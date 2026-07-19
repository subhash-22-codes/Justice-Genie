"""
Account blueprint: profile picture, myaccount summary, game name, PDF export,
account deletion (+ goodbye email), and account lock-status check.
"""
import re
from io import BytesIO
from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify, session, send_file
import cloudinary
import cloudinary.uploader
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from config import logger
from extensions import users_collection, leaderboard_collection, collab_collection, chats_collection
from utils.email import send_email

account_bp = Blueprint('account', __name__)


def allowed_file(filename):
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

@account_bp.route('/api/update_profile_picture', methods=['POST'])
def update_profile_picture():
    username = session.get('username')
    if not username:
        return jsonify({'message': 'Unauthorized'}), 401

    if 'profile_picture' not in request.files:
        return jsonify({'message': 'No file part'}), 400

    file = request.files['profile_picture']
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400

    if not allowed_file(file.filename):
        return jsonify({'message': 'Invalid file type'}), 400

    try:
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            file,
            folder='profile_pics',
            transformation=[{'width': 500, 'height': 500, 'crop': 'limit'}]
        )

        logger.info(f"Cloudinary upload result: {result.get('secure_url', 'unknown')}")

        # Remove old profile pic from Cloudinary if exists
        user = users_collection.find_one({'username': username})
        old_pic_id = user.get('profile_picture_id')
        if old_pic_id:
            cloudinary.uploader.destroy(old_pic_id)

        # Save new Cloudinary URL + public_id in DB
        users_collection.update_one(
            {'username': username},
            {'$set': {
                'profile_picture': result['secure_url'],
                'profile_picture_id': result['public_id']
            }}
        )

        return jsonify({
            'message': 'Profile picture updated!',
            'file_path': result['secure_url']
        })

    except Exception as e:
        return jsonify({'message': 'Error uploading image', 'error': str(e)}), 500


# ---- Remove Profile Picture ---- #
@account_bp.route('/api/remove_profile_picture', methods=['POST'])
def remove_profile_picture():
    username = session.get('username')
    if not username:
        return jsonify({'message': 'Unauthorized'}), 401

    user = users_collection.find_one({'username': username})
    if not user:
        return jsonify({'message': 'User not found'}), 404

    try:
        old_pic_id = user.get('profile_picture_id')
        if old_pic_id:
            cloudinary.uploader.destroy(old_pic_id)

        # Remove both fields from DB
        users_collection.update_one(
            {'username': username},
            {'$unset': {'profile_picture': "", 'profile_picture_id': ""}}
        )

        return jsonify({'message': 'Profile picture removed successfully!'})

    except Exception as e:
        return jsonify({'message': 'Error removing profile picture', 'error': str(e)}), 500





@account_bp.route('/api/myaccount', methods=['GET'])
def myaccount():
    if 'username' not in session:
        logger.info("USERNAME NOT IN SESSION")
        return jsonify({'error': 'Unauthorized'}), 401

    user = users_collection.find_one({'username': session['username']})
    if not user:
        return jsonify({'error': 'User not found'}), 404

    unlocked_level = user.get('quiz_level', 1)
    if isinstance(unlocked_level, str):
        try:
            unlocked_level = int(unlocked_level.split()[-1])
        except (ValueError, IndexError):
            unlocked_level = 1

    level_scores = user.get('level_scores', {})
    total_score = sum(level_scores.values())

    return jsonify({
        'username': user.get('username', ''),
        'email': user.get('email',''),
        'game_name': user.get('game_name', ''),
        'profile_picture': user.get('profile_picture', ''),
        'quiz_level': unlocked_level,
        'totalScore': total_score,
        'levelScores': level_scores,
        'last_quiz_marks': user.get('last_quiz_marks', 0),
        'last_quiz_percentage': user.get('last_quiz_percentage', 0)
    })
@account_bp.route('/api/update_game_name', methods=['POST'])
def update_game_name():
    if 'username' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    game_name = data.get('game_name', '').strip()

    if not game_name:
        return jsonify({'error': 'Game name cannot be empty'}), 400

    # ✅ Update in users collection
    users_collection.update_one(
        {'username': session['username']},
        {'$set': {'game_name': game_name}}
    )

    # ✅ Also update in leaderboard collection
    leaderboard_collection.update_one(
        {'username': session['username']},
        {'$set': {'game_name': game_name}}
    )

    return jsonify({'message': 'Game name updated successfully'}), 200


