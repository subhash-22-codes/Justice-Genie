"""
Chat blueprint: the main /api/chat endpoint (query classification + Gemini),
plus translate, speech stubs, and chat history storage/retrieval.
"""
import hashlib
import time
import pytz
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, session
from pymongo import ReturnDocument

from config import logger
from google.api_core.exceptions import ResourceExhausted
from extensions import model, model_fallback, chats_collection, users_collection, limiter, query_cache_collection, chat_metrics_collection, daily_usage_collection
from utils.decorators import login_required

chat_bp = Blueprint('chat', __name__)


def _cache_key(query):
    """Normalize the query text so trivial differences (case, whitespace)
    still hit the same cache entry."""
    normalized = query.strip().lower()
    return hashlib.sha256(normalized.encode('utf-8')).hexdigest()


def get_cached_response(query):
    """Returns (intent, response_text) if this exact query was answered
    recently, else (None, None). Cache entries expire via TTL index (see
    extensions.py) so answers don't go stale forever."""
    cached = query_cache_collection.find_one({'_id': _cache_key(query)})
    if cached:
        return cached.get('intent'), cached.get('response')
    return None, None


import re

CREATOR_RESPONSE = (
    "I was created by two passionate developers:\n\n"
    "**Subhash Yaganti** (Full-Stack & UI/UX)\n"
    "[LinkedIn](https://www.linkedin.com/in/subhash-yaganti-a8b3b626a/) | [GitHub](https://github.com/subhash-22-codes)\n\n"
    "**Siri Mahalaxmi Vemula** (Backend & System Architecture)\n"
    "[LinkedIn](https://www.linkedin.com/in/vemula-siri-mahalaxmi-b4b624319/) | [GitHub](https://github.com/armycodes)\n\n"
    "They combined their skills in technology and an interest in law to build me."
)

OFF_TOPIC_RESPONSE = "I am Justice Genie, your assistant for questions related to Indian law. I cannot help with topics outside of that scope."

# Deliberately conservative: these only match if the ENTIRE message (after
# trimming punctuation) is just a greeting/thanks - "hi, what are my rights
# as a tenant" must NOT match this, only a bare "hi" should. False positives
# here would silently break real questions, so we'd rather under-match than
# over-match.
_GREETING_RE = re.compile(r'^(hi+|hello+|hey+|hii+|helo|yo|namaste|good\s*(morning|afternoon|evening|night))[\s!.,?]*$', re.IGNORECASE)
_THANKS_RE = re.compile(r'^(thanks?|thank\s*you|thx|ty|tysm)[\s!.,]*$', re.IGNORECASE)
_CREATOR_RE = re.compile(r'\b(who\s+(made|created|built|developed)\s+(you|this|it|justice\s*genie|jg)|who\s+(are|is)\s+(your|the)\s+(creator|creators|developer|developers|innovator|innovators))\b', re.IGNORECASE)

_GREETING_RESPONSES = [
    "Namaste! I'm doing great, thank you for asking! ✨ I'm Justice Genie, your legal AI assistant for Indian law. How can I help you today?",
    "Hello! Great to see you. I'm Justice Genie - ask me anything about Indian law and I'll do my best to help.",
]
_THANKS_RESPONSES = [
    "You're most welcome! Feel free to come back anytime you have another legal question.",
    "Happy to help! Let me know if anything else comes up.",
]


def check_prefilter(query):
    """Catches obvious greetings/thanks/creator-questions before any Gemini
    call happens. Returns (intent, response_text) on a match, else (None, None).
    Deliberately narrow scope - anything even slightly ambiguous falls
    through to the real model instead of risking a wrong short-circuit."""
    stripped = query.strip()

    if _CREATOR_RE.search(stripped):
        return 'CREATOR', CREATOR_RESPONSE

    if _GREETING_RE.match(stripped):
        import random
        return 'CONVERSATIONAL', random.choice(_GREETING_RESPONSES)

    if _THANKS_RE.match(stripped):
        import random
        return 'CONVERSATIONAL', random.choice(_THANKS_RESPONSES)

    return None, None


