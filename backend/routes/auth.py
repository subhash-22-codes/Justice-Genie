"""
Auth blueprint: register, verify, login, logout, forgot/reset password,
session check.
"""
import random
import re
import threading
from datetime import datetime

from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash

from config import logger
from extensions import users_collection, limiter
from utils.email import send_verification_email, send_welcome_email, send_forgot_password_email

auth_bp = Blueprint('auth', __name__)

# In-memory temp storage for not-yet-verified registrations.
# NOTE: this resets on every server restart/redeploy, and won't be shared
# across multiple worker processes if you ever scale past 1 Render worker.
# Fine for now (Render free tier runs 1 worker) - revisit if you add workers.
unverified_users = {}


@auth_bp.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data['email']
    username = data['username']
    
    # if not is_valid_email(email):
    #      return jsonify({'error': 'Invalid or non-existent email address.'}), 400
    
    # Check if the username already exists
    existing_user = users_collection.find_one({'username': username})
    if existing_user:
        return jsonify({'error': 'Username already exists. Please choose a different username.'}), 400

    # Check if the email already exists
    existing_email = users_collection.find_one({'email': email})
    if existing_email:
        return jsonify({'error': 'Email already registered. Please log in or use a different email.'}), 400

    # Prevent duplicate registrations in temporary storage
    if email in unverified_users:
        return jsonify({'error': 'A verification code was already sent to this email. Please check your email or wait for the code to expire before trying again.'}), 400

    verification_code = str(random.randint(100000, 999999))  # Generate a 6-digit code

    # Store user data temporarily (NOT in MongoDB yet)
    unverified_users[email] = {
        'username': username,
        'email': email,
        'phone': data['phone'],
        'dob': data['dob'],
        'password': generate_password_hash(data['password']),
        'verification_code': verification_code
    }

    # Send verification email
    send_verification_email(email, verification_code)

    return jsonify({'message': 'Please check your email for the verification code to complete registration.'}), 200




@auth_bp.route('/api/verify_code', methods=['POST'])
def verify_code():
    data = request.get_json()
    email = data.get('email')
    entered_code = data.get('verification_code')

    # Check if the user is in temporary storage
    if email not in unverified_users:
        return jsonify({'error': 'User not found or already verified.'}), 400

    stored_code = unverified_users[email]['verification_code']

    if entered_code == stored_code:
        # Move user data from temporary storage to the database
        user_data = unverified_users.pop(email)  # Remove from temporary storage

        users_collection.insert_one({   # ✅ add ()
            'username': user_data['username'],
            'email': user_data['email'],
            'phone': user_data['phone'],
            'dob': user_data['dob'],
            'password': user_data['password'],  # Already hashed
            'verified': True,  # Mark as verified
            'joinedAt': datetime.utcnow(),
            'role': 'user'
        })

        # ✅ Send Welcome Email in the Background
        
        threading.Thread(target=send_welcome_email, args=(email, user_data['username'])).start()


        return jsonify({'message': 'Registration successful! You can now log in.'}), 200
    else:
        return jsonify({'error': 'Invalid verification code.'}), 400


@auth_bp.route('/api/resend_verification_code', methods=['POST'])
def resend_verification_code():
    data = request.get_json()
    email = data.get('email')

    # Check if the user is in temporary storage (not yet verified)
    if email in unverified_users:
        new_code = str(random.randint(100000, 999999))  # Generate new code
        unverified_users[email]['verification_code'] = new_code  # Update in temp storage

        send_verification_email(email, new_code)

        return jsonify({'message': 'Verification code resent. Please check your email.'}), 200

    # If user is already in the database, they should not need verification again
    if users_collection.find_one({'email': email, 'verified': True}):
        return jsonify({'error': 'User already verified! Please log in.'}), 400

    return jsonify({'error': 'User not found or verification expired. Please register again.'}), 400


@auth_bp.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')

    # Email format validation using regex
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if not re.match(email_regex, email):
        return jsonify({'error': 'Invalid email format. Please enter a valid email address.'}), 400

    user = users_collection.find_one({'email': email})

    if not user:
        # Email not found in the database
        return jsonify({'error': 'Email address not found. Please check and try again.'}), 400

    reset_code = str(random.randint(100000, 999999))  # Generate reset code
    # Store the reset code in the database
    users_collection.update_one({'email': email}, {'$set': {'reset_code': reset_code}})

    # Send reset code email
    send_forgot_password_email(email, reset_code)

    return jsonify({'message': 'Password reset code sent to your email.'}), 200



@auth_bp.route('/api/verify-forgot-password-code', methods=['POST'])
def verify_forgot_password_code():
    data = request.get_json()
    email = data.get('email')
    entered_code = str(data.get('reset_code')).strip()  # Convert entered code to string and strip any spaces

    user = users_collection.find_one({'email': email})

    if not user:
        return jsonify({'error': 'User not found'}), 400

    stored_code = str(user.get('reset_code')).strip()  # Convert stored code to string and strip any spaces


    if entered_code == stored_code:
        return jsonify({'message': 'Reset code verified. You can now reset your password.'}), 200
    else:
        return jsonify({'status': 'fail', 'message': 'Invalid reset code.'}), 200




@auth_bp.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    email = data.get('email')
    new_password = data.get('new_password')

    user = users_collection.find_one({'email': email})

    if not user:
        return jsonify({'error': 'User not found'}), 400

    # Hash the new password
    hashed_password = generate_password_hash(new_password)

    # Update the password in the database
    users_collection.update_one({'email': email}, {'$set': {'password': hashed_password}})

    # Remove the reset code after password change
    users_collection.update_one({'email': email}, {'$unset': {'reset_code': ""}})

    return jsonify({'message': 'Password successfully reset. You can now log in with your new password.'})



@auth_bp.route('/api/login', methods=['POST'])
@limiter.limit("10 per minute")
def login():
    data = request.get_json()
    username_or_email = data.get('username')
    password = data.get('password')

    user = users_collection.find_one({
        "$or": [
            {"username": username_or_email},
            {"email": username_or_email}
        ]
    })

    if user:
        password_match = check_password_hash(user['password'], password)

        if password_match:
            session.permanent = True
            session['username'] = user['username']
            session['email'] = user['email']
            session['role'] = user.get('role', 'user')

            is_admin = user.get('role') == 'admin'
            logger.info(f"Login success for user: {user['username']}")

            return jsonify({
                'message': 'Login successful',
                'isAdmin': is_admin
            })

    logger.warning(f"Login failed for identifier: {username_or_email}")
    return jsonify({'error': 'Invalid credentials'}), 401


@auth_bp.route("/api/check-session", methods=["GET"])
def check_session():
    if "username" in session and "email" in session:
        return jsonify({
            "loggedIn": True,
            "username": session["username"],
            "role": session.get("role", "user")
        })

    return jsonify({"loggedIn": False})



@auth_bp.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'}), 200