#export pdf
@account_bp.route('/api/export-pdf', methods=['POST'])
def export_pdf():
    try:
        data = request.get_json()
        messages = data.get('messages', [])

        # REMOVED: The font registration logic is gone

        pdf_buffer = BytesIO()
        doc = SimpleDocTemplate(pdf_buffer, pagesize=letter)

        styles = getSampleStyleSheet()
        # CHANGED: The fontName is now back to the standard 'Helvetica'
        heading_style = ParagraphStyle(
            'HeadingStyle', parent=styles['Normal'], fontName='Helvetica-Bold',
            fontSize=16, spaceAfter=15, alignment=1
        )
        user_style = ParagraphStyle(
            'UserStyle', parent=styles['Normal'], fontName='Helvetica-Bold',
            fontSize=11, textColor='blue', spaceAfter=8
        )
        bot_style = ParagraphStyle(
            'BotStyle', parent=styles['Normal'], fontName='Helvetica',
            fontSize=11, textColor='black', spaceAfter=8
        )

        elements = [
            Paragraph("<b>Chat History with Justice Genie</b>", heading_style),
            Spacer(1, 20)
        ]

        # This function converts markdown to ReportLab-compatible HTML
        def prettify_text_for_pdf(text):
            text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text) # Bold
            text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', text)     # Italic
            text = text.replace("\n", "<br/>")                 # Newlines
            return text.strip()

        # This logic remains the same
        for message in messages:
            user = message.get('user', 'Unknown')
            text = message.get('text', '').strip()
            
            if user.lower() == 'you':
                name_part = f"<b>{user}:</b>"
                style = user_style
            else:
                name_part = f"<b>{user}:</b>"
                style = bot_style
                
            formatted_text = prettify_text_for_pdf(text)
            
            elements.append(Paragraph(f"{name_part} {formatted_text}", style))
            elements.append(Spacer(1, 10))

        doc.build(elements)
        pdf_buffer.seek(0)
        return send_file(pdf_buffer, mimetype='application/pdf', as_attachment=True, download_name='chat_history.pdf')

    except Exception as e:
        return jsonify({'error': f'Failed to generate PDF: {str(e)}'}), 500
    
