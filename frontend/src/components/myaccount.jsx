import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ArrowLeft, LogOut, Camera, Edit2, MessageSquare, Trash2, Upload, AlertTriangle, Loader, UserPlus, Trash2Icon,HelpCircle} from 'lucide-react';
import '../styles/my_account.css';
import { useNavigate } from 'react-router-dom';
import Swal from "sweetalert2";
import Mailcheck from 'mailcheck';
// Component for Profile Image Section
import 'animate.css/animate.min.css'; // Import animate.css for animations
const ProfileImage = ({ src, onUploadClick, onRemoveClick }) => (
    <div className="myaccount-profile-image-wrapper relative">
      <div className="myaccount-profile-image-container" onClick={onUploadClick}>
        <img
          src={src || "./images/user.png"}
          alt={src ? "User Profile Photo" : "Default Profile Placeholder"}
          loading="lazy"
          className="myaccount-profile-image"
        />
        <div className="myaccount-profile-image-overlay">
          <Camera size={24} />
          <span>Update Photo</span>
        </div>
      </div>
  
      {/* 🔴 Circle Trash Icon — SouthEast Placement */}
      {src && src !== "./images/user.png" && (
        <button
          className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 
          myaccount-remove-profile-picture bg-red-500 hover:bg-red-600 
          text-white rounded-full p-2 md:p-2.5 transition-all duration-300 shadow-md"
          onClick={onRemoveClick}
          title="Remove Photo"
        >
          <Trash2 size={16} className="md:size-5 size-4" />
        </button>
      )}
  
      <div className="myaccount-profile-image-ring"></div>
    </div>
  );
  
  ProfileImage.defaultProps = {
    src: "./images/user.png",
    onUploadClick: () => {},
    onRemoveClick: () => {},
  };
  
  

