from flask import Flask, request, jsonify, redirect, url_for, session, send_from_directory
from flask_cors import CORS
import google.generativeai as genai
from pymongo import MongoClient
from bson.objectid import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
import re
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Flask, request, jsonify, send_file
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import json
from textwrap import wrap
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from bson import json_util
from google.cloud import translate_v2 as translate
import requests
import uuid
from datetime import datetime, timedelta
import traceback
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import ListItem, ListFlowable
from markdown2 import markdown
from googletrans import Translator
from bs4 import BeautifulSoup
import pyttsx3
import threading
import speech_recognition as sr
from PIL import Image
from pytz import timezone,utc
from dotenv import load_dotenv
load_dotenv()
IST = timezone('Asia/Kolkata')
# ABSTRACT_API_KEY = os.getenv("ABSTRACT_API_KEY")

# Email setup
EMAIL_USER = os.getenv("JG_EMAIL")
EMAIL_PASS = os.getenv("JG_PASSWORD")
# Get API key from environment
api_key = os.getenv("GEMINI_API_KEY")

    
app = Flask(__name__, static_folder='frontend/build/static')
 
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)


app.secret_key = 'supersecretkey'


genai.configure(api_key=api_key)  
model = genai.GenerativeModel('gemini-1.5-flash')

# MongoDB connection setup
client = MongoClient('mongodb://localhost:27017/')  
db = client['law_chatbot']
users_collection = db['users']
feedback_collection = db["feedback"]
quizzquestions_collection = db['quizzquestions']
books_collection = db["books"]
collab_collection = db['collaborations']
leaderboard_collection = db['leaderboard']
chats_collection = db["chats"]  # New chat collection
translator = Translator()
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'frontend/public/pdfs')
# UPLOAD_FOLDER = os.path.join(os.getcwd(), 'backend', 'images')
BOOKS_FOLDER = os.path.join(os.getcwd(), 'images')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
UPLOAD_FOLDER = './uploaded_images'

# 🔹 Global pyttsx3 engine instance
engine = pyttsx3.init()

def speak_text(text):
    """Convert text to speech using pyttsx3"""
    try:
        engine.endLoop()  # Stop any previous loop if running
    except:
        pass  # Ignore if no loop is running
    
    engine.say(text)
    engine.runAndWait()

@app.route('/api/text-to-speech', methods=['POST'])
def text_to_speech():
    """API to receive text from frontend and play speech"""
    data = request.get_json()
    text = data.get('text', '')

    if not text:
        return jsonify({'error': 'No text provided'}), 400

    try:
        speak_text(text)  # Run synchronously (No threading)
        return jsonify({'message': 'Speech playing'}), 200
    except Exception as e:
        return jsonify({'error': f'Error: {str(e)}'}), 500

@app.route('/api/stop-speech', methods=['POST'])
def stop_speech():
    """API to stop ongoing speech and reset the engine"""
    global engine
    try:
        engine.stop()  # Stop ongoing speech
        engine.endLoop()  # Ensure the loop is stopped
        engine = pyttsx3.init()  # Reinitialize engine to clear any queued speech
        return jsonify({'message': 'Speech stopped successfully'}), 200
    except Exception as e:
        return jsonify({'error': f'Error stopping speech: {str(e)}'}), 500
    
def recognize_speech():
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        print("Listening... Speak now.")
        recognizer.adjust_for_ambient_noise(source)

        try:
            audio = recognizer.listen(source, timeout=10)  # Listen for 10 seconds
            text = recognizer.recognize_google(audio)
            return text
        except sr.UnknownValueError:
            return "Could not understand the audio."
        except sr.RequestError:
            return "Speech recognition service unavailable."

@app.route('/api/speech-to-text', methods=['GET'])
def speech_to_text():
    response = {"text": ""}

    def process_speech():
        text = recognize_speech()
        response["text"] = text

    thread = threading.Thread(target=process_speech)
    thread.start()
    thread.join()  # Wait for the thread to complete

    return jsonify(response)


def serialize_book(book):
    """Serialize MongoDB book document."""
    book['id'] = str(book['_id'])
    del book['_id']
    return book

@app.route('/api/books')
def get_books():
    """Fetch books with optional category filter."""
    category = request.args.get('category', 'all')
    query = {} if category == 'all' else {'category': category}
    
    books = list(books_collection.find(query))
    serialized_books = [serialize_book(book) for book in books]
    return jsonify(serialized_books)


@app.route('/api/books/<book_id>/<action>', methods=['GET'])
def serve_book(book_id, action):
    """Serve book for viewing or downloading based on action."""
    book = books_collection.find_one({'_id': ObjectId(book_id)})
    if not book:
        return jsonify({'error': 'Book not found'}), 404

    file_path = book.get('file_path')
    if not file_path:
        return jsonify({'error': 'File path not specified'}), 400

    abs_path = os.path.join(BOOKS_FOLDER, file_path)
    print("Looking for file at:", abs_path)

    if not os.path.exists(abs_path):
        return jsonify({'error': 'File not found on server'}), 404

    if action == 'download':
        books_collection.update_one(
            {'_id': ObjectId(book_id)},
            {'$inc': {'downloads': 1}, '$set': {'updated_at': datetime.utcnow()}}
        )
        return send_from_directory(directory=BOOKS_FOLDER, path=file_path, as_attachment=True)
    
    elif action == 'view':
        books_collection.update_one(
            {'_id': ObjectId(book_id)},
            {'$inc': {'views': 1}, '$set': {'updated_at': datetime.utcnow()}}
        )
        response = send_from_directory(directory=BOOKS_FOLDER, path=file_path, as_attachment=False)
        response.headers['Content-Type'] = 'application/pdf'
        return response

    return jsonify({'error': 'Invalid action'}), 400



