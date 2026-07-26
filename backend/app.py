"""
App entrypoint: creates the Flask app, applies config, sets up CORS, and
registers every blueprint. Actual route logic lives in routes/*.py.
"""
import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from config import APP_ENV, logger, CORS_ORIGINS, configure_app
from extensions import limiter

app = Flask(__name__)
configure_app(app)
limiter.init_app(app)

CORS(
    app,
    supports_credentials=True,
    origins=CORS_ORIGINS
)

from routes.auth import auth_bp
from routes.google_auth import google_auth_bp
from routes.chat import chat_bp
from routes.quiz import quiz_bp
from routes.books import books_bp
from routes.account import account_bp
from routes.admin import admin_bp
from routes.feedback import feedback_bp
from routes.analysis import analysis_bp

app.register_blueprint(auth_bp)
app.register_blueprint(google_auth_bp)
app.register_blueprint(chat_bp)
app.register_blueprint(quiz_bp)
app.register_blueprint(books_bp)
app.register_blueprint(account_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(feedback_bp)
app.register_blueprint(analysis_bp)


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    if path != "" and os.path.exists(os.path.join('frontend/build', path)):
        return send_from_directory('frontend/build', path)
    return send_from_directory('frontend/build', 'index.html')


# Serve images from backend's static folder
@app.route('/static/<path:filename>')
def serve_static_files(filename):
    return send_from_directory('static', filename)


# Lightweight health check - no DB call, no auth, just confirms the process is
# alive. Point an external uptime pinger (e.g. UptimeRobot, cron-job.org - both
# have free tiers) at this every 10 minutes to stop Render's free tier from
# spinning the server down after 15 min idle. Exempt from rate limiting since
# a monitoring service will call this constantly.
@app.route('/health')
@limiter.exempt
def health_check():
    return jsonify({"status": "ok"}), 200


# Global error handler: any unhandled exception returns clean JSON instead of
# a raw stack trace (and full detail is still logged server-side for debugging).
# HTTPExceptions (404, 405, etc.) are left alone so they keep their real status codes.
@app.errorhandler(Exception)
def handle_unexpected_error(e):
    if isinstance(e, HTTPException):
        return e
    logger.exception(f"Unhandled exception on {request.method} {request.path}: {e}")
    return jsonify({"error": "Something went wrong. Please try again."}), 500


if __name__ == '__main__':
    app.run(debug=(APP_ENV != "production"))