// Component for Progress Bar
const ProgressBar = ({ percentage, marks, total, level, rank, gameName }) => (
    <div className="myaccount-progress-card">
      <h3>Quiz Progress</h3>
      <div className="myaccount-progress-stats">
        <div className="myaccount-progress-bar-container">
          <div className="myaccount-progress-bar" style={{ width: `${percentage}%` }}>
            <div className="myaccount-progress-glow"></div>
          </div>
        </div>
  
        <div className="myaccount-progress-details">
          <p>Score: <span>{marks}/{total}</span></p>
          <p>Level: <span>{level}</span></p>
        </div>
  
        {/* 🎯 Rank & Game Name UI */}
        <div className="quizz-game-rank flex items-center gap-4 mt-4 bg-white p-4 rounded-xl shadow-sm border w-fit">
          {/* Rank with badge */}
          <div className="quizz-rank flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold">
            {rank === 1 ? (
              <img src="./images/1stplace.png" alt="1st Place" className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : rank === 2 ? (
              <img src="./images/2ndplace.png" alt="2nd Place" className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : rank === 3 ? (
              <img src="./images/3rdplace.png" alt="3rd Place" className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <span className="quizz-rank-icon text-lg">🏆</span>
            )}
            <span className="quizz-rank-number">
              {rank ? `Rank #${rank}` : 'Rank --'}
            </span>
          </div>
  
          {/* Game Name Tag */}
          <div className="quizz-game-name flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium italic">
            🎮
            <span className="quizz-game-name-text">
              {gameName || 'Justice warrior'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
  

// Component for Modal
const Modal = ({ isOpen, onClose, title, children, className }) => {
    if (!isOpen) return null;

    return (
        <div className="myaccount-modal-overlay" onClick={onClose}>
            <div className={`myaccount-modal-content ${className}`} onClick={e => e.stopPropagation()}>
                <div className="myaccount-modal-header">
                    <h3>{title}</h3>
                </div>
                {children}
            </div>
        </div>
    );
};

const MyAccount = () => {
    // State Management
    const [userDetails, setUserDetails] = useState({});
    const [quizProgress, setQuizProgress] = useState({
        marks: 0,
        total: 100,
        percentage: 0,
        level: 'Beginner'
    });
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
//   const [feedbackStars, setFeedbackStars] = useState([0, 0, 0, 0, 0, 0]); // 5 questions + 1 overall

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const accountRes = await axios.get('/api/myaccount');
        setGameName(accountRes.data.game_name);

        const leaderboardRes = await axios.get('/api/leaderboard');
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
            const response = await axios.get('/api/myaccount');
            setUserDetails(response.data);
            setQuizProgress(response.data.quiz_progress || {});
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
    
    // Notification System
    const showNotification = (message, type = 'success') => {
        const notification = document.createElement('div');
        notification.className = `myaccount-notification myaccount-notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    };

    // File Upload Handler
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('profile_picture', file);

        try {
            const response = await axios.post('/api/update_profile_picture', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(progress);
                }
            });

            setUserDetails(prev => ({
                ...prev,
                profile_picture: response.data.file_path
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
          const response = await axios.post('/api/remove_profile_picture');
          if (response.data.message) {
            setUserDetails(prev => ({
              ...prev,
              profile_picture: "", // fallback to default
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
            await axios.post('/api/update_profile', editField);
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
                const response = await axios.get(`/api/get_feedback_status?email=${userDetails.email}`);
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
            await axios.post('/api/submit_feedback', {
                feedbackText,
                // feedbackStars, // include stars in the submission
                email: userDetails.email,
            });
    
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
    

    // const handleStarClick = (questionIndex, rating) => {
    //     const updatedStars = [...feedbackStars];
    //     updatedStars[questionIndex] = rating;
    //     setFeedbackStars(updatedStars);
    // };
    

    // Collaboration Status
    useEffect(() => {
        const fetchCollabStatus = async () => {
            try {
                console.log("Fetching collab status for:", userDetails.email);
                const response = await axios.get('/api/get_collab_status', {
                    params: { email: userDetails.email } // ✅ passing email
                });
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
            const response = await axios.post('/api/collab', {
                name: data.name,
                email: data.email,
                collaborationType: data.collaborationType,
                message: data.message,
                language: data.language,
                frameworks: data.frameworks || "Not specified",
                database: data.database || "Not specified",
                skills: data.skills || "Not specified"
            });
    
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
            customClass: {
              popup: 'myaccount-clear-chat-swal-popup',
              title: 'myaccount-clear-chat-swal-title-error',
              htmlContainer: 'myaccount-clear-chat-swal-text',
              confirmButton: 'myaccount-clear-chat-swal-btn myaccount-clear-chat-swal-btn-red',
            },
            buttonsStyling: false
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
          customClass: {
            popup: 'myaccount-clear-chat-swal-popup',
            title: 'myaccount-clear-chat-swal-title',
            htmlContainer: 'myaccount-clear-chat-swal-text',
            confirmButton: 'myaccount-clear-chat-swal-btn myaccount-clear-chat-swal-btn-red',
            cancelButton: 'myaccount-clear-chat-swal-btn myaccount-clear-chat-swal-btn-gray'
          },
          buttonsStyling: false
        });
      
        if (!confirmation.isConfirmed) return;
      
        try {
          const response = await fetch("/api/clear_chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: userDetails.username }),
          });
      
          const data = await response.json();
      
          Swal.fire({
            title: "Deleted!",
            text: data.message,
            icon: "success",
            customClass: {
              popup: 'myaccount-clear-chat-swal-popup-1',
              title: 'myaccount-clear-chat-swal-title-success',
              htmlContainer: 'myaccount-clear-chat-swal-text',
              confirmButton: 'myaccount-clear-chat-swal-btn myaccount-clear-chat-swal-btn-green',
            },
            buttonsStyling: false
          });
      
          sessionStorage.removeItem("session_id");
          localStorage.removeItem("chat_messages");
          window.dispatchEvent(new Event("chatHistoryClear"));
      
        } catch (error) {
          console.error("Error clearing chat history:", error);
          Swal.fire({
            title: "Error!",
            text: "Failed to clear chat history. Please try again.",
            icon: "error",
            customClass: {
              popup: 'myaccount-clear-chat-swal-popup',
              title: 'myaccount-clear-chat-swal-title-error',
              htmlContainer: 'myaccount-clear-chat-swal-text',
              confirmButton: 'myaccount-clear-chat-swal-btn myaccount-clear-chat-swal-btn-red',
            },
            buttonsStyling: false
          });
        }
      };
      
      
    // Account Deletion Handler
    const [isDeleting, setIsDeleting] = useState(false); // State to track loading

    const handleDeleteAccount = async () => {
        setIsDeleting(true); // Start loading
        try {
            await axios.delete('/api/delete_account', { withCredentials: true });
    
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
          await fetch("/api/logout", {
            method: "POST",
            credentials: "include", // important for session cookies
          });
      
          // 🔥 Clear sessionStorage for frontend route protection
          sessionStorage.removeItem("isLoggedIn");
          navigate("/login");
        } catch (err) {
          console.error("Logout failed:", err);
        }
      };
      


    // Loading State
    if (loading) {
        return <div className="myaccount-loading-container"><div className="myaccount-loading-spinner" /></div>;
    }

    return (
        <div className="myaccount-wrapper">
            <div className="myaccount-container">
                {/* Header */}
                <header className="myaccount-header">
                    <button
                    className="myaccount-btn-back group relative overflow-hidden transition-transform duration-300 hover:scale-105 active:scale-95"
                    onClick={() => navigate("/chat")}
                    >
                    <ArrowLeft
                        size={20}
                        className="transition-transform duration-300 group-hover:-translate-x-1"
                    />
                    <span className="tracking-wide">Back</span>
                    </button>

                    <h1>My Account</h1>
                    <button
                    onClick={handleLogout}
                    className="myaccount-btn-logout group relative overflow-hidden transition-transform duration-300 hover:scale-105 active:scale-95"
                    >
                    <LogOut
                        size={20}
                        className="transition-transform duration-300 group-hover:-rotate-90"
                    />
                    <span className="tracking-wide">Logout</span>
                    </button>


                </header>

                {/* Main Content */}
                <div className="myaccount-layout">
                    {/* Profile Section */}
                    <div className="myaccount-profile-card">
                        <ProfileImage
                            src={userDetails.profile_picture}
                            onUploadClick={() => toggleModal('upload', true)}
                            onRemoveClick={handleRemovePicture}
                        />
                        <div className="myaccount-profile-info">
                            <h2>{userDetails.username}</h2>
                            <p className="myaccount-user-email">{userDetails.email}</p>
                        </div>
                    </div>

                    {/* Progress Section */}
                    <ProgressBar
                        {...quizProgress}
                        rank={rank}
                        gameName={gameName}
                        />



                    {/* Actions Section */}
                    <div className="myaccount-actions">
                        {isEditing ? (
                            <div className="myaccount-edit-form">
                                <input
                                    type="text"
                                    name="username"
                                    placeholder="New Username"
                                    value={editField.username}
                                    onChange={(e) => setEditField(prev => ({
                                        ...prev,
                                        username: e.target.value
                                    }))}
                                    className="myaccount-edit-input"
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
                                    className="myaccount-edit-input"
                                />
                                <div className="myaccount-edit-buttons">
                                    <button className="myaccount-btn-save" onClick={handleUpdateProfile}>
                                        Save Changes
                                    </button>
                                    <button className="myaccount-btn-cancel" onClick={() => {
                                        setIsEditing(false);
                                        setEditField({ username: '', password: '' });
                                    }}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="myaccount-button-group">
                            <button className="myaccount-btn-edit text-sm sm:text-base font-medium" onClick={() => setIsEditing(true)}>
                        <Edit2 size={20} />
                        <span>Edit Profile</span>
                        </button>

                        <button className="myaccount-btn-feedback text-sm sm:text-base font-medium" onClick={() => toggleModal('feedback', true)}>
                        <MessageSquare size={20} />
                        <span>Give Feedback</span>
                        </button>

                        <button className="myaccount-btn-collab text-sm sm:text-base font-medium" onClick={() => toggleModal('collab', true)}>
                        <UserPlus size={20} />
                        <span>Collab with Us?</span>
                        </button>

                        <button className="myaccount-btn-delete text-sm sm:text-base font-medium" onClick={() => toggleModal('delete', true)}>
                        <Trash2 size={20} />
                        <span>Delete Account</span>
                        </button>

                        <button className="myaccount-btn-delete text-sm sm:text-base font-medium" onClick={handleClearChat}>
                        <Trash2Icon size={20} />
                        <span>Clear Chat History</span>
                        </button>

                        <button
                        className="myaccount-helpandsupport-button flex items-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-indigo-500 text-white rounded-lg shadow-md hover:bg-indigo-600 transition-all duration-300"
                        onClick={() => toggleModal('help', true)}
                        >
                        <HelpCircle size={18} className="sm:w-5 sm:h-5" />
                        <span>Help & Support</span>
                        </button>


                        </div>
                        
                        )}
                    </div>
                </div>

                {/* Modals */}
                <Modal
                    isOpen={modals.upload}
                    onClose={() => toggleModal('upload', false)}
                    title="Update Profile Picture"
                    className="myaccount-upload-modal"
                >
                    <div className="myaccount-upload-area">
                        <div className="myaccount-upload-dropzone">
                            <Upload size={32} />
                            <p>Click to upload or drag and drop</p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="myaccount-file-input"
                            />
                        </div>
                        {uploadProgress > 0 && (
                            <div className="myaccount-upload-progress">
                                <div
                                    className="myaccount-upload-progress-bar"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                                <span>{uploadProgress}%</span>
                            </div>
                        )}
                    </div>
                </Modal>
                
                <Modal
                    isOpen={modals.feedback}
                    onClose={() => toggleModal('feedback', false)}
                    title="Share Your Feedback"
                    className="w-[90%] sm:w-full max-w-[600px] mx-auto p-4 sm:p-6 md:p-8 bg-gray-50 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] overflow-hidden box-border"
                >
                    {feedbackSubmitted ? (
                        <div className="flex flex-col items-center justify-center p-4">
                            <img
                                src="/images/ThankyouFeedback.png"
                                alt="Thank you"
                                className="w-72 sm:w-80 md:w-96 max-w-full h-auto"
                            />
                        </div>
                    ) : (
                        <>
                            <textarea
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                placeholder="We value your thoughts and suggestions..."
                                className="myaccount-feedback-input"
                            />
                            <div className="myaccount-modal-actions">
                                <button
                                    className="myaccount-btn-submit"
                                    onClick={handleFeedbackSubmit}
                                    disabled={!feedbackText.trim()}
                                >
                                    Submit Feedback
                                </button>
                                <button
                                    className="myaccount-feedback-btn-cancel"
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



                <Modal 
                    isOpen={modals.collab} 
                    onClose={() => toggleModal('collab', false)} 
                    title="Collaboration Request"
                    className="myaccount-collab-modal"

                >
                <div id="emailModal" className="fixed inset-0 flex items-center justify-center z-50 hidden bg-gray-800 bg-opacity-50">
                    <div className="myaccount-swal-type bg-white p-4 sm:p-6 rounded-lg shadow-lg max-w-xs sm:max-w-md md:max-w-lg w-full">
                        <h2 className="text-base sm:text-lg md:text-lg font-semibold mb-4">
                            Did you mean <span id="suggestionEmail" className="font-bold text-blue-500"></span> instead of <span id="currentEmail" className="font-bold text-red-500"></span>?
                        </h2>
                        <p className="text-sm sm:text-base md:text-sm mb-4 text-gray-600">
                            Click <strong>Yes</strong> to use the suggested email or <strong>No</strong> to keep your email.
                        </p>
                        <div className="flex justify-end gap-2 sm:gap-4">
                            <button id="confirmBtn" className="myaccount-swal-type-button bg-blue-500 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-md hover:bg-blue-600">Yes</button>
                            <button id="cancelBtn" className="myaccount-swal-type-button bg-gray-500 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-md hover:bg-gray-600">No</button>
                        </div>
                    </div>
                </div>
                    <div className="myaccount-collab-form">
                    {hasSubmitted ? (
                        <div className="flex flex-col items-center justify-center my-6 px-4 text-center">
                            <p className="text-base sm:text-lg font-medium text-gray-700 max-w-xl mb-4">
                            🚀 <strong>You made the right move!</strong> Your collaboration request has been submitted successfully.  
                            Our team is reviewing your details and will reach out via email once we verify your status and needs.  
                            Excited to build something incredible together! 🌟
                            </p>
                            <img
                            src="./images/collab1.png"
                            alt="Collaboration Success"
                            className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg object-contain"
                            />
                        </div>
                        ) : (
                            <>
                                <div className="myaccount-collab-invite from-purple-50 to-indigo-50 border border-indigo-200 rounded-2xl p-4 mb-6 shadow-sm">
                                <h2 className="text-base sm:text-lg md:text-xl lg:text-xl font-semibold text-indigo-700 mb-2 text-center sm:text-left">
                                🤝 Ready to Collaborate?
                                </h2>

                            <p className="text-gray-700 text-base leading-relaxed">
                            Interested in working on real-world, impactful projects? Fill out the form, and we’ll reach out via email—<strong>make sure to provide a correct email address</strong>.
                                <br /><br />
                                <strong>✨ Join us</strong> to gain experience, recognition, and help shape the future of <strong>impactful projects</strong>.
                                <br /><br />
                                <span className="text-red-600 font-medium">Note:</span> Deleting your account will remove your collaboration request permanently.
                            </p>
                            </div>

                                <div className="myaccount-collab-row">
                                    <input type="text" placeholder="Full Name" value={collabData.name} 
                                        onChange={e => setCollabData({ ...collabData, name: e.target.value })} className="myaccount-collab-input" />
                                    
                                    <input type="email" placeholder="Working Email" value={collabData.email} 
                                        onChange={e => setCollabData({ ...collabData, email: e.target.value })} className="myaccount-collab-input" />
                                </div>

                                <div className="myaccount-collab-row">
                                    <input type="text" placeholder="Collaboration Type e.g., Developer, Legal Expert, Content Creator" value={collabData.collaborationType} 
                                        onChange={e => setCollabData({ ...collabData, collaborationType: e.target.value })} className="myaccount-collab-input" />
                                    
                                    <select value={collabData.language} onChange={e => setCollabData({ ...collabData, language: e.target.value })} 
                                        className="myaccount-collab-dropdown">
                                        <option value="">Select a Programming Language</option>
                                        {["JavaScript", "Python", "Java", "C++", "C#", "Ruby", "Swift", "Kotlin", "Go", "PHP", "TypeScript", "Rust", "Dart", "Scala", "Perl"].map(lang => (
                                            <option key={lang} value={lang}>{lang}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="myaccount-collab-row">
                                    <input type="text" placeholder="Frameworks: ReactJS,Flask..." value={collabData.frameworks} 
                                        onChange={e => setCollabData({ ...collabData, frameworks: e.target.value })} className="myaccount-collab-input" />
                                    
                                    <input type="text" placeholder="Database: MongoDB,SQL.. (Optional)" value={collabData.database} 
                                        onChange={e => setCollabData({ ...collabData, database: e.target.value })} className="myaccount-collab-input" />
                                </div>

                                <div className="myaccount-collab-row">
                                    <input type="text" placeholder="Other Skills Communication,MachineLearning (Optional)" value={collabData.skills} 
                                        onChange={e => setCollabData({ ...collabData, skills: e.target.value })} className="myaccount-collab-input" />
                                    
                                    <textarea placeholder="Message" value={collabData.message} 
                                        onChange={e => setCollabData({ ...collabData, message: e.target.value })} className="myaccount-collab-textarea"></textarea>
                                </div>

                                <div className="myaccount-collab-modal-actions">
                                <button onClick={handleCollabSubmit} disabled={isSubmittingCollab} className="myaccount-collab-submit-button">
                            {isSubmittingCollab ? (
                                <span className="flex items-center gap-2 text-white">
                                <svg
                                    className="animate-spin h-5 w-5"
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
                    <div className="myaccount-collab-credits">
                        <p>Developed by <strong>Subhash Yaganti</strong> & <strong>Vemula Siri Mahalaxmi</strong></p>
                        <p>
                            <a href="https://www.linkedin.com/in/subhash-yaganti-a8b3b626a/" target="_blank" rel="noopener noreferrer">LinkedIn</a> | 
                            <a href="https://github.com/subhash-22-codes" target="_blank" rel="noopener noreferrer">GitHub</a>
                        </p>
                    </div>
                </Modal>

                <Modal
                    isOpen={modals.delete}
                    onClose={() => toggleModal('delete', false)}
                    title="Delete Account"
                    className="myaccount-delete-modal"
                >
                    <div className="myaccount-delete-modal-content">
                        <AlertTriangle size={32} className="myaccount-delete-warning-icon" />
                        <p>Are you sure you want to delete your account? This action cannot be undone.</p>
                        <ul className="myaccount-delete-consequences">
                            <li>Your profile and personal data will be permanently deleted</li>
                            <li>All your quiz progress will be lost</li>
                            <li>You won't be able to recover your account</li>
                            
                        </ul>
                    </div>

                    {isDeleting && (
                        <div className="myaccount-delete-progress-bar">
                            <div className="myaccount-delete-progress-fill"></div>
                        </div>
                    )}

                    <div className="myaccount-modal-actions">
                        <button 
                            className="myaccount-delete-btn-confirm" 
                            onClick={handleDeleteAccount} 
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader size={18} className="myaccount-loading-icon" /> Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 size={18} /> Delete Account
                                </>
                            )}
                        </button>

                        <button 
                            className="myaccount-delete-btn-cancel" 
                            onClick={() => toggleModal('delete', false)} 
                            disabled={isDeleting}
                        >
                            Cancel
                        </button>
                    </div>
                </Modal>
                <Modal
                isOpen={modals.help}
                onClose={() => toggleModal('help', false)}
                title="Help & Support"
                className="myaccount-helpandsupport-modal bg-white p-4 sm:p-6 rounded-xl shadow-xl w-[90%] sm:w-full max-w-sm sm:max-w-md"

                >
                <div className="myaccount-helpandsupport-content flex flex-col items-center text-center mb-4">
                        <img 
                            src="https://cdn-icons-png.flaticon.com/512/5726/5726470.png" 
                            alt="Help Icon"
                            className="myaccount-helpandsupport-icon w-8 h-8 mb-3"
                            />

                    <p className="myaccount-helpandsupport-text text-gray-700 mb-4 text-sm">
                    If you're facing any issues or have questions, we're here to help!
                    </p>

                    <ul className="myaccount-helpandsupport-options text-left text-sm text-gray-600 space-y-2">
                    <li>📧 Email us: <a href="mailto:justicegenie2.0@gmail.com" className="text-blue-600">justicegenie2.0@gmail.com</a></li>
                    <li>📚 Read our FAQ (Coming Soon)</li>
                    <li>🔧 For urgent issues, contact the admin panel</li>
                    </ul>
                </div>

                <div className="myaccount-helpandsupport-actions mt-4 flex justify-center">
                <button
                    className="myaccount-helpandsupport-btn-close bg-gray-200 text-gray-800 text-sm sm:text-base px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-gray-300 transition-all duration-200"
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