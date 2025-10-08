import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { 
  Brain, ArrowLeft, CheckCircle2, XCircle, Trophy, Timer,
  BookOpen, Lock, Unlock, Crown, Save, Edit, X, Info 
} from 'lucide-react';
import Swal from 'sweetalert2';
import '../styles/quizz.css';

const Quiz = () => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [results, setResults] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900);
  const [username, setUsername] = useState("");
  const [gameName, setGameName] = useState("Justice Warrior");
  const [editingName, setEditingName] = useState(false);
  const [tempGameName, setTempGameName] = useState("");
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [showLevelInfo, setShowLevelInfo] = useState(null);
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const quizLevels = [
    { id: 1, name: "Constitutional Basics", description: "Test your knowledge of fundamental constitutional principles and rights." },
    { id: 2, name: "Criminal Justice", description: "Challenge yourself with questions about criminal law, procedures, and landmark cases." },
    { id: 3, name: "Civil Rights & Liberties", description: "Explore the depth of your understanding about civil rights movements and legislation." },
    { id: 4, name: "International Law", description: "Test your knowledge of treaties, international courts, and global legal frameworks." },
    { id: 5, name: "Legal Ethics", description: "Challenge your understanding of professional responsibility and ethical dilemmas in law." }
  ];

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/myaccount`, { withCredentials: true })
      .then((response) => {
        const { username, game_name, quiz_level } = response.data;
        setUsername(username);
        setGameName(game_name || 'Justice Warrior');
        setTempGameName(game_name || 'Justice Warrior');
        setUnlockedLevel(quiz_level || 1);
        
        return axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/leaderboard`, { withCredentials: true });
      })
      .then((res) => {
        const sortedLeaderboard = res.data.leaderboard || [];
        setLeaderboard(sortedLeaderboard);
        // We use a local variable for username here because state updates can be asynchronous
        const userEntry = sortedLeaderboard.find(player => player.username === username);
        setUserRank(userEntry ? userEntry.rank : "N/A");
      })
      .catch(err => console.error("Error fetching initial page data:", err));
  }, [username]);

  const handleAnswerChange = (questionId, selectedOption) => {
    setAnswers(prevAnswers => ({ ...prevAnswers, [questionId]: selectedOption }));
  };

  const handleSubmit = useCallback(() => {
    setIsSubmitting(true);
    axios.post(
      `${process.env.REACT_APP_BACKEND_URL}/api/submit_quiz`,
      { answers, level: selectedLevel },
      { withCredentials: true }
    )
    .then((response) => {
      setScore(response.data.score);
      setPercentage(response.data.percentage);
      setResults(response.data.results || []);
      setSubmitted(true);

      if (response.data.level_up) {
        Swal.fire({
          icon: 'success',
          title: 'Level Up!',
          text: 'Congratulations, you have unlocked the next level!',
          timer: 3000,
          showConfirmButton: false
        });
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/myaccount`, { withCredentials: true })
          .then(res => setUnlockedLevel(res.data.quiz_level || 1));
      }

      return axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/leaderboard`, { withCredentials: true });
    })
    .then((res) => {
      const sortedLeaderboard = res.data.leaderboard || [];
      setLeaderboard(sortedLeaderboard);
      const userEntry = sortedLeaderboard.find(player => player.username === username);
      setUserRank(userEntry ? userEntry.rank : "N/A");
    })
    .catch((error) => console.error("Error submitting quiz", error))
    .finally(() => setIsSubmitting(false));
  }, [answers, username, selectedLevel]);

  useEffect(() => {
    if (!quizStarted || submitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [quizStarted, submitted, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && quizStarted && !submitted) {
      handleSubmit();
    }
  }, [timeLeft, quizStarted, submitted, handleSubmit]);

  const handleSelectLevel = (levelId) => {
    setSelectedLevel(levelId);
    setQuizStarted(false);
    setSubmitted(false);
    setAnswers({});
    setCurrentQuestion(0);
    setTimeLeft(900);
    setQuestions([]);

    axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/get_quiz?level=${levelId}`, { withCredentials: true })
      .then((response) => {
        setQuestions(response.data.quiz || []);
      })
      .catch((error) => console.error("Error fetching quiz questions", error));
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };
  
  const handleEditGameName = () => {
    setTempGameName(gameName);
    setEditingName(true);
  };
  
  const handleCancelGameName = () => {
    setTempGameName(gameName);
    setEditingName(false);
  };

  const handleSaveGameName = () => {
    axios.post(
      `${process.env.REACT_APP_BACKEND_URL}/api/update_game_name`,
      { game_name: tempGameName },
      { withCredentials: true }
    )
    .then(() => {
      setGameName(tempGameName);
      setEditingName(false);
      return axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/leaderboard`, { withCredentials: true });
    })
    .then((res) => {
      setLeaderboard(res.data.leaderboard || []);
    })
    .catch(err => console.error("Game name update failed", err));
  };

  const toggleLeaderboard = () => {
    setLeaderboardVisible(!leaderboardVisible);
  };

  const renderProgressBar = () => (
    <div className="quiz-progress">
      <div className="quiz-progress-bar" style={{ width: `${((currentQuestion + 1) / (questions.length || 1)) * 100}%` }}></div>
      <span className="quiz-progress-text">
        Question {currentQuestion + 1} of {questions.length}
      </span>
    </div>
  );

  const renderLevelSelector = () => {
    return (
      <div className="quiz-levels-container">
        <h2 className="quiz-levels-title">Challenge Levels</h2>
        <div className="quiz-levels-grid font-urbanist">
          {quizLevels.map((level) => {
            const isLocked = level.id > unlockedLevel;
            return (
              <div 
                key={level.id}
                className={`quiz-level-card ${selectedLevel === level.id ? 'quiz-level-selected' : ''} ${isLocked ? 'quiz-level-locked' : ''}`}
                onClick={() => !isLocked && handleSelectLevel(level.id)}
                onMouseEnter={() => setShowLevelInfo(level.id)}
                onMouseLeave={() => setShowLevelInfo(null)}
              >
                <div className="quiz-level-content">
                  <h3 className="quiz-level-name">{level.name}</h3>
                  {isLocked ? <Lock className="quiz-level-icon" /> : <Unlock className="quiz-level-icon" />}
                </div>
                {showLevelInfo === level.id && (
                  <div className="quiz-level-tooltip">
                    <p>{level.description}</p>
                    {isLocked && <p className="quiz-level-locked-message font-poppins">Complete previous levels to unlock</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderUserProfile = () => (
    <div className="quiz-user-profile">
      <div className="quiz-user-info">
        <div className="quiz-username font-urbanist">{username}</div>
        <div className="quiz-game-name-container">
          {editingName ? (
            <div className="quiz-game-name-edit font-urbanist">
              <input type="text" value={tempGameName} onChange={(e) => setTempGameName(e.target.value)} className="quiz-game-name-input font-urbanist" />
              <button className="quiz-game-name-save" onClick={handleSaveGameName}><Save size={16} /></button>
              <button className="quiz-game-name-cancel" onClick={handleCancelGameName}><X size={16} /></button>
            </div>
          ) : (
            <>
              <span className="quiz-game-name">{gameName}</span>
              <button className="quiz-game-name-edit-btn" onClick={handleEditGameName}><Edit size={16} /></button>
            </>
          )}
        </div>
      </div>
      <div className="quiz-user-rank font-urbanist" onClick={toggleLeaderboard}>
        <Trophy size={20} />
        <span>Rank #{userRank || 'N/A'}</span>
      </div>
    </div>
  );

  const renderLeaderboard = () => {
    if (!leaderboardVisible) return null;
  
    return (
      <div className="quiz-leaderboard-overlay">
        <div className="quiz-leaderboard-container">
          <div className="quiz-leaderboard-header">
            <h2 className="quiz-leaderboard-title">
              <Crown size={24} />
              Global Leaderboard
            </h2>
            <button className="quiz-leaderboard-close" onClick={toggleLeaderboard}>×</button>
          </div>
          <div className="quiz-leaderboard-content">
            <table className="quiz-leaderboard-table font-poppins">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Game Name</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
              {leaderboard.map((player) => (
                <tr key={player.username} className={player.username === username ? 'quiz-leaderboard-current-user' : ''}>
                  <td className="flex items-center justify-center">
                    {player.rank === 1 ? (
                      <img
                        src="./images/1stplace.png"
                        alt="1st Place"
                        className="quiz-rank-icon w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10"
                      />
                    ) : player.rank === 2 ? (
                      <img
                        src="./images/2ndplace.png"
                        alt="2nd Place"
                        className="quiz-rank-icon w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10"
                      />
                    ) : player.rank === 3 ? (
                      <img
                        src="./images/3rdplace.png"
                        alt="3rd Place"
                        className="quiz-rank-icon w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10"
                      />
                    ) : (
                      <span className="text-sm sm:text-base md:text-lg font-semibold">{player.rank}</span>
                    )}
                  </td>
                  <td>{player.username}</td>
                  <td>{player.gameName}</td>
                  <td className="font-spacegrotesk">{player.score}</td>
                </tr>
              ))}

              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="quiz-app-container">
      {renderLeaderboard()}
  
      <div className="quiz-sidebar">
        <button className="font-manrope law-pdf-back-button flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105" onClick={() => navigate('/chat')} aria-label="Back to Dashboard">
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Chat</span>
        </button>
        {renderUserProfile()}
        {renderLevelSelector()}
      </div>
  
      <div className="quiz-main-container">
        <div className="quiz-header sticky-header">
          <h1 className="quiz-title"><Brain className="quiz-title-icon" /> Justice Genie Quiz</h1>
          {!quizStarted ? (
            <button className="quiz-start-button font-manrope" onClick={() => {
              if (questions.length > 0) {
                setQuizStarted(true);
              } else {
                handleSelectLevel(selectedLevel); // Fetch questions if not already loaded
                setQuizStarted(true);
              }
            }}>
              Start Quiz
            </button>
          ) : !submitted && (
            <div className="quiz-timer"><Timer size={20} /><span>{formatTime(timeLeft)}</span></div>
          )}
          {submitted && (
            <button onClick={() => {
              setQuizStarted(false); setSubmitted(false); setAnswers({}); setScore(0);
              setCurrentQuestion(0); setTimeLeft(900); setQuestions([]);
            }} className="font-manrope Quizz-restart bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg mt-4">
              Restart Quiz
            </button>
          )}
        </div>

        {!quizStarted && (
          <div className="quiz-placeholder">
            <img src="/images/right-image.png" alt="Justice Quiz" className="quiz-banner" />
            <h2 className="quiz-welcome">📜 Justice Genie Quiz</h2>
            <p className="quiz-instruction font-manrope">Once you start, <strong>there's no turning back!</strong></p>
            <p className="quiz-details font-manrope">⏳ <strong>Time Limit:</strong> 15 minutes</p>
            <p className="quiz-warning font-manrope">⚠️ <strong>Important:</strong> If time runs out, your answers will be auto-submitted.</p>
            <p className="quiz-leaderboard-note font-manrope">Get <strong>80%</strong> to pass the level.</p>
          </div>
        )}

        {quizStarted && !submitted && (
          <div className={`quiz-main level-${selectedLevel}`}>
            {renderProgressBar()}
            <div className="quiz-question-container animate-fade-in">
              {questions.length > 0 && questions[currentQuestion] ? (
                <div className="quiz-card">
                  <h3 className="quiz-question-text"><BookOpen className="quiz-question-icon" /> {questions[currentQuestion].question}</h3>
                  <div className="quiz-options">
                    {questions[currentQuestion].options.map((option, index) => {
                      const questionId = questions[currentQuestion]._id;
                      return (
                        <label key={index} className={`quiz-option ${answers[questionId] === option ? 'quiz-option-selected' : ''}`}>
                          <input
                            type="radio"
                            name={`quiz-question-${currentQuestion}`}
                            value={option}
                            checked={answers[questionId] === option}
                            onChange={() => handleAnswerChange(questionId, option)}
                            className="quiz-radio"
                          />
                          <span className="quiz-option-text">{option}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : ( <div>Loading questions...</div> )}
              <div className="quiz-navigation">
                <button className="quiz-nav-button font-manrope" onClick={handlePrevious} disabled={currentQuestion === 0}>Previous</button>
                {currentQuestion === questions.length - 1 ? (
                  <button className="quiz-submit font-manrope" onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                  </button>
                ) : (
                  <button className="quiz-nav-button quiz-next font-manrope" onClick={handleNext}>Next</button>
                )}
              </div>
            </div>
          </div>
        )}
        
        {submitted && (
          <div className="quiz-results animate-fade-in">
            <div className="quiz-score-container">
              <div className="quiz-score-circle" style={{ '--percentage': `${percentage.toFixed(2)}%`, '--color': percentage >= 70 ? '#4CAF50' : percentage >= 40 ? '#FFA726' : '#F44336' }}>
                <div className="quiz-score-inner font-courgette">
                  <span className="quiz-score-number">{score}</span>
                  <span className="quiz-score-total">/ {questions.length}</span>
                  <div className="quiz-percentage">{percentage.toFixed(2)}%</div>
                </div>
              </div>
            </div>
            <div className="quiz-results-list">
              {results.map((result, index) => (
                <div key={index} className={`quiz-result-item ${result.answer_status === 'correct' ? 'quiz-correct' : 'quiz-incorrect'}`}>
                  {result.answer_status === 'correct' ? <CheckCircle2 className="quiz-result-icon quiz-correct" /> : <XCircle className="quiz-result-icon quiz-incorrect" />}
                  <div className="quiz-result-content">
                    <h3 className="quiz-question-text">{result.question}</h3>
                    <div className="quiz-answer-box">
                      <p>
                        <span className="quiz-answer-label font-manrope">Your Answer:</span>
                        <span className={result.answer_status === 'correct' ? 'quiz-correct-text' : 'quiz-incorrect-text'}>
                          {result.user_answer}
                        </span>
                      </p>
                      {result.answer_status !== 'correct' && (
                        <p>
                          <span className="quiz-answer-label font-manrope">Correct Answer:</span>
                          <span className="quiz-correct-text">{result.correct_answer}</span>
                        </p>
                      )}
                    </div>
                    {result.explanation && (
                      <div className="quiz-explanation font-manrope">
                        <Info /> <p>{result.explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => {
              setQuizStarted(false); setSubmitted(false); setAnswers({}); setScore(0);
              setCurrentQuestion(0); setTimeLeft(900); setQuestions([]);
            }} className="font-manrope Quizz-restart bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg mt-4">
              Restart Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz;