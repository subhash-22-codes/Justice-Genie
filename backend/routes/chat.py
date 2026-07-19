"""
Chat blueprint: the main /api/chat endpoint (query classification + Gemini),
plus translate, speech stubs, and chat history storage/retrieval.
"""
import hashlib
from datetime import datetime
from flask import Blueprint, request, jsonify, session

from config import logger
from extensions import model, chats_collection, users_collection, limiter, query_cache_collection

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
def clear_chat():
    data = request.get_json()
    username = data.get('username')

    logger.info(f"Received username for chat deletion: {username}")

    if not username:
        return jsonify({"error": "Username is required"}), 400

    # ✅ Use helper
    result = chats_collection.delete_many({"username": username})

    if result.deleted_count > 0:
        return jsonify({"message": "Chat history cleared successfully"}), 200
    else:
        return jsonify({"message": "No chat history found"}), 200


@chat_bp.route('/api/store_message', methods=['POST'])
def store_message():
    try:
        data = request.json
        username = data.get("username")
        messages = data.get("messages")  # Expecting a list of messages

        if not username or not messages or not isinstance(messages, list):
            return jsonify({"error": "Username and a list of messages are required"}), 400

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
def get_chat():
    username = request.args.get('username')

    if not username:
        return jsonify({"error": "Username is required"}), 400

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


def classify_query(query):
    """
    Classifies the user's query into one of four categories.
    """
    prompt = f"""
    Analyze the user's query and classify it into one of four categories based on its intent.
    The categories are: LEGAL, LEGAL_GENERAL, CONVERSATIONAL, or OFF_TOPIC.
    - LEGAL: The query is about a specific Indian law, IPC section, or a concrete legal situation.
    - LEGAL_GENERAL: The query is a broad, philosophical, or definitional question about the legal system itself.
    - CREATOR: Questions about who made, created, developed, built, or are the innovators of the Justice Genie.
    - CONVERSATIONAL: The query is a greeting, a question about you (the AI), a thank you, or other small talk.
    - OFF_TOPIC: The query is about something completely unrelated to law.

    Respond with ONLY the category name.

    Examples:
    Query: "What is the punishment for theft?" -> LEGAL
    Query: "What is Law?" -> LEGAL_GENERAL
    Query: "who made you?" -> CREATOR
    Query: "Hello there" -> CONVERSATIONAL
    Query: "Why do we have courts?" -> LEGAL_GENERAL
    Query: "who developed this application?" -> CREATOR
    Query: "How do I cook biryani?" -> OFF_TOPIC
    Query: "who are the innovators of jg?" -> CREATOR

    Now, classify this query:
    Query: "{query}" ->
    """
    
    response = model.generate_content(prompt)
    classification = response.text.strip().upper()
    
    if classification in ['LEGAL', 'LEGAL_GENERAL', 'CONVERSATIONAL', 'CREATOR', 'OFF_TOPIC']:
        return classification
    else:
        return 'OFF_TOPIC' # Default fallback

# Your final, simplified chat() function
@chat_bp.route('/api/chat', methods=['POST'])
@limiter.limit("15 per minute")
def chat():
    if 'username' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json() or {}
    query = (data.get('query') or "").strip()

    if not query:
        return jsonify({'error': 'Query cannot be empty.'}), 400

    # Check cache first - a hit skips BOTH the classification Gemini call and
    # the main response Gemini call, since both are keyed off the same query text.
    cached_intent, cached_response = get_cached_response(query)
    if cached_response is not None:
        logger.info(f"Cache hit for query (intent={cached_intent})")
        return jsonify({'response': cached_response})

    intent = classify_query(query)

    try:
        if intent == 'CREATOR':
            response_text = (
                "I was created by two passionate developers:\n\n"
                "**Subhash Yaganti** (Full-Stack & UI/UX)\n"
                "[LinkedIn](https://www.linkedin.com/in/subhash-yaganti-a8b3b626a/) | [GitHub](https://github.com/subhash-22-codes)\n\n"
                "**Siri Mahalaxmi Vemula** (Backend & System Architecture)\n"
                "[LinkedIn](https://www.linkedin.com/in/vemula-siri-mahalaxmi-b4b624319/) | [GitHub](https://github.com/armycodes)\n\n"
                "They combined their skills in technology and an interest in law to build me."
            )

        elif intent == 'LEGAL':
            logger.info(f"Handling LEGAL query: {query}")
            prompt = f"{GUIDANCE}\nUser Query: {query}"
            response_text = model.generate_content(prompt).text

        elif intent == 'LEGAL_GENERAL':
            logger.info(f"Handling LEGAL_GENERAL query: {query}")
            prompt = f"""
            You are 'Justice Genie', an expert legal AI assistant.
            Answer the user's broad, philosophical, or definitional question about law in a clear and concise way.
            While you specialize in the IPC, provide a helpful general answer.
            User's question: "{query}"
            """
            response_text = model.generate_content(prompt).text

        elif intent == 'CONVERSATIONAL':
            logger.info(f"Handling CONVERSATIONAL query: {query}")
            # This prompt can be the simpler one now, or the detailed one. 
            # The react-markdown component will handle either perfectly.
            prompt = f"""
            You are 'Justice Genie', a friendly and professional legal AI assistant for Indian law.
            Respond to the user's conversational query in character. Be polite and helpful.
            User's message: "{query}"
            """
            response_text = model.generate_content(prompt).text

        else:  # This handles OFF_TOPIC
            logger.info(f"Handling OFF_TOPIC query: {query}")
            response_text = "I am Justice Genie, your assistant for questions related to Indian law. I cannot help with topics outside of that scope."

        # Cache the result for every intent - a repeat of this exact query
        # (from this user or any other) skips Gemini entirely next time.
        set_cached_response(query, intent, response_text)
        return jsonify({'response': response_text})

    except Exception as e:
        logger.exception(f'Error processing query: {e}')
        return jsonify({'error': 'There was an error processing your request.'}), 500