@app.route("/api/translate", methods=["POST"])
def translate_text():
    try:
        data = request.json
        message_id = data.get("messageId")
        message_content = data.get("messageContent")  # Original formatted text
        target_lang = data.get("targetLang")

        if not message_id or not message_content or not target_lang:
            return jsonify({"error": "Invalid request. 'messageId', 'messageContent', and 'targetLang' are required."}), 400

        def format_response(response_text):
            """Ensures the response retains the same structure as the bot's original response."""
            response_text = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', response_text)
            lines = response_text.splitlines()
            formatted_lines = []

            for line in lines:
                if re.match(r'^\d+\.', line):  # Numbered list (1., 2., etc.)
                    formatted_lines.append(f"<p><strong>{line}</strong></p>")
                elif line.strip().startswith('*'):  # Bullet points (* point)
                    subpoint = line.strip().lstrip('*').strip()
                    formatted_lines.append(f"<ul><li>{subpoint}</li></ul>")
                else:
                    formatted_lines.append(f"<p>{line}</p>")

            return ''.join(formatted_lines)

        # Step 1: Format Original Response
        formatted_content = format_response(message_content)

        # Step 2: Parse the formatted content using BeautifulSoup
        soup = BeautifulSoup(formatted_content, "html.parser")

        # Step 3: Translate only the text inside tags while preserving HTML
        for tag in soup.find_all(string=True):
            if tag.parent.name in ["strong", "li", "p"]:  # Translate only inside text-containing tags
                translated_text = translator.translate(tag, dest=target_lang).text
                tag.replace_with(translated_text)

        # Step 4: Return Translated and Formatted Response
        translated_content = str(soup)

        return jsonify({"translatedText": translated_content})

    except Exception as e:
        return jsonify({"error": f"Translation failed: {str(e)}"}), 500
    
@app.route('/api/clear_chat', methods=['POST'])
def clear_chat():
    data = request.get_json()
    username = data.get('username')  # ✅ Get username from request

    print("Received username for chat deletion:", username)  # ✅ Debugging

    if not username:
        return jsonify({"error": "Username is required"}), 400

    chats_collection = db["chats"]  # ✅ Ensure correct collection name
    result = chats_collection.delete_many({"username": username})  # ✅ Use username

    if result.deleted_count > 0:
        return jsonify({"message": "Chat history cleared successfully"}), 200
    else:
        return jsonify({"message": "No chat history found"}), 200


