from flask import Flask, request, jsonify, redirect, url_for, session, send_from_directory
from flask_cors import CORS
import google.generativeai as genai
from pymongo import MongoClient
from bson.objectid import ObjectId
import traceback
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
import re
import random
from flask import Flask, request, jsonify, send_file
from io import BytesIO
from reportlab.lib.pagesizes import letter
from textwrap import wrap
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from datetime import datetime, timedelta
import threading
from reportlab.lib.enums import TA_CENTER
from pytz import timezone,utc
from dotenv import load_dotenv
import logging
import cloudinary
import cloudinary.uploader
from urllib.parse import quote_plus
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from pprint import pprint
from sib_api_v3_sdk.models import SendSmtpEmail
import json
import secrets

#--Unused imports, In future may use--#
'''
from PIL import Image
from reportlab.platypus import ListItem, ListFlowable
from google.cloud import translate_v2 as translate
import requests
from reportlab.lib import colors
from reportlab.pdfgen import canvas
import json
from bson import json_util
import traceback
from googletrans import Translator
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from bs4 import BeautifulSoup
import uuid
'''

# load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# Important session settings
app.config['SESSION_COOKIE_SAMESITE'] = 'None'
app.config['SESSION_COOKIE_SECURE'] = True  # must be HTTPS
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=1)  # sessions last 7 days

CORS(
    app,
    supports_credentials=True,
    origins=["http://localhost:3000", "https://justice-genie-mu.vercel.app"]
)

app.secret_key = os.getenv("SECRET_KEY")
if not app.secret_key:
    raise ValueError("No SECRET_KEY set for Flask application")

#---- Cloudinary configuration ----#
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

# Set timezone to IST
IST = timezone('Asia/Kolkata')

'''ABSTRACT_API_KEY = os.getenv("ABSTRACT_API_KEY")'''


TEST_MODE = False # Set to False in production

# ------------------
# Brevo Email Setup
# ------------------
BREVO_API_KEY = os.getenv("BREVO_API_KEY")
BREVO_SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL")
BREVO_SENDER_NAME = os.getenv("BREVO_SENDER_NAME")

# Configure client
# Configure client for transactional emails
brevo_config = sib_api_v3_sdk.Configuration()
brevo_config.api_key['api-key'] = BREVO_API_KEY
brevo_client = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(brevo_config))


# Get API key from environment
api_key = os.getenv("GEMINI_API_KEY")
    
MONITORING_API_KEY = os.getenv("MONITORING_API_KEY")
# Fix headers if behind a proxy (safe to add, good practice)
# app.wsgi_app = ProxyFix(app.wsgi_app)

# # Configure logging (INFO level is enough for requests)
# logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# @app.before_request
# def log_request():
#     logging.info(f"{request.remote_addr} {request.method} {request.path}")

# Configure Google Gemini API
genai.configure(api_key=api_key)  
model = genai.GenerativeModel('gemini-2.5-flash')

