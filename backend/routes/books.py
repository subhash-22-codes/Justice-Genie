"""
Books + collaboration blueprint: browse/serve legal reference books (via
Cloudinary), and the collaboration request form + status check.
"""
import threading
from datetime import datetime

from flask import Blueprint, request, jsonify, redirect, session
from bson.objectid import ObjectId

from config import logger
from extensions import books_collection, collab_collection
from utils.email import send_email

books_bp = Blueprint('books', __name__)


def serialize_book(book):
    """Return a copy of book with 'id' instead of '_id'."""
    book_copy = dict(book)  # Avoid mutating original
    book_copy['id'] = str(book_copy['_id'])
    del book_copy['_id']
    return book_copy

# -------------------------------
# Fetch books endpoint
# -------------------------------
@books_bp.route('/api/books')
def get_books():
    """Fetch books with optional category filter."""
    category = request.args.get('category', 'all')
    query = {} if category == 'all' else {'category': category}

    books = list(books_collection.find(query))
    serialized_books = [serialize_book(book) for book in books]
    return jsonify(serialized_books)

# -------------------------------
# Serve book endpoint
# -------------------------------
@books_bp.route('/api/books/<book_id>/<action>', methods=['GET'])
def serve_book(book_id, action):
    """Serve book for viewing or downloading (via Cloudinary)."""
    try:
        oid = ObjectId(book_id)
    except:
        return jsonify({'error': 'Invalid book ID'}), 400

    book = books_collection.find_one({'_id': oid})
    if not book:
        return jsonify({'error': 'Book not found'}), 404

    file_url = book.get('file_path')
    if not file_url:
        return jsonify({'error': 'File path not specified'}), 400

    # Update stats
    update_fields = {'$set': {'updated_at': datetime.utcnow()}}
    if action == 'download':
        update_fields['$inc'] = {'downloads': 1}
    elif action == 'view':
        update_fields['$inc'] = {'views': 1}
    else:
        return jsonify({'error': 'Invalid action'}), 400

    books_collection.update_one({'_id': oid}, update_fields)

    # Redirect user to Cloudinary URL
    return redirect(file_url)