# ✅ Store Messages (Both Text & Graph) in MongoDB
@app.route('/api/store_message', methods=['POST'])
def store_message():
    try:
        data = request.json
        username = data.get("username")
        messages = data.get("messages")  # Expecting a list of messages

        if not username or not messages or not isinstance(messages, list):
            return jsonify({"error": "Username and a list of messages are required"}), 400

        # Find user ID
        user = users_collection.find_one({"username": username})
        if not user:
            return jsonify({"error": "User not found"}), 404

        user_id = str(user["_id"])

        # Check if user already has a chat history
        user_chat = chats_collection.find_one({"user_id": user_id})

        if user_chat:
            # Append new messages to existing chat history
            chats_collection.update_one(
                {"user_id": user_id},
                {"$push": {"messages": {"$each": messages}}}  # Append multiple messages
            )
        else:
            # Create a new chat entry
            chats_collection.insert_one({
                "user_id": user_id,
                "username": username,
                "messages": messages  # Store all messages
            })

        return jsonify({"success": True, "message": "Messages stored successfully"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ✅ Fetch Chat History from MongoDB
@app.route('/api/get_chat', methods=['GET'])
def get_chat():
    username = request.args.get('username')

    if not username:
        return jsonify({"error": "Username is required"}), 400

    try:
        # Find user ID
        user = users_collection.find_one({"username": username})
        if not user:
            return jsonify({"error": "User not found"}), 404

        user_id = str(user["_id"])

        # Fetch chat history
        user_chat = chats_collection.find_one({"user_id": user_id})

        if not user_chat:
            return jsonify({"messages": []})  # Return empty if no chat found

        return jsonify({"messages": user_chat.get("messages", [])})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/submit_feedback', methods=['POST'])
def submit_feedback():
    data = request.get_json()
    feedback_text = data.get('feedbackText')
    feedback_stars = data.get('feedbackStars', [])  # New: get ratings array
    email = data.get('email')

    user = users_collection.find_one({'email': email})

    if user and user.get('feedback_submitted', False):
        return jsonify({"message": "You have already submitted feedback."}), 400

    if user and 'feedback_submitted' not in user:
        users_collection.update_one(
            {'email': email},
            {'$set': {'feedback_submitted': False}}
        )

    feedback_collection.insert_one({
        'email': email,
        'feedback_text': feedback_text,
        'feedback_stars': feedback_stars,  # ⭐ Save the star ratings
        'submitted_at': datetime.utcnow()
    })

    users_collection.update_one(
        {'email': email},
        {'$set': {'feedback_submitted': True}}
    )

    return jsonify({"message": "Thank you for your feedback!"}), 200

@app.route('/api/get_feedback_status', methods=['GET'])
def get_feedback_status():
    email = request.args.get('email')  # Assuming the user is logged in and we get their email as a query parameter

    # Find the user in the database
    user = users_collection.find_one({'email': email})

    if user:
        feedback_submitted = user.get('feedback_submitted', False)
        return jsonify({'submitted': feedback_submitted}), 200
    else:
        return jsonify({'message': 'User not found'}), 404
    

@app.route('/api/collab', methods=['POST'])
def collab():
    collab_data = request.get_json()
    
    print(f"Received collab data: {collab_data}")

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

    # Store the request in MongoDB with additional fields
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
        print(f"Error inserting into MongoDB: {e}")
        return jsonify({'error': 'Failed to store collaboration data'}), 500

    # Send confirmation email with a professional & visually enhanced style
    try:
        sender_email = os.getenv("JG_EMAIL")
        sender_password = os.getenv("JG_PASSWORD")

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
                                                <a href="https://justicegenie.com" class="button">Visit Our Website</a>
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

        msg = MIMEMultipart()
        msg["From"] = sender_email
        msg["To"] = user_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, user_email, msg.as_string())

        print(f"✅ Email sent successfully to {user_email}")

    except Exception as e:
        print(f"❌ Error sending email: {e}")
        return jsonify({'error': 'Failed to send confirmation email'}), 500

    return jsonify({'success': 'Your collaboration request has been submitted successfully!'})

@app.route('/api/get_collab_status', methods=['GET'])
def get_collab_status():
    username = session.get('username')  # Ensure logged-in user

    if not username:
        return jsonify({'error': 'Unauthorized. Please log in.'}), 401

    # Check if this specific user has submitted a request
    collab_submission = collab_collection.find_one({"submitted_by": username})

    return jsonify({'submitted': bool(collab_submission)}), 200


# Directory to save uploaded profile pictures


def is_legal_query(query):
    prompt = (
    f"Classify the following query strictly as 'legal' or 'non-legal' under the context of Indian law only. "
    f"Only classify queries as 'legal' if they directly relate to legal statutes, IPC sections, Indian penal codes, acts, or law topics in India.\n\n"
    f"If the query is classified as 'legal,' provide:\n"
    f"1. Relevant IPC sections or laws applicable to the scenario.\n"
    f"2. Possible punishments (e.g., years of imprisonment, fines, or capital punishment like Uri Shiksha).\n"
    f"3. Additional comments explaining any exceptions, variations, or conditions influencing the punishment.\n"
    f"4. A summary of one or two past Indian legal cases directly relevant to the query.\n"
    f"5. For each case, include:\n"
    f"   a. Who won the case (e.g., the plaintiff, the accused, or the state).\n"
    f"   b. The reasoning behind the judgment (e.g., evidence presented, interpretation of the law).\n"
    f"   c. The IPC sections or laws referenced in the judgment.\n"
    f"   d. The punishment given to the accused, and the reasoning behind the specific punishment awarded.\n\n"
    f"Query: '{query}'"
)


    response = model.generate_content(prompt)
    classification = response.text.strip().lower()
    return 'legal' in classification

def format_response(response_text):
    response_text = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', response_text)
    lines = response_text.splitlines()
    formatted_lines = []

    for line in lines:
        if re.match(r'^\d+\.', line):
            formatted_lines.append(f"<p><strong>{line}</strong></p>")
        elif line.strip().startswith('*'):
            subpoint = line.strip().lstrip('*').strip()
            formatted_lines.append(f"<ul><li>{subpoint}</li></ul>")
        else:
            formatted_lines.append(f"<p>{line}</p>")

    return ''.join(formatted_lines)

# Serve React static files
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

# Register endpoint

def send_verification_email(email, verification_code):
    sender_email = os.getenv("JG_EMAIL")
    receiver_email = email
    password = os.getenv("JG_PASSWORD")

    # Unique Subject Line to Prevent Email Threading
    subject = f"🔹 Justice Genie - Verify Your Email ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')})"

    # Justice Genie Logo (Replace with actual URL)
    logo_url = "https://images.nightcafe.studio/jobs/DLZmuOJUEdalL84u3voe/DLZmuOJUEdalL84u3voe--1--t6av2.jpg?tr=w-1600,c-at_max"

    # HTML Email Body
    body = f"""
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f7f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 40px auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
            <!-- Logo -->
            <div style="text-align: center; margin-bottom: 32px;">
                <img src="{logo_url}" alt="Justice Genie Logo" style="width: 120px; height: auto;">
            </div>

            <h1 style="color: #1a1a1a; font-size: 24px; text-align: center; margin-bottom: 24px;">
                Verify Your Email Address
            </h1>

            <p style="color: #444444; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 32px;">
                Welcome to <strong>Justice Genie</strong>. To ensure the security of your account, please use the verification code below.
            </p>

            <!-- Verification Code Box -->
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
                <span style="font-family: monospace; font-size: 32px; font-weight: 600; color: #2563eb; letter-spacing: 4px;">
                    {verification_code}
                </span>
            </div>

            <p style="color: #666666; font-size: 14px; text-align: center; margin-top: 24px;">
                This code will expire shortly. If you didn't request this verification, please ignore this email.
            </p>

            <!-- Footer -->
            <div style="border-top: 1px solid #eaeaea; margin-top: 32px; padding-top: 32px; text-align: center;">
                <p style="color: #666666; font-size: 14px; margin: 0;">
                    Justice Genie - Empowering citizens with knowledge
                </p>
                <p style="color: #666666; font-size: 12px; margin-top: 8px;">
                    This is an automated message, please do not reply.
                </p>
            </div>
        </div>
    </body>
    </html>
    """


    # Email Setup
    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = receiver_email
    msg['Subject'] = subject

    # Prevent Email Threading with a Unique Message-ID
    msg.add_header('Message-ID', f"<{uuid.uuid4()}@justicegenie.com>")

    msg.attach(MIMEText(body, 'html'))  # Set as HTML

    # Send Email
    try:
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(sender_email, password)
            server.sendmail(sender_email, receiver_email, msg.as_string())
        print("✅ Verification email sent successfully!")
    except Exception as e:
        print(f"❌ Error sending email: {e}")

        
# def is_valid_email(email):
#     url = f"https://emailvalidation.abstractapi.com/v1/?api_key={ABSTRACT_API_KEY}&email={email}"
#     response = requests.get(url).json()
    
#     # Check if the email is deliverable
#     return response.get("deliverability") == "DELIVERABLE"

# Temporary storage for unverified users
unverified_users = {}

@app.route('/api/register', methods=['POST'])
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


# Verify code endpoint
@app.route('/api/verify_code', methods=['POST'])
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

        users_collection.insert_one({
            'username': user_data['username'],
            'email': user_data['email'],
            'phone': user_data['phone'],
            'dob': user_data['dob'],
            'password': user_data['password'],  # Already hashed
            'verified': True,# Mark as verified
            'joinedAt':  datetime.utcnow(),
            'role': 'user'
            
        })
         # ✅ Send Welcome Email in the Background
        threading.Thread(target=send_welcome_email, args=(email, user_data['username'])).start()

        return jsonify({'message': 'Registration successful! You can now log in.'}), 200
    else:
        return jsonify({'error': 'Invalid verification code.'}), 400
    


def send_welcome_email(email, username):
    sender_email = os.getenv("JG_EMAIL")
    receiver_email = email
    password = os.getenv("JG_PASSWORD")

    subject = f"🎉 Welcome to Justice Genie - Your Legal Empowerment Journey Begins!({datetime.now().strftime('%Y-%m-%d %H:%M:%S')})"

    # Enhanced HTML template with better email client compatibility
    body = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>Welcome to Justice Genie</title>
        <!--[if mso]>
        <style type="text/css">
            table {{border-collapse: collapse; border-spacing: 0; margin: 0;}}
            div, td {{padding: 0;}}
            div {{margin: 0 !important;}}
        </style>
        <noscript>
            <xml>
                <o:OfficeDocumentSettings>
                    <o:PixelsPerInch>96</o:PixelsPerInch>
                </o:OfficeDocumentSettings>
            </xml>
        </noscript>
        <![endif]-->
    </head>
    <body style="margin: 0; padding: 0; width: 100%; font-family: 'Segoe UI', Arial, sans-serif; -webkit-font-smoothing: antialiased; background-color: #f0f4f8;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin: 0; padding: 0; background-color: #f0f4f8;">
            <tr>
                <td align="center" style="padding: 40px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 20px; text-align: center;">
                                <img src="https://images.nightcafe.studio/jobs/DLZmuOJUEdalL84u3voe/DLZmuOJUEdalL84u3voe--1--t6av2.jpg" 
                                    alt="Justice Genie Logo" 
                                    style="width: 200px; height: auto; margin-bottom: 30px; border: 3px solid white; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                                
                                <h1 style="color: white; margin: 0 0 15px; font-size: 32px; line-height: 1.2; font-weight: 700;">
                                    Welcome to Justice Genie, {username}! ⚖️
                                </h1>
                                
                                <p style="color: #e2e8f0; margin: 0; font-size: 18px;">
                                    Your path to legal empowerment starts here
                                </p>
                            </td>
                        </tr>

                        <!-- Introduction -->
                        <tr>
                            <td style="padding: 40px 30px; background-color: white;">
                                <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                    We're thrilled to have you join Justice Genie! Here are some powerful features waiting for you:
                                </p>
                            </td>
                        </tr>

                        <!-- Features Grid -->
                        <tr>
                            <td style="padding: 0 30px 40px;">
                                <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                                    <!-- AI Assistant Feature -->
                                    <tr>
                                        <td style="padding-bottom: 30px;">
                                            <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: #f8fafc; border-radius: 12px; overflow: hidden;">
                                                <tr>
                                                    <td style="padding: 20px;">
                                                         <img src="https://tse2.mm.bing.net/th?id=OIP.i3-CCHf7-QIfShu91Jqg9QHaHa&pid=Api" 
                                                            alt="AI and Law Ethics" 
                                                            style="width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px;">
                                                        <h3 style="color: #1e3a8a; margin: 0 0 10px; font-size: 22px;">🤖 AI-Powered Legal Assistant</h3>
                                                        <p style="color: #475569; margin: 0; line-height: 1.6;">
                                                            Get instant, accurate legal insights powered by advanced AI technology.
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>

                                    <!-- Secure Chat Feature -->
                                    <tr>
                                        <td style="padding-bottom: 30px;">
                                            <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: #f8fafc; border-radius: 12px; overflow: hidden;">
                                                <tr>
                                                    <td style="padding: 20px;">
                                                        <img src="https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800" 
                                                            alt="Secure Chat" 
                                                            style="width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px;">
                                                        <h3 style="color: #1e3a8a; margin: 0 0 10px; font-size: 22px;">🔒 Secure Chat & History</h3>
                                                        <p style="color: #475569; margin: 0; line-height: 1.6;">
                                                            End-to-end encrypted conversations with complete history control.
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>

                                    <!-- Stats Section -->
                                    <tr>
                                        <td style="padding: 30px 0;">
                                            <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                                                <tr>
                                                    <td style="width: 33.33%; text-align: center; padding: 0 10px;">
                                                        <div style="background: #f8fafc; padding: 20px; border-radius: 12px;">
                                                            <h4 style="color: #1e3a8a; margin: 0 0 5px; font-size: 24px;">95%</h4>
                                                            <p style="color: #475569; margin: 0;">Success Rate</p>
                                                        </div>
                                                    </td>
                                                    <td style="width: 33.33%; text-align: center; padding: 0 10px;">
                                                        <div style="background: #f8fafc; padding: 20px; border-radius: 12px;">
                                                            <h4 style="color: #1e3a8a; margin: 0 0 5px; font-size: 24px;">10K+</h4>
                                                            <p style="color: #475569; margin: 0;">Users Helped</p>
                                                        </div>
                                                    </td>
                                                    <td style="width: 33.33%; text-align: center; padding: 0 10px;">
                                                        <div style="background: #f8fafc; padding: 20px; border-radius: 12px;">
                                                            <h4 style="color: #1e3a8a; margin: 0 0 5px; font-size: 24px;">24/7</h4>
                                                            <p style="color: #475569; margin: 0;">Support</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>

                                    <!-- CTA Button -->
                                    <tr>
                                        <td style="padding: 20px 0 40px; text-align: center;">
                                            <a href="https://justicegenie.com/login" 
                                                style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 18px;">
                                                Start Your Journey Now ⚖️
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); padding: 40px 30px; text-align: center;">
                                <p style="color: #e2e8f0; font-size: 14px; margin: 0 0 20px;">
                                    Follow us on social media:
                                </p>
                                
                                <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 240px; margin: 0 auto;">
                                    <tr>
                                        <td align="center" style="padding: 0 10px;">
                                            <a href="https://x.com/SYaganti44806" style="text-decoration: none;">
                                                <img src="https://cdn2.iconfinder.com/data/icons/social-media-2285/512/1_Twitter_colored_svg-512.png" 
                                                    alt="Twitter" style="width: 32px; height: 32px;">
                                            </a>
                                        </td>
                                        <td align="center" style="padding: 0 10px;">
                                            <a href="https://www.linkedin.com/in/subhash-yaganti-a8b3b626a/" style="text-decoration: none;">
                                                <img src="https://cdn2.iconfinder.com/data/icons/social-media-2285/512/1_Linkedin_unofficial_colored_svg-512.png" 
                                                    alt="LinkedIn" style="width: 32px; height: 32px;">
                                            </a>
                                        </td>
                                        <td align="center" style="padding: 0 10px;">
                                            <a href="https://instagram.com/subhash_spoidy" style="text-decoration: none;">
                                                <img src="https://cdn2.iconfinder.com/data/icons/social-media-2285/512/1_Instagram_colored_svg_1-512.png" 
                                                    alt="Instagram" style="width: 32px; height: 32px;">
                                            </a>
                                        </td>
                                        
                                        <td align="center" style="padding: 0 10px;">
                                            <a href="https://github.com/subhash-22-codes" style="text-decoration: none;">
                                                <img src="https://cdn2.iconfinder.com/data/icons/social-icons-33/128/Github-512.png" 
                                                    alt="GitHub" style="width: 32px; height: 32px;">
                                            </a>
                                        </td>
                                  
                                    </tr>
                                </table>

                                <p style="color: #e2e8f0; font-size: 14px; margin: 20px 0 0;">
                                    © 2025 Justice Genie. All rights reserved.<br>
                                    <span style="color: #94a3b8;">Empowering citizens with knowledge, one step at a time.</span>
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

    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = receiver_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'html'))

    try:
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(sender_email, password)
            server.sendmail(sender_email, receiver_email, msg.as_string())
        print("✅ Welcome email sent successfully!")
    except Exception as e:
        print(f"❌ Error sending welcome email: {e}")


