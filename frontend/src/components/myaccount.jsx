import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ArrowLeft, LogOut, Camera, Edit2, MessageSquare, Trash2, Upload, AlertTriangle, Loader, UserPlus, Trash2Icon,HelpCircle} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from "sweetalert2";
import Mailcheck from 'mailcheck';
import 'animate.css/animate.min.css'; // Import animate.css for animations
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
const ProfileImage = ({ src, onUploadClick, onRemoveClick }) => (
    <div className="relative inline-block">
      <div
        className="relative w-32 h-32 rounded-sm overflow-hidden bg-slate-100 dark:bg-slate-700 cursor-pointer group"
        onClick={onUploadClick}
      >
        <img
          src={src || "./images/user.png"}
          alt={src ? "User Profile Photo" : "Default Profile Placeholder"}
          loading="lazy"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 flex flex-col items-center justify-center gap-1 text-white opacity-0 group-hover:opacity-100 transition-all duration-200">
          <Camera size={22} />
          <span className="font-manrope text-xs">Update Photo</span>
        </div>
      </div>

      {src && src !== "./images/user.png" && (
        <button
          className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 bg-red-500 hover:bg-red-600 text-white rounded-sm p-2 shadow-md"
          onClick={onRemoveClick}
          title="Remove Photo"
        >
          <Trash2 size={16} />
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
  const overallPercentage = (totalScore / MAX_POSSIBLE_SCORE) * 100;

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-5">
      <h3 className="font-poppins font-semibold text-slate-800 dark:text-slate-100">Overall Quiz Progress</h3>

      <div className="mt-4">
        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${overallPercentage || 0}%` }}
          ></div>
        </div>

        <div className="flex justify-between mt-2 font-manrope text-sm text-slate-600 dark:text-slate-400">
          <p>Total Progress: <span className="font-semibold text-slate-800 dark:text-slate-200">{totalScore || 0} / {MAX_POSSIBLE_SCORE}</span></p>
          <p>Current Level: <span className="font-semibold text-slate-800 dark:text-slate-200">{level || 1}</span></p>
        </div>

        <div className="flex items-center flex-wrap gap-3 mt-4">
          <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-3 py-1.5 rounded-sm text-sm font-manrope font-semibold">
            {rank === 1 ? (
              <img src="./images/1stplace.png" alt="1st Place" className="w-5 h-5" />
            ) : rank === 2 ? (
              <img src="./images/2ndplace.png" alt="2nd Place" className="w-5 h-5" />
            ) : rank === 3 ? (
              <img src="./images/3rdplace.png" alt="3rd Place" className="w-5 h-5" />
            ) : (
              <span>🏆</span>
            )}
            <span>{rank ? `Rank #${rank}` : 'No Rank'}</span>
          </div>

          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-sm text-sm font-manrope font-semibold">
            🌟 <span>Total Score: {totalScore || 0}</span>
          </div>

          <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-sm text-sm font-manrope font-medium italic">
            🎮 <span>{gameName || 'Justice Warrior'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Generic modal wrapper used by every dialog below - styled once here, so
// every modal in this file gets consistent sizing/spacing automatically.
const Modal = ({ isOpen, onClose, title, children, className }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className={`bg-white dark:bg-slate-800 rounded-sm shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto ${className || ''}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="px-6 pt-6 pb-2">
                    <h3 className="font-poppins font-semibold text-lg text-slate-800 dark:text-slate-100">{title}</h3>
                </div>
                <div className="px-6 pb-6">
                  {children}
                </div>
            </div>
        </div>
    );
};

const MyAccount = () => {
    // State Management
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
  const { setAuth } = useContext(AuthContext);
//   const [feedbackStars, setFeedbackStars] = useState([0, 0, 0, 0, 0, 0]); // 5 questions + 1 overall

  useEffect(() => {
    const fetchStats = async () => {
  try {
    // ✅ Include session cookies
    const accountRes = await axios.get(
      `${process.env.REACT_APP_BACKEND_URL}/api/myaccount`,
      { withCredentials: true }
    );
    setGameName(accountRes.data.game_name);

    const leaderboardRes = await axios.get(
      `${process.env.REACT_APP_BACKEND_URL}/api/leaderboard`,
      { withCredentials: true } // 👈 include cookies here too if needed
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
            `${process.env.REACT_APP_BACKEND_URL}/api/myaccount`,
            { withCredentials: true } // 👈 important for cookies
        );
        setUserDetails(response.data);
        setLoading(false);
    } catch (error) {
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
    
    // Notification System - uses Swal's toast mode (already used elsewhere in
    // this file for confirmations), so it needs zero custom CSS to look right.
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

    // File Upload Handler
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('profile_picture', file);

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/api/update_profile_picture`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    withCredentials: true, // 👈 include session cookie
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
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Yes, remove it!',
        });
      
        if (!result.isConfirmed) return;
      
        try {
          const response = await axios.post(
            `${process.env.REACT_APP_BACKEND_URL}/api/remove_profile_picture`,
            {},
            { withCredentials: true } // 👈 include session cookie
            );

          if (response.data.message) {
            setUserDetails(prev => ({
              ...prev,
              profile_picture: "", // fallback to default
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
      
    // Profile Update Handler
    const handleUpdateProfile = async () => {
        if (!editField.username && !editField.password) {
            showNotification('Please provide new details to update', 'error');
            return;
        }

        try {
            await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/api/update_profile`,
                editField,
                { withCredentials: true } // 👈 include session cookie
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

    // Feedback Submission Handler
    useEffect(() => {
        const fetchFeedbackStatus = async () => {
           try {
            const response = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/api/get_feedback_status?email=${userDetails.email}`,
                { withCredentials: true } // 👈 include session cookie
            );

            if (response.data.submitted) {
                setFeedbackSubmitted(true);  // Show "Thank you" message
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
                `${process.env.REACT_APP_BACKEND_URL}/api/submit_feedback`,
                {
                feedbackText,
                // feedbackStars, // include stars if needed
                email: userDetails.email,
                },
                { withCredentials: true } // 👈 include session cookie
            );

            showNotification("Thanks for your feedback! 😊", "success");
            setFeedbackText('');
            // setFeedbackStars([0, 0, 0, 0, 0, 0]); // reset stars
            setFeedbackSubmitted(true); 
            toggleModal('feedback', false);
            } catch (error) {
            console.error("Error submitting feedback:", error);
            showNotification("Failed to submit feedback", "error");
            }

    };
    // Collaboration Status
    useEffect(() => {
        const fetchCollabStatus = async () => {
            try {
                console.log("Fetching collab status for:", userDetails.email);
                const response = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/api/get_collab_status`,
                {
                    params: { email: userDetails.email }, // ✅ passing email
                    withCredentials: true,               // 👈 include session cookie
                }
                );
                console.log("Collab Status Response:", response.data);
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
        // Validate required fields
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
    
        // Check if already submitted
        if (hasSubmitted) {
            showNotification("You have already submitted a collaboration request.", "info");
            return;
        }
    
        // Validate email format
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
                // Update modal content
                document.getElementById('suggestionEmail').textContent = suggestion.full;
                document.getElementById('currentEmail').textContent = collabData.email;

                // Show modal
                const modal = document.getElementById('emailModal');
                modal.classList.remove('hidden');

                // Handle Yes button click (update the email)
                document.getElementById('confirmBtn').onclick = () => {
                    // Automatically update the email input field
                    setCollabData({ ...collabData, email: suggestion.full });
                    modal.classList.add('hidden'); // Hide modal
                };

                // Handle No button click (do nothing)
                document.getElementById('cancelBtn').onclick = () => {
                    showNotification("Please correct your email before submitting.", "info");
                    modal.classList.add('hidden'); // Hide modal
                };
            },
            empty: function () {
                // If no suggestion, directly submit the email
                submitCollabData(collabData);
            }
        });
    };
    
    // Separate submission logic
    const submitCollabData = async (data) => {
        setIsSubmittingCollab(true);
    
        try {
           const response = await axios.post(
            `${process.env.REACT_APP_BACKEND_URL}/api/collab`,
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
            { withCredentials: true } // 👈 send session cookie
            );

    
            showNotification(response.data.success, "success");
    
            // Reset form
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
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/clear_chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include", // important for session cookies
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
      
      
    // Account Deletion Handler
    const [isDeleting, setIsDeleting] = useState(false); // State to track loading

    const handleDeleteAccount = async () => {
        setIsDeleting(true); // Start loading
        try {
            await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/api/delete_account`, { withCredentials: true });
    
            showNotification('Account deletion in progress...');
            
            setTimeout(() => {
                showNotification('Account deleted successfully');
                navigate('/register'); // Redirect after delay
            }, 2000);
        } catch (error) {
            console.error('Error deleting account:', error);
            showNotification('Failed to delete account', 'error');
        } finally {
            setTimeout(() => {
                setIsDeleting(false); // Stop loading after delay
            }, 2000);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/logout`, {
            method: "POST",
            credentials: "include", // important for session cookies
            });

            // Clear frontend session and localStorage
            sessionStorage.removeItem("isLoggedIn");
            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("role");
            localStorage.removeItem("darkMode");

            // ✅ Reset auth context
            setAuth({ loggedIn: false, role: null, username: null, loading: false });

            // Redirect to login page
            navigate("/login");
        } catch (err) {
            console.error("Logout failed:", err);
        }
        };

    // Loading State
    if (loading) {
        return (
          <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
            <Loader size={32} className="animate-spin text-blue-600 dark:text-blue-400" />
          </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <header className="flex items-center justify-between mb-6">
                    <button
                    className="group flex items-center gap-2 px-3 py-2 rounded-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => navigate("/chat")}
                    >
                    <ArrowLeft
                        size={20}
                        className="transition-transform duration-300 group-hover:-translate-x-1"
                    />
                    <span className="font-manrope text-sm">Back</span>
                    </button>

                    <h1 className="font-poppins font-bold text-xl text-slate-800 dark:text-slate-100">My Account</h1>

                    <button
                    onClick={handleLogout}
                    className="group flex items-center gap-2 px-3 py-2 rounded-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                    <LogOut
                        size={20}
                        className="transition-transform duration-300 group-hover:-rotate-90"
                    />
                    <span className="font-manrope text-sm">Logout</span>
                    </button>
                </header>

                {/* Main Content */}
                <div className="space-y-6">
                    {/* Profile Section */}
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-6 flex items-center gap-5">
                        <ProfileImage
                            src={userDetails.profile_picture}
                            onUploadClick={() => toggleModal('upload', true)}
                            onRemoveClick={handleRemovePicture}
                        />
                        <div>
                            <h2 className="font-poppins font-semibold text-lg text-slate-800 dark:text-slate-100">{userDetails.username}</h2>
                            <p className="font-manrope text-sm text-slate-500 dark:text-slate-400">{userDetails.email}</p>
                        </div>
                    </div>

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

                    {/* Actions Section */}
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-6">
                        {isEditing ? (
                            <div className="space-y-3 max-w-sm">
                                <input
                                    type="text"
                                    name="username"
                                    placeholder="New Username"
                                    value={editField.username}
                                    onChange={(e) => setEditField(prev => ({
                                        ...prev,
                                        username: e.target.value
                                    }))}
                                    className="w-full font-manrope text-sm px-3 py-2 rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="New Password"
                                    value={editField.password}
                                    onChange={(e) => setEditField(prev => ({
                                        ...prev,
                                        password: e.target.value
                                    }))}
                                    className="w-full font-manrope text-sm px-3 py-2 rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <div className="flex gap-2">
                                    <button
                                      className="font-manrope text-sm px-4 py-2 rounded-sm bg-blue-600 text-white hover:bg-blue-700"
                                      onClick={handleUpdateProfile}
                                    >
                                        Save Changes
                                    </button>
                                    <button
                                      className="font-manrope text-sm px-4 py-2 rounded-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                                      onClick={() => {
                                        setIsEditing(false);
                                        setEditField({ username: '', password: '' });
                                    }}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                            <button
                              className="flex items-center gap-2 font-manrope text-sm font-medium px-4 py-2 rounded-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                              onClick={() => setIsEditing(true)}
                            >
                                <Edit2 size={18} />
                                <span>Edit Profile</span>
                            </button>

                            <button
                              className="flex items-center gap-2 font-manrope text-sm font-medium px-4 py-2 rounded-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                              onClick={() => toggleModal('feedback', true)}
                            >
                                <MessageSquare size={18} />
                                <span>Give Feedback</span>
                            </button>

                            <button
                              className="flex items-center gap-2 font-manrope text-sm font-medium px-4 py-2 rounded-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                              onClick={() => toggleModal('collab', true)}
                            >
                                <UserPlus size={18} />
                                <span>Collab with Us?</span>
                            </button>

                            <button
                              className="flex items-center gap-2 font-manrope text-sm font-medium px-4 py-2 rounded-sm border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                              onClick={() => toggleModal('delete', true)}
                            >
                                <Trash2 size={18} />
                                <span>Delete Account</span>
                            </button>

                            <button
                              className="flex items-center gap-2 font-manrope text-sm font-medium px-4 py-2 rounded-sm border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                              onClick={handleClearChat}
                            >
                                <Trash2Icon size={18} />
                                <span>Clear Chat History</span>
                            </button>

                            <button
                              className="flex items-center gap-2 font-manrope text-sm font-medium px-4 py-2 rounded-sm bg-blue-600 text-white hover:bg-blue-700"
                              onClick={() => toggleModal('help', true)}
                            >
                                <HelpCircle size={18} />
                                <span>Help & Support</span>
                            </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Upload Photo Modal */}
                <Modal
                    isOpen={modals.upload}
                    onClose={() => toggleModal('upload', false)}
                    title="Update Profile Picture"
                >
                    <div className="space-y-3">
                        <div className="relative flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-sm py-10 text-slate-500 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-500/50">
                            <Upload size={28} />
                            <p className="font-manrope text-sm">Click to upload or drag and drop</p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </div>
                        {uploadProgress > 0 && (
                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-600 transition-all duration-200"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                                <span className="font-manrope text-xs text-slate-500 dark:text-slate-400">{uploadProgress}%</span>
                            </div>
                        )}
                    </div>
                </Modal>

                {/* Feedback Modal */}
                <Modal
                    isOpen={modals.feedback}
                    onClose={() => toggleModal('feedback', false)}
                    title="Share Your Feedback"
                >
                    {feedbackSubmitted ? (
                        <div className="flex flex-col items-center justify-center p-4">
                            <img
                                src="/images/ThankyouFeedback.png"
                                alt="Thank you"
                                className="w-64 max-w-full h-auto"
                            />
                        </div>
                    ) : (
                        <>
                            <textarea
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                placeholder="We value your thoughts and suggestions..."
                                rows={4}
                                className="w-full font-manrope text-sm px-3 py-2 rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                            <div className="flex gap-2 mt-4">
                                <button
                                    className="font-manrope text-sm px-4 py-2 rounded-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                                    onClick={handleFeedbackSubmit}
                                    disabled={!feedbackText.trim()}
                                >
                                    Submit Feedback
                                </button>
                                <button
                                    className="font-manrope text-sm px-4 py-2 rounded-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                                    onClick={() => {
                                        toggleModal('feedback', false);
                                        setFeedbackText('');
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    )}
                </Modal>

                {/* Collaboration Modal */}
                <Modal
                    isOpen={modals.collab}
                    onClose={() => toggleModal('collab', false)}
                    title="Collaboration Request"
                    className="max-w-2xl"
                >
                <div id="emailModal" className="fixed inset-0 flex items-center justify-center z-[60] hidden bg-black/50">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-sm shadow-lg max-w-md w-full mx-4">
                        <h2 className="font-poppins text-base font-semibold mb-3 text-slate-800 dark:text-slate-100">
                        Did you mean
                        <span id="suggestionEmail" className="font-bold text-blue-600 mx-1"></span>
                        instead of
                        <span id="currentEmail" className="font-bold text-red-500 mx-1"></span>?
                        </h2>

                        <p className="font-manrope text-sm mb-4 text-slate-600 dark:text-slate-400">
                        Click <strong>Yes</strong> to use the suggested email or <strong>No</strong> to keep your email.
                        </p>

                        <div className="flex justify-end gap-2">
                        <button id="confirmBtn" className="font-manrope text-sm bg-blue-600 text-white px-4 py-2 rounded-sm hover:bg-blue-700">Yes</button>
                        <button id="cancelBtn" className="font-manrope text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-sm hover:bg-slate-300 dark:hover:bg-slate-600">No</button>
                        </div>
                    </div>
                </div>
                    <div>
                    {hasSubmitted ? (
                       <div className="flex flex-col items-center justify-center my-4 text-center">
                        <p className="font-manrope text-sm text-slate-600 dark:text-slate-300 mb-4">
                            🚀 <strong className="font-semibold">You made the right move!</strong>
                            Your collaboration request has been submitted successfully.
                            Our team is reviewing your details and will reach out via email once we verify your status and needs.
                            Excited to build something incredible together! 🌟
                        </p>

                        <img
                            src="./images/collab1.png"
                            alt="Collaboration Success"
                            className="w-full max-w-xs object-contain"
                        />
                        </div>
                        ) : (
                            <>
                           <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-sm p-4 mb-4">

                                <h2 className="font-poppins font-semibold text-indigo-700 dark:text-indigo-400 mb-2">
                                    🤝 Ready to Collaborate?
                                </h2>

                                <p className="font-manrope text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                    Interested in working on real-world, impactful projects? Fill out the form, and we'll reach out via email—<strong className="font-semibold">make sure to provide a correct email address</strong>.
                                    <br /><br />
                                    <strong className="font-semibold">✨ Join us</strong> to gain experience, recognition, and help shape the future of impactful projects.
                                    <br /><br />
                                    <span className="text-red-600 dark:text-red-400 font-medium">Note:</span> Deleting your account will remove your collaboration request permanently.
                                </p>
                            </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                    <input type="text" placeholder="Full Name" value={collabData.name}
                                        onChange={e => setCollabData({ ...collabData, name: e.target.value })} className="font-manrope text-sm px-3 py-2 rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />

                                    <input type="email" placeholder="Working Email" value={collabData.email}
                                        onChange={e => setCollabData({ ...collabData, email: e.target.value })} className="font-manrope text-sm px-3 py-2 rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                    <input type="text" placeholder="Collaboration Type e.g., Developer, Legal Expert, Content Creator" value={collabData.collaborationType}
                                        onChange={e => setCollabData({ ...collabData, collaborationType: e.target.value })} className="font-manrope text-sm px-3 py-2 rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />

                                    <select value={collabData.language} onChange={e => setCollabData({ ...collabData, language: e.target.value })}
                                        className="font-manrope text-sm px-3 py-2 rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="">Select a Programming Language</option>
                                        {["JavaScript", "Python", "Java", "C++", "C#", "Ruby", "Swift", "Kotlin", "Go", "PHP", "TypeScript", "Rust", "Dart", "Scala", "Perl"].map(lang => (
                                            <option key={lang} value={lang}>{lang}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                    <input type="text" placeholder="Frameworks: ReactJS,Flask..." value={collabData.frameworks}
                                        onChange={e => setCollabData({ ...collabData, frameworks: e.target.value })} className="font-manrope text-sm px-3 py-2 rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />

                                    <input type="text" placeholder="Database: MongoDB,SQL.. (Optional)" value={collabData.database}
                                        onChange={e => setCollabData({ ...collabData, database: e.target.value })} className="font-manrope text-sm px-3 py-2 rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                    <textarea placeholder="Other Skills Communication,MachineLearning (Optional)" value={collabData.skills}
                                        onChange={e => setCollabData({ ...collabData, skills: e.target.value })} rows={3} className="font-manrope text-sm px-3 py-2 rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea>

                                    <textarea placeholder="Message" value={collabData.message}
                                        onChange={e => setCollabData({ ...collabData, message: e.target.value })} rows={3} className="font-manrope text-sm px-3 py-2 rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
                                </div>

                                <div className="flex justify-end">
                                <button onClick={handleCollabSubmit} disabled={isSubmittingCollab} className="font-manrope text-sm px-4 py-2 rounded-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
                            {isSubmittingCollab ? (
                                <span className="flex items-center gap-2">
                                <svg
                                    className="animate-spin h-4 w-4"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    />
                                    <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                    />
                                </svg>
                                Submitting...
                                </span>
                            ) : (
                                'Submit Request'
                            )}
                            </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Creator Credits */}
                    <div className="font-manrope text-xs text-slate-400 dark:text-slate-500 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                        <p>Developed by <strong>Subhash Yaganti</strong> & <strong>Siri Mahalaxmi Vemula</strong></p>
                        <p className="mt-1 space-x-2">
                            <a href="https://www.linkedin.com/in/subhash-yaganti-a8b3b626a/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">LinkedIn</a>
                            <span>|</span>
                            <a href="https://github.com/subhash-22-codes" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">GitHub</a>
                        </p>
                    </div>
                </Modal>

                {/* Delete Account Modal */}
                <Modal
                    isOpen={modals.delete}
                    onClose={() => toggleModal('delete', false)}
                    title="Delete Account"
                >
                    <div className="flex flex-col items-center text-center gap-2">
                        <AlertTriangle size={30} className="text-red-500" />
                        <p className="font-poppins text-sm text-slate-700 dark:text-slate-200">Are you sure you want to delete your account? This action cannot be undone.</p>
                        <ul className="font-manrope text-xs text-slate-500 dark:text-slate-400 text-left list-disc list-inside space-y-1 mt-2">
                            <li>Your profile and personal data will be permanently deleted</li>
                            <li>All your quiz progress will be lost</li>
                            <li>You won't be able to recover your account</li>
                        </ul>
                    </div>

                    {isDeleting && (
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mt-4">
                            <div className="h-full bg-red-500 animate-pulse w-full"></div>
                        </div>
                    )}

                    <div className="flex justify-center gap-2 mt-5">
                        <button
                            className="flex items-center gap-2 font-manrope text-sm px-4 py-2 rounded-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                            onClick={handleDeleteAccount}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader size={16} className="animate-spin" /> Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 size={16} /> Delete Account
                                </>
                            )}
                        </button>

                        <button
                            className="font-manrope text-sm px-4 py-2 rounded-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-60"
                            onClick={() => toggleModal('delete', false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </button>
                    </div>
                </Modal>

                {/* Help & Support Modal */}
                <Modal
                isOpen={modals.help}
                onClose={() => toggleModal('help', false)}
                title="Help & Support"
                >
                <div className="flex flex-col items-center text-center mb-4">
                        <img
                            src="https://cdn-icons-png.flaticon.com/512/5726/5726470.png"
                            alt="Help Icon"
                            className="w-8 h-8 mb-3"
                            />

                    <p className="font-poppins text-sm text-slate-600 dark:text-slate-300 mb-4">
                    If you're facing any issues or have questions, we're here to help!
                    </p>

                    <ul className="font-manrope text-sm text-slate-500 dark:text-slate-400 text-left space-y-2">
                    <li>📧 Email us: <a href="mailto:justicegenie2.0@gmail.com" className="text-blue-600 hover:underline">justicegenie2.0@gmail.com</a></li>
                    <li>📚 Read our FAQ (Coming Soon)</li>
                    <li>🔧 For urgent issues, contact the admin panel</li>
                    </ul>
                </div>

                <div className="flex justify-center">
                <button
                    className="font-manrope text-sm px-4 py-2 rounded-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    onClick={() => toggleModal('help', false)}
                    >
                    Close
                    </button>
                </div>
                </Modal>

            </div>
        </div>
    );
};

export default MyAccount;