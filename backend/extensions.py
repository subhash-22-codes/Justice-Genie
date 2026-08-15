"""
Third-party service setup: MongoDB, Cloudinary, Gemini, Brevo.
Import the client/collection/model objects you need from here instead of
re-configuring these services in every route file.
"""
import os
from urllib.parse import quote_plus

from pymongo import MongoClient
import cloudinary
import cloudinary.uploader
import google.generativeai as genai
import sib_api_v3_sdk
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from config import APP_ENV, logger

# ---------------- MongoDB ----------------
if APP_ENV == "production":
    _username = os.getenv("MONGO_USER")
    _password = quote_plus(os.getenv("MONGO_PASS"))
    _cluster = os.getenv("MONGO_CLUSTER")

    if not all([_username, _password, _cluster]):
        raise RuntimeError(
            "APP_ENV=production but MONGO_USER / MONGO_PASS / MONGO_CLUSTER are missing. "
            "Check Render's Environment tab."
        )

    MONGO_URI = f"mongodb+srv://{_username}:{_password}@{_cluster}/?retryWrites=true&w=majority&appName=Cluster0"
    client = MongoClient(MONGO_URI)
    logger.info("[startup] APP_ENV=production -> connected to Atlas cluster")
else:
    client = MongoClient('mongodb://localhost:27017/')
    logger.info("[startup] APP_ENV=development -> connected to local MongoDB")

db = client["law_chatbot"]
users_collection = db["users"]
feedback_collection = db["feedback"]
quizzquestions_collection = db["quizzquestions"]
books_collection = db["books"]
collab_collection = db["collaborations"]
leaderboard_collection = db["leaderboard"]
chats_collection = db["chats"]
query_cache_collection = db["query_cache"]  # cached Gemini responses, see routes/chat.py
chat_metrics_collection = db["chat_metrics"]  # per-request analytics: latency, tokens, cache hit/miss
daily_usage_collection = db["daily_usage"]  # per-user + global daily message counters, see Mission-Save Phase 3


def _ensure_index(collection, keys, **kwargs):
    """
    Create an index if it doesn't already exist. Each call is independent and
    non-fatal: if one fails (e.g. unique=True hitting existing duplicate data),
    we log it and move on instead of crashing the whole app at startup.
    MongoDB's create_index() is itself idempotent - safe to call on every boot.
    """
    try:
        collection.create_index(keys, **kwargs)
    except Exception as e:
        logger.warning(
            f"[startup] Could not create index {keys} on {collection.name}: {e}. "
            f"App will still run, but queries on this field may be slower, "
            f"and any 'unique' constraint you expected is NOT enforced at the DB level."
        )


# ---------------- Indexes ----------------
# Built for the actual query patterns used across routes/*.py. Safe to run on
# every startup - MongoDB skips recreating an index that already matches.
_ensure_index(users_collection, "username", unique=True)
_ensure_index(users_collection, "email", unique=True)

# chats is queried by BOTH user_id (chat.py) and username (account.py/clear_chat) -
# a pre-existing schema inconsistency, not something we're fixing today, but both
# fields genuinely need an index since both are actually queried.
_ensure_index(chats_collection, "user_id")
_ensure_index(chats_collection, "username")

_ensure_index(leaderboard_collection, "username", unique=True)
_ensure_index(leaderboard_collection, [("score", -1)])

_ensure_index(collab_collection, "submitted_by")
_ensure_index(collab_collection, "email")

_ensure_index(books_collection, "category")

# Cached Gemini responses auto-expire after 7 days, so answers don't go stale
# forever (laws/interpretations can change, and this keeps the cache small).
_ensure_index(query_cache_collection, "cached_at", expireAfterSeconds=7 * 24 * 60 * 60)

# Analytics events auto-expire after 90 days - plenty for real usage analysis
# (cache hit rate, latency, conversation length trends), without growing
# unbounded on a free-tier database.
_ensure_index(chat_metrics_collection, "timestamp", expireAfterSeconds=90 * 24 * 60 * 60)

# Daily usage counters (Mission-Save) only ever need to track "today" - a
# short TTL keeps this collection tiny instead of accumulating forever.
_ensure_index(daily_usage_collection, "created_at", expireAfterSeconds=3 * 24 * 60 * 60)

# ---------------- Cloudinary ----------------
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

# ---------------- Gemini (main chat model, fallback model, and analyzer) ----------------
# IMPORTANT: genai.configure() sets GLOBAL module state - calling it more than
# once means whichever key was configured LAST wins for any model that hasn't
# been used yet. This used to be a real, flagged bug: analysis.py reconfigured
# the global key per-request, which could theoretically race with chat.py's
# model on its very first call after a fresh server start.
#
# The fix: force each model to bind to its OWN client immediately, right here
# at startup, before any request ever comes in. Once a GenerativeModel's
# internal client is set, it's cached forever and never re-reads the global
# config again - so from this point on, each model is permanently locked to
# the correct key regardless of what any other code configures afterward.
# get_default_generative_client() only builds a local client object - it does
# NOT make a network call, so this costs zero Gemini quota to do.
from google.generativeai import client as _genai_client_internal

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-2.5-flash')
model._client = _genai_client_internal.get_default_generative_client()

genai.configure(api_key=os.getenv("GEMINI_API_KEY_FALL_BACK"))
model_fallback = genai.GenerativeModel('gemini-2.5-flash-lite')
model_fallback._client = _genai_client_internal.get_default_generative_client()

genai.configure(api_key=os.getenv("GEMINI_ANALYZE_API_KEY"))
analyze_model = genai.GenerativeModel('gemini-2.5-flash')
analyze_model._client = _genai_client_internal.get_default_generative_client()

# ---------------- Rate limiting ----------------
# NOTE: default storage is in-memory, which resets on restart and isn't shared
# across multiple worker processes. Fine for Render's free tier (1 worker) -
# if you ever scale to multiple workers/dynos, switch storage_uri to Redis.
limiter = Limiter(key_func=get_remote_address, storage_uri="memory://")

# ---------------- Brevo (transactional email) ----------------
_brevo_config = sib_api_v3_sdk.Configuration()
_brevo_config.api_key['api-key'] = os.getenv("BREVO_API_KEY")
brevo_client = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(_brevo_config))
BREVO_SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL")
BREVO_SENDER_NAME = os.getenv("BREVO_SENDER_NAME")