# Resend verification code endpoint
@app.route('/api/resend_verification_code', methods=['POST'])
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

@app.route('/api/forgot-password', methods=['POST'])
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


def send_forgot_password_email(email, reset_code):
    sender_email = os.getenv("JG_EMAIL")
    receiver_email = email
    password = os.getenv("JG_PASSWORD")
    
    subject = f"🔑 JUSTICE GENIE - Reset Your Password & Unlock Your Legal Power ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')})"

    # Justice Genie Logo (replace with actual URL)
    logo_url = "https://static.vecteezy.com/system/resources/previews/016/006/572/original/law-firm-services-with-justice-legal-advice-judgement-and-lawyer-consultant-in-flat-cartoon-poster-hand-drawn-templates-illustration-vector.jpg"

    # HTML Email Body
    body = f"""
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f7f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 40px auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
            <!-- Logo -->
            <div style="text-align: center; margin-bottom: 32px;">
                <img src="{logo_url}" alt="Justice Genie Logo" style="width: 120px; height: auto;">
            </div>

            <h1 style="color: #1a1a1a; font-size: 24px; text-align: center; margin-bottom: 24px;">
                Reset Your Password
            </h1>

            <p style="color: #444444; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 32px;">
                We received a request to reset your <strong>Justice Genie</strong> password. Use the code below to set up a new password for your account.
            </p>

            <!-- Reset Code Box -->
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
                <span style="font-family: monospace; font-size: 32px; font-weight: 600; color: #2563eb; letter-spacing: 4px;">
                    {reset_code}
                </span>
            </div>

            <p style="color: #666666; font-size: 14px; text-align: center; margin-top: 24px;">
                This code will expire shortly. If you didn't request this reset, please contact our support team.
            </p>

            <!-- Footer -->
            <div style="border-top: 1px solid #eaeaea; margin-top: 32px; padding-top: 32px; text-align: center;">
                <p style="color: #666666; font-size: 14px; margin: 0;">
                    Justice Genie - Empowering citizens with knowledge
                </p>
                <p style="color: #666666; font-size: 12px; margin-top: 8px;">
                    This is an automated message, please do not reply.
                </p>
            </div>
        </div>
    </body>
    </html>
    """


    # Email Setup
    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = receiver_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'html'))  # Set as HTML

    # Send Email
    try:
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(sender_email, password)
            server.sendmail(sender_email, receiver_email, msg.as_string())
        print("✅ Password reset email sent successfully!")
    except Exception as e:
        print(f"❌ Error sending email: {e}")

