"""
All app-wide configuration lives here: env loading, logging setup, secrets,
session/cookie rules, and CORS origins. Nothing here talks to Mongo/Cloudinary/
Gemini directly - that's extensions.py. Import from this module instead of
reading os.getenv() scattered across route files.
"""
import os
import re
import logging
from datetime import timedelta
from dotenv import load_dotenv
from pytz import timezone

# Load .env once, here, before anything else reads an env var.
load_dotenv()

# Render sets APP_ENV=production; local .env should have APP_ENV=development (or leave unset)
APP_ENV = os.getenv("APP_ENV", "development")

# ---------------- Logging ----------------
logging.basicConfig(
    level=logging.INFO if APP_ENV != "production" else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("justicegenie")

# ---------------- Flask secret key ----------------
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("No SECRET_KEY set for Flask application")

# ---------------- Session / cookies ----------------
# The frontend now reaches this backend through a Vercel rewrite proxy
# (see frontend/vercel.json), so from the browser's point of view every
# request is same-origin, not cross-site. That means the cookie no longer
# needs SameSite=None (which is what Safari's third-party cookie blocking
# was rejecting) — SameSite=Lax is safer and works fine here.
# Secure=True is still required in production since the site is served over
# HTTPS either way. Locally (http://localhost) Secure=True would break
# cookies entirely, so this still switches automatically with APP_ENV.
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SECURE = APP_ENV == "production"
PERMANENT_SESSION_LIFETIME = timedelta(days=1)

# ---------------- CORS ----------------
CORS_ORIGINS = [
    "http://localhost:3000",
    "https://justice-genie-mu.vercel.app",
    re.compile(r"^https://justice-genie.*\.vercel\.app$")  # any Vercel preview deploy
]

# ---------------- Misc ----------------
IST = timezone('Asia/Kolkata')
TEST_MODE = False  # Set to True locally to skip actually sending emails
MONITORING_API_KEY = os.getenv("MONITORING_API_KEY")


def configure_app(app):
    """Apply all of the above onto a Flask app instance. Call once in app.py."""
    app.secret_key = SECRET_KEY
    app.config['SESSION_COOKIE_SAMESITE'] = SESSION_COOKIE_SAMESITE
    app.config['SESSION_COOKIE_SECURE'] = SESSION_COOKIE_SECURE
    app.config['PERMANENT_SESSION_LIFETIME'] = PERMANENT_SESSION_LIFETIME
