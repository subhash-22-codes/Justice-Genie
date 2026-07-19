"""
Admin blueprint: all /api/admin/* routes plus the /monitor/metrics dashboard
endpoint. Every route here (except /monitor/metrics, which uses its own API
key check) is protected by @admin_required.
"""
import secrets
from datetime import datetime, timedelta
from pytz import utc

from flask import Blueprint, request, jsonify

from config import logger, IST, MONITORING_API_KEY
from extensions import users_collection, collab_collection, feedback_collection, leaderboard_collection
from utils.decorators import admin_required
from utils.email import send_email

admin_bp = Blueprint('admin', __name__)


def _paginate_args():
    """Read ?page=1&limit=20 from the request, with sane defaults/bounds."""
    try:
        page = max(1, int(request.args.get('page', 1)))
    except (TypeError, ValueError):
        page = 1
    try:
        limit = int(request.args.get('limit', 20))
    except (TypeError, ValueError):
        limit = 20
    limit = min(max(1, limit), 100)  # cap at 100 so nobody can request the whole table in one page
    return page, limit


DEFAULT_PROFILE_PIC = "https://res.cloudinary.com/dggciuh9l/image/upload/v1760548194/profile_pics/sswolspeqyywjimwegbh.png"

@admin_bp.route('/api/admin/users', methods=['GET'])
@admin_required
def get_users():
    page, limit = _paginate_args()
    total = users_collection.count_documents({'role': 'user'})
    users = users_collection.find({'role': 'user'}).skip((page - 1) * limit).limit(limit)
    user_list = []

    for user in users:
        lock_time = user.get('account_locked_until')
        if lock_time:
            lock_time = lock_time.replace(tzinfo=utc).astimezone(IST)
        user_list.append({
            "username": user.get('username'),
            "email": user.get('email'),
            "phone": user.get('phone', 'Not provided'),
            "dob": user.get('dob', 'Not provided'),
            "profile_picture": user.get('profile_picture', DEFAULT_PROFILE_PIC),
            "role": user.get('role', 'user'),
            "joinedAt": user.get('joinedAt', 'Unknown'),
            "account_locked_until": lock_time.isoformat() if lock_time else None
        })

    return jsonify({
        "users": user_list,
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": (total + limit - 1) // limit if total else 0
    })


@admin_bp.route('/api/admin/collab-requests', methods=['GET'])
@admin_required
def get_collab_requests():
    try:
        page, limit = _paginate_args()
        total = collab_collection.count_documents({})
        collabs = list(
            collab_collection.find({}, {'_id': 0}).skip((page - 1) * limit).limit(limit)
        )
        return jsonify({
            "collabs": collabs,
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": (total + limit - 1) // limit if total else 0
        }), 200
    except Exception as e:
        logger.error(f"Error fetching collab data: {e}")
        return jsonify({'error': 'Failed to fetch data'}), 500

@admin_bp.route('/api/admin/feedbacks', methods=['GET'])
@admin_required
def get_feedbacks():
    try:
        page, limit = _paginate_args()
        total = feedback_collection.count_documents({})
        feedbacks = list(
            feedback_collection.find({}, {'_id': 0}).skip((page - 1) * limit).limit(limit)
        )
        return jsonify({
            "feedbacks": feedbacks,
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": (total + limit - 1) // limit if total else 0
        }), 200
    except Exception as e:
        logger.error(f"Error fetching feedback data: {e}")
        return jsonify({'error': 'Failed to fetch feedback data'}), 500