# Verify Forgot Password Code Endpoint
@app.route('/api/verify-forgot-password-code', methods=['POST'])
def verify_forgot_password_code():
    data = request.get_json()
    email = data.get('email')
    entered_code = str(data.get('reset_code')).strip()  # Convert entered code to string and strip any spaces

    user = users_collection.find_one({'email': email})

    if not user:
        return jsonify({'error': 'User not found'}), 400

    stored_code = str(user.get('reset_code')).strip()  # Convert stored code to string and strip any spaces

    # Log the codes for debugging
    print(f"Entered code: {entered_code}")
    print(f"Stored code: {stored_code}")

    if entered_code == stored_code:
        return jsonify({'message': 'Reset code verified. You can now reset your password.'}), 200
    else:
        return jsonify({'status': 'fail', 'message': 'Invalid reset code.'}), 200




# Reset Password Endpoint
@app.route('/api/reset-password', methods=['POST'])
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

# API Endpoints
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username_or_email = data.get('username')  # still receiving as 'username' from frontend
    password = data.get('password')

    user = users_collection.find_one({
        "$or": [
            {"username": username_or_email},
            {"email": username_or_email}
        ]
    })

    if user and check_password_hash(user['password'], password):
        session['username'] = user['username']
        session['email'] = user['email']
        session['role'] = user.get('role', 'user')  # store role in session

        is_admin = user.get('role') == 'admin'

        return jsonify({'message': 'Login successful', 'isAdmin': is_admin})

    return jsonify({'error': 'Invalid credentials'}), 401


