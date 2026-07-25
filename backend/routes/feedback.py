"""
Feedback blueprint: submit user feedback + check whether the user has
already submitted feedback.
"""
from datetime import datetime
from flask import Blueprint, request, jsonify, session

from extensions import users_collection, feedback_collection
from utils.decorators import login_required

feedback_bp = Blueprint('feedback', __name__)


@feedback_bp.route('/api/submit_feedback', methods=['POST'])
@login_required
def submit_feedback():
    data = request.get_json()
    feedback_text = data.get('feedbackText')
    feedback_stars = data.get('feedbackStars', [])  # New: get ratings array
    # SECURITY: email now comes from the logged-in session, never from the
    # request body — otherwise anyone could submit feedback that looks like
    # it came from someone else's account, or flip another account's
    # "feedback submitted" status.
    email = session['email']

    user = users_collection.find_one({'email': email})  # ✅ add ()

    if user and user.get('feedback_submitted', False):
        return jsonify({"message": "You have already submitted feedback."}), 400

    if user and 'feedback_submitted' not in user:
        users_collection.update_one(   # ✅ add ()
            {'email': email},
            {'$set': {'feedback_submitted': False}}
        )

    feedback_collection.insert_one({   # ✅ add ()
        'email': email,
        'feedback_text': feedback_text,
        'feedback_stars': feedback_stars,  # ⭐ Save the star ratings
        'submitted_at': datetime.utcnow()
    })

    users_collection.update_one(   # ✅ add ()
        {'email': email},
        {'$set': {'feedback_submitted': True}}
    )

    return jsonify({"message": "Thank you for your feedback!"}), 200


@feedback_bp.route('/api/get_feedback_status', methods=['GET'])
@login_required
def get_feedback_status():
    # SECURITY: email now comes from the logged-in session, never from the
    # query string — otherwise anyone could check (or infer) another
    # account's feedback status just by changing ?email=... in the URL.
    email = session['email']

    # Find the user in the database
    user = users_collection.find_one({'email': email})

    if user:
        feedback_submitted = user.get('feedback_submitted', False)
        return jsonify({'submitted': feedback_submitted}), 200
    else:
        return jsonify({'message': 'User not found'}), 404
    
