"""
Analysis blueprint: case-strength analysis (Gemini) + saving analysis
results onto a stored chat message.
"""
import os
import re
import json
import google.generativeai as genai
from flask import Blueprint, request, jsonify, session

from config import logger
from extensions import chats_collection

analysis_bp = Blueprint('analysis', __name__)


@analysis_bp.route('/api/analyze_probability', methods=['POST'])
def analyze_probability():
    logger.info("\n--- NEW ANALYSIS REQUEST ---")
    try:
        data = request.json
        user_query = data.get("user_query")
        bot_response = data.get("bot_response")
        
        logger.info("--- STEP 1: RECEIVED DATA ---")
        logger.info(f"User Query: {user_query[:100]}...")
        logger.info(f"Bot Response: {bot_response[:100]}...")
        
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
        
        logger.info("\n--- STEP 2: SENDING PROMPT TO AI ---")
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        
        logger.info("\n--- STEP 3: RAW AI RESPONSE ---")
        logger.info(response.text)
        
        json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
        
        if json_match:
            json_string = json_match.group(0)
            logger.info("\n--- STEP 4: EXTRACTED JSON STRING ---")
            logger.info(json_string)
            analysis_result = json.loads(json_string)
            return jsonify(analysis_result)
        else:
            logger.info("\n--- ERROR: NO JSON FOUND IN AI RESPONSE ---")
            return jsonify({"error": "Failed to extract a valid analysis from the AI response"}), 500

    except Exception as e:
        logger.info(f"\n--- STEP 5: AN EXCEPTION OCCURRED ---")
        logger.info(f"ERROR: {e}")
        return jsonify({"error": str(e)}), 500


@analysis_bp.route('/api/save_analysis', methods=['POST'])
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