@app.route('/api/chat', methods=['POST'])
def chat():
    if 'username' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    query = data.get('query')

    if not is_legal_query(query):
        return jsonify({'response': "I'm here to assist with questions related to Indian law."})

    try:
        guidance = (
            "Provide a detailed response about the specified legal topic under Indian law. "
            "Include any relevant IPC sections, acts, and legal precedents."
        )
        response = model.generate_content(guidance + "\n" + query)
        formatted_response = format_response(response.text)
        return jsonify({'response': formatted_response})
    except Exception as e:
        print(f'Error generating content: {e}')
        return jsonify({'error': 'There was an error processing your request.'}), 500
    

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER



# Helper Functions
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


@app.route('/api/update_profile_picture', methods=['POST'])
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

    # Generate unique filename
    original_filename = secure_filename(file.filename)
    file_ext = os.path.splitext(original_filename)[1].lower()
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
    upload_folder = app.config['UPLOAD_FOLDER']
    os.makedirs(upload_folder, exist_ok=True)
    file_path = os.path.join(upload_folder, unique_filename)

    try:
        # Process image with Pillow
        image = Image.open(file.stream)
        max_size = (500, 500)
        image.thumbnail(max_size)

        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")

        image.save(file_path, format="JPEG", quality=85)

        # Remove old profile picture if not default
        user = users_collection.find_one({'username': username})
        old_picture = user.get('profile_picture')

        if old_picture and old_picture != '/uploaded_images/default.jpg':
            old_file_path = os.path.join(app.root_path, old_picture.lstrip('/'))
            if os.path.exists(old_file_path):
                os.remove(old_file_path)

        # Update user's profile picture path
        new_picture_path = f'/uploaded_images/{unique_filename}'
        users_collection.update_one(
            {'username': username},
            {'$set': {'profile_picture': new_picture_path}}
        )

        return jsonify({'message': 'Profile picture updated!', 'file_path': new_picture_path})

    except Exception as e:
        return jsonify({'message': 'Error processing image', 'error': str(e)}), 500
    
    
@app.route('/api/remove_profile_picture', methods=['POST'])
def remove_profile_picture():
    username = session.get('username')
    if not username:
        return jsonify({'message': 'Unauthorized'}), 401

    user = users_collection.find_one({'username': username})
    if not user:
        return jsonify({'message': 'User not found'}), 404

    profile_pic_path = user.get('profile_picture')
    if profile_pic_path:
        full_path = '.' + profile_pic_path  # Convert to relative local path
        if os.path.exists(full_path):
            os.remove(full_path)

    users_collection.update_one({'username': username}, {'$unset': {'profile_picture': ""}})

    return jsonify({'message': 'Profile picture removed successfully!'})


# Route to serve uploaded files
@app.route('/uploaded_images/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


# Quiz related functions
@app.route('/api/get_quiz', methods=['GET'])
def get_quiz():
    questions = list(quizzquestions_collection.aggregate([
        {"$match": {"level": 1}},
        {"$sample": {"size": 15}}
    ]))
    
    quiz_data = []

    for question in questions:
        quiz_data.append({
            'question': question['question'],
            'options': question['options'],
            'explanation': question.get('explanation', 'No explanation provided.')
        })

    return jsonify({'quiz': quiz_data})



#  Submit Quiz + Leaderboard Update
@app.route('/api/submit_quiz', methods=['POST'])
def submit_quiz():
    data = request.get_json()
    username = session.get('username')

    if not username:
        return jsonify({'error': 'Unauthorized'}), 401

    user_answers = data.get('answers')
    user = users_collection.find_one({'username': username})

    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Initialize quiz details
    score = 0
    total_questions = 15  # Set to 15
    results = []
    correct_answers = []
    explanations = []

    # Loop through user's answers & calculate score
    for question, user_answer in user_answers.items():
        quiz_question = quizzquestions_collection.find_one({"question": question})
        correct_option = quiz_question['correct_answer']
        explanation = quiz_question.get('explanation', 'No explanation provided.')

        # Check answer correctness
        if user_answer == correct_option:
            score += 1
            answer_status = "correct"
        else:
            answer_status = "incorrect"

        correct_answers.append(correct_option)
        explanations.append(explanation)

        # Store each question's result
        results.append({
            'question': question,
            'user_answer': user_answer,
            'correct_answer': correct_option,
            'answer_status': answer_status,
            'explanation': explanation
        })

    # Calculate quiz percentage
    percentage = (score / total_questions) * 100

    # Fetch the user's current highest score
    current_high_score = user.get('quiz_marks', 0)

    # Only update if the new score is higher
    if score > current_high_score:
        users_collection.update_one(
            {'username': username},
            {'$set': {'quiz_marks': score, 'quiz_total': total_questions, 'quiz_percentage': percentage, 'quiz_level': 'Level 1'}}
        )

        #  Update Leaderboard Collection
        leaderboard_collection.update_one(
            {'username': username},
            {'$set': {'score': score}},  # Update only if it's a new high score
            upsert=True  # If user doesn't exist, insert them
        )

    return jsonify({
        'message': 'Quiz submitted successfully!',
        'score': score,
        'percentage': percentage,
        'correctAnswers': correct_answers,
        'explanations': explanations,
        'results': results
    })



@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    try:
        # Fetch leaderboard data from leaderboard_collection
        users = list(leaderboard_collection.find({}, {'username': 1, 'score': 1, 'game_name': 1, '_id': 0}))


        # Sort users by score in descending order
        users_sorted = sorted(users, key=lambda x: x.get('score', 0), reverse=True)

        # Assign ranks
        leaderboard = []
        previous_score = None
        rank = 0
        for index, user in enumerate(users_sorted):
            if user['score'] != previous_score:
                rank = index + 1  # Rank increments only when score changes
            leaderboard.append({
                'rank': rank,
                'username': user.get('username', 'Unknown'),
                'score': user.get('score', 0),
                'gameName': user.get('game_name', 'Justice Warrior') 
            })
            previous_score = user['score']

        return jsonify({'leaderboard': leaderboard}), 200
    except Exception as e:
        print("Error in /api/leaderboard:", str(e))  # Debugging
        return jsonify({'error': str(e)}), 500


@app.route('/api/myaccount', methods=['GET'])
def myaccount():
    if 'username' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user = users_collection.find_one({'username': session['username']})
    if user:
        quiz_progress = {
            'marks': user.get('quiz_marks', 0),
            'total': user.get('quiz_total', 0),
            'percentage': user.get('quiz_percentage', 0),
            'level': user.get('quiz_level', 'Beginner')
        }
        return jsonify({
            'username': user['username'],
            'email': user.get('email', ''),
            'profile_picture': user.get('profile_picture', ''),
            'quiz_progress': quiz_progress,
            'game_name': user.get('game_name', '')  # ✅ Add this line
        })
    return jsonify({'error': 'User not found'}), 404

@app.route('/api/update_game_name', methods=['POST'])
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

@app.route('/api/export-pdf', methods=['POST'])
def export_pdf():
    try:
        data = request.get_json()
        messages = data.get('messages', [])

        # Create a PDF in memory
        pdf_buffer = BytesIO()
        doc = SimpleDocTemplate(pdf_buffer, pagesize=letter)

        # Define styles
        styles = getSampleStyleSheet()
        heading_style = ParagraphStyle(
            'HeadingStyle', parent=styles['Normal'], fontName='Helvetica-Bold',
            fontSize=16, textColor='darkred', spaceAfter=15, alignment=1
        )
        user_style = ParagraphStyle(
            'UserStyle', parent=styles['Normal'], fontName='Helvetica-Bold',
            fontSize=11, textColor='blue', spaceAfter=8
        )
        bot_style = ParagraphStyle(
            'BotStyle', parent=styles['Normal'], fontName='Helvetica',
            fontSize=11, textColor='black', spaceAfter=8
        )

        # Elements list for the PDF content
        elements = [
            Paragraph("<b>Chat History</b>", heading_style),
            Spacer(1, 20)
        ]

        # Helper function to prettify text
        def prettify_text(text):
            """Formats text: Removes extra spaces, converts markdown to readable format."""
            text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)  # **bold**
            text = re.sub(r'__(.*?)__', r'<b>\1</b>', text)  # __bold__
            text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', text)  # *italic*
            text = re.sub(r'## (.*?)', r'<h2>\1</h2>', text)  # ## Headings
            text = re.sub(r'# (.*?)', r'<h1>\1</h1>', text)  # # Main heading
            text = text.replace("\n", "<br/>")  # Preserve newlines
            return text.strip()

        # Format and add messages
        for message in messages:
            user = message.get('user', 'Unknown')
            text = message.get('text', '').strip()
            formatted_text = prettify_text(text)  # Apply formatting

            style = user_style if user.lower() == 'you' else bot_style
            elements.append(Paragraph(f"<b>{user}:</b> {formatted_text}", style))
            elements.append(Spacer(1, 10))  # Add spacing between messages

        # Build and return the PDF
        doc.build(elements)
        pdf_buffer.seek(0)
        return send_file(pdf_buffer, mimetype='application/pdf', as_attachment=True, download_name='chat_history.pdf')

    except Exception as e:
        return jsonify({'error': f'Failed to generate PDF: {str(e)}'}), 400
    