@admin_bp.route('/api/admin/quiz_participants', methods=['GET'])
@admin_required
def get_quiz_participants():
    """
    Admin-only: Fetch all users from leaderboard with their email, score, and rank.
    Ranks are computed over the FULL sorted leaderboard first, then only the
    requested page is returned - this keeps ranks correct on every page
    (page 2 shouldn't restart at rank 1).
    """
    try:
        page, limit = _paginate_args()
        leaderboard_data = list(leaderboard_collection.find({}, {'_id': 0}))

        # Sort by score descending
        leaderboard_data.sort(key=lambda x: x.get('score', 0), reverse=True)

        # Assign ranks (over the FULL list, before pagination)
        rank = 0
        previous_score = None
        for index, entry in enumerate(leaderboard_data):
            if entry['score'] != previous_score:
                rank = index + 1
            entry['rank'] = rank
            previous_score = entry['score']

        total = len(leaderboard_data)
        start = (page - 1) * limit
        page_data = leaderboard_data[start:start + limit]

        # Fetch emails only for the usernames on this page
        usernames = [entry['username'] for entry in page_data]
        user_email_map = {
            user['username']: user.get('email', 'Not available')
            for user in users_collection.find(
                {'username': {'$in': usernames}},
                {'username': 1, 'email': 1, '_id': 0}
            )
        }

        # Merge emails into this page's entries
        for entry in page_data:
            entry['email'] = user_email_map.get(entry['username'], 'Not available')
            entry['game_name'] = entry.get('game_name', 'Justice Warrior')

        return jsonify({
            'participants': page_data,
            'page': page,
            'limit': limit,
            'total': total,
            'total_pages': (total + limit - 1) // limit if total else 0
        }), 200

    except Exception as e:
        logger.error(f"Error in /api/admin/quiz_participants: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@admin_bp.route('/api/admin/remove-user', methods=['POST'])
@admin_required
def remove_user():
    data = request.get_json()
    email = data.get('email')

    user = users_collection.find_one({'email': email})
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404

    # Get current UTC time
    current_time_utc = datetime.utcnow()
    lock_until = user.get('account_locked_until')

    # Compare using UTC, check if lock is expired
    if lock_until and lock_until > current_time_utc:
        return jsonify({'success': False, 'message': 'User is already locked.'}), 400

    # Lock for 5 minutes (store in UTC)
    new_lock_until = current_time_utc + timedelta(minutes=5)
    users_collection.update_one({'email': email}, {'$set': {'account_locked_until': new_lock_until}})

    # Convert UTC to IST for email notification
    lock_until_ist = new_lock_until.astimezone(IST)  # IST from config.py - was NameError before (pytz.timezone was never imported)

    try:
        subject = f"⚠️ Temporary Account Suspension - {lock_until_ist.strftime('%Y-%m-%d %H:%M:%S')} IST"
        send_email_alert(email, subject, user['username'])
    except Exception as e:
        logger.error(f"Email sending failed: {e}")

    return jsonify({'success': True, 'message': 'User temporarily locked and notified.'}), 200


def send_email_alert(receiver_email, subject, username):
    body = f"""
    <html>
    <head>
      <style>
        .container {{
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          padding: 20px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background-color: #f9f9f9;
        }}
        .header {{
          background-color: #4F46E5;
          padding: 10px 20px;
          color: white;
          text-align: center;
          border-radius: 6px 6px 0 0;
        }}
        .content {{
          padding: 20px;
          color: #333;
        }}
        .footer {{
          font-size: 12px;
          color: #777;
          text-align: center;
          margin-top: 20px;
        }}
        .button {{
          display: inline-block;
          padding: 10px 20px;
          background-color: #4F46E5;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin-top: 15px;
        }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>⚠️ Account Activity Warning</h2>
        </div>
        <div class="content">
          <p>Dear <strong>{username}</strong>,</p>
          <p>We noticed some unusual activity on your account that may indicate a potential security issue.</p>
          <p>At this time, your account remains fully active. However, we recommend reviewing your recent activity to ensure everything looks normal.</p>
          <p>If this activity was not done by you, please change your password immediately and contact our support team.</p>
          <p>
            <a href="mailto:justicegenie2.0@gmail.com" class="button">Contact Support</a>
          </p>
        </div>
        <div class="footer">
          &copy; {datetime.utcnow().year} Justice Genie. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    """

    try:
        send_email(receiver_email, subject, body)
        logger.info(f"Alert email sent to {receiver_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send alert email to {receiver_email}: {e}")
        return False

@admin_bp.route("/monitor/metrics", methods=["GET"])
def get_dashboard_metrics():
    auth_header = request.headers.get("Authorization")
    
    # --- Secure Auth Check ---
    is_valid = False
    if auth_header and auth_header.startswith("Bearer "):
        provided_key = auth_header.split(" ")[1]
        is_valid = secrets.compare_digest(provided_key, MONITORING_API_KEY)

    if not is_valid:
        return jsonify({"error": "Unauthorized"}), 401

    # --- Users collection pipeline ---
    user_pipeline = [
        {
            "$group": {
                "_id": None,
                "total_users": { "$sum": 1 },
                "verified_users_count": {
                    "$sum": {
                        "$cond": [ { "$eq": ["$verified", True] }, 1, 0 ]
                    }
                }
            }
        },
        { "$project": { "_id": 0 } }
    ]

    try:
        # --- Get user stats ---
        user_metrics = list(users_collection.aggregate(user_pipeline))
        if not user_metrics:
            user_metrics = [{
                "total_users": 0,
                "verified_users_count": 0
            }]
        metrics = user_metrics[0]

        # --- Get best score from leaderboard ---
        best_entry = leaderboard_collection.find_one(sort=[("score", -1)])
        metrics["best_score"] = best_entry["score"] if best_entry else 0

        # --- Get total quiz participants from leaderboard ---
        total_participants = leaderboard_collection.count_documents({})
        metrics["total_quiz_participants"] = total_participants

        # --- Get average quiz score from leaderboard_collection ---
        quiz_pipeline = [
            {
                "$group": {
                    "_id": None,
                    "average_quiz_score": { "$avg": "$score" } 
                }
            }
        ]
        
        # --- (FIXED) Running on the correct collection ---
        quiz_stats = list(leaderboard_collection.aggregate(quiz_pipeline)) 
        
        # Check if quiz_stats is not empty and the average score is not None
        if quiz_stats and quiz_stats[0]["average_quiz_score"] is not None:
            metrics["average_quiz_score"] = quiz_stats[0]["average_quiz_score"]
        else:
            metrics["average_quiz_score"] = 0 # Default to 0 if no scores

        # --- Return final metrics ---
        return jsonify(metrics), 200

    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500