@books_bp.route('/api/collab', methods=['POST'])
def collab():
    collab_data = request.get_json()
    logger.info(f"Received collab data: {collab_data}")

    # Validate input fields
    required_fields = ['name', 'email', 'collaborationType', 'message']
    if not all(collab_data.get(field) for field in required_fields):
        return jsonify({'error': 'All required fields must be filled'}), 400

    user_email = collab_data['email']
    username = session.get('username')  # Ensure the user is logged in
    if not username:
        return jsonify({'error': 'Unauthorized. Please log in.'}), 401

    # Check if the logged-in user has already submitted a collaboration request
    existing_collab = collab_collection.find_one({"submitted_by": username})
    if existing_collab:
        return jsonify({'error': 'You have already submitted a collaboration request.'}), 400

    # Store the request in MongoDB
    collab_entry = {
        "name": collab_data['name'],
        "email": user_email,
        "collaborationType": collab_data['collaborationType'],
        "message": collab_data['message'],
        "language": collab_data.get('language', "Not specified"),
        "frameworks": collab_data.get('frameworks', "Not specified"),
        "database": collab_data.get('database', "Not specified"),
        "skills": collab_data.get('skills', "Not specified"),
        "submitted_by": username,
        "submitted_at": datetime.utcnow()
    }
    try:
        collab_collection.insert_one(collab_entry)
    except Exception as e:
        logger.error(f"Error inserting into MongoDB: {e}")
        return jsonify({'error': 'Failed to store collaboration data'}), 500

    # Send confirmation email with a professional & visually enhanced style
    try:
        subject = f"🚀 Collaboration Request Received – Justice Genie ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')})"
        body = f"""
        <html>
        <head>
            <style>
                body {{ margin: 0; padding: 0; background-color: #f4f4f4; }}
                table {{ border-collapse: collapse; width: 100%; max-width: 600px; margin: 0 auto; }}
                .header {{ background-color: #1a365d; color: white; padding: 30px; text-align: center; }}
                .content {{ background-color: white; }}
                .details-table {{ width: 100%; margin: 20px 0; }}
                .details-table td {{ padding: 12px; border: 1px solid #e2e8f0; }}
                .details-table td:first-child {{ background-color: #f8fafc; width: 30%; font-weight: bold; }}
                .button {{ background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; }}
                .footer {{ background-color: #f8fafc; color: #666; font-size: 12px; padding: 20px; text-align: center; }}
            </style>
        </head>
        <body>
            <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                    <td>
                        <table cellpadding="0" cellspacing="0" border="0" style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <tr>
                                <td class="header">
                                    <h1 style="margin: 0;">🤝 Thank You for Your Interest!</h1>
                                </td>
                            </tr>
                            
                            <!-- Content -->
                            <tr>
                                <td style="padding: 30px;">
                                    <p style="font-size: 16px;">Dear <strong>{collab_data['name']}</strong>,</p>
                                    <p style="font-size: 16px;">We're thrilled to have received your collaboration request. Your expertise and skills will be a valuable addition to our mission at <strong>Justice Genie</strong>.</p>
                                    
                                    <h3 style="color: #1a365d; margin-top: 30px;">🔍 Collaboration Details</h3>
                                    <table class="details-table">
                                        <tr>
                                            <td>Collaboration Type</td>
                                            <td>{collab_data['collaborationType']}</td>
                                        </tr>
                                        <tr>
                                            <td>Message</td>
                                            <td>{collab_data['message']}</td>
                                        </tr>
                                        <tr>
                                            <td>Languages Known</td>
                                            <td>{collab_data.get('language', 'Not specified')}</td>
                                        </tr>
                                        <tr>
                                            <td>Frameworks</td>
                                            <td>{collab_data.get('frameworks', 'Not specified')}</td>
                                        </tr>
                                        <tr>
                                            <td>Database Experience</td>
                                            <td>{collab_data.get('database', 'Not specified')}</td>
                                        </tr>
                                        <tr>
                                            <td>Skills</td>
                                            <td>{collab_data.get('skills', 'Not specified')}</td>
                                        </tr>
                                    </table>

                                    <p style="margin-top: 30px;">Our team will carefully review your submission and get back to you at the earliest.</p>
                                    
                                    <table style="width: 100%; margin: 30px 0;">
                                        <tr>
                                            <td align="center">
                                                <a href="https://justice-genie-mu.vercel.app" class="button">Visit Our Website</a>
                                            </td>
                                        </tr>
                                    </table>

                                    <p>Best Regards,<br><strong>Justice Genie Team</strong></p>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td class="footer">
                                    <p style="margin: 0;">📩 This is an automated email. Please do not reply to this email.</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """

        # In your collab endpoint, replace threading line:
        threading.Thread(target=send_collab_email_safe, args=(user_email, subject, body)).start()
        logger.info(f"Collaboration email scheduled for: {user_email}")
        
        
    except Exception as e:
        logger.error(f"Error sending email: {e}")
        return jsonify({'error': 'Failed to send confirmation email'}), 500

    return jsonify({'success': 'Your collaboration request has been submitted successfully!'})

def send_collab_email_safe(user_email, subject, body):
    try:
        send_email(user_email, subject, body)
        logger.info(f"Collaboration email successfully sent to: {user_email}")
    except Exception as e:
        logger.error(f"Failed to send collaboration email to {user_email}: {e}")

@books_bp.route('/api/get_collab_status', methods=['GET'])
def get_collab_status():
    username = session.get('username')  # Ensure logged-in user

    if not username:
        return jsonify({'error': 'Unauthorized. Please log in.'}), 401

    # Check if this specific user has submitted a request
    collab_submission = collab_collection.find_one({"submitted_by": username})

    return jsonify({'submitted': bool(collab_submission)}), 200
