"""
Google Sign-In blueprint.

Flow:
  1. Frontend gets a signed ID token from Google (via the "Sign in with
     Google" button) and POSTs it here.
  2. We verify that token really came from Google and really belongs to
     our app (checked against GOOGLE_CLIENT_ID).
  3. Case 1 - email already has an account (password or Google):
       log them straight in, no changes to their existing username.
  4. Case 2 - brand-new email, auto-generated username is free:
       create the account immediately, log them in.
  5. Case 3 - brand-new email, auto-generated username is already taken:
       don't create the account yet - ask the frontend to show a
       "pick a username" screen, then finish signup via
       /api/auth/google/complete-signup.
"""
import re
import threading
from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify, session
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

from config import logger, GOOGLE_CLIENT_ID
from extensions import users_collection
from utils.email import send_welcome_email

google_auth_bp = Blueprint('google_auth', __name__)

# Same pattern as the email-OTP registration flow: a short-lived, in-memory
# holding area for a Google signup that's waiting on the user to pick a
# username (Case 3 only). Not written to Mongo because it's meant to be
# gone within minutes either way.
pending_google_signups = {}
PENDING_SIGNUP_EXPIRY_MINUTES = 15


def _generate_username_from_email(email):
    """Turn 'sub.22+test@gmail.com' into something like 'sub22test'."""
    base = email.split('@')[0].lower()
    base = re.sub(r'[^a-z0-9_]', '', base)
    if len(base) < 3:
        base = (base + "user")[:20]
    return base[:20]


def _start_session_for_user(user):
    session.permanent = True
    session['username'] = user['username']
    session['email'] = user['email']
    session['role'] = user.get('role', 'user')


@google_auth_bp.route('/api/auth/google', methods=['POST'])
def google_sign_in():
    data = request.get_json() or {}
    token = data.get('credential')

    if not token:
        return jsonify({'error': 'Missing Google credential.'}), 400

    if not GOOGLE_CLIENT_ID:
        logger.error("GOOGLE_CLIENT_ID is not configured on the server.")
        return jsonify({'error': 'Google Sign-In is not configured on this server.'}), 500

    try:
        payload = google_id_token.verify_oauth2_token(
            token, google_requests.Request(), GOOGLE_CLIENT_ID
        )
    except ValueError:
        # Covers an invalid signature, wrong audience, or expired token -
        # never trust anything about the token until this call succeeds.
        logger.warning("Rejected an invalid Google ID token.")
        return jsonify({'error': 'Invalid Google credential.'}), 401

    if not payload.get('email_verified', False):
        return jsonify({'error': 'Your Google email is not verified. Please verify it with Google first.'}), 400

    email = payload['email']
    name = payload.get('name', '')
    picture = payload.get('picture', '')

    # Case 1: this email already has an account (however it was created).
    # A verified email on both sides is treated as proof it's the same
    # person - this is the standard "auto-link by verified email" pattern.
    existing_user = users_collection.find_one({'email': email})
    if existing_user:
        _start_session_for_user(existing_user)
        logger.info(f"Google sign-in: logged in existing account for {email}")
        return jsonify({
            'message': 'Login successful',
            'username': existing_user['username'],
            'role': existing_user.get('role', 'user'),
            'isAdmin': existing_user.get('role') == 'admin',
        })

    # No account yet - this is a first-time Google signup.
    candidate_username = _generate_username_from_email(email)
    username_taken = users_collection.find_one({'username': candidate_username}) is not None

    if not username_taken:
        # Case 2: clean path, no collision - create the account right away.
        new_user = {
            'username': candidate_username,
            'email': email,
            'phone': None,
            'dob': None,
            'password': None,  # No password - this account signs in via Google only.
            'auth_provider': 'google',
            'profile_picture': picture,
            'verified': True,  # Google already verified this email.
            'joinedAt': datetime.utcnow(),
            'role': 'user',
        }
        users_collection.insert_one(new_user)
        threading.Thread(target=send_welcome_email, args=(email, candidate_username)).start()

        _start_session_for_user(new_user)
        logger.info(f"Google sign-in: created new account {candidate_username} for {email}")
        return jsonify({
            'message': 'Account created successfully',
            'username': candidate_username,
            'role': 'user',
            'isAdmin': False,
        })

    # Case 3: the auto-generated username collided with an existing user.
    # Hold their Google profile briefly and ask the frontend to collect a
    # username before we create the account.
    pending_google_signups[email] = {
        'email': email,
        'name': name,
        'picture': picture,
        'expiry': datetime.utcnow() + timedelta(minutes=PENDING_SIGNUP_EXPIRY_MINUTES),
    }
    logger.info(f"Google sign-in: username collision for {email}, asking for a manual username")
    return jsonify({
        'needsUsername': True,
        'email': email,
        'suggestedUsername': candidate_username,
    }), 200


@google_auth_bp.route('/api/auth/google/complete-signup', methods=['POST'])
def google_complete_signup():
    data = request.get_json() or {}
    email = data.get('email')
    username = (data.get('username') or '').strip()

    pending = pending_google_signups.get(email)
    if not pending:
        return jsonify({'error': 'Your Google sign-in session has expired. Please sign in with Google again.'}), 400

    if datetime.utcnow() > pending['expiry']:
        pending_google_signups.pop(email, None)
        return jsonify({'error': 'Your Google sign-in session has expired. Please sign in with Google again.'}), 400

    if not re.match(r'^[a-zA-Z0-9_]{3,20}$', username):
        return jsonify({'error': 'Username must be 3-20 characters, letters/numbers/underscores only.'}), 400

    # Re-check uniqueness in case someone else took it in the last few minutes.
    if users_collection.find_one({'username': username}):
        return jsonify({'error': 'That username is already taken. Please choose another.'}), 400

    new_user = {
        'username': username,
        'email': email,
        'phone': None,
        'dob': None,
        'password': None,
        'auth_provider': 'google',
        'profile_picture': pending.get('picture', ''),
        'verified': True,
        'joinedAt': datetime.utcnow(),
        'role': 'user',
    }
    users_collection.insert_one(new_user)
    pending_google_signups.pop(email, None)

    threading.Thread(target=send_welcome_email, args=(email, username)).start()

    _start_session_for_user(new_user)
    logger.info(f"Google sign-in: completed manual-username signup for {email} as {username}")
    return jsonify({
        'message': 'Account created successfully',
        'username': username,
        'role': 'user',
        'isAdmin': False,
    })