GUIDANCE = """
You are 'Justice Genie', an expert AI legal assistant specializing in the Indian Penal Code (IPC). Your goal is to provide clear, structured, and insightful legal information. Analyze the user's query and provide a detailed response that follows the structure and quality of the example provided below.

---
### EXAMPLE START ###
User Query: "What is criminal intimidation?"

### 📜 Primary IPC Section(s) Applicable
The primary section is **IPC Section 503 (Criminal Intimidation)**. It states: "Whoever threatens another with any injury to his person, reputation or property... with intent to cause alarm to that person, or to cause that person to do any act which he is not legally bound to do... as the means of avoiding the execution of such threat, commits criminal intimidation."

### 🔑 Key Elements of the Offense
For an act to be considered criminal intimidation, the following elements must be proven:
1.  **Threat of Injury:** There must be a clear threat to injure a person's body, reputation, or property.
2.  **Intent (Mens Rea):** The accused must have the intention to cause alarm, or to force the person to do something illegal or omit something they are legally entitled to do. The mere use of threatening words is not enough without the required intent.

### ⚖️ Punishment
The punishment is defined under **IPC Section 506**. For simple criminal intimidation, the punishment is imprisonment for up to two years, a fine, or both. If the threat is to cause death, grievous hurt, or to destroy property by fire, the punishment can extend to seven years.

### 💡 Important Nuances & Considerations
- A key distinction is whether the threat is credible and causes genuine alarm. A casual threat made in anger may not meet the legal standard if it doesn't create a reasonable sense of fear.
- This is often linked with other offenses like extortion (IPC 383), where the threat is used to dishonestly obtain property.

### 📚 Landmark Case Example
**Amulya Kumar Behera v. Nabaghana Behera (1995):** In this case, the court held that mere words are not enough. It must be proven that the accused intended to cause alarm and that the threat was sufficient to do so. The accused was acquitted because the prosecution could not prove that his words actually caused a state of alarm in the victim. This case highlights the importance of the "intent" element.

### ⚠️ Disclaimer
Conclude with the following disclaimer: "This information is for educational purposes only and does not constitute legal advice. Please consult with a qualified legal professional for advice on your specific situation."
---
### EXAMPLE END ###
---

Now, answer the following user query based on the same high standards:
"""

username = os.getenv("MONGO_USER")
password = quote_plus(os.getenv("MONGO_PASS"))
cluster  = os.getenv("MONGO_CLUSTER")

MONGO_URI = f"mongodb+srv://{username}:{password}@{cluster}/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(MONGO_URI)   # single global client
# client = MongoClient('mongodb://localhost:27017/') # local testing

db = client["law_chatbot"]
users_collection = db["users"]
feedback_collection = db["feedback"]
quizzquestions_collection = db["quizzquestions"]
books_collection = db["books"]
collab_collection = db["collaborations"]
leaderboard_collection = db["leaderboard"]
chats_collection = db["chats"]


ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def send_email(recipient_emails, subject, html_body):
    """
    Send transactional email via Brevo.
    
    recipient_emails: str (single) or list of dicts [{'email':..,'name':..}, ...]
    """
    # Prepare recipient list
    if isinstance(recipient_emails, str):
        to_list = [{"email": recipient_emails}]
    elif isinstance(recipient_emails, list):
        to_list = []
        for r in recipient_emails:
            if isinstance(r, str):
                to_list.append({"email": r})
            elif isinstance(r, dict) and "email" in r:
                to_list.append(r)
    else:
        raise ValueError("recipient_emails must be str or list of emails/dicts")

    # Construct Brevo email
    email_to_send = SendSmtpEmail(
        to=to_list,
        html_content=html_body,
        sender={"name": BREVO_SENDER_NAME, "email": BREVO_SENDER_EMAIL},
        subject=subject
    )

    try:
        # Try sending via Brevo
        response = brevo_client.send_transac_email(email_to_send)
        print(f"✅ Email sent successfully to {to_list} via Brevo!")
        return True

    except ApiException as api_err:
        print(f"❌ Brevo API exception: {api_err}")
        return False

    except Exception as e:
        print(f"❌ General error sending email: {e}")
        return False


@app.route('/api/text-to-speech', methods=['POST'])
def text_to_speech():
    return jsonify({'message': '🔊 Text-to-Speech is coming soon in production!'}), 200
@app.route('/api/stop-speech', methods=['POST'])
def stop_speech():
    return jsonify({'message': '⏹️ Stop Speech is not available in production!'}), 200
    
@app.route('/api/speech-to-text', methods=['GET'])
def speech_to_text():
    return jsonify({'message': '🎤 Speech-to-Text is coming soon in production!'}), 200
    
# -------------------------------
# Helper to serialize MongoDB book
# -------------------------------
def serialize_book(book):
    """Return a copy of book with 'id' instead of '_id'."""
    book_copy = dict(book)  # Avoid mutating original
    book_copy['id'] = str(book_copy['_id'])
    del book_copy['_id']
    return book_copy

# -------------------------------
# Fetch books endpoint
# -------------------------------
@app.route('/api/books')
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
@app.route('/api/books/<book_id>/<action>', methods=['GET'])
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