def set_cached_response(query, intent, response_text):
    query_cache_collection.update_one(
        {'_id': _cache_key(query)},
        {'$set': {
            'intent': intent,
            'response': response_text,
            'cached_at': datetime.utcnow(),
            'query_sample': query[:200],  # for debugging - what query this cache entry is for
        }},
        upsert=True
    )


def _extract_usage(response):
    """Pulls real token counts from Gemini's response, if available.
    Returns (input_tokens, output_tokens), either of which may be None if
    the SDK/model didn't report usage for this call."""
    try:
        usage = response.usage_metadata
        return usage.prompt_token_count, usage.candidates_token_count
    except Exception:
        return None, None


def _log_chat_metrics(**fields):
    """Records one analytics document per /api/chat request. Deliberately
    wrapped in try/except - a logging failure should never break the actual
    chat feature for the user."""
    try:
        fields['timestamp'] = datetime.utcnow()
        chat_metrics_collection.insert_one(fields)
    except Exception as e:
        logger.warning(f"Failed to log chat metrics (non-fatal): {e}")


# ---------------- Mission-Save: daily usage limits ----------------
# Real, measured Gemini free-tier capacity (confirmed directly from Google's
# own dashboard, not estimated): 20/day on the primary model + 20/day on the
# fallback = 40/day combined, total, across every user of the app.
#
# PER_USER_DAILY_LIMIT: how many real AI messages one account gets per day.
# GLOBAL_DAILY_SAFETY_LIMIT: a safety cutoff below the true 40 ceiling, so the
# app degrades gracefully with a friendly message instead of a raw Gemini
# error once real usage gets close to the actual wall.
PER_USER_DAILY_LIMIT = 5
GLOBAL_DAILY_SAFETY_LIMIT = 35

IST = pytz.timezone('Asia/Kolkata')


def _today_ist_str():
    return datetime.now(IST).strftime('%Y-%m-%d')


