import React, { useState, useEffect,useCallback } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle,
  Trophy,
  Timer,
  ArrowRight,
  BookOpen,
  Lock,
  Unlock,
  User,
  Edit,
  Crown,
  Save,
  Info
} from 'lucide-react';
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
  const [timeLeft, setTimeLeft] = useState(900); // 30 minutes in seconds
  const [username, setUsername] = useState("");
  const [gameName, setGameName] = useState("Justice Warrior");
  const [editingName, setEditingName] = useState(false);
  const [tempGameName, setTempGameName] = useState("");
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [showLevelInfo, setShowLevelInfo] = useState(null);
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState("");
  const navigate = useNavigate();

  const quizLevels = [
    { 
      id: 0, 
      name: "Constitutional Basics", 
      locked: false,
      description: "Test your knowledge of fundamental constitutional principles and rights."
    },
    { 
      id: 1, 
      name: "Criminal Justice", 
      locked: true,
      description: "Challenge yourself with questions about criminal law, procedures, and landmark cases."
    },
    { 
      id: 2, 
      name: "Civil Rights & Liberties", 
      locked: true,
      description: "Explore the depth of your understanding about civil rights movements and legislation."
    },
    { 
      id: 3, 
      name: "International Law", 
      locked: true,
      description: "Test your knowledge of treaties, international courts, and global legal frameworks."
    },
    { 
      id: 4, 
      name: "Legal Ethics", 
      locked: true,
      description: "Challenge your understanding of professional responsibility and ethical dilemmas in law."
    }
  ];

  useEffect(() => {
    axios.get('/api/get_quiz')
      .then((response) => {
        setQuestions(response.data.quiz);
      })
      .catch((error) => {
        console.error("Error fetching quiz questions", error);
      });
      
   
  }, []);
  useEffect(() => {
    axios.get('/api/myaccount')
      .then((response) => {
        const fetchedUsername = response.data.username;
        const fetchedGameName = response.data.game_name || 'Justice Warrior'; // ✅ fallback if null
  
        setUsername(fetchedUsername);
        setGameName(fetchedGameName);
        setTempGameName(fetchedGameName);
  
        axios.get('/api/leaderboard')
          .then((res) => {
            const sortedLeaderboard = res.data.leaderboard || [];
            setLeaderboard(sortedLeaderboard);
  
            const userEntry = sortedLeaderboard.find(player => player.username === fetchedUsername);
            setUserRank(userEntry ? userEntry.rank : "N/A");
          })
          .catch(err => console.error("Error fetching leaderboard", err));
      })
      .catch(err => console.error("Error fetching user details", err));
  }, []);
  
  
  

  const handleAnswerChange = (question, option) => {
    setAnswers(prev => ({
      ...prev,
      [question]: option,
    }));
  };
  useEffect(() => {
    if (!quizStarted) return; // Don't start if the quiz hasn't begun
  
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  
    return () => clearInterval(timer); // Cleanup on unmount
  }, [quizStarted]); // Runs only when quizStarted changes
  
  
  const handleSubmit = useCallback(() => {
    axios.post('/api/submit_quiz', { answers })
      .then((response) => {
        console.log("Score received:", response.data.score); // ✅ Debugging log
        setScore(response.data.score);  
        setPercentage(response.data.percentage);
        setResults(response.data.results || []);
        setSubmitted(true);
  
        // ✅ Fetch leaderboard and update rank dynamically
        axios.get('/api/leaderboard')
          .then((res) => {
            const sortedLeaderboard = res.data.leaderboard || [];
            setLeaderboard(sortedLeaderboard);
  
            // ✅ Extract updated rank dynamically
            const userEntry = sortedLeaderboard.find(player => player.username === username);
            if (userEntry) {
              console.log("Updated Rank:", userEntry.rank);
              setUserRank(userEntry.rank);  // ✅ Update rank dynamically
            } else {
              setUserRank("N/A");
            }
          })
          .catch((err) => console.error("Error updating leaderboard", err));
  
        // ❌ Remove the `/api/myaccount` call for rank (it fetches stale data)
      })
      .catch((error) => {
        console.error("Error submitting quiz", error);
      });
  }, [answers, username]);

  
  
  
  
  useEffect(() => {
    if (!submitted && quizStarted) {
      if (timeLeft === 0) {
        handleSubmit();  // ⏳ Auto-submit when time is up
        return;
      }
  
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
  
      return () => clearInterval(timer);
    }
  }, [timeLeft, submitted, quizStarted, handleSubmit]);  // ✅ `handleSubmit` is now safe to include
  

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

  const handleSaveGameName = () => {
    axios.post('/api/update_game_name', { game_name: tempGameName })
      .then(() => {
        setGameName(tempGameName);
        setEditingName(false);
  
        // ✅ Optional: Immediately refresh leaderboard
        axios.get('/api/leaderboard')
          .then((res) => {
            setLeaderboard(res.data.leaderboard || []);
          });
      })
      .catch(err => console.error("Game name update failed", err));
  };
  
  

  const handleSelectLevel = (levelId) => {
    if (!quizLevels[levelId].locked) {
      setSelectedLevel(levelId);
      setSubmitted(false);
      setAnswers({});
      setCurrentQuestion(0);
      setTimeLeft(900);
      
      // In a real app, you would fetch questions for the selected level
      axios.get(`/api/get_quiz?level=${levelId}`)
        .then((response) => {
          setQuestions(response.data.quiz);
        })
        .catch((error) => {
          console.error("Error fetching quiz questions", error);
        });
    }
  };

  const toggleLeaderboard = () => {
    setLeaderboardVisible(!leaderboardVisible);
  };

  const renderProgressBar = () => {
    const progress = (currentQuestion + 1) / questions.length * 100;
    return (
      <div className="quiz-progress">
        <div className="quiz-progress-bar" style={{ width: `${progress}%` }}></div>
        <span className="quiz-progress-text">
          Question {currentQuestion + 1} of {questions.length}
        </span>
      </div>
    );
  };

  const renderLevelSelector = () => {
    return (
      <div className="quiz-levels-container">
        <h2 className="quiz-levels-title">Challenge Levels</h2>
        <div className="quiz-levels-grid">
          {quizLevels.map((level) => (
            <div 
              key={level.id}
              className={`quiz-level-card ${selectedLevel === level.id ? 'quiz-level-selected' : ''} ${level.locked ? 'quiz-level-locked' : ''}`}
              onClick={() => !level.locked && handleSelectLevel(level.id)}
              onMouseEnter={() => setShowLevelInfo(level.id)}
              onMouseLeave={() => setShowLevelInfo(null)}
            >
              <div className="quiz-level-content">
                <h3 className="quiz-level-name">{level.name}</h3>
                {level.locked ? (
                  <Lock className="quiz-level-icon" />
                ) : (
                  <Unlock className="quiz-level-icon" />
                )}
              </div>
              {showLevelInfo === level.id && (
                <div className="quiz-level-tooltip">
                  <p>{level.description}</p>
                  {level.locked && <p className="quiz-level-locked-message">Complete previous levels to unlock</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderUserProfile = () => {
    return (
      <div className="quiz-user-profile">
        <div className="quiz-user-avatar">
          <User size={24} />
        </div>
        <div className="quiz-user-info">
          <div className="quiz-username">{username}</div>
          <div className="quiz-game-name-container">
            {editingName ? (
              <div className="quiz-game-name-edit">
                <input 
                  type="text" 
                  value={tempGameName} 
                  onChange={(e) => setTempGameName(e.target.value)}
                  className="quiz-game-name-input"
                />
                <button className="quiz-game-name-save" onClick={handleSaveGameName}>
                  <Save size={16} />
                </button>
              </div>
            ) : (
              <>
                <span className="quiz-game-name">{gameName}</span>
                <button className="quiz-game-name-edit-btn" onClick={handleEditGameName}>
                  <Edit size={16} />
                </button>
              </>
            )}
          </div>
        </div>
        <div className="quiz-user-rank" onClick={toggleLeaderboard}>
          <Trophy size={20} />
          <span>Rank #{userRank || 'Loading...'}</span>  {/* ✅ Show updated rank */}
        </div>
      </div>
    );
  };

   
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
            <table className="quiz-leaderboard-table">
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
                  <td>{player.score}</td>
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
      <button
  className="law-pdf-back-button flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105"
  onClick={() => navigate('/chat')}
  aria-label="Back to Dashboard"
>
  <ArrowLeft className="w-5 h-5" />
  <span>Back to Chat</span>
</button>
        {renderUserProfile()}
        {renderLevelSelector()}
      </div>
  
      <div className="quiz-main-container">
        <div className="quiz-header sticky-header">
          <h1 className="quiz-title">
            <Brain className="quiz-title-icon" />
            Justice Genie Quiz
          </h1>
  
          {!quizStarted ? (
            <button 
              className="quiz-start-button" 
              onClick={() => setQuizStarted(true)}
            >
              Start Quiz
            </button>
          ) : (
            !submitted && (
              <div className="quiz-timer">
                <Timer size={20} />
                <span>{formatTime(timeLeft)}</span>
              </div>
            )
          )}
  
          {/* ✅ Retake Quiz Button (Appears only after submission) */}
          {submitted && (
            <button 
            onClick={() => {
              setQuizStarted(false);  // Show the welcome screen again
              setSubmitted(false);    // Hide the results
              setAnswers({});         // Clear previous answers
              setScore(0);            // Reset score
              setCurrentQuestion(0);  // Go back to the first question
              setTimeLeft(900);       // Reset timer (15 minutes = 900s)
            }}
            className="Quizz-restart bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg mt-4"
          >
             Restart Quiz
          </button>
          )}
        </div>
        {!quizStarted && (
            <div className="quiz-placeholder">
              <img src="/images/right-image.png" alt="Justice Quiz" className="quiz-banner" />
              <h2 className="quiz-welcome">📜 Justice Genie Quiz</h2>
              <p className="quiz-instruction">
                Once you start, <strong>there's no turning back!</strong> 
              </p>
              <p className="quiz-details">
                ⏳ <strong>Time Limit:</strong> 15 minutes  
              </p>
              <p className="quiz-warning">
                ⚠️ <strong>Important:</strong> If time runs out, your answers will be auto-submitted.  
              </p>
              <p className="quiz-leaderboard-note">
                🔄 Refresh after submission to see your position on the leaderboard.
              </p>
            </div>
         )}

        {/* ✅ Quiz Appears Only After "Start Quiz" is Clicked */}
        {quizStarted && !submitted ? (
          <div className="quiz-main">
            {renderProgressBar()}
            <div className="quiz-question-container animate-fade-in">
              {questions[currentQuestion] && (
                <div className="quiz-card">
                  <h3 className="quiz-question-text">
                    <BookOpen className="quiz-question-icon" />
                    {questions[currentQuestion].question}
                  </h3>
                  <div className="quiz-options">
                    {questions[currentQuestion].options.map((option, index) => (
                      <label 
                        key={index} 
                        className={`quiz-option ${
                          answers[questions[currentQuestion].question] === option 
                            ? 'quiz-option-selected' 
                            : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name={`quiz-question-${currentQuestion}`}
                          value={option}
                          checked={answers[questions[currentQuestion].question] === option}
                          onChange={() => handleAnswerChange(questions[currentQuestion].question, option)}
                          className="quiz-radio"
                        />
                        <span className="quiz-option-text">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="quiz-navigation">
                <button 
                  className="quiz-nav-button" 
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                >
                  Previous
                </button>
                {currentQuestion === questions.length - 1 ? (
                  <button className="quiz-submit" onClick={handleSubmit}>
                    Submit Quiz
                    <Trophy size={20} />
                  </button>
                ) : (
                  <button 
                    className="quiz-nav-button quiz-next" 
                    onClick={handleNext}
                  >
                    Next
                    <ArrowRight size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : null}
          {timeLeft === 0 && submitted && (
             <div className="quiz-timeout-message">
                 Time’s up! Your quiz has been auto-submitted.
              </div>
          )}

        {/* ✅ Show Quiz Results After Submission */}
        {submitted && (
          <div className="quiz-results animate-fade-in">
            <div className="quiz-score-container">
              <div className="quiz-score-circle" style={{ 
                '--percentage': `${percentage}%`,
                '--color': percentage >= 70 ? '#4CAF50' : percentage >= 40 ? '#FFA726' : '#F44336'
              }}>
                <div className="quiz-score-inner">
                  <span className="quiz-score-number">{score}</span>
                  <span className="quiz-score-total">/ {questions.length}</span>
                  <div className="quiz-percentage">{percentage}%</div>
                </div>
              </div>
            </div>
  
            <div className="quiz-results-list">
              {results.map((result, index) => (
                <div 
                  key={index} 
                  className={`quiz-result-item ${result.answer_status === 'correct' ? 'quiz-correct' : 'quiz-incorrect'}`}
                >
                  {result.answer_status === 'correct' ? (
                    <CheckCircle2 className="quiz-result-icon quiz-correct" />
                  ) : (
                    <XCircle className="quiz-result-icon quiz-incorrect" />
                  )}
                  <div className="quiz-result-content">
                    <h3 className="quiz-question-text">{result.question}</h3>
                    <div className="quiz-answer-box">
                      <p>
                        <span className="quiz-answer-label">Your Answer:</span> 
                        <span className={result.answer_status === 'correct' ? 'quiz-correct-text' : 'quiz-incorrect-text'}>
                          {answers[result.question]}
                        </span>
                      </p>
                      {result.answer_status !== 'correct' && (
                        <p>
                          <span className="quiz-answer-label">Correct Answer:</span> 
                          <span className="quiz-correct-text">{result.correct_answer}</span>
                        </p>
                      )}
                    </div>
                    {result.explanation && (
                      <div className="quiz-explanation">
                        <Info size={16} className="quiz-info-icon" />
                        <p>{result.explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button 
            onClick={() => {
              setQuizStarted(false);  // Show the welcome screen again
              setSubmitted(false);    // Hide the results
              setAnswers({});         // Clear previous answers
              setScore(0);            // Reset score
              setCurrentQuestion(0);  // Go back to the first question
              setTimeLeft(900);       // Reset timer (15 minutes = 900s)
            }}
            className="Quizz-restart bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg mt-4"
          >
             Restart Quiz
          </button>

          </div>
        )}
      </div>
    </div>
  );
};  

export default Quiz;