"""
Feedback blueprint: submit user feedback + check whether the user has
already submitted feedback.
"""
from datetime import datetime
from flask import Blueprint, request, jsonify

from extensions import users_collection, feedback_collection

feedback_bp = Blueprint('feedback', __name__)


@feedback_bp.route('/api/submit_feedback', methods=['POST'])
def submit_feedback():
    data = request.get_json()
    feedback_text = data.get('feedbackText')
    feedback_stars = data.get('feedbackStars', [])  # New: get ratings array
    email = data.get('email')

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
def get_feedback_status():
    email = request.args.get('email')  # Assuming the user is logged in and we get their email as a query parameter

    # Find the user in the database
    user = users_collection.find_one({'email': email})

    if user:
        feedback_submitted = user.get('feedback_submitted', False)
        return jsonify({'submitted': feedback_submitted}), 200
    else:
        return jsonify({'message': 'User not found'}), 404
    
