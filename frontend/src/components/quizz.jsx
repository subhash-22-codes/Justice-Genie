import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { 
  Brain, ArrowLeft, CheckCircle2, XCircle, Trophy, Timer,
   Lock, Unlock, Crown, Save, Edit, X, Info, Loader,
   Menu
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
  const [expandedLevelInfo, setExpandedLevelInfo] = useState(null);
  const [leaderboardVisible, setLeaderboardVisible] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const quizLevels = [
    { id: 1, name: "Constitutional Basics", description: "Test your knowledge of fundamental constitutional principles and rights." },
    { id: 2, name: "Criminal Justice", description: "Challenge yourself with questions about criminal law, procedures, and landmark cases." },
    { id: 3, name: "Civil Rights & Liberties", description: "Explore the depth of your understanding about civil rights movements and legislation." },
    { id: 4, name: "International Law", description: "Test your knowledge of treaties, international courts, and global legal frameworks." },
    { id: 5, name: "Legal Ethics", description: "Challenge your understanding of professional responsibility and ethical dilemmas in law." }
  ];

  useEffect(() => {
    axios.get(`/api/myaccount`, { withCredentials: true })
      .then((response) => {
        const { username, game_name, quiz_level } = response.data;
        setUsername(username);
        setGameName(game_name || 'Justice Warrior');
        setTempGameName(game_name || 'Justice Warrior');
        setUnlockedLevel(quiz_level || 1);
        
        return axios.get(`/api/leaderboard`, { withCredentials: true });
      })
      .then((res) => {
        const sortedLeaderboard = res.data.leaderboard || [];
        setLeaderboard(sortedLeaderboard);
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
      `/api/submit_quiz`,
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
          showConfirmButton: false,
          background: document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff',
          color: document.documentElement.classList.contains('dark') ? '#e2e8f0' : '#1e293b',
          confirmButtonColor: '#2563eb',
        });
        axios.get(`/api/myaccount`, { withCredentials: true })
          .then(res => setUnlockedLevel(res.data.quiz_level || 1));
      }

      return axios.get(`/api/leaderboard`, { withCredentials: true });
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

  useEffect(() => {
    if (!leaderboardVisible) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setLeaderboardVisible(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [leaderboardVisible]);

  const handleSelectLevel = (levelId) => {
    setSelectedLevel(levelId);
    setQuizStarted(false);
    setSubmitted(false);
    setAnswers({});
    setCurrentQuestion(0);
    setTimeLeft(900);
    setQuestions([]);
    setSidebarOpen(false);

    axios.get(`/api/get_quiz?level=${levelId}`, { withCredentials: true })
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
      `/api/update_game_name`,
      { game_name: tempGameName },
      { withCredentials: true }
    )
    .then(() => {
      setGameName(tempGameName);
      setEditingName(false);
      return axios.get(`/api/leaderboard`, { withCredentials: true });
    })
    .then((res) => {
      setLeaderboard(res.data.leaderboard || []);
    })
    .catch(err => console.error("Game name update failed", err));
  };

  const toggleLeaderboard = () => {
    setLeaderboardVisible(!leaderboardVisible);
  };

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const resetQuiz = () => {
    setQuizStarted(false); setSubmitted(false); setAnswers({}); setScore(0);
    setCurrentQuestion(0); setTimeLeft(900); setQuestions([]);
  };

  const renderProgressBar = () => (
    <div className="mb-4 sm:mb-5">
      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300 ease-premium"
          style={{ width: `${((currentQuestion + 1) / (questions.length || 1)) * 100}%` }}
        ></div>
      </div>
      <div className="flex justify-between items-center mt-1.5">
        <span className="font-manrope text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
          Question {currentQuestion + 1} of {questions.length}
        </span>
      </div>
    </div>
  );

  const renderLevelSelector = () => {
    return (
      <div className="mt-5 sm:mt-6">
        <h2 className="font-poppins text-xs sm:text-[13px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 mb-3 px-1">Challenge Levels</h2>
        <div className="space-y-1.5">
          {quizLevels.map((level) => {
            const isLocked = level.id > unlockedLevel;
            const isInfoOpen = expandedLevelInfo === level.id;
            const isSelected = selectedLevel === level.id;
            
            return (
              <div
                key={level.id}
                className={`relative rounded-md transition-all duration-150 ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-500/10'
                    : 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60'
                } ${isLocked ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center">
                  <button
                    type="button"
                    className={`flex-1 flex items-center justify-between p-2.5 sm:p-3 text-left ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    onClick={() => !isLocked && handleSelectLevel(level.id)}
                    disabled={isLocked}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-blue-600' : 'bg-transparent'}`}></span>
                      <h3 className={`font-manrope text-xs sm:text-sm font-medium ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}`}>
                        {level.name}
                      </h3>
                    </div>
                    {isLocked ? <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" /> : <Unlock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />}
                  </button>

                  <button
                    type="button"
                    className="p-2.5 sm:p-3 text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedLevelInfo(isInfoOpen ? null : level.id);
                    }}
                    aria-label={`${isInfoOpen ? 'Hide' : 'Show'} details for ${level.name}`}
                  >
                    <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>

                {isInfoOpen && (
                  <div className="px-4 pb-3 pl-8 -mt-1 animate-fadeIn">
                    <p className="font-manrope text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{level.description}</p>
                    {isLocked && (
                      <p className="flex items-center gap-1 font-manrope text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 mt-1.5 font-medium">
                        <Lock size={10} className="sm:w-[11px] sm:h-[11px]" />
                        Complete previous levels to unlock
                      </p>
                    )}
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
    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 mt-2">
      <div className="min-w-0 flex-1">
        <div className="font-poppins text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{username}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {editingName ? (
            <div className="flex items-center gap-1 w-full">
              <input
                type="text"
                value={tempGameName}
                onChange={(e) => setTempGameName(e.target.value)}
                className="font-manrope text-[10px] sm:text-xs px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500/40 w-full min-w-[80px]"
                autoFocus
              />
              <button className="text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 p-1 rounded-md flex-shrink-0" onClick={handleSaveGameName} aria-label="Save game name"><Save size={13} /></button>
              <button className="text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded-md flex-shrink-0" onClick={handleCancelGameName} aria-label="Cancel editing"><X size={13} /></button>
            </div>
          ) : (
            <>
              <span className="font-manrope text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 italic truncate">{gameName}</span>
              <button className="text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 flex-shrink-0 p-0.5" onClick={handleEditGameName} aria-label="Edit game name"><Edit size={11} /></button>
            </>
          )}
        </div>
      </div>
      <button 
        className="flex flex-col items-center justify-center bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 px-2.5 py-1.5 rounded-md flex-shrink-0 transition-colors border border-amber-100 dark:border-amber-500/20" 
        onClick={toggleLeaderboard}
      >
        <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5" />
        <span className="font-poppins text-[10px] sm:text-[11px] font-bold">#{userRank || '-'}</span>
      </button>
    </div>
  );

  const renderLeaderboard = () => {
    if (!leaderboardVisible) return null;

    const medalFor = (rank) => {
      if (rank === 1) return <img src="./images/1stplace.png" alt="1st place" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />;
      if (rank === 2) return <img src="./images/2ndplace.png" alt="2nd place" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />;
      if (rank === 3) return <img src="./images/3rdplace.png" alt="3rd place" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />;
      return <span className="text-xs sm:text-sm font-semibold text-slate-400 dark:text-slate-500 w-5 sm:w-6 text-center">{rank}</span>;
    };

    return (
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={toggleLeaderboard}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="leaderboard-title"
          className="bg-white dark:bg-slate-900 rounded-lg shadow-elevated w-full max-w-md sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col animate-scaleIn"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 id="leaderboard-title" className="font-poppins font-bold text-sm sm:text-[15px] text-slate-900 dark:text-slate-100 flex items-center gap-1.5 sm:gap-2">
              <Crown className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-500" />
              Global Leaderboard
            </h2>
            <button
              className="p-1 sm:p-1.5 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              onClick={toggleLeaderboard}
              aria-label="Close leaderboard"
            >
              <X className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </div>

          <div className="custom-scrollbar overflow-y-auto">
            <ul className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {leaderboard.map((player) => (
                <li key={player.username} className={`flex items-center justify-between gap-3 px-4 py-3 ${player.username === username ? 'bg-blue-50/60 dark:bg-blue-500/5' : ''}`}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex-shrink-0 w-6 flex justify-center">{medalFor(player.rank)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="font-manrope text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{player.gameName}</p>
                      <p className="font-manrope text-[10px] text-slate-400 dark:text-slate-500 truncate">@{player.username}</p>
                    </div>
                  </div>
                  <div className="font-poppins text-xs font-bold text-slate-800 dark:text-slate-100 flex-shrink-0 pl-2">{player.score} pts</div>
                </li>
              ))}
            </ul>

            <table className="hidden sm:table w-full font-manrope text-sm">
              <thead>
                <tr className="text-left text-slate-400 dark:text-slate-500 text-[11px] uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/20">
                  <th className="px-5 py-2.5 font-semibold">Rank</th>
                  <th className="px-3 py-2.5 font-semibold">Player</th>
                  <th className="px-3 py-2.5 font-semibold">Game Name</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((player) => (
                  <tr key={player.username} className={`${player.username === username ? 'bg-blue-50/60 dark:bg-blue-500/5' : ''} border-b border-slate-50 dark:border-slate-800/50 last:border-0`}>
                    <td className="px-5 py-2.5">{medalFor(player.rank)}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-700 dark:text-slate-200 font-medium">{player.username}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-400 dark:text-slate-500">{player.gameName}</td>
                    <td className="px-5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 text-right">{player.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {leaderboard.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 sm:py-10 text-slate-300 dark:text-slate-600">
                <Trophy size={24} className="sm:w-7 sm:h-7" />
                <p className="font-manrope text-xs sm:text-sm mt-2">No entries yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {renderLeaderboard()}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transform transition-transform duration-300 ease-premium lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-14 sm:h-16 px-4 sm:px-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center flex-shrink-0">
              <img
                src="/images/jg_original_logo_1.png"
                alt="Justice Genie"
                className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
              />
            </div>
            <h1 className="text-sm sm:text-[15px] font-poppins font-bold text-slate-900 dark:text-slate-50 tracking-tight">
              Justice Genie
            </h1>
          </div>
          <button
            className="lg:hidden p-2 rounded-md text-slate-400 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800 transition-colors"
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-4">
          <button
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-xs sm:text-sm font-manrope font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            onClick={() => navigate('/chat')}
          >
            <ArrowLeft size={16} className="text-slate-400 dark:text-slate-500" />
            <span>Back to Chat</span>
          </button>
          
          {renderUserProfile()}
          {renderLevelSelector()}
        </div>
      </aside>

      {/* Main area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-2 sm:gap-3 h-14 sm:h-16 px-4 sm:px-6 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shrink-0">
          <button
            className="lg:hidden p-2 -ml-2 rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            onClick={toggleSidebar}
            aria-label="Open sidebar"
          >
            <Menu size={18} className="sm:w-5 sm:h-5" />
          </button>
          <div className="flex-1 min-w-0 flex justify-between items-center">
            <h2 className="font-poppins font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-[15px] truncate flex items-center gap-1.5 sm:gap-2">
              <Brain className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-blue-600 dark:text-blue-400" /> 
              Genie Quiz
            </h2>
            {quizStarted && !submitted && (
              <div className="flex items-center gap-1.5 sm:gap-2 font-manrope text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md">
                <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-3xl mx-auto w-full">
            
            {/* View 1: Not Started */}
            {!quizStarted && (
              <div className="flex flex-col items-center text-center max-w-lg mx-auto py-6 sm:py-10 animate-revealUp">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-5 shadow-card">
                  <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="font-poppins text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mb-2 sm:mb-3">
                  {quizLevels.find(l => l.id === selectedLevel)?.name || 'Select a Level'}
                </h2>
                <p className="font-manrope text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 px-4">
                  {quizLevels.find(l => l.id === selectedLevel)?.description}
                </p>

                <div className="w-full bg-white dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/50 rounded-xl shadow-sm p-4 sm:p-5 text-left space-y-3 sm:space-y-3.5 mb-8">
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-md">
                      <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    </div>
                    <p className="font-manrope text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">15 minutes time limit. Auto-submits when time runs out.</p>
                  </div>
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <div className="p-1.5 bg-amber-50 dark:bg-amber-900/30 rounded-md">
                      <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    </div>
                    <p className="font-manrope text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">Score 80% or higher to unlock the next challenge level.</p>
                  </div>
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <div className="p-1.5 bg-slate-100 dark:bg-slate-700/50 rounded-md">
                      <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                    </div>
                    <p className="font-manrope text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">Progress cannot be paused once the quiz begins.</p>
                  </div>
                </div>

                <button
                    className="font-manrope text-sm sm:text-[15px] font-semibold bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 sm:py-3 rounded-md shadow-card hover:shadow-card-hover active:scale-[0.98] transition-all duration-150 w-full sm:w-auto"
                    onClick={() => {
                      if (questions.length > 0) {
                        setQuizStarted(true);
                      } else {
                        handleSelectLevel(selectedLevel);
                        setQuizStarted(true);
                      }
                    }}
                  >
                    Start Challenge
                </button>
              </div>
            )}

            {/* View 2: Active Quiz */}
            {quizStarted && !submitted && (
              <div className="animate-fadeIn w-full max-w-2xl mx-auto">
                {renderProgressBar()}
                
                {questions.length > 0 && questions[currentQuestion] ? (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-card p-4 sm:p-6 mb-6">
                    <h3 className="font-poppins text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 flex items-start gap-2.5 mb-5 leading-snug">
                      <span className="text-blue-600 dark:text-blue-400 mt-0.5 font-bold">{currentQuestion + 1}.</span> 
                      {questions[currentQuestion].question}
                    </h3>
                    
                    <div role="radiogroup" aria-label="Answer options" className="space-y-2.5 sm:space-y-3">
                      {questions[currentQuestion].options.map((option, index) => {
                        const questionId = questions[currentQuestion]._id;
                        const isSelected = answers[questionId] === option;
                        return (
                          <label 
                            key={index} 
                            className={`flex items-start gap-3 p-3 sm:p-3.5 rounded-md border cursor-pointer transition-colors duration-150 ${
                              isSelected 
                                ? 'border-blue-300 dark:border-blue-500/50 bg-blue-50 dark:bg-blue-500/10' 
                                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`quiz-question-${currentQuestion}`}
                              value={option}
                              checked={isSelected}
                              onChange={() => handleAnswerChange(questionId, option)}
                              className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 text-blue-600 flex-shrink-0"
                            />
                            <span className={`font-manrope text-xs sm:text-sm ${isSelected ? 'text-blue-900 dark:text-blue-100 font-medium' : 'text-slate-700 dark:text-slate-200'}`}>
                              {option}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 font-manrope text-xs sm:text-sm text-slate-400 dark:text-slate-500 py-10">
                    <Loader size={16} className="animate-spin" /> Loading questions...
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <button
                    className="font-manrope text-xs sm:text-sm font-medium px-4 py-2 sm:py-2.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                  >
                    Previous
                  </button>
                  {currentQuestion === questions.length - 1 ? (
                    <button
                      className="flex items-center gap-1.5 sm:gap-2 font-manrope text-xs sm:text-sm font-semibold px-5 py-2 sm:py-2.5 rounded-md bg-green-600 hover:bg-green-700 text-white shadow-card hover:shadow-card-hover active:scale-[0.98] transition-all duration-150 disabled:opacity-60"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting && <Loader size={14} className="animate-spin" />}
                      {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                    </button>
                  ) : (
                    <button
                      className="font-manrope text-xs sm:text-sm font-semibold px-5 py-2 sm:py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow-card hover:shadow-card-hover active:scale-[0.98] transition-all duration-150"
                      onClick={handleNext}
                    >
                      Next
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* View 3: Results */}
            {submitted && (
              <div className="max-w-2xl mx-auto animate-fadeIn pb-10">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-card p-6 sm:p-8 mb-6 text-center relative overflow-hidden">
                  <h2 className="font-poppins text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 relative z-10">Quiz Results</h2>
                  
                  <div className="flex justify-center mb-6 relative z-10">
                    <div
                      className="w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center shadow-inner"
                      style={{
                        background: `conic-gradient(${percentage >= 80 ? '#16a34a' : percentage >= 50 ? '#f59e0b' : '#dc2626'} ${percentage.toFixed(2)}%, #e5e7eb ${percentage.toFixed(2)}%)`
                      }}
                    >
                      <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white dark:bg-slate-900 rounded-full flex flex-col items-center justify-center">
                        <span className="font-poppins text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 leading-none">{score}</span>
                        <span className="font-manrope text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5">/ {questions.length}</span>
                        <div className={`font-manrope text-[10px] sm:text-xs font-bold mt-1.5 px-2 py-0.5 rounded-full ${percentage >= 80 ? 'text-green-700 bg-green-100' : percentage >= 50 ? 'text-amber-700 bg-amber-100' : 'text-red-700 bg-red-100'}`}>
                          {percentage.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button onClick={resetQuiz} className="relative z-10 font-manrope text-xs sm:text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 px-5 py-2 sm:py-2.5 rounded-md shadow-sm active:scale-[0.98] transition-all duration-150">
                    Try Again
                  </button>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <h3 className="font-poppins text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200 px-1 mb-2">Detailed Review</h3>
                  {results.map((result, index) => (
                    <div key={index} className={`flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-lg border bg-white dark:bg-slate-900 ${result.answer_status === 'correct' ? 'border-l-4 border-l-green-500 border-slate-200 dark:border-slate-800' : 'border-l-4 border-l-red-500 border-slate-200 dark:border-slate-800'}`}>
                      {result.answer_status === 'correct' ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0 mt-0.5" />}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-poppins text-xs sm:text-[14.5px] font-medium text-slate-800 dark:text-slate-100 mb-2 leading-snug">{result.question}</h4>
                        <div className="space-y-1.5">
                          <p className="font-manrope text-[11px] sm:text-xs">
                            <span className="text-slate-400 dark:text-slate-500">Your Answer: </span>
                            <span className={result.answer_status === 'correct' ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-red-600 dark:text-red-400 font-semibold'}>
                              {result.user_answer}
                            </span>
                          </p>
                          {result.answer_status !== 'correct' && (
                            <p className="font-manrope text-[11px] sm:text-xs">
                              <span className="text-slate-400 dark:text-slate-500">Correct Answer: </span>
                              <span className="text-green-600 dark:text-green-400 font-semibold">{result.correct_answer}</span>
                            </p>
                          )}
                        </div>
                        {result.explanation && (
                          <div className="flex items-start gap-1.5 sm:gap-2 mt-2.5 font-manrope text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 sm:p-2.5 rounded-md leading-relaxed border border-slate-100 dark:border-slate-800/80">
                            <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 mt-0.5 text-blue-500" /> 
                            <p>{result.explanation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-30 lg:hidden animate-fadeIn" onClick={toggleSidebar}></div>
      )}
    </div>
  );
};

export default Quiz;