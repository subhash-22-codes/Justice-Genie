import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import { 
  ArrowLeft, LogOut, Camera, Edit2, MessageSquare, Trash2, Upload, 
  AlertTriangle, Loader, UserPlus, HelpCircle, Trophy, Star, Gamepad2, 
  Mail, Settings, Menu
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from "sweetalert2";
import Mailcheck from 'mailcheck';
import 'animate.css/animate.min.css';
import { AuthContext } from "../context/AuthContext";

const ProfileImage = ({ src, onUploadClick, onRemoveClick }) => (
    <div className="relative inline-block group">
      <div
        className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer shadow-card ring-2 ring-slate-200 dark:ring-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-transform duration-200 group-hover:scale-[1.02]"
        onClick={onUploadClick}
        role="button"
        tabIndex={0}
        aria-label="Update profile photo"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onUploadClick();
          }
        }}
      >
        <img
          src={src || "./images/user.png"}
          alt={src ? "User Profile Photo" : "Default Profile Placeholder"}
          loading="lazy"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/60 flex flex-col items-center justify-center gap-1 text-white opacity-0 group-hover:opacity-100 transition-all duration-200">
          <Camera size={20} />
          <span className="font-manrope text-[10px] font-semibold">Change Photo</span>
        </div>
      </div>

      {src && src !== "./images/user.png" && (
        <button
          className="absolute -bottom-1.5 -right-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl p-1.5 shadow-card active:scale-95 transition-all duration-150 ring-2 ring-white dark:ring-slate-900"
          onClick={onRemoveClick}
          title="Remove Photo"
          aria-label="Remove profile photo"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );

ProfileImage.defaultProps = {
  src: "./images/user.png",
  onUploadClick: () => {},
  onRemoveClick: () => {},
};

const ProgressBar = ({ level, rank, gameName, totalScore }) => {
  const MAX_POSSIBLE_SCORE = 75;
  const overallPercentage = Math.min(100, (totalScore / MAX_POSSIBLE_SCORE) * 100);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg shadow-card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-poppins font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">Performance & Analytics</h3>
          <p className="font-manrope text-xs text-slate-400 dark:text-slate-500 mt-0.5">Your overall standing across platform challenges</p>
        </div>
        <span className="font-poppins text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 px-2.5 py-1 rounded-md">
          Level {level || 1} Unlocked
        </span>
      </div>

      <div className="space-y-1.5 my-4">
        <div className="flex justify-between font-manrope text-xs font-semibold text-slate-600 dark:text-slate-300">
          <span>Progress to Max Rank</span>
          <span>{overallPercentage.toFixed(0)}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-700 ease-premium"
            style={{ width: `${overallPercentage || 0}%` }}
          ></div>
        </div>
        <div className="flex justify-between font-manrope text-[11px] text-slate-400 dark:text-slate-500">
          <span>{totalScore || 0} Points earned</span>
          <span>Max Target: {MAX_POSSIBLE_SCORE} pts</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-1">
        <div className="flex flex-col items-center text-center gap-1 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <Trophy size={16} className="text-amber-500 mb-0.5" />
          <span className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-100">{rank ? `#${rank}` : '—'}</span>
          <span className="font-manrope text-[10px] text-slate-400 dark:text-slate-500">Global Rank</span>
        </div>

        <div className="flex flex-col items-center text-center gap-1 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <Star size={16} className="text-blue-500 mb-0.5" />
          <span className="font-poppins font-bold text-sm text-slate-800 dark:text-slate-100">{totalScore || 0}</span>
          <span className="font-manrope text-[10px] text-slate-400 dark:text-slate-500">Total Score</span>
        </div>

        <div className="flex flex-col items-center text-center gap-1 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <Gamepad2 size={16} className="text-purple-500 mb-0.5" />
          <span className="font-poppins font-bold text-xs text-slate-800 dark:text-slate-100 truncate max-w-full">{gameName || 'Justice Warrior'}</span>
          <span className="font-manrope text-[10px] text-slate-400 dark:text-slate-500">Alias</span>
        </div>
      </div>
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children, className }) => {
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                className={`bg-white dark:bg-slate-900 rounded-lg shadow-elevated w-full max-w-md max-h-[90vh] overflow-y-auto animate-scaleIn border border-slate-100 dark:border-slate-800 ${className || ''}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="px-5 pt-5 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 id="modal-title" className="font-poppins font-semibold text-sm sm:text-[15px] text-slate-900 dark:text-slate-100">{title}</h3>
                </div>
                <div className="p-5">
                  {children}
                </div>
            </div>
        </div>
    );
};

const MyAccount = () => {
    const [userDetails, setUserDetails] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [editField, setEditField] = useState({ username: '', password: '' });
    const [modals, setModals] = useState({
        upload: false,
        feedback: false,
        delete: false,
        collab: false,
        help: false
    });
    const [feedbackText, setFeedbackText] = useState('');
    const [loading, setLoading] = useState(true);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const [collabData, setCollabData] = useState({
        name: '',
        email: '',
        collaborationType: '',
        message: '',
        language: '',
        frameworks: '',
        database: '',
        skills: ''
    });
    const [isSubmittingCollab, setIsSubmittingCollab] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [gameName, setGameName] = useState('');
    const [rank, setRank] = useState(null);
    const { setAuth, clearAuth } = useContext(AuthContext);

    useEffect(() => {
      const fetchStats = async () => {
        try {
          const accountRes = await axios.get(
            `/api/myaccount`,
            { withCredentials: true }
          );
          setGameName(accountRes.data.game_name);

          const leaderboardRes = await axios.get(
            `/api/leaderboard`,
            { withCredentials: true }
          );

          const leaderboard = leaderboardRes.data.leaderboard;
          const user = accountRes.data.username;

          const matched = leaderboard.find(item => item.username === user);
          if (matched) {
            setRank(matched.rank);
          }
        } catch (err) {
          console.error('Error fetching rank or game name:', err);
        }
      };

      fetchStats();
    }, []);

    const fetchUserDetails = useCallback(async () => {
      try {
          const response = await axios.get(
              `/api/myaccount`,
              { withCredentials: true }
          );
          setUserDetails(response.data);
          setLoading(false);
      } catch (error) {
          if (error.response && error.response.status === 401) {
            // Session isn't actually valid — don't show a confusing
            // "failed to load" message, just send the user to log in.
            clearAuth();
            navigate("/login", { replace: true });
            return;
          }
          console.error('Error fetching user details:', error);
          showNotification('Failed to load user details', 'error');
          setLoading(false);
      }
    }, []);

    useEffect(() => {
        fetchUserDetails();
    }, [fetchUserDetails]);

    const toggleModal = (modalName, value) => {
        setModals(prev => ({ ...prev, [modalName]: value }));
    };
    
    const showNotification = (message, type = 'success') => {
        const iconMap = { success: 'success', error: 'error', info: 'info' };
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: iconMap[type] || 'success',
            title: message,
            showConfirmButton: false,
            timer: 3500,
            timerProgressBar: true,
        });
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('profile_picture', file);

        try {
            const response = await axios.post(
                `/api/update_profile_picture`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    withCredentials: true,
                    onUploadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(progress);
                    },
                }
            );
            const newPictureUrl = response.data.file_path;

            setUserDetails(prev => ({
            ...prev,
            profile_picture: newPictureUrl
             }));
             const cachedUser = JSON.parse(sessionStorage.getItem("userData")) || {};
                 sessionStorage.setItem("userData", JSON.stringify({
                     ...cachedUser,
                     profile_picture: newPictureUrl
             }));
            
            toggleModal('upload', false);
            setUploadProgress(0);
            showNotification('Profile picture updated successfully');
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            showNotification('Failed to upload profile picture', 'error');
            setUploadProgress(0);
        }
    };

    const handleRemovePicture = async () => {
        const result = await Swal.fire({
          title: 'Are you sure?',
          text: "Do you really want to remove your profile picture?",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#dc2626',
          cancelButtonColor: '#64748b',
          confirmButtonText: 'Yes, remove it!',
        });
      
        if (!result.isConfirmed) return;
      
        try {
          const response = await axios.post(
            `/api/remove_profile_picture`,
            {},
            { withCredentials: true }
          );

          if (response.data.message) {
            setUserDetails(prev => ({
              ...prev,
              profile_picture: "",
            }));

             const cachedUser = JSON.parse(sessionStorage.getItem("userData")) || {};
            sessionStorage.setItem("userData", JSON.stringify({
                ...cachedUser,
                profile_picture: ""
            }));
      
            Swal.fire({
              icon: 'success',
              title: 'Removed!',
              text: 'Your profile picture has been removed.',
              timer: 2000,
              showConfirmButton: false,
            });
          }
        } catch (error) {
          console.error('Error removing profile picture:', error);
          Swal.fire({
            icon: 'error',
            title: 'Failed!',
            text: 'Something went wrong. Try again.',
          });
        }
      };
      
    const handleUpdateProfile = async () => {
        const trimmedUsername = editField.username.trim();
        const trimmedPassword = editField.password.trim();

        if (!trimmedUsername && !trimmedPassword) {
            showNotification('Please provide new details to update', 'error');
            return;
        }
        if (trimmedUsername && trimmedUsername.length < 3) {
            showNotification('Username must be at least 3 characters', 'error');
            return;
        }
        if (trimmedPassword && trimmedPassword.length < 6) {
            showNotification('Password must be at least 6 characters', 'error');
            return;
        }

        try {
            await axios.post(
                `/api/update_profile`,
                { username: trimmedUsername || undefined, password: trimmedPassword || undefined },
                { withCredentials: true }
            );

            setUserDetails(prev => ({ ...prev, ...editField }));
            setIsEditing(false);
            setEditField({ username: '', password: '' });
            showNotification('Profile updated successfully');
          } catch (error) {
            console.error('Error updating profile:', error);
            showNotification('Failed to update profile', 'error');
          }
    };

    useEffect(() => {
        const fetchFeedbackStatus = async () => {
           try {
            const response = await axios.get(
                `/api/get_feedback_status?email=${userDetails.email}`,
                { withCredentials: true }
            );

            if (response.data.submitted) {
                setFeedbackSubmitted(true);
            }
            } catch (error) {
            console.error('Error fetching feedback status:', error);
            }
        };

        if (userDetails.email) {
            fetchFeedbackStatus();
        }
    }, [userDetails.email]);

    const handleFeedbackSubmit = async () => {
        if (!feedbackText.trim()) {
            showNotification("Please enter your feedback before submitting.", "error");
            return;
        }
    
        try {
            await axios.post(
                `/api/submit_feedback`,
                {
                feedbackText,
                email: userDetails.email,
                },
                { withCredentials: true }
            );

            showNotification("Thanks for your feedback! 😊", "success");
            setFeedbackText('');
            setFeedbackSubmitted(true); 
            toggleModal('feedback', false);
          } catch (error) {
            console.error("Error submitting feedback:", error);
            showNotification("Failed to submit feedback", "error");
          }
    };

    useEffect(() => {
        const fetchCollabStatus = async () => {
            try {
                const response = await axios.get(
                `/api/get_collab_status`,
                {
                    params: { email: userDetails.email },
                    withCredentials: true,
                }
                );
                setHasSubmitted(response.data.submitted);
            } catch (error) {
                console.error('Error fetching collaboration status:', error);
            }
        };
    
        if (userDetails.email) {
            fetchCollabStatus();
        }
    }, [userDetails.email]);
    
    const handleCollabSubmit = () => {
        if (
            !collabData.name ||
            !collabData.email ||
            !collabData.collaborationType ||
            !collabData.message ||
            !collabData.language
        ) {
            showNotification("Please fill all required fields.", "error");
            return;
        }
    
        if (hasSubmitted) {
            showNotification("You have already submitted a collaboration request.", "info");
            return;
        }
    
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(collabData.email)) {
            showNotification("Invalid email format.", "error");
            return;
        }
    
        Mailcheck.run({
            email: collabData.email,
            domains: ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'],
            secondLevelDomains: ['yahoo', 'hotmail', 'live', 'outlook', 'icloud'],
            topLevelDomains: ['com', 'net', 'org', 'info'],
            suggested: function (suggestion) {
                document.getElementById('suggestionEmail').textContent = suggestion.full;
                document.getElementById('currentEmail').textContent = collabData.email;

                const modal = document.getElementById('emailModal');
                modal.classList.remove('hidden');

                document.getElementById('confirmBtn').onclick = () => {
                    setCollabData({ ...collabData, email: suggestion.full });
                    modal.classList.add('hidden');
                };

                document.getElementById('cancelBtn').onclick = () => {
                    showNotification("Please correct your email before submitting.", "info");
                    modal.classList.add('hidden');
                };
            },
            empty: function () {
                submitCollabData(collabData);
            }
        });
    };
    
    const submitCollabData = async (data) => {
        setIsSubmittingCollab(true);
    
        try {
           const response = await axios.post(
            `/api/collab`,
            {
                name: data.name,
                email: data.email,
                collaborationType: data.collaborationType,
                message: data.message,
                language: data.language,
                frameworks: data.frameworks || "Not specified",
                database: data.database || "Not specified",
                skills: data.skills || "Not specified",
            },
            { withCredentials: true }
            );
    
            showNotification(response.data.success, "success");
    
            setCollabData({
                name: '',
                email: '',
                collaborationType: '',
                message: '',
                language: '',
                frameworks: '',
                database: '',
                skills: ''
            });
    
            setHasSubmitted(true);
            toggleModal('collab', false);
        } catch (error) {
            console.error("Error submitting collaboration request:", error);
            showNotification(error.response?.data?.error || "Failed to submit collaboration request.", "error");
        } finally {
            setIsSubmittingCollab(false);
        }
    };
    
    const handleClearChat = async () => {
        if (!userDetails.username) {
          Swal.fire({
            title: "Error!",
            text: "Username not found. Please log in again.",
            icon: "error",
            confirmButtonColor: '#dc2626',
          });
          return;
        }
      
        const confirmation = await Swal.fire({
          title: "Are you sure?",
          text: "This will permanently delete your chat history.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes, delete it!",
          cancelButtonText: "Cancel",
          confirmButtonColor: '#dc2626',
          cancelButtonColor: '#64748b',
        });
      
        if (!confirmation.isConfirmed) return;
      
        try {
          const response = await fetch(`/api/clear_chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ username: userDetails.username }),
          });
      
          const data = await response.json();
      
          Swal.fire({
            title: "Deleted!",
            text: data.message,
            icon: "success",
            confirmButtonColor: '#16a34a',
          });
      
          sessionStorage.removeItem("session_id");
          localStorage.removeItem(`chatHistory_${userDetails.username}`);
          window.dispatchEvent(new Event("chatHistoryClear"));
      
        } catch (error) {
          console.error("Error clearing chat history:", error);
          Swal.fire({
            title: "Error!",
            text: "Failed to clear chat history. Please try again.",
            icon: "error",
            confirmButtonColor: '#dc2626',
          });
        }
    };
      
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            await axios.delete(`/api/delete_account`, { withCredentials: true });
    
            showNotification('Account deletion in progress...');
            
            setTimeout(() => {
                showNotification('Account deleted successfully');
                navigate('/register');
            }, 2000);
        } catch (error) {
            console.error('Error deleting account:', error);
            showNotification('Failed to delete account', 'error');
        } finally {
            setTimeout(() => {
                setIsDeleting(false);
            }, 2000);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch(`/api/logout`, {
            method: "POST",
            credentials: "include",
            });

            sessionStorage.removeItem("isLoggedIn");
            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("role");
            localStorage.removeItem("darkMode");

            setAuth({ loggedIn: false, role: null, username: null, loading: false });

            navigate("/login");
        } catch (err) {
            console.error("Logout failed:", err);
        }
    };

    if (loading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 font-manrope">
            <img
                src="/images/jg_original_logo_1.png"
                alt="Justice Genie"
                className="w-8 h-8 object-contain mb-4 animate-pulse"
            />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                Loading your account details
                <span className="inline-flex gap-0.5 ml-0.5">
                    <span className="animate-[bounce_1.4s_infinite_ease-in-out_0s]">.</span>
                    <span className="animate-[bounce_1.4s_infinite_ease-in-out_0.2s]">.</span>
                    <span className="animate-[bounce_1.4s_infinite_ease-in-out_0.4s]">.</span>
                </span>
            </p>
        </div>
    );
}

    return (
        <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden font-manrope">
            {/* Sidebar matching Chat and Quiz */}
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
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close sidebar"
                >
                    <ArrowLeft size={18} />
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

                {/* Profile Widget inside Sidebar */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div className="font-poppins text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{userDetails.username}</div>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400 dark:text-slate-500 truncate">
                        <span>{gameName || 'Justice Warrior'}</span>
                    </div>
                </div>

                {/* Quick Navigation Links */}
                <div className="space-y-1 pt-2">
                    <p className="font-poppins text-[11px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 px-1 mb-2">Navigation</p>
                    <Link to="/lawpdf" className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" fill="#3B82F6" fillOpacity="0.15" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M14 2V8H20" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M16 13H8" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M16 17H8" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M10 9H9H8" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Digital Law Library
                    </Link>
                    <Link to="/chat" className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" fill="#8B5CF6" fillOpacity="0.15" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Chat Assistant
                    </Link>
                    <Link to="/quizz" className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" fill="#10B981" fillOpacity="0.15" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M9 7H15" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M9 11H13" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Genie Quiz
                    </Link>
                </div>
                </div>
            </aside>

            {/* Main Area */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Header */}
                <header className="flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            className="lg:hidden p-2 -ml-2 rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                            onClick={() => setSidebarOpen(true)}
                            aria-label="Open sidebar"
                        >
                            <Menu size={18} />
                        </button>
                        <h2 className="font-poppins font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-[15px] flex items-center gap-2">
                            <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Account Settings
                        </h2>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="group flex items-center gap-1.5 px-3 py-1.5 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors duration-150 text-xs sm:text-sm font-medium"
                    >
                        <LogOut size={16} />
                        <span>Logout</span>
                    </button>
                </header>

                {/* Content Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <div className="max-w-3xl mx-auto space-y-6">
                        {/* Profile Hero Card */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg shadow-card p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-5 relative overflow-hidden">
                            <ProfileImage
                                src={userDetails.profile_picture}
                                onUploadClick={() => toggleModal('upload', true)}
                                onRemoveClick={handleRemovePicture}
                            />

                            <div className="flex-1 text-center sm:text-left min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                                    <h2 className="font-poppins font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 truncate">{userDetails.username}</h2>
                                    <span className="self-center sm:self-auto bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-poppins text-[10px] px-2 py-0.5 rounded font-semibold border border-blue-100 dark:border-blue-500/20">Active User</span>
                                </div>
                                <p className="font-manrope text-xs sm:text-sm text-slate-400 dark:text-slate-500 truncate mb-3">{userDetails.email}</p>
                                
                                <button 
                                    onClick={() => setIsEditing(true)} 
                                    className="inline-flex items-center gap-1.5 font-manrope text-xs font-semibold bg-slate-900 dark:bg-slate-800 text-white px-3 py-1.5 rounded-md shadow-sm hover:bg-slate-800 transition-all"
                                >
                                    <Edit2 size={13} /> Edit Credentials
                                </button>
                            </div>
                        </div>

                        {/* Edit Drawer Form if active */}
                        {isEditing && (
                            <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-500/40 rounded-lg shadow-card p-5 animate-fadeIn">
                                <h3 className="font-poppins font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                                    <Settings size={16} className="text-blue-600 dark:text-blue-400" /> Update Account Credentials
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                    <div>
                                        <label className="block font-manrope text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">New Username</label>
                                        <input
                                            type="text"
                                            placeholder="Enter new username"
                                            value={editField.username}
                                            onChange={(e) => setEditField(prev => ({ ...prev, username: e.target.value }))}
                                            className="w-full font-manrope text-xs sm:text-sm px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-manrope text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">New Password</label>
                                        <input
                                            type="password"
                                            placeholder="Enter new password"
                                            value={editField.password}
                                            onChange={(e) => setEditField(prev => ({ ...prev, password: e.target.value }))}
                                            className="w-full font-manrope text-xs sm:text-sm px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button
                                        className="font-manrope text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        onClick={() => { setIsEditing(false); setEditField({ username: '', password: '' }); }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="font-manrope text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all"
                                        onClick={handleUpdateProfile}
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Progress Section */}
                        <ProgressBar
                            percentage={userDetails.last_quiz_percentage}
                            marks={userDetails.last_quiz_marks}
                            total={userDetails.last_quiz_total}
                            level={userDetails.quiz_level}
                            rank={rank}
                            gameName={gameName}
                            totalScore={userDetails.totalScore}
                        />

                        {/* Control Center Grid */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg shadow-card p-5 sm:p-6">
                            <h3 className="font-poppins font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 mb-4">Platform Services & Tools</h3>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                    className="flex items-center gap-3.5 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-all text-left group"
                                    onClick={() => toggleModal('feedback', true)}
                                >
                                    <div className="p-2.5 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                        <MessageSquare size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-poppins font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100">Send Feedback</h4>
                                        <p className="font-manrope text-[11px] text-slate-400 dark:text-slate-500">Share your thoughts with us</p>
                                    </div>
                                </button>

                                <button
                                    className="flex items-center gap-3.5 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-all text-left group"
                                    onClick={() => toggleModal('collab', true)}
                                >
                                    <div className="p-2.5 rounded-md bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                        <UserPlus size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-poppins font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100">Collaborate with Us</h4>
                                        <p className="font-manrope text-[11px] text-slate-400 dark:text-slate-500">Join our development network</p>
                                    </div>
                                </button>

                                <button
                                    className="flex items-center gap-3.5 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-all text-left group"
                                    onClick={() => toggleModal('help', true)}
                                >
                                    <div className="p-2.5 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                        <HelpCircle size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-poppins font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100">Help & Support</h4>
                                        <p className="font-manrope text-[11px] text-slate-400 dark:text-slate-500">Get assistance or FAQ guides</p>
                                    </div>
                                </button>

                                <button
                                    className="flex items-center gap-3.5 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-500/30 hover:bg-red-50/30 dark:hover:bg-red-500/10 transition-all text-left group"
                                    onClick={handleClearChat}
                                >
                                    <div className="p-2.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:text-red-500 transition-colors">
                                        <Trash2 size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-poppins font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100">Clear Chat History</h4>
                                        <p className="font-manrope text-[11px] text-slate-400 dark:text-slate-500">Wipe active session history</p>
                                    </div>
                                </button>
                            </div>

                            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center flex-wrap gap-3">
                                <p className="font-manrope text-[11px] text-slate-400">Danger Zone: Permanent actions</p>
                                <button
                                    className="flex items-center gap-1.5 font-manrope text-xs font-semibold px-3.5 py-2 rounded-md border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                                    onClick={() => toggleModal('delete', true)}
                                >
                                    <Trash2 size={14} /> Delete Account
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modals */}
            <Modal
                isOpen={modals.upload}
                onClose={() => toggleModal('upload', false)}
                title="Update Profile Picture"
            >
                <div className="space-y-3">
                    <div className="relative flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg py-8 text-slate-400 dark:text-slate-500 hover:border-blue-400 hover:bg-blue-50/30 transition-all">
                        <Upload size={24} className="text-blue-500" />
                        <p className="font-manrope text-xs">Click to upload or drag & drop</p>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                    </div>
                    {uploadProgress > 0 && (
                        <div className="space-y-1">
                            <div className="flex justify-between font-manrope text-[11px] text-slate-500">
                                <span>Uploading...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-600 transition-all duration-200"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            <Modal
                isOpen={modals.feedback}
                onClose={() => toggleModal('feedback', false)}
                title="Share Your Feedback"
            >
                {feedbackSubmitted ? (
                    <div className="flex flex-col items-center justify-center p-3 animate-fadeIn">
                        <img
                            src="/images/ThankyouFeedback.png"
                            alt="Thank you"
                            className="w-48 max-w-full h-auto mb-3"
                        />
                        <p className="font-poppins font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100">Thank you for your feedback!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <textarea
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                            placeholder="We value your thoughts..."
                            rows={4}
                            className="w-full font-manrope text-xs sm:text-sm p-3 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500/40 resize-none"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                className="font-manrope text-xs font-medium px-3 py-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                onClick={() => { toggleModal('feedback', false); setFeedbackText(''); }}
                            >
                                Cancel
                            </button>
                            <button
                                className="font-manrope text-xs font-semibold px-4 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all disabled:opacity-40"
                                onClick={handleFeedbackSubmit}
                                disabled={!feedbackText.trim()}
                            >
                                Submit Feedback
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={modals.collab}
                onClose={() => toggleModal('collab', false)}
                title="Collaboration Request"
                className="max-w-lg"
            >
            <div id="emailModal" className="fixed inset-0 flex items-center justify-center z-[60] hidden bg-slate-900/50 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-lg shadow-elevated max-w-sm w-full mx-4 border border-slate-200 dark:border-slate-800">
                    <h2 className="font-poppins text-xs font-semibold mb-2 text-slate-800 dark:text-slate-100">
                      Did you mean <span id="suggestionEmail" className="font-bold text-blue-600"></span> instead of <span id="currentEmail" className="font-bold text-red-500"></span>?
                    </h2>
                    <div className="flex justify-end gap-2 mt-3">
                      <button id="confirmBtn" className="font-manrope text-xs font-semibold bg-blue-600 text-white px-3 py-1 rounded-md">Yes</button>
                      <button id="cancelBtn" className="font-manrope text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-md">No</button>
                    </div>
                </div>
            </div>
                <div>
                {hasSubmitted ? (
                    <div className="flex flex-col items-center justify-center my-3 text-center animate-fadeIn">
                      <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-500/10 flex items-center justify-center mb-2">
                        <UserPlus size={18} className="text-green-600 dark:text-green-400" />
                      </div>
                      <p className="font-manrope text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
                          <strong className="font-semibold text-slate-800 dark:text-slate-100">Request submitted successfully.</strong> Our team is reviewing your profile.
                      </p>
                      <img
                          src="./images/collab1.png"
                          alt="Collaboration Success"
                          className="w-full max-w-[180px] object-contain"
                      />
                    </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="bg-blue-50/60 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 rounded-md p-3">
                                <p className="font-manrope text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                    Join the Justice Genie network and contribute to impactful systems. Provide your details below.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <input type="text" placeholder="Full Name" value={collabData.name}
                                    onChange={e => setCollabData({ ...collabData, name: e.target.value })} className="font-manrope text-xs sm:text-sm px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500/40" />

                                <input type="email" placeholder="Working Email" value={collabData.email}
                                    onChange={e => setCollabData({ ...collabData, email: e.target.value })} className="font-manrope text-xs sm:text-sm px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500/40" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <input type="text" placeholder="Role (e.g., Developer)" value={collabData.collaborationType}
                                    onChange={e => setCollabData({ ...collabData, collaborationType: e.target.value })} className="font-manrope text-xs sm:text-sm px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500/40" />

                                <select value={collabData.language} onChange={e => setCollabData({ ...collabData, language: e.target.value })}
                                    className="font-manrope text-xs sm:text-sm px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500/40">
                                    <option value="">Primary Language</option>
                                    {["JavaScript", "Python", "Java", "C++", "C#", "Ruby", "Swift", "Kotlin", "Go", "PHP", "TypeScript", "Rust", "Dart", "Scala", "Perl"].map(lang => (
                                        <option key={lang} value={lang}>{lang}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <input type="text" placeholder="Frameworks (React, Flask...)" value={collabData.frameworks}
                                    onChange={e => setCollabData({ ...collabData, frameworks: e.target.value })} className="font-manrope text-xs sm:text-sm px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500/40" />

                                <input type="text" placeholder="Database (MongoDB, SQL...)" value={collabData.database}
                                    onChange={e => setCollabData({ ...collabData, database: e.target.value })} className="font-manrope text-xs sm:text-sm px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500/40" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <textarea placeholder="Other Skills" value={collabData.skills}
                                    onChange={e => setCollabData({ ...collabData, skills: e.target.value })} rows={2} className="font-manrope text-xs sm:text-sm px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500/40 resize-none"></textarea>

                                <textarea placeholder="Message" value={collabData.message}
                                    onChange={e => setCollabData({ ...collabData, message: e.target.value })} rows={2} className="font-manrope text-xs sm:text-sm px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500/40 resize-none"></textarea>
                            </div>

                            <div className="flex justify-end pt-1">
                              <button onClick={handleCollabSubmit} disabled={isSubmittingCollab} className="font-manrope text-xs sm:text-sm font-semibold px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all disabled:opacity-60">
                              {isSubmittingCollab ? 'Submitting...' : 'Submit Request'}
                              </button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            <Modal
                isOpen={modals.delete}
                onClose={() => toggleModal('delete', false)}
                title="Delete Account"
            >
                <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                        <AlertTriangle size={20} className="text-red-500" />
                    </div>
                    <p className="font-poppins text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">Are you sure you want to permanently delete your account?</p>
                    <ul className="font-manrope text-[11px] text-slate-400 dark:text-slate-500 text-left list-disc list-inside space-y-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md w-full">
                        <li>Profile data and session history will be erased</li>
                        <li>Quiz scores and rankings will be removed</li>
                    </ul>
                </div>

                <div className="flex justify-end gap-2 mt-5">
                    <button
                        className="font-manrope text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        onClick={() => toggleModal('delete', false)}
                        disabled={isDeleting}
                    >
                        Cancel
                    </button>
                    <button
                        className="flex items-center gap-1.5 font-manrope text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 shadow-sm transition-all disabled:opacity-60"
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                    >
                        {isDeleting ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                    </button>
                </div>
            </Modal>

            <Modal
              isOpen={modals.help}
              onClose={() => toggleModal('help', false)}
              title="Help & Support"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-md bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20">
                  <Mail size={18} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-poppins font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100">Support Email</h4>
                    <a href="mailto:justicegenie2.0@gmail.com" className="font-manrope text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline mt-0.5 inline-block">justicegenie2.0@gmail.com</a>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                  <button
                      className="font-manrope text-xs sm:text-sm font-semibold px-4 py-1.5 rounded-md bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 transition-colors"
                      onClick={() => toggleModal('help', false)}
                  >
                      Close
                  </button>
              </div>
            </Modal>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-30 lg:hidden animate-fadeIn" onClick={() => setSidebarOpen(false)}></div>
            )}
        </div>
    );
};

export default MyAccount;