def send_goodbye_email(email, username, score=None, rank=None):
   
    receiver_email = email
    subject = f"It's Not Goodbye, Just See You Later – Justice Genie 🪄💙 ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')})"

    # Only show rank info if both score and rank are provided
    rank_info = f"""
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #ffffff 0%, #e0f2fe 100%); border-radius: 12px; margin: 32px 0;">
        <tr>
            <td style="padding: 24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="text-align: center; padding-bottom: 16px;">
                            <h3 style="color: #0369a1; margin: 0; font-size: 20px; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">
                                🏆 Your Legal Journey Achievements
                            </h3>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td width="45%" style="background: rgba(3, 105, 161, 0.1); padding: 20px; border-radius: 8px; text-align: center;">
                                        <div style="font-size: 36px; font-weight: bold; color: #2b6cb0; margin-bottom: 8px; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">{score}</div>
                                        <div style="color: #475569; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Points Earned</div>
                                    </td>
                                    <td width="10%" style="text-align: center;">
                                        <div style="width: 1px; background-color: rgba(3, 105, 161, 0.2); height: 100%; margin: 0 auto;"></div>
                                    </td>
                                    <td width="45%" style="background: rgba(3, 105, 161, 0.1); padding: 20px; border-radius: 8px; text-align: center;">
                                        <div style="font-size: 36px; font-weight: bold; color: #2b6cb0; margin-bottom: 8px; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">#{rank}</div>
                                        <div style="color: #475569; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Final Rank</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    """ if score is not None and rank is not None else ""

    body = f"""
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f7fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 40px auto;">
            <tr>
                <td style="background: white; padding: 48px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);">
                    <!-- Header with Gradient Border -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="text-align: center; padding-bottom: 40px; position: relative;">
                                <div style="position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 150px; height: 4px;  border-radius: 2px;"></div>
                                <img src="https://res.cloudinary.com/dggciuh9l/image/upload/v1760548194/profile_pics/sswolspeqyywjimwegbh.png" 
                                     alt="Justice Genie Logo" 
                                     style="width: 120px; height: auto; margin-bottom: 24px; border-radius: 60px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
                                <h1 style="color: #1a365d; font-size: 28px; margin: 0; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.05);">Thank You for Your Journey</h1>
                            </td>
                        </tr>
                    </table>

                    <!-- Main Content -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="color: #2d3748; font-size: 16px; line-height: 1.8; padding-bottom: 24px;">
                                <p style="font-size: 18px; margin-bottom: 24px;">
                                    Dear <strong style="color: #2b6cb0; text-shadow: 0 1px 2px rgba(43, 108, 176, 0.1);">{username}</strong>,
                                </p>

                                <p>
                                    We wanted to take a moment to express our heartfelt gratitude for being part of the 
                                    <strong style="color: #2b6cb0; text-shadow: 0 1px 2px rgba(43, 108, 176, 0.1);">Justice Genie</strong> community. Your presence has made our platform stronger and more meaningful. ⚖️
                                </p>

                                <p>
                                    While your account has been successfully deleted, we want you to know that your impact on our community remains, 
                                    and our doors will always be open for you. 🌟
                                </p>
                            </td>
                        </tr>
                    </table>

                    {rank_info}

                    <!-- Did You Know Section -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; margin: 32px 0; box-shadow: 0 4px 15px rgba(0, 122, 255, 0.2);">
                        <tr>
                            <td style="padding: 24px;">
                                <h3 style="color: #0369a1; margin: 0 0 16px 0; font-size: 20px; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">
                                    💡 Did You Know?
                                </h3>
                                <p style="color: #000000; font-weight: 600; margin: 0; line-height: 1.8; background-color: #ffffff;">
                                    You can always return to Justice Genie with a fresh start. Our platform is continuously evolving 
                                    with new features and improvements to serve you better.
                                </p>
                            </td>
                        </tr>
                    </table>

                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="text-align: center; padding: 40px 0;">
                                <a href="https://Justice-Genie-mu.vercel.app/register" 
                                    style="display: inline-block; background: #ffffff; color: #0369a1; padding: 16px 32px; 
                                    text-decoration: none; border-radius: 8px; font-weight: 600; transition: all 0.3s ease; 
                                    box-shadow: 0 4px 10px rgba(0, 122, 255, 0.2); border: 2px solid #38bdf8;">
                                    Return to Justice Genie ⚖️
                                </a>
                            </td>
                        </tr>
                    </table>

                    <!-- Footer -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #e2e8f0; margin-top: 40px;">
                        <tr>
                            <td style="text-align: center; padding-top: 32px;">
                                <p style="color: #2d3748; font-style: italic; margin-bottom: 24px;">
                                    "Justice is the constant and perpetual wish to render to everyone their due."
                                </p>
                                <p style="color: #4a5568; margin-bottom: 24px;">
                                    Until we meet again, stay empowered and informed.
                                </p>
                                <p style="color: #2d3748; font-weight: 600; margin: 0;">
                                    With warm regards,<br>
                                    The Justice Genie Team 🏛️
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    # Email Setup
    logger.info(f"Preparing to send goodbye email to: {receiver_email}")
    try:
        send_email(receiver_email, subject, body)
        logger.info(f"Goodbye email successfully queued for: {receiver_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send goodbye email to {receiver_email}: {e}")
        return False
        

@account_bp.route('/api/delete_account', methods=['DELETE'])
def delete_account():
    if 'username' not in session:  
        return jsonify({'error': 'Unauthorized. Please log in.'}), 401

    username = session['username']
    user = users_collection.find_one({'username': username})  

    if not user:
        return jsonify({'error': 'User not found.'}), 404

    user_email = user.get('email')  
    logger.info(f"Deleting user: {username} (Email: {user_email})")

    # 🔥 Fetch leaderboard to calculate user's rank before deletion
    leaderboard = list(leaderboard_collection.find().sort("score", -1))
    rank = None
    user_score = None

    for i, entry in enumerate(leaderboard):
        if entry['username'] == username:
            rank = i + 1  # Rank starts from 1
            user_score = entry['score']
            break

    # ✅ Delete user from MongoDB
    user_deletion_result = users_collection.delete_one({'username': username})
    logger.info(f"User Deletion Status: {user_deletion_result.deleted_count}")

    # ✅ Delete user from leaderboard
    leaderboard_deletion_result = leaderboard_collection.delete_one({'username': username})
    logger.info(f"Leaderboard Deletion Status: {leaderboard_deletion_result.deleted_count}")

    # ✅ Delete all collabs where 'submitted_by' matches the username
    collab_deletion_result = collab_collection.delete_many({'submitted_by': username})
    logger.info(f"Collab Deletion Status: {collab_deletion_result.deleted_count}")
    
     # ✅ Delete user chat history
    chat_history_deletion_result = chats_collection.delete_many({'username': username})
    logger.info(f"Chat History Deletion Status: {chat_history_deletion_result.deleted_count}")

    # Confirm remaining collabs (if other users submitted with the same email)
    remaining_collabs = list(collab_collection.find({'email': user_email}))
    logger.info(f"Remaining collabs with email {user_email}: {remaining_collabs}")

    
    # ✅ Send goodbye email with score & rank if applicable
    send_goodbye_email(user_email, username, user_score, rank)  

    # Clear session
    session.clear()  

    return jsonify({'message': 'Account deleted successfully. You will be redirected to the login page.'}), 200



# Get user lock status with expired check
@account_bp.route('/api/user/lock-status', methods=['GET'])
def get_lock_status():
    email = request.args.get('email')
    user = users_collection.find_one({'email': email})
    
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404

    lock_until = user.get('account_locked_until')
    
    # Check if the user is locked, and if the lock time has expired
    if lock_until:
        if lock_until < datetime.utcnow():
            # If the lock time is expired, unlock the user by removing the lock
            users_collection.update_one({'email': email}, {'$unset': {'account_locked_until': 1}})
            return jsonify({'success': True, 'message': 'User unlocked', 'lock_until': None}), 200
        return jsonify({'success': True, 'lock_until': lock_until.isoformat()}), 200
    
    return jsonify({'success': False, 'message': 'No lock status found'}), 404
