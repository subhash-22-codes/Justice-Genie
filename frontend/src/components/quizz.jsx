import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { 
  Brain, ArrowLeft, CheckCircle2, XCircle, Trophy, Timer,
  BookOpen, Lock, Unlock, Crown, Save, Edit, X, Info 
} from 'lucide-react';
import Swal from 'sweetalert2';

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
    <div className="mb-5">
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${((currentQuestion + 1) / (questions.length || 1)) * 100}%` }}
        ></div>
      </div>
      <span className="font-manrope text-xs text-slate-400 mt-1.5 block">
        Question {currentQuestion + 1} of {questions.length}
      </span>
    </div>
  );

  const renderLevelSelector = () => {
    return (
      <div className="mt-6">
        <h2 className="font-poppins font-semibold text-slate-800 mb-3">Challenge Levels</h2>
        <div className="space-y-2">
          {quizLevels.map((level) => {
            const isLocked = level.id > unlockedLevel;
            return (
              <div 
                key={level.id}
                className={`relative p-3 rounded-sm border cursor-pointer transition-colors ${
                  selectedLevel === level.id
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !isLocked && handleSelectLevel(level.id)}
                onMouseEnter={() => setShowLevelInfo(level.id)}
                onMouseLeave={() => setShowLevelInfo(null)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-manrope text-sm font-medium text-slate-700">{level.name}</h3>
                  {isLocked ? <Lock size={16} className="text-slate-400" /> : <Unlock size={16} className="text-green-500" />}
                </div>
                {showLevelInfo === level.id && (
                  <div className="absolute z-10 left-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-sm shadow-lg p-3">
                    <p className="font-manrope text-xs text-slate-600">{level.description}</p>
                    {isLocked && <p className="font-poppins text-xs text-red-500 mt-1">Complete previous levels to unlock</p>}
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
    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-sm p-4 mt-4">
      <div>
        <div className="font-manrope font-semibold text-slate-800">{username}</div>
        <div className="flex items-center gap-1.5 mt-1">
          {editingName ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={tempGameName}
                onChange={(e) => setTempGameName(e.target.value)}
                className="font-manrope text-xs px-2 py-1 rounded-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 w-28"
              />
              <button className="text-green-600 hover:bg-green-50 p-1 rounded-sm" onClick={handleSaveGameName}><Save size={14} /></button>
              <button className="text-slate-400 hover:bg-slate-100 p-1 rounded-sm" onClick={handleCancelGameName}><X size={14} /></button>
            </div>
          ) : (
            <>
              <span className="font-manrope text-xs text-slate-500 italic">{gameName}</span>
              <button className="text-slate-400 hover:text-slate-600" onClick={handleEditGameName}><Edit size={12} /></button>
            </>
          )}
        </div>
      </div>
      <button className="flex items-center gap-1.5 font-manrope text-sm font-medium text-amber-600 hover:bg-amber-50 px-2 py-1.5 rounded-sm" onClick={toggleLeaderboard}>
        <Trophy size={18} />
        <span>#{userRank || 'N/A'}</span>
      </button>
    </div>
  );

  const renderLeaderboard = () => {
    if (!leaderboardVisible) return null;
  
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-sm shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <h2 className="font-poppins font-semibold text-slate-800 flex items-center gap-2">
              <Crown size={20} className="text-amber-500" />
              Global Leaderboard
            </h2>
            <button className="text-slate-400 hover:text-slate-600 text-xl leading-none" onClick={toggleLeaderboard}>×</button>
          </div>
          <div className="overflow-y-auto p-2">
            <table className="w-full font-manrope text-sm">
              <thead>
                <tr className="text-left text-slate-400 text-xs">
                  <th className="px-3 py-2">Rank</th>
                  <th className="px-3 py-2">Player</th>
                  <th className="px-3 py-2">Game Name</th>
                  <th className="px-3 py-2">Score</th>
                </tr>
              </thead>
              <tbody>
              {leaderboard.map((player) => (
                <tr key={player.username} className={`${player.username === username ? 'bg-blue-50' : ''} border-t border-slate-100`}>
                  <td className="px-3 py-2 flex items-center justify-center">
                    {player.rank === 1 ? (
                      <img
                        src="./images/1stplace.png"
                        alt="1st Place"
                        className="w-6 h-6 sm:w-8 sm:h-8"
                      />
                    ) : player.rank === 2 ? (
                      <img
                        src="./images/2ndplace.png"
                        alt="2nd Place"
                        className="w-6 h-6 sm:w-8 sm:h-8"
                      />
                    ) : player.rank === 3 ? (
                      <img
                        src="./images/3rdplace.png"
                        alt="3rd Place"
                        className="w-6 h-6 sm:w-8 sm:h-8"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-slate-500">{player.rank}</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-700">{player.username}</td>
                  <td className="px-3 py-2 text-slate-500">{player.gameName}</td>
                  <td className="px-3 py-2 font-semibold text-slate-800">{player.score}</td>
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
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {renderLeaderboard()}
  
      <aside className="lg:w-80 flex-shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 p-5">
        <button
          className="flex items-center gap-2 font-manrope font-medium bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-sm transition-colors"
          onClick={() => navigate('/chat')}
          aria-label="Back to Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Chat</span>
        </button>
        {renderUserProfile()}
        {renderLevelSelector()}
      </aside>
  
      <main className="flex-1 p-5 sm:p-8">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <h1 className="font-poppins text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Brain className="text-blue-600" /> Justice Genie Quiz
          </h1>
          {!quizStarted ? (
            <button
              className="font-manrope font-medium bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-sm transition-colors"
              onClick={() => {
                if (questions.length > 0) {
                  setQuizStarted(true);
                } else {
                  handleSelectLevel(selectedLevel); // Fetch questions if not already loaded
                  setQuizStarted(true);
                }
              }}
            >
              Start Quiz
            </button>
          ) : !submitted && (
            <div className="flex items-center gap-2 font-manrope font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-sm">
              <Timer size={18} /><span>{formatTime(timeLeft)}</span>
            </div>
          )}
          {submitted && (
            <button onClick={() => {
              setQuizStarted(false); setSubmitted(false); setAnswers({}); setScore(0);
              setCurrentQuestion(0); setTimeLeft(900); setQuestions([]);
            }} className="font-manrope font-medium bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-sm transition-colors">
              Restart Quiz
            </button>
          )}
        </div>

        {!quizStarted && (
          <div className="flex flex-col items-center text-center max-w-lg mx-auto py-10">
            <img src="/images/right-image.png" alt="Justice Quiz" className="w-48 h-48 object-contain mb-4" />
            <h2 className="font-poppins text-xl font-bold text-slate-800 mb-3">📜 Justice Genie Quiz</h2>
            <p className="font-manrope text-sm text-slate-600 mb-1">Once you start, <strong>there's no turning back!</strong></p>
            <p className="font-manrope text-sm text-slate-600 mb-1">⏳ <strong>Time Limit:</strong> 15 minutes</p>
            <p className="font-manrope text-sm text-amber-600 mb-1">⚠️ <strong>Important:</strong> If time runs out, your answers will be auto-submitted.</p>
            <p className="font-manrope text-sm text-slate-600">Get <strong>80%</strong> to pass the level.</p>
          </div>
        )}

        {quizStarted && !submitted && (
          <div className="max-w-2xl mx-auto animate-fadeIn">
            {renderProgressBar()}
            <div>
              {questions.length > 0 && questions[currentQuestion] ? (
                <div className="bg-white border border-slate-200 rounded-sm p-6">
                  <h3 className="font-poppins font-semibold text-slate-800 flex items-start gap-2 mb-4">
                    <BookOpen size={20} className="text-blue-600 flex-shrink-0 mt-0.5" /> {questions[currentQuestion].question}
                  </h3>
                  <div className="space-y-2">
                    {questions[currentQuestion].options.map((option, index) => {
                      const questionId = questions[currentQuestion]._id;
                      const isSelected = answers[questionId] === option;
                      return (
                        <label key={index} className={`flex items-center gap-3 p-3 rounded-sm border cursor-pointer transition-colors ${isSelected ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                          <input
                            type="radio"
                            name={`quiz-question-${currentQuestion}`}
                            value={option}
                            checked={isSelected}
                            onChange={() => handleAnswerChange(questionId, option)}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-manrope text-sm text-slate-700">{option}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : ( <div className="font-manrope text-slate-500">Loading questions...</div> )}
              <div className="flex justify-between mt-5">
                <button
                  className="font-manrope font-medium px-4 py-2 rounded-sm border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                >
                  Previous
                </button>
                {currentQuestion === questions.length - 1 ? (
                  <button
                    className="font-manrope font-medium px-4 py-2 rounded-sm bg-green-600 hover:bg-green-700 text-white disabled:opacity-60"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                  </button>
                ) : (
                  <button
                    className="font-manrope font-medium px-4 py-2 rounded-sm bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleNext}
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        
        {submitted && (
          <div className="max-w-2xl mx-auto animate-fadeIn">
            <div className="flex justify-center mb-8">
              <div
                className="w-44 h-44 rounded-full flex items-center justify-center"
                style={{
                  background: `conic-gradient(${percentage >= 70 ? '#16a34a' : percentage >= 40 ? '#f59e0b' : '#dc2626'} ${percentage.toFixed(2)}%, #e5e7eb ${percentage.toFixed(2)}%)`
                }}
              >
                <div className="w-36 h-36 bg-white rounded-full flex flex-col items-center justify-center">
                  <span className="font-poppins text-4xl font-bold text-slate-800">{score}</span>
                  <span className="font-manrope text-sm text-slate-400">/ {questions.length}</span>
                  <div className="font-manrope text-sm font-semibold text-slate-600 mt-1">{percentage.toFixed(2)}%</div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className={`flex items-start gap-3 p-4 rounded-sm border ${result.answer_status === 'correct' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  {result.answer_status === 'correct' ? <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" /> : <XCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />}
                  <div className="flex-1">
                    <h3 className="font-poppins text-sm font-semibold text-slate-800">{result.question}</h3>
                    <div className="mt-2 space-y-1">
                      <p className="font-manrope text-sm">
                        <span className="text-slate-500">Your Answer: </span>
                        <span className={result.answer_status === 'correct' ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                          {result.user_answer}
                        </span>
                      </p>
                      {result.answer_status !== 'correct' && (
                        <p className="font-manrope text-sm">
                          <span className="text-slate-500">Correct Answer: </span>
                          <span className="text-green-700 font-medium">{result.correct_answer}</span>
                        </p>
                      )}
                    </div>
                    {result.explanation && (
                      <div className="flex items-start gap-2 mt-2 font-manrope text-xs text-slate-500 bg-white/60 p-2 rounded-sm">
                        <Info size={14} className="flex-shrink-0 mt-0.5" /> <p>{result.explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => {
              setQuizStarted(false); setSubmitted(false); setAnswers({}); setScore(0);
              setCurrentQuestion(0); setTimeLeft(900); setQuestions([]);
            }} className="font-manrope font-medium bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-sm mt-6 transition-colors">
              Restart Quiz
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Quiz;
