"""
Quiz blueprint: get_quiz, submit_quiz, leaderboard.
"""
import traceback
from flask import Blueprint, request, jsonify, session
from bson.objectid import ObjectId

from extensions import users_collection, quizzquestions_collection, leaderboard_collection

quiz_bp = Blueprint('quiz', __name__)


@quiz_bp.route('/api/get_quiz', methods=['GET'])
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



@quiz_bp.route('/api/submit_quiz', methods=['POST'])
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



@quiz_bp.route('/api/leaderboard', methods=['GET'])
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

