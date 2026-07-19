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
# Vercel (frontend) and Render (backend) are different domains, so cross-site
# cookies REQUIRE SameSite=None + Secure=True in production. Locally (http://localhost)
# Secure=True would break cookies entirely, so this switches automatically with APP_ENV.
SESSION_COOKIE_SAMESITE = 'None' if APP_ENV == "production" else 'Lax'
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