def send_goodbye_email(email, username, score=None, rank=None):
    sender_email = os.getenv("JG_EMAIL")
    receiver_email = email
    password = os.getenv("JG_PASSWORD")  # Your app password

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
                                <img src="https://images.nightcafe.studio/jobs/DLZmuOJUEdalL84u3voe/DLZmuOJUEdalL84u3voe--1--t6av2.jpg" 
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
                                <a href="http://JusticeGenie.com/register" 
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

    msg = MIMEText(body, "html")
    msg["Subject"] = subject
    msg["From"] = sender_email
    msg["To"] = receiver_email

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, receiver_email, msg.as_string())
        server.quit()
        print("Goodbye email sent successfully! 📨✅")
        return True
    except Exception as e:
        print(f"Error sending email: {e} ❌")
        return False
    
@app.route('/api/delete_account', methods=['DELETE'])
def delete_account():
    print("Current Session Data:", session)  
    print("Session Keys:", session.keys())  

    if 'username' not in session:  
        return jsonify({'error': 'Unauthorized. Please log in.'}), 401

    username = session['username']
    user = users_collection.find_one({'username': username})  

    if not user:
        return jsonify({'error': 'User not found.'}), 404

    user_email = user.get('email')  
    print(f"Deleting user: {username} (Email: {user_email})")

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
    print(f"User Deletion Status: {user_deletion_result.deleted_count}")  

    # ✅ Delete user from leaderboard
    leaderboard_deletion_result = leaderboard_collection.delete_one({'username': username})
    print(f"Leaderboard Deletion Status: {leaderboard_deletion_result.deleted_count}")  

    # ✅ Delete all collabs where 'submitted_by' matches the username
    collab_deletion_result = collab_collection.delete_many({'submitted_by': username})
    print(f"Collab Deletion Status: {collab_deletion_result.deleted_count}") 
    
     # ✅ Delete user chat history
    chat_history_deletion_result = chats_collection.delete_many({'username': username})
    print(f"Chat History Deletion Status: {chat_history_deletion_result.deleted_count}")  

    # Confirm remaining collabs (if other users submitted with the same email)
    remaining_collabs = list(collab_collection.find({'email': user_email}))
    print(f"Remaining collabs with email {user_email}: {remaining_collabs}")  

    
    # ✅ Send goodbye email with score & rank if applicable
    send_goodbye_email(user_email, username, user_score, rank)  

    # Clear session
    session.clear()  

    return jsonify({'message': 'Account deleted successfully. You will be redirected to the login page.'}), 200


@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'}), 200