# @app.route("/api/translate", methods=["POST"])
# def translate_text():
#     try:
#         data = request.json
#         message_id = data.get("messageId")
#         message_content = data.get("messageContent")  # Original formatted text
#         target_lang = data.get("targetLang")

#         if not message_id or not message_content or not target_lang:
#             return jsonify({
#                 "error": "Invalid request. 'messageId', 'messageContent', and 'targetLang' are required."
#             }), 400

#         def format_response(response_text):
#             """Ensures the response retains the same structure as the bot's original response."""
#             response_text = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', response_text)
#             lines = response_text.splitlines()
#             formatted_lines = []

#             for line in lines:
#                 if re.match(r'^\d+\.', line):  # Numbered list (1., 2., etc.)
#                     formatted_lines.append(f"<p><strong>{line}</strong></p>")
#                 elif line.strip().startswith('*'):  # Bullet points (* point)
#                     subpoint = line.strip().lstrip('*').strip()
#                     formatted_lines.append(f"<ul><li>{subpoint}</li></ul>")
#                 else:
#                     formatted_lines.append(f"<p>{line}</p>")

#             return ''.join(formatted_lines)

#         # Step 1: Format Original Response
#         formatted_content = format_response(message_content)

#         # Step 2: Parse the formatted content using BeautifulSoup
#         soup = BeautifulSoup(formatted_content, "html.parser")

#         # Step 3: Translate only the text inside tags while preserving HTML
#         for tag in soup.find_all(string=True):
#             if tag.parent.name in ["strong", "li", "p"]:  # Translate only inside text-containing tags
#                 try:
#                     translated_text = translator.translate(tag, dest=target_lang).text
#                 except Exception:
#                     translated_text = tag  # fallback to original if translation fails
#                 tag.replace_with(translated_text)

#         # Step 4: Return Translated and Formatted Response
#         translated_content = str(soup)

#         return jsonify({"translatedText": translated_content})

#     except Exception as e:
#         # Friendly fallback instead of raw error
#         return jsonify({"error": "⚠️ Translation service temporarily unavailable. Please try again later."}), 500
    

@app.route("/api/translate", methods=["POST"])
def translate_text():
    try:
        # Immediately return a friendly placeholder message
        return jsonify({
            "translatedText": "🌐 Translation service coming soon! Please stay tuned."
        })
    
    except Exception as e:
        # Fallback for unexpected errors
        return jsonify({
            "error": "⚠️ Translation service temporarily unavailable. Please try again later."
        }), 500