def _next_midnight_ist_iso():
    now_ist = datetime.now(IST)
    tomorrow_midnight = (now_ist + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return tomorrow_midnight.isoformat()


def check_and_track_usage(username):
    """Atomically increments the per-user counter first, checks it, and ONLY
    if the user is within their own limit does it go on to increment+check
    the global counter too. This ordering is deliberate: if someone keeps
    hitting "send" after already being blocked by their personal cap, those
    attempts never touch the global counter - so the app's shared daily
    budget only ever gets consumed by requests that had a real chance of
    reaching Gemini, not wasted on already-blocked retries.

    Uses MongoDB's atomic $inc (never a read-then-write), specifically to
    avoid the exact race-condition pattern found elsewhere in this codebase
    during the product audit (see quiz.py's submit_quiz).

    Returns a dict: {'allowed': bool, 'reason': None|'user_limit'|'global_limit', 'reset_at': iso str}
    """
    today = _today_ist_str()
    reset_at = _next_midnight_ist_iso()

    user_doc = daily_usage_collection.find_one_and_update(
        {'_id': f'user:{username}:{today}'},
        {
            '$inc': {'count': 1},
            '$setOnInsert': {'type': 'user', 'username': username, 'date': today, 'created_at': datetime.utcnow()},
        },
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    if user_doc['count'] > PER_USER_DAILY_LIMIT:
        return {'allowed': False, 'reason': 'user_limit', 'reset_at': reset_at}

    global_doc = daily_usage_collection.find_one_and_update(
        {'_id': f'global:{today}'},
        {
            '$inc': {'count': 1},
            '$setOnInsert': {'type': 'global', 'date': today, 'created_at': datetime.utcnow()},
        },
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    if global_doc['count'] > GLOBAL_DAILY_SAFETY_LIMIT:
        return {'allowed': False, 'reason': 'global_limit', 'reset_at': reset_at}

    return {'allowed': True, 'reason': None, 'reset_at': reset_at}


# The main system prompt used for LEGAL-classified queries in chat().
GUIDANCE = """
You are 'Justice Genie', an expert AI legal assistant specializing in the Indian Penal Code (IPC). Your goal is to provide clear, structured, and insightful legal information. Analyze the user's query and provide a detailed response that follows the structure and quality of the example provided below.

---
### EXAMPLE START ###
User Query: "What is criminal intimidation?"

### 📜 Primary IPC Section(s) Applicable
The primary section is **IPC Section 503 (Criminal Intimidation)**. It states: "Whoever threatens another with any injury to his person, reputation or property... with intent to cause alarm to that person, or to cause that person to do any act which he is not legally bound to do... as the means of avoiding the execution of such threat, commits criminal intimidation."

### 🔑 Key Elements of the Offense
For an act to be considered criminal intimidation, the following elements must be proven:
1.  **Threat of Injury:** There must be a clear threat to injure a person's body, reputation, or property.
2.  **Intent (Mens Rea):** The accused must have the intention to cause alarm, or to force the person to do something illegal or omit something they are legally entitled to do. The mere use of threatening words is not enough without the required intent.

### ⚖️ Punishment
The punishment is defined under **IPC Section 506**. For simple criminal intimidation, the punishment is imprisonment for up to two years, a fine, or both. If the threat is to cause death, grievous hurt, or to destroy property by fire, the punishment can extend to seven years.

### 💡 Important Nuances & Considerations
- A key distinction is whether the threat is credible and causes genuine alarm. A casual threat made in anger may not meet the legal standard if it doesn't create a reasonable sense of fear.
- This is often linked with other offenses like extortion (IPC 383), where the threat is used to dishonestly obtain property.

### 📚 Landmark Case Example
**Amulya Kumar Behera v. Nabaghana Behera (1995):** In this case, the court held that mere words are not enough. It must be proven that the accused intended to cause alarm and that the threat was sufficient to do so. The accused was acquitted because the prosecution could not prove that his words actually caused a state of alarm in the victim. This case highlights the importance of the "intent" element.

### ⚠️ Disclaimer
Conclude with the following disclaimer: "This information is for educational purposes only and does not constitute legal advice. Please consult with a qualified legal professional for advice on your specific situation."
---
### EXAMPLE END ###
---

Now, answer the following user query based on the same high standards:
"""


@chat_bp.route('/api/text-to-speech', methods=['POST'])
def text_to_speech():
    return jsonify({'message': '🔊 Text-to-Speech is coming soon in production!'}), 200
@chat_bp.route('/api/stop-speech', methods=['POST'])
def stop_speech():
    return jsonify({'message': '⏹️ Stop Speech is not available in production!'}), 200
    
@chat_bp.route('/api/speech-to-text', methods=['GET'])
def speech_to_text():
    return jsonify({'message': '🎤 Speech-to-Text is coming soon in production!'}), 200


@chat_bp.route("/api/translate", methods=["POST"])
def translate_text():
    try:
        # Immediately return a friendly placeholder message
        return jsonify({
            "translatedText": "🌐 Translation service coming soon! Please stay tuned."
        })
    
    except Exception as e:
        # Fallback for unexpected errors
        return jsonify({
            "error": "⚠️ Translation service temporarily unavailable. Please try again later."
        }), 500


@chat_bp.route('/api/clear_chat', methods=['POST'])
@login_required
def clear_chat():
    # SECURITY: username now comes from the logged-in session, never from the
    # request body — otherwise anyone could clear another user's chat history
    # just by sending that user's username.
    username = session['username']

    logger.info(f"Clearing chat history for session user: {username}")

    # ✅ Use helper
    result = chats_collection.delete_many({"username": username})

    if result.deleted_count > 0:
        return jsonify({"message": "Chat history cleared successfully"}), 200
    else:
        return jsonify({"message": "No chat history found"}), 200


@chat_bp.route('/api/store_message', methods=['POST'])
@login_required
def store_message():
    try:
        data = request.json
        # SECURITY: username now comes from the logged-in session, never from
        # the request body — otherwise anyone could write messages into
        # another user's chat history just by sending that user's username.
        username = session['username']
        messages = data.get("messages")  # Expecting a list of messages

        if not messages or not isinstance(messages, list):
            return jsonify({"error": "A list of messages is required"}), 400

        # Find user ID
        user = users_collection.find_one({"username": username})  # ✅ add ()
        if not user:
            return jsonify({"error": "User not found"}), 404

        user_id = str(user["_id"])

        # Check if user already has a chat history
        user_chat = chats_collection.find_one({"user_id": user_id})  # ✅ add ()

        if user_chat:
            # Append new messages to existing chat history
            chats_collection.update_one(   # ✅ add ()
                {"user_id": user_id},
                {"$push": {"messages": {"$each": messages}}}  # Append multiple messages
            )
        else:
            # Create a new chat entry
            chats_collection.insert_one({   # ✅ add ()
                "user_id": user_id,
                "username": username,
                "messages": messages  # Store all messages
            })

        return jsonify({"success": True, "message": "Messages stored successfully"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500




@chat_bp.route('/api/get_chat', methods=['GET'])
@login_required
def get_chat():
    # SECURITY: username now comes from the logged-in session, never from
    # the query string — otherwise anyone could read another user's entire
    # chat history just by changing ?username=... in the URL.
    username = session['username']

    try:
        # Find user ID
        user = users_collection.find_one({"username": username})  # ✅ add ()
        if not user:
            return jsonify({"error": "User not found"}), 404

        user_id = str(user["_id"])

        # Fetch chat history
        user_chat = chats_collection.find_one({"user_id": user_id})  # ✅ add ()

        if not user_chat:
            return jsonify({"messages": []})  # Return empty if no chat found

        return jsonify({"messages": user_chat.get("messages", [])})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def build_merged_prompt(query):
    """One prompt that both classifies AND answers in a single Gemini call,
    instead of the old two-call approach (classify, then respond).
    Output format is deliberately simple to parse: first line is
    "INTENT: <CATEGORY>", everything after is the actual answer."""
    return f"""You are 'Justice Genie', an expert AI legal assistant specializing in the Indian Penal Code (IPC).

STEP 1 - Classify the user's query into exactly one category: LEGAL, LEGAL_GENERAL, CONVERSATIONAL, or OFF_TOPIC.
- LEGAL: a specific Indian law, IPC section, or concrete legal situation.
- LEGAL_GENERAL: a broad, philosophical, or definitional question about the legal system itself.
- CONVERSATIONAL: a greeting, small talk, or a question about you (the AI).
- OFF_TOPIC: unrelated to law entirely.

STEP 2 - On the very first line of your response, output ONLY: INTENT: <CATEGORY>

STEP 3 - Starting from the second line, answer the query:
- If LEGAL, follow this exact structure:
{GUIDANCE}
- If LEGAL_GENERAL: give a clear, concise general answer (2-4 paragraphs), noting your IPC specialty where relevant.
- If CONVERSATIONAL: respond briefly and warmly, in character as Justice Genie.
- If OFF_TOPIC: respond with exactly this line: "{OFF_TOPIC_RESPONSE}"

User Query: "{query}"
"""


def parse_merged_response(raw_text):
    """Splits the model's raw output into (intent, answer_text). Falls back
    to OFF_TOPIC if the model didn't follow the expected INTENT: line format,
    rather than crashing on an unexpected response shape."""
    lines = raw_text.strip().split("\n", 1)
    first_line = lines[0].strip().upper()

    if first_line.startswith("INTENT:"):
        intent = first_line.replace("INTENT:", "").strip()
        answer = lines[1].strip() if len(lines) > 1 else ""
    else:
        # Model didn't follow the format - treat the whole thing as the
        # answer rather than losing the response entirely.
        intent = "LEGAL_GENERAL"
        answer = raw_text.strip()

    if intent not in ['LEGAL', 'LEGAL_GENERAL', 'CONVERSATIONAL', 'OFF_TOPIC']:
        intent = 'LEGAL_GENERAL'

    return intent, answer


@chat_bp.route('/api/chat', methods=['POST'])
@limiter.limit("15 per minute")
def chat():
    if 'username' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    request_start = time.time()
    username = session['username']

    data = request.get_json() or {}
    query = (data.get('query') or "").strip()

    if not query:
        return jsonify({'error': 'Query cannot be empty.'}), 400

    # Conversation depth: how many messages this user already has stored.
    existing_user_doc = chats_collection.find_one({"username": username}, {"messages": 1})
    prior_message_count = len(existing_user_doc.get("messages", [])) if existing_user_doc else 0

    # 1) Cache check - zero Gemini calls on a hit.
    cached_intent, cached_response = get_cached_response(query)
    if cached_response is not None:
        logger.info(f"Cache hit for query (intent={cached_intent})")
        _log_chat_metrics(
            username=username, cache_hit=True, pre_filtered=False,
            intent=cached_intent, prior_message_count=prior_message_count,
            total_latency_ms=round((time.time() - request_start) * 1000),
        )
        return jsonify({'response': cached_response})

    # 2) Pre-filter check - zero Gemini calls for obvious greetings/thanks/creator questions.
    pf_intent, pf_response = check_prefilter(query)
    if pf_response is not None:
        logger.info(f"Pre-filter matched (intent={pf_intent}), no Gemini call needed")
        set_cached_response(query, pf_intent, pf_response)
        _log_chat_metrics(
            username=username, cache_hit=False, pre_filtered=True,
            intent=pf_intent, prior_message_count=prior_message_count,
            total_latency_ms=round((time.time() - request_start) * 1000),
        )
        return jsonify({'response': pf_response})

    # 3) Daily usage limit check - only applies here, since cache hits and
    # pre-filtered messages never touch Gemini and shouldn't count against
    # anyone's limited daily allowance.
    usage_check = check_and_track_usage(username)
    if not usage_check['allowed']:
        logger.info(f"Usage limit reached for {username}: {usage_check['reason']}")
        _log_chat_metrics(
            username=username, cache_hit=False, pre_filtered=False,
            limit_reached=usage_check['reason'], prior_message_count=prior_message_count,
            total_latency_ms=round((time.time() - request_start) * 1000),
        )
        return jsonify({
            'limitReached': True,
            'reason': usage_check['reason'],
            'resetAt': usage_check['reset_at'],
        })

    # 4) Real Gemini call - ONE call does both classification and answering,
    # instead of the old two-call (classify, then respond) approach.
    generation_latency_ms = None
    generation_input_tokens = None
    generation_output_tokens = None
    intent = None
    used_fallback = False

    try:
        prompt = build_merged_prompt(query)
        gen_start = time.time()

        try:
            gemini_response = model.generate_content(prompt)
        except ResourceExhausted:
            # Primary model's daily quota is exhausted - fall back to the
            # secondary model (separate key, separate quota pool) instead of
            # failing the request outright. This is the ONLY exception we
            # fall back on - anything else (a real bug, a malformed prompt,
            # a genuine outage) should surface normally, not be silently
            # retried against a different model.
            logger.warning("Primary Gemini model quota exhausted - retrying with fallback model")
            used_fallback = True
            gemini_response = model_fallback.generate_content(prompt)

        generation_latency_ms = round((time.time() - gen_start) * 1000)
        generation_input_tokens, generation_output_tokens = _extract_usage(gemini_response)

        intent, response_text = parse_merged_response(gemini_response.text)

        # Cache the result for every intent - a repeat of this exact query
        # (from this user or any other) skips Gemini entirely next time.
        set_cached_response(query, intent, response_text)

        _log_chat_metrics(
            username=username, cache_hit=False, pre_filtered=False,
            intent=intent, prior_message_count=prior_message_count,
            used_fallback=used_fallback,
            generation_latency_ms=generation_latency_ms,
            generation_input_tokens=generation_input_tokens,
            generation_output_tokens=generation_output_tokens,
            total_latency_ms=round((time.time() - request_start) * 1000),
        )

        return jsonify({'response': response_text})

    except Exception as e:
        logger.exception(f'Error processing query: {e}')
        _log_chat_metrics(
            username=username, cache_hit=False, pre_filtered=False,
            intent=intent, prior_message_count=prior_message_count,
            used_fallback=used_fallback,
            generation_latency_ms=generation_latency_ms,
            error=str(e),
            total_latency_ms=round((time.time() - request_start) * 1000),
        )
        return jsonify({'error': 'There was an error processing your request.'}), 500