@app.route('/api/analyze_probability', methods=['POST'])
def analyze_probability():
    try:
        data = request.json
        bot_response = data.get("bot_response")
        print("Received Bot Response:", bot_response)
        
        if not bot_response:
            return jsonify({"error": "No bot response provided"}), 400

        # Get API key from environment instead of hardcoding
        api_key = os.getenv("GEMINI_ANALYZE_API_KEY")
        if not api_key:
            return jsonify({"error": "Gemini API key not configured"}), 500
        
        # Configure Gemini API
        genai.configure(api_key=api_key)

        # Prompt
        prompt = f"""
        ### Task:
        Analyze the probability of winning a legal case based on the given scenario.

        ### Scenario:
        "{bot_response}"

        ### Understanding the Query:
        The user is trying to understand their legal standing based on the given situation.
        Determine whether the question is about **their own case or someone else's**.

        ### Expected Output:
        Provide a probability breakdown in the exact format below:
        - Win: XX%
        - Loss: XX%
        - Need More Information: XX%

        ### Rules:
        1. Keep responses strictly in the given format.
        2. Do **not** add explanations or additional text.
        """

        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)

        print("Gemini API Response:", response.text)

        probabilities = extract_probabilities(response.text)
        return jsonify(probabilities)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
def extract_probabilities(text):
    """
    Extracts numerical probabilities from the Gemini API response.
    """
    try:
        # Use regex to extract numbers
        match = re.findall(r"Win:\s*(\d+)%|Loss:\s*(\d+)%|Need More Information:\s*(\d+)%", text)

        # Ensure match contains enough elements to avoid index errors
        win = int(match[0][0]) if len(match) > 0 and match[0][0] else 0
        loss = int(match[1][1]) if len(match) > 1 and match[1][1] else 0
        need_more_info = int(match[2][2]) if len(match) > 2 and match[2][2] else 0

        return {"win": win, "loss": loss, "need_more_info": need_more_info}
    except Exception as e:
        return {"error": f"Failed to extract probabilities: {str(e)}"}

@app.route('/api/admin/users', methods=['GET'])
def get_users():
    if session.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    users = users_collection.find({'role': 'user'})
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
            "profile_picture": user.get('profile_picture', '/uploaded_images/default.jpg'),
            "role": user.get('role', 'user'),
            "joinedAt": user.get('joinedAt', 'Unknown'),
            "account_locked_until": lock_time.isoformat() if lock_time else None
        })

    return jsonify({"users": user_list})



@app.route('/api/admin/collab-requests', methods=['GET'])
def get_collab_requests():
    if session.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    try:
        collabs = list(collab_collection.find({}, {'_id': 0})) 
        return jsonify(collabs), 200
    except Exception as e:
        print(f"Error fetching collab data: {e}")
        return jsonify({'error': 'Failed to fetch data'}), 500

@app.route('/api/admin/feedbacks', methods=['GET'])
def get_feedbacks():
    # Check if the user has 'admin' role in session
    if session.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    try:
        # Fetch all feedbacks, excluding the '_id' field for simplicity (you can include it if needed)
        feedbacks = list(feedback_collection.find({}, {'_id': 0})) 
        
        return jsonify(feedbacks), 200
    except Exception as e:
        print(f"Error fetching feedback data: {e}")
        return jsonify({'error': 'Failed to fetch feedback data'}), 500

@app.route('/api/admin/quiz_participants', methods=['GET'])
def get_quiz_participants():
    """
    Admin-only: Fetch all users from leaderboard with their email, score, and rank.
    """
    try:
        if session.get('role') != 'admin':
            return jsonify({'error': 'Unauthorized'}), 403

        leaderboard_data = list(leaderboard_collection.find({}, {'_id': 0}))

        # Sort by score descending
        leaderboard_data.sort(key=lambda x: x.get('score', 0), reverse=True)

        # Assign ranks
        rank = 0
        previous_score = None
        for index, entry in enumerate(leaderboard_data):
            if entry['score'] != previous_score:
                rank = index + 1
            entry['rank'] = rank
            previous_score = entry['score']

        # Fetch emails for all usernames
        usernames = [entry['username'] for entry in leaderboard_data]
        user_email_map = {
            user['username']: user.get('email', 'Not available')
            for user in users_collection.find(
                {'username': {'$in': usernames}},
                {'username': 1, 'email': 1, '_id': 0}
            )
        }

        # Merge emails into leaderboard entries
        for entry in leaderboard_data:
            entry['email'] = user_email_map.get(entry['username'], 'Not available')
            entry['game_name'] = entry.get('game_name', 'Justice Warrior')

        return jsonify({'participants': leaderboard_data}), 200

    except Exception as e:
        print(f"Error in /api/admin/quiz_participants: {str(e)}")
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/api/admin/remove-user', methods=['POST'])
def remove_user():
    if session.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

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
    india_timezone = timezone('Asia/Kolkata')
    lock_until_ist = new_lock_until.astimezone(india_timezone)

    try:
        subject = f"⚠️ Temporary Account Suspension - {lock_until_ist.strftime('%Y-%m-%d %H:%M:%S')} IST"
        send_email_alert(email, subject, user['username'])
    except Exception as e:
        print("Email sending failed:", e)

    return jsonify({'success': True, 'message': 'User temporarily locked and notified.'}), 200

# Get user lock status with expired check
@app.route('/api/user/lock-status', methods=['GET'])
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


def send_email_alert(receiver_email, subject, username):
    sender_email = os.getenv("JG_EMAIL")
    password = os.getenv("JG_PASSWORD")

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
            <a href="mailto:{sender_email}" class="button">Contact Support</a>
          </p>
        </div>
        <div class="footer">
          &copy; {datetime.utcnow().year} Justice Genie. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    """

    msg = MIMEText(body, "html")
    msg["Subject"] = subject
    msg["From"] = sender_email
    msg["To"] = receiver_email

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, receiver_email, msg.as_string())
        server.quit()
        print("Warning email sent successfully! 📨✅")
        return True
    except Exception as e:
        print(f"Error sending email: {e} ❌")
        return False


if __name__ == '__main__':
    app.run(debug=True)