@app.route('/api/clear_chat', methods=['POST'])
def clear_chat():
    data = request.get_json()
    username = data.get('username')

    print("Received username for chat deletion:", username)

    if not username:
        return jsonify({"error": "Username is required"}), 400

    # ✅ Use helper
    result = chats_collection.delete_many({"username": username})

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
        user = users_collection.find_one({"username": username})  # ✅ add ()
        if not user:
            return jsonify({"error": "User not found"}), 404

        user_id = str(user["_id"])

        # Check if user already has a chat history
        user_chat = chats_collection.find_one({"user_id": user_id})  # ✅ add ()

        if user_chat:
            # Append new messages to existing chat history
            chats_collection.update_one(   # ✅ add ()
                {"user_id": user_id},
                {"$push": {"messages": {"$each": messages}}}  # Append multiple messages
            )
        else:
            # Create a new chat entry
            chats_collection.insert_one({   # ✅ add ()
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
        user = users_collection.find_one({"username": username})  # ✅ add ()
        if not user:
            return jsonify({"error": "User not found"}), 404

        user_id = str(user["_id"])

        # Fetch chat history
        user_chat = chats_collection.find_one({"user_id": user_id})  # ✅ add ()

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
        print(f"Error inserting into MongoDB: {e}")
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
        print(f"⏳ Collaboration email scheduled for: {user_email}")
        
        
    except Exception as e:
        print(f"❌ Error sending email: {e}")
        return jsonify({'error': 'Failed to send confirmation email'}), 500

    return jsonify({'success': 'Your collaboration request has been submitted successfully!'})

def send_collab_email_safe(user_email, subject, body):
    try:
        send_email(user_email, subject, body)
        print(f"✅ Collaboration email successfully sent to: {user_email}")
    except Exception as e:
        print(f"❌ Failed to send collaboration email to {user_email}: {e}")

@app.route('/api/get_collab_status', methods=['GET'])
def get_collab_status():
    username = session.get('username')  # Ensure logged-in user

    if not username:
        return jsonify({'error': 'Unauthorized. Please log in.'}), 401

    # Check if this specific user has submitted a request
    collab_submission = collab_collection.find_one({"submitted_by": username})

    return jsonify({'submitted': bool(collab_submission)}), 200


# UPDATED Function 1: The Smart Classifier
def classify_query(query):
    """
    Classifies the user's query into one of four categories.
    """
    prompt = f"""
    Analyze the user's query and classify it into one of four categories based on its intent.
    The categories are: LEGAL, LEGAL_GENERAL, CONVERSATIONAL, or OFF_TOPIC.
    - LEGAL: The query is about a specific Indian law, IPC section, or a concrete legal situation.
    - LEGAL_GENERAL: The query is a broad, philosophical, or definitional question about the legal system itself.
    - CREATOR: Questions about who made, created, developed, built, or are the innovators of the Justice Genie.
    - CONVERSATIONAL: The query is a greeting, a question about you (the AI), a thank you, or other small talk.
    - OFF_TOPIC: The query is about something completely unrelated to law.

    Respond with ONLY the category name.

    Examples:
    Query: "What is the punishment for theft?" -> LEGAL
    Query: "What is Law?" -> LEGAL_GENERAL
    Query: "who made you?" -> CREATOR
    Query: "Hello there" -> CONVERSATIONAL
    Query: "Why do we have courts?" -> LEGAL_GENERAL
    Query: "who developed this application?" -> CREATOR
    Query: "How do I cook biryani?" -> OFF_TOPIC
    Query: "who are the innovators of jg?" -> CREATOR

    Now, classify this query:
    Query: "{query}" ->
    """
    
    response = model.generate_content(prompt)
    classification = response.text.strip().upper()
    
    if classification in ['LEGAL', 'LEGAL_GENERAL', 'CONVERSATIONAL', 'CREATOR', 'OFF_TOPIC']:
        return classification
    else:
        return 'OFF_TOPIC' # Default fallback

# Your final, simplified chat() function
@app.route('/api/chat', methods=['POST'])
def chat():
    if 'username' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json() or {}
    query = (data.get('query') or "").strip()

    if not query:
        return jsonify({'error': 'Query cannot be empty.'}), 400

    intent = classify_query(query)

    try:
        
        if intent == 'CREATOR':
            creator_response = (
                "I was created by two passionate developers:\n\n"
                "**Subhash Yaganti** (Full-Stack & UI/UX)\n"
                "[LinkedIn](https://www.linkedin.com/in/subhash-yaganti-a8b3b626a/) | [GitHub](https://github.com/subhash-22-codes)\n\n"
                "**Siri Mahalaxmi Vemula** (Backend & System Architecture)\n"
                "[LinkedIn](https://www.linkedin.com/in/vemula-siri-mahalaxmi-b4b624319/) | [GitHub](https://github.com/armycodes)\n\n"
                "They combined their skills in technology and an interest in law to build me."
            )
            return jsonify({'response': creator_response})
        
        elif intent == 'LEGAL':
            app.logger.info(f"Handling LEGAL query: {query}")
            prompt = f"{GUIDANCE}\nUser Query: {query}"
            response_text = model.generate_content(prompt).text
            
            # SIMPLIFIED: Just send the raw text
            return jsonify({'response': response_text})

        elif intent == 'LEGAL_GENERAL':
            app.logger.info(f"Handling LEGAL_GENERAL query: {query}")
            prompt = f"""
            You are 'Justice Genie', an expert legal AI assistant.
            Answer the user's broad, philosophical, or definitional question about law in a clear and concise way.
            While you specialize in the IPC, provide a helpful general answer.
            User's question: "{query}"
            """
            response_text = model.generate_content(prompt).text
            
            # SIMPLIFIED: Just send the raw text
            return jsonify({'response': response_text})

        elif intent == 'CONVERSATIONAL':
            app.logger.info(f"Handling CONVERSATIONAL query: {query}")
            # This prompt can be the simpler one now, or the detailed one. 
            # The react-markdown component will handle either perfectly.
            prompt = f"""
            You are 'Justice Genie', a friendly and professional legal AI assistant for Indian law.
            Respond to the user's conversational query in character. Be polite and helpful.
            User's message: "{query}"
            """
            response_text = model.generate_content(prompt).text
            
            # SIMPLIFIED: Just send the raw text
            return jsonify({'response': response_text})

        else:  # This handles OFF_TOPIC
            app.logger.info(f"Handling OFF_TOPIC query: {query}")
            response_text = "I am Justice Genie, your assistant for questions related to Indian law. I cannot help with topics outside of that scope."
            return jsonify({'response': response_text})

    except Exception as e:
        app.logger.exception(f'Error processing query: {e}')
        return jsonify({'error': 'There was an error processing your request.'}), 500


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
    if TEST_MODE:
        print(f"[TEST MODE] Skipping email to {email}")
        return

    # Unique Subject Line to Prevent Email Threading
    subject = f"🔹 Justice Genie - Verify Your Email ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')})"
    
    # Justice Genie Logo
    logo_url = "https://res.cloudinary.com/dggciuh9l/image/upload/v1760548194/profile_pics/sswolspeqyywjimwegbh.png"

    # HTML Email Body
    body = f"""
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f7f9fc;">
        <div style="max-width:600px;margin:40px auto;background:white;padding:40px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
            <div style="text-align:center;margin-bottom:32px;">
                <img src="{logo_url}" alt="Justice Genie Logo" style="width:120px;height:auto;">
            </div>
            <h1 style="color:#1a1a1a;font-size:24px;text-align:center;margin-bottom:24px;">Verify Your Email Address</h1>
            <p style="color:#444;font-size:16px;line-height:1.6;text-align:center;margin-bottom:32px;">
                Welcome to <strong>Justice Genie</strong>. To ensure the security of your account, please use the verification code below.
            </p>
            <div style="background:#f8f9fa;border-radius:8px;padding:24px;margin:24px 0;text-align:center;">
                <span style="font-family:monospace;font-size:32px;font-weight:600;color:#2563eb;letter-spacing:4px;">
                    {verification_code}
                </span>
            </div>
            <p style="color:#666;font-size:14px;text-align:center;margin-top:24px;">
                This code will expire shortly. If you didn't request this verification, please ignore this email.
            </p>
            <div style="border-top:1px solid #eaeaea;margin-top:32px;padding-top:32px;text-align:center;">
                <p style="color:#666;font-size:14px;margin:0;">Justice Genie - Empowering citizens with knowledge</p>
                <p style="color:#666;font-size:12px;margin-top:8px;">This is an automated message, please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Send the email in a separate thread to avoid blocking
    
    print(f"📩 Preparing to send verification email to: {email}")    
    try:
         send_email(email, subject, body)
         print(f"✅ Verification email successfully queued for: {email}")
         return True
    except Exception as e:
         print(f"❌ Failed to send verification email to {email}: {e}")
         return False
        


        
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


# ✅ Verify code endpoint
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

    
def send_welcome_email(email, username):
    
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
                                <img src="https://res.cloudinary.com/dggciuh9l/image/upload/v1760548194/profile_pics/sswolspeqyywjimwegbh.png" 
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
                                                            <h4 style="color: #1e3a8a; margin: 0 0 5px; font-size: 24px;">30+</h4>
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
                                            <a href="https://justice-genie-mu.vercel.app/login" 
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
    print(f"📩 Preparing to send welcome email to: {email}")
    
    try:
        send_email(email, subject, body)
        print(f"✅ Welcome email successfully queued for: {email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send welcome email to {email}: {e}")
        return False


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
    
    subject = f"🔑 JUSTICE GENIE - Reset Your Password & Unlock Your Legal Power ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')})"

    # Justice Genie Logo (replace with actual URL)
    logo_url = "https://res.cloudinary.com/dggciuh9l/image/upload/v1760548194/profile_pics/sswolspeqyywjimwegbh.png"

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
    print(f"📩 Preparing to send password reset email to: {email}")
    try:
        send_email(email, subject, body)
        print(f"✅ Password reset email successfully queued for: {email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send password reset email to {email}: {e}")
        return False

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

# API Endpoint for Login
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
        session.permanent = True 
        session['username'] = user['username']
        session['email'] = user['email']
        session['role'] = user.get('role', 'user')  # store role in session

        is_admin = user.get('role') == 'admin'

        return jsonify({'message': 'Login successful', 'isAdmin': is_admin})

    return jsonify({'error': 'Invalid credentials'}), 401

# API Endpoint to check session
@app.route("/api/check-session", methods=["GET"])
def check_session():
    print("🔎 /api/check-session called")   # log every request
    print("➡️ Current session contents:", dict(session))  # show what's stored

    if "username" in session and "email" in session:
        print("✅ Session found for user:", session["username"])
        return jsonify({
            "loggedIn": True,
            "username": session["username"],
            "role": session.get("role", "user")
        })

    print("❌ No valid session found")
    return jsonify({"loggedIn": False})


def allowed_file(filename):
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

# ---- Update Profile Picture ---- #
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

    try:
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            file,
            folder='profile_pics',
            transformation=[{'width': 500, 'height': 500, 'crop': 'limit'}]
        )

        print("Upload result:", result)

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
@app.route('/api/remove_profile_picture', methods=['POST'])
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




# This function is now dynamic and secure, fetching questions for the user's current level
@app.route('/api/get_quiz', methods=['GET'])
def get_quiz():
    if 'username' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    username = session['username']
    user = users_collection.find_one({'username': username})
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Defaults to 1 for new users, ensuring a 1-indexed system
    unlocked_level = user.get('quiz_level', 1)
    if isinstance(unlocked_level, str):
        try: unlocked_level = int(unlocked_level.split()[-1])
        except (ValueError, IndexError): unlocked_level = 1
            
    requested_level = int(request.args.get('level', unlocked_level))
    if requested_level > unlocked_level:
        return jsonify({'error': 'Level is locked'}), 403

    questions = list(quizzquestions_collection.aggregate([
        {"$match": {"level": requested_level}},
        {"$sample": {"size": 15}}
    ]))
    
    if not questions:
        return jsonify({'message': f'Congratulations! You have completed all quiz levels.'})

    quiz_data = []
    for q in questions:
        quiz_data.append({
            '_id': str(q['_id']),
            'question': q['question'],
            'options': q['options'],
        })
    return jsonify({'quiz': quiz_data, 'level': requested_level})

# This function now uses the new "sum of high scores" logic
@app.route('/api/submit_quiz', methods=['POST'])
def submit_quiz():
    try:
        data = request.get_json()
        username = session.get('username')
        if not username: return jsonify({'error': 'Unauthorized'}), 401

        user_answers = data.get('answers', {})
        level_played = data.get('level')
        if level_played is None: return jsonify({'error': 'Level not provided'}), 400

        user = users_collection.find_one({'username': username})
        if not user: return jsonify({'error': 'User not found'}), 404

        PASSING_PERCENTAGE = 80

        question_ids = [ObjectId(id_str) for id_str in user_answers.keys()]
        correct_answers_cursor = quizzquestions_collection.find(
            {"_id": {"$in": question_ids}},
            {"question": 1, "correct_answer": 1, "explanation": 1}
        )
        answer_map = {str(q['_id']): q for q in correct_answers_cursor}

        score = 0
        total_questions = len(question_ids)
        results = []
        for q_id, u_ans in user_answers.items():
            if q_id in answer_map:
                details = answer_map[q_id]
                is_correct = u_ans == details['correct_answer']
                if is_correct: score += 1
                results.append({
                    'question': details['question'], 'user_answer': u_ans,
                    'correct_answer': details['correct_answer'], 'answer_status': "correct" if is_correct else "incorrect",
                    'explanation': details.get('explanation', '')
                })

        percentage = (score / total_questions) * 100 if total_questions > 0 else 0
        
        # --- NEW CUMULATIVE HIGH SCORE LOGIC ---
        level_scores = user.get('level_scores', {})
        previous_high_score_for_level = level_scores.get(str(level_played), 0)
        if score > previous_high_score_for_level:
            level_scores[str(level_played)] = score
        new_total_score = sum(level_scores.values())
        # ---

        # --- LEVEL-UP LOGIC ---
        current_unlocked = user.get('quiz_level', 1)
        new_unlocked = current_unlocked
        if percentage >= PASSING_PERCENTAGE and level_played == current_unlocked:
            new_unlocked = current_unlocked + 1
        level_up = new_unlocked > current_unlocked
        # ---

        # Update the user's document
        users_collection.update_one(
            {'username': username},
            {'$set': {
                'level_scores': level_scores,
                'last_quiz_marks': score,
                'last_quiz_percentage': percentage,
                'quiz_level': new_unlocked
            }}
        )
        
        # Update the leaderboard with the new TOTAL score
        leaderboard_collection.update_one(
            {'username': username},
            {'$set': {'score': new_total_score, 'game_name': user.get('game_name', 'Justice Warrior')}},
            upsert=True
        )
        
        return jsonify({'message': 'Quiz submitted!', 'score': score, 'percentage': percentage, 'results': results, 'level_up': level_up})
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# This function is correct and does not need changes, but is included for completeness
@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    try:
        users_sorted = list(leaderboard_collection.find(
            {}, {'username': 1, 'score': 1, 'game_name': 1, '_id': 0}
        ).sort('score', -1).limit(100))
        
        leaderboard = []
        rank = 0
        previous_score = -1
        for index, user in enumerate(users_sorted):
            current_score = user.get('score', 0)
            if current_score != previous_score: rank = index + 1
            leaderboard.append({
                'rank': rank, 'username': user.get('username', 'Unknown'),
                'score': current_score, 'gameName': user.get('game_name', 'Justice Warrior') 
            })
            previous_score = current_score
        return jsonify({'leaderboard': leaderboard})
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# This function now returns the detailed scoring data for the My Account page
@app.route('/api/myaccount', methods=['GET'])
def myaccount():
    if 'username' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user = users_collection.find_one({'username': session['username']})
    if not user:
        return jsonify({'error': 'User not found'}), 404

    unlocked_level = user.get('quiz_level', 1)
    if isinstance(unlocked_level, str):
        try: unlocked_level = int(unlocked_level.split()[-1])
        except (ValueError, IndexError): unlocked_level = 1

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
    print(f"📩 Preparing to send goodbye email to: {receiver_email}")
    try:
        send_email(receiver_email, subject, body)
        print(f"✅ Goodbye email successfully queued for: {receiver_email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send goodbye email to {receiver_email}: {e}")
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
    print("\n--- NEW ANALYSIS REQUEST ---")
    try:
        data = request.json
        user_query = data.get("user_query")
        bot_response = data.get("bot_response")
        
        print("--- STEP 1: RECEIVED DATA ---")
        print(f"User Query: {user_query[:100]}...") # Print first 100 chars
        print(f"Bot Response: {bot_response[:100]}...") # Print first 100 chars
        
        if not user_query or not bot_response:
            return jsonify({"error": "User query and bot response are required"}), 400

        api_key = os.getenv("GEMINI_ANALYZE_API_KEY")
        if not api_key:
            return jsonify({"error": "Gemini API key not configured"}), 500
        
        genai.configure(api_key=api_key)

        prompt = f"""
        ### Task:
        Analyze the legal strength of a case based on the user's original query and a structured summary.

        ### User's Original Query:
        "{user_query}"

        ### Structured Legal Summary:
        "{bot_response}"

        ### Analysis Instructions:
        Based on both the user's tone/intent from their query and the facts from the summary, provide a qualitative analysis.

        ### Expected Output:
        Respond with ONLY a valid JSON object in the following format. Do not add any other text or explanations.
        {{
          "case_strength": "...",
          "strength_score": 0,
          "key_strengths": ["...", "..."],
          "key_weaknesses": ["...", "..."],
          "critical_missing_info": "..."
        }}

        ### Rules for "strength_score":
        - If "case_strength" is "Weak", the score should be between 10 and 35.
        - If "case_strength" is "Moderate", the score should be between 40 and 65.
        - If "case_strength" is "Strong", the score should be between 70 and 95.
        - If "Needs More Information", the score should be 0.
        """
        
        print("\n--- STEP 2: SENDING PROMPT TO AI ---")
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        
        print("\n--- STEP 3: RAW AI RESPONSE ---")
        print(response.text)
        
        json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
        
        if json_match:
            json_string = json_match.group(0)
            print("\n--- STEP 4: EXTRACTED JSON STRING ---")
            print(json_string)
            analysis_result = json.loads(json_string)
            return jsonify(analysis_result)
        else:
            print("\n--- ERROR: NO JSON FOUND IN AI RESPONSE ---")
            return jsonify({"error": "Failed to extract a valid analysis from the AI response"}), 500

    except Exception as e:
        print(f"\n--- STEP 5: AN EXCEPTION OCCURRED ---")
        print(f"ERROR: {e}")
        return jsonify({"error": str(e)}), 500
    
# This is the final version for your app.py file

@app.route('/api/save_analysis', methods=['POST'])
def save_analysis():
    if 'username' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        data = request.json
        message_id = data.get('message_id')
        analysis_data = data.get('analysis_data')
        username = session['username']

        if not message_id or not analysis_data:
            return jsonify({'error': 'Missing message ID or analysis data'}), 400

        # This query now targets your `chats_collection`
        # and finds the specific message within the 'messages' array to update.
        result = chats_collection.update_one(
            # Find the chat document for the correct user
            {'username': username},
            # Set the 'analysis' field on the specific message element
            {'$set': {'messages.$[elem].analysis': analysis_data}},
            # Use array_filters to specify which element to update
            array_filters=[{'elem.id': message_id}]
        )

        if result.modified_count > 0:
            return jsonify({'message': 'Analysis saved successfully'})
        else:
            return jsonify({'error': 'Message not found in chat history'}), 404

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
DEFAULT_PROFILE_PIC = "https://res.cloudinary.com/dggciuh9l/image/upload/v1760548194/profile_pics/sswolspeqyywjimwegbh.png"

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
            "profile_picture": user.get('profile_picture', DEFAULT_PROFILE_PIC),
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
        print(f"Alert email sent to {receiver_email}")
        return True
    except Exception as e:
        print(f"Failed to send alert email to {receiver_email}: {e}")
        return False

@app.route("/monitor/metrics", methods=["GET"])
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

        # --- Get average quiz score from quizzquestions_collection ---
        quiz_pipeline = [
            {
                "$group": {
                    "_id": None,
                    "average_quiz_score": { "$avg": "$score" }
                }
            }
        ]
        quiz_stats = list(leaderboard_collection.aggregate(quiz_pipeline))
        metrics["average_quiz_score"] = quiz_stats[0]["average_quiz_score"] if quiz_stats else 0
        
        total_quiz_participants = leaderboard_collection.count_documents("username")
        metrics["total_quiz_participants"] = total_quiz_participants if total_quiz_participants else 0

        # --- Return final metrics ---
        return jsonify(metrics), 200

    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500


if __name__ == '__main__':
    app.run(debug=True)
