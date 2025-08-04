import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, Moon, Sun, Trash2, LogOut, MessageSquare, 
  User, FileText, Zap, Loader, Scale, 
  BookOpen, Download, AlertCircle, Menu,Clipboard,ThumbsDown,ThumbsUp,Globe,Mic,BarChart,XCircle,RotateCcw,MicOff,Volume2,SquareDotIcon,Check
} from 'lucide-react';
import '../styles/chat.css';
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Chart from "chart.js/auto";
import { Link } from 'react-router-dom';
import { Modal } from "antd";
const Chat = () => {
  const [messages, setMessages] = useState([]); // Removed localStorage
  const [input, setInput] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [username, setUsername] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const chatBoxRef = useRef(null);
  const inputRef = useRef(null);
  const [feedback, setFeedback] = useState(null);
  const navigate = useNavigate();
  const [loadingMessage, setLoadingMessage] = useState('Analyzing your query...');
  const menuRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [popupMessageId, setPopupMessageId] = useState(null);
  const [activeTranslateMessageId, setActiveTranslateMessageId] = useState(null);
  const [loadingTranslation, setLoadingTranslation] = useState(null);
  const [currentMessageId, setCurrentMessageId] = useState(null);
  const [cancelled, setCancelled] = useState(false); 

  const [copied, setCopied] = useState(false);
  const [isListening, setIsListening] = useState(false);
  // let controller = new AbortController(); // To cancel fetch if stopped

  const recognitionRef = useRef(null); // Store recognition instance

 
  const handleMicClick = () => {
    if (isListening) {
      recognitionRef.current?.stop(); // Stop when clicking again
      setIsListening(false);
      return;
    }

    // Initialize Speech Recognition
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true; // Keeps listening after short pauses
    recognition.interimResults = true; // Show words as they are spoken
    recognition.lang = "en-US"; // Set language

    let finalTranscript = ""; // Stores final recognized text

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " "; // Store final words
        } else {
          interimTranscript = result[0].transcript; // Show temporary words
        }
      }

      setInput(finalTranscript + interimTranscript); // Merge final & live text
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.start();
  };

  const [speakingMessageId, setSpeakingMessageId] = useState(null); // 🔹 Track which message is speaking

  const isMobile = /Mobi|Android/i.test(navigator.userAgent); // 🔹 Detect mobile device
  
  const stripHTML = (html) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };
  
  const speakText = async (text, messageId) => {
    try {
      setSpeakingMessageId(messageId); // 🔹 Track only the clicked message
      
      const cleanText = stripHTML(text); // 🔹 Remove HTML tags
  
      if (isMobile) {
        // 🔹 Use browser's built-in speech synthesis for mobile
        const speech = new SpeechSynthesisUtterance(cleanText);
        speech.lang = "en-US";
        speech.rate = 1.0; // 🔹 Normal speed for clarity
        speech.pitch = 1.1; // 🔹 Slightly increased pitch for better pronunciation
        speech.volume = 1.0; // 🔹 Ensure full volume
  
        speech.onend = () => setSpeakingMessageId(null); // 🔹 Reset when speech ends
        speech.onerror = () => setSpeakingMessageId(null); // 🔹 Reset on error
  
        speechSynthesis.speak(speech);
      } else {
        // 🔹 Call backend API for desktop TTS
        const response = await fetch("/api/text-to-speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: cleanText, rate: 150 }),
        });
  
        if (!response.ok) {
          throw new Error("Failed to start speech on the server");
        }
      }
    } catch (error) {
      console.error("Error playing speech:", error);
      setSpeakingMessageId(null); // 🔹 Reset state on error
    }
  };
  
  const stopSpeech = async () => {
    try {
      if (isMobile) {
        // 🔹 Stop speech for mobile browsers
        speechSynthesis.cancel();
      } else {
        // 🔹 Call backend API to stop speech for desktop
        const response = await fetch("/api/stop-speech", { method: "POST" });
        if (!response.ok) {
          throw new Error("Failed to stop speech on the server");
        }
      }
    } catch (error) {
      console.error("Error stopping speech:", error);
    } finally {
      setSpeakingMessageId(null); // 🔹 Ensure state resets
    }
  };
  
  
  const languages = [
    { name: "English", code: "en", native: "English" },
    { name: "Telugu", code: "te", native: "తెలుగు" },
    { name: "Hindi", code: "hi", native: "हिंदी" },
    { name: "Tamil", code: "ta", native: "தமிழ்" },
    { name: "Malayalam", code: "ml", native: "മലയാളം" },
    { name: "Kannada", code: "kn", native: "ಕನ್ನಡ" },
    { name: "Marathi", code: "mr", native: "मराठी" },
    { name: "Gujarati", code: "gu", native: "ગુજરાતી" },
    { name: "Bengali", code: "bn", native: "বাংলা" },
    { name: "Punjabi", code: "pa", native: "ਪੰਜਾਬੀ" },
    { name: "Odia", code: "or", native: "ଓଡ଼ିଆ" },
    { name: "Urdu", code: "ur", native: "اردو" },
    { name: "Sindhi", code: "sd", native: "سنڌي" },
  ];
  const handleTranslate = async (messageId, targetLang, messageContent) => {
    setLoadingTranslation(targetLang);
    setCurrentMessageId(messageId);
    setCancelled(false);
  
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, targetLang, messageContent }),
      });
  
      const data = await response.json();
      console.log("Translation Response:", data);
  
      if (!cancelled && data.translatedText) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === messageId
              ? { ...msg, originalContent: msg.content, content: data.translatedText, translated: true }
              : msg
          )
        );
      }
    } catch (error) {
      console.error("Translation request failed:", error);
    } finally {
      setLoadingTranslation(null);
      setCurrentMessageId(null);
    }
  };
  
  const handleRestore = (messageId) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === messageId
          ? { ...msg, content: msg.originalContent, originalContent: null, translated: false }
          : msg
      )
    );
  };
  
const handleCancelTranslation = () => {
  setCancelled(true); // ✅ Mark translation as canceled
  setLoadingTranslation(null);
  setCurrentMessageId(null);
};



  
  // ✅ Fetch chat history from MongoDB on component mount
  useEffect(() => {
    if (!username) return;
  
    const fetchMessages = async () => {
      try {
        setMessages([]); // Clear messages before fetching
        const response = await fetch(`/api/get_chat?username=${username}`);
        const data = await response.json();
        setMessages(data.messages || []); // Setting messages after fetching
      } catch (error) {
        console.error("Error fetching chat history:", error);
      }
    };
  
    fetchMessages();
  
    const handleChatClear = () => {
      setMessages([]); // Clear chat messages from UI
    };
  
    window.addEventListener("chatHistoryCleared", handleChatClear);
  
    return () => {
      window.removeEventListener("chatHistoryCleared", handleChatClear);
    };
  }, [username]);
  
  
   // ✅ Store messages in MongoDB instead of local storage
   const handleAnalyze = async (botMessage) => {
    setLoading(true);
  
    try {
      const response = await fetch("/api/analyze_probability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot_response: botMessage }),
      });
  
      const data = await response.json();
      if (data.error) throw new Error(data.error);
  
      const graphId = Date.now();
      const graphMessage = {
        id: graphId,
        type: "bot",
        content: `<p><strong>Case Analysis:</strong></p><canvas id="chart-${graphId}"></canvas>`,
        probabilities: data,
        timestamp: new Date().toISOString(), // Added timestamp
      };
  
      // Store analyzed message in MongoDB
      await storeMessageInMongoDB(graphMessage);
      
      setMessages((prev) => [...prev, graphMessage]);
      setTimeout(() => renderGraph(graphMessage.id, data), 500);
    } catch (error) {
      console.error("Error analyzing:", error);
      setMessages((prev) => [...prev, { id: Date.now(), type: "bot", content: "Analysis failed. Try again!" }]);
    }
  
    setLoading(false);
  };
  
  // Extracted MongoDB store function
  const storeMessageInMongoDB = async (graphMessage) => {
    await fetch("/api/store_message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        messages: [graphMessage], // Store graph message
      }),
    });
  };
  

  const renderGraph = (chartId, probabilities) => {
  const canvas = document.getElementById(`chart-${chartId}`);
  if (!canvas) return;

  // Get existing chart instance and destroy it if necessary
  const existingChart = Chart.getChart(canvas); // This fetches the chart instance
  if (existingChart) existingChart.destroy(); // Prevent duplicate charts

  new Chart(canvas, {
    type: "bar",
    data: {
      labels: ["Win", "Loss", "Need More Info"],
      datasets: [
        {
          label: "Probability (%)",
          data: [probabilities.win, probabilities.loss, probabilities.need_more_info],
          backgroundColor: ["#4CAF50", "#F44336", "#FFC107"],
          borderWidth: 1,
          
        },
      ],
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true, max: 100 } },
    },
  });
};
useEffect(() => {
  if (messages.length > 0) {
    messages.forEach((message) => {
      if (message.probabilities) {
        setTimeout(() => renderGraph(message.id, message.probabilities), 500);
      }
    });
  }
}, [messages]);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".graph-popup") && !event.target.closest(".graph-button")) {
        setPopupMessageId(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveTranslateMessageId(null);
      }
    };
  
    document.addEventListener("mousedown", handleClickOutside);
  
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Handle responsive sidebar
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    
    // Initial check
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);

  // Apply dark mode to document body
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('chat-dark-theme');
    } else {
      document.body.classList.remove('chat-dark-theme');
    }
  }, [isDarkMode]);

  // Fetch User Data (Ensure unique chat storage per user)
  const fetchUserData = async () => {
    try {
      setError(null);
      const response = await fetch('/api/myaccount');
      if (!response.ok) throw new Error('Failed to fetch user data');
      const data = await response.json();
      setUsername(data.username);
      setProfilePicture(data.profile_picture || '');
      
      // Load user-specific chat history
      const savedMessages = localStorage.getItem(`chatHistory_${data.username}`);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load user data. Please refresh the page.');
    }
  };
  
  useEffect(() => {
    fetchUserData();
  }, []);

  // Save Chat History for Specific User
  useEffect(() => {
    if (messages.length > 0 && username) {
      localStorage.setItem(`chatHistory_${username}`, JSON.stringify(messages));
    }
  }, [messages, username]);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTo({
        top: chatBoxRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const abortControllerRef = useRef(null); // Holds the abort controller reference

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !isOnline) return;
  
    const messageId = Date.now().toString();
    const userMessage = { id: messageId, type: "user", content: input, timestamp: new Date().toISOString() };
  
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);
  
    abortControllerRef.current = new AbortController();
  
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input }),
        signal: abortControllerRef.current.signal,
      });
  
      if (!response.ok) throw new Error("Network response was not ok");
  
      const data = await response.json();
      const botMessage = {
        id: Date.now().toString(),
        type: "bot",
        content: data.response,
        timestamp: new Date().toISOString(),
      };
  
      setTimeout(async () => {
        setMessages((prev) => [...prev, botMessage]);
        setIsLoading(false);
  
        // ✅ Store both user & bot messages in MongoDB
        await fetch("/api/store_message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            messages: [userMessage, botMessage], // Storing both messages
          }),
        });
      }, 800);
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Request was aborted");
      } else {
        console.error("Error:", error);
        setError("Failed to send message. Please try again.");
      }
      setIsLoading(false);
    }
  };
  

const handleStopRequest = () => {
  if (abortControllerRef.current) {
    abortControllerRef.current.abort(); // Stop the fetch request
    setIsLoading(false);
  }
};


  const handleExportPDF = async () => {
    if (!messages.length) return alert('No messages to export.');

    try {
      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map(({ type, content, timestamp }) => ({
            user: type === 'user' ? 'You' : 'Justice Genie',
            text: content
              .replace(/<\/?[^>]+(>|$)/g, '') // Remove HTML tags
              .replace(/\*\*(.*?)\*\*/g, '**$1**') // Keep bold Markdown
              .replace(/__(.*?)__/g, '**$1**') // Convert underline to bold
              .replace(/\*(.*?)\*/g, '*$1*') // Keep italic Markdown
              .replace(/## (.*?)/g, '## $1') // Keep Markdown headings
              .replace(/# (.*?)/g, '# $1') // Keep H1 headings
              .replace(/\n/g, '\\n'), // Preserve newlines for backend formatting
            timestamp
          }))
        }),
      });

      if (!response.ok) throw new Error('Failed to generate PDF');

      const url = URL.createObjectURL(await response.blob());
      const a = document.createElement('a');
      
      Object.assign(a, {
        href: url,
        download: `chat_history_${new Date().toISOString().split('T')[0]}.pdf`,
        rel: 'noopener noreferrer' 
      });

      document.body.appendChild(a);  
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setError('Failed to export chat history. Please try again.');
    }
};

  
useEffect(() => {
  if (isLoading) {
    const messages = [
      'Analyzing your query...',
      'Just a moment, almost done...',
      'Still working on it, hold tight...',
      'This is taking longer than expected, but we are on it!'
    ];

    let index = 0;
    const interval = setInterval(() => {
      setLoadingMessage(messages[index]);
      index = (index + 1) % messages.length;
    }, 6000); // Change message every 4 seconds

    return () => clearInterval(interval);
  }
}, [isLoading]); // Only runs when `isLoading` changes

const fallbackCopy = (text) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand("copy");
  } catch (err) {
    alert("Failed to copy, please copy manually.");
  }
  document.body.removeChild(textArea);
};


  const handleClearChat = useCallback(() => {
    Swal.fire({
      title: "Clear all conversations?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, clear it!",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "chat-swal-popup",
        title: "chat-swal-title",
        content: "chat-swal-content",
        confirmButton: "chat-swal-confirm",
        cancelButton: "chat-swal-cancel",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        setMessages([]);
        setFeedback(null);
        localStorage.removeItem(`chatHistory_${username}`);
      }
    });
  }, [username]);
  
  const handleLogout = useCallback(() => {
    Modal.confirm({
      title: "Log out?",
      content: "Do you want to save your chat before logging out?",
      okText: "Save & Log Out",
      cancelText: "Cancel",
      okType: "danger",
      className: "chat-modal-popup",
      onOk: async () => {
        try {
          await fetch("/api/logout", {
            method: "POST",
            credentials: "include", // Important for cookies
          });

          // Clear session and localStorage
          sessionStorage.removeItem("isLoggedIn");
          localStorage.removeItem(`chatHistory_${username}`);
          localStorage.removeItem("darkMode");

          // Clear chat history from state
          setMessages([]);
          
          // Navigate to login page
          navigate("/login");
        } catch (error) {
          console.error("Error logging out:", error);
        }
      },
      onCancel: () => {
        console.log("Logout cancelled");
      },
    });
  }, [username, navigate, setMessages]);

  
  


  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const navItems = [
    { icon: <FileText size={20} />, label: 'LawPDF', path: '/lawpdf' },
    { icon: <Scale size={20} />, label: 'Legal Resources', path: '/resources' },
    { icon: <BookOpen size={20} />, label: 'GenieQuizz', path: '/quizz' },
    { icon: <User size={20} />, label: 'My Account', path: '/myaccount' }
  ];
  
  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('darkMode', newMode);
      return newMode;
    });
  };
  
  const handleSampleQuestion = (question) => {
    setInput(question);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  
  return (
    <div className={`chat-container ${isDarkMode ? 'chat-dark-mode' : ''}`}>

      {/* Sidebar */}
      <aside className={`chat-sidebar ${sidebarOpen ? 'chat-sidebar-open' : ''}`}>
        <div className="chat-sidebar-header">
          <div className="chat-logo">
            <Zap className="chat-logo-icon" size={24} />
            <h1><strong>Justice Genie 2.0</strong></h1>
          </div>
          <button 
            className="chat-sidebar-close"
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          >
            <Menu size={24} />
          </button>
        </div>

        <div className="chat-user-profile">
        <div className="chat-avatar-large">
            {profilePicture ? (
              <img
                src={profilePicture}
                alt="Profile"
                loading="lazy"
                srcSet={`${profilePicture}?w=300 300w, ${profilePicture}?w=500 500w, ${profilePicture}?w=800 800w`}
                sizes="(max-width: 600px) 300px, (max-width: 1024px) 500px, 800px"
              />
            ) : (
              <div className="avatar-placeholder">
                <User size={36} />
              </div>
            )}
          </div>
          <div className="chat-user-details">
            <h3 className="chat-username-large">{username || 'Guest User'}</h3>
            <span className="chat-user-status">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        <nav className="chat-nav">
        <div className="chat-nav-section">
              <h4 className="chat-nav-title">Tools</h4>
              {navItems.map((item, index) => (
                <Link 
                  key={index} 
                  to={item.path} // Use 'to' instead of 'href'
                  className="chat-nav-item"
                  onClick={(e) => {
                    if (!isOnline) {
                      e.preventDefault();
                      alert('This feature is not available offline');
                    }
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

          <div className="chat-nav-section">
            <h4 className="chat-nav-title">Preferences</h4>
            {/* Dark Mode button */}
            <button 
              className="chat-nav-item chat-action-btn"
              onClick={toggleDarkMode}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            {/* Clear Chat button */}
            <button 
              className="chat-nav-item chat-action-btn"
              onClick={handleClearChat}
              disabled={messages.length === 0}
            >
              <Trash2 size={20} />
              <span>Clear Chat</span>
            </button>

            {/* Logout button */}
            <button 
              className="chat-nav-item chat-action-btn chat-logout-btn"
              onClick={handleLogout}
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </nav>

        <div className="chat-sidebar-footer">
          <p>© 2025 Justice Genie</p>
          <p>All rights reserved</p>
        </div>
      </aside>

      <main className="chat-main">
        {/* Chat Header */}
        <header className="chat-header">
          <div className="chat-header-title">
            {/* <MessageSquare size={24} className="chat-pulse" /> */}
            <button 
            className="chat-sidebar-close"
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          >
            <Menu size={24} />
          </button>
            <h2>Understand Your Legal Rights</h2>
            {!isOnline && (
              <span className="chat-offline-badge">
                <AlertCircle size={16} />
                Offline
              </span>
            )}
          </div>
        </header>

        {error && (
          <div className="chat-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Messages Area */}
        <div className="chat-messages" ref={chatBoxRef}>
          {messages.length === 0 && (
            <div className="chat-empty-state">
              <div className="chat-empty-illustration">
                <MessageSquare size={48} />
              </div>
              <h3>Start Your Legal Conversation</h3>
              <p>Ask any legal question and get expert guidance from Justice Genie</p>
              <div className="chat-sample-questions">
                <button 
                  onClick={() => handleSampleQuestion("What are my rights as a tenant?")}
                  className="chat-sample-question"
                >
                  What are my rights as a tenant?
                </button>
                <button 
                  onClick={() => handleSampleQuestion("How do I file a small claims case?")}
                  className="chat-sample-question"
                >
                  How do I file a small claims case?
                </button>
                <button 
                  onClick={() => handleSampleQuestion("Explain employment discrimination laws")}
                  className="chat-sample-question"
                >
                  Explain employment discrimination laws
                </button>
              </div>
            </div>
          )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`chat-message ${
              message.type === "user" ? "chat-message-user" : "chat-message-bot"
            }`}
          >
            <div className="chat-message-avatar">
              {message.type === "user" ? (
                profilePicture ? (
                  <img src={profilePicture} alt="You" />
                ) : (
                  <User size={24} />
                )
              ) : (
                <Zap size={24} className="chat-pulse-bot" />
              )}
            </div>

            <div className="chat-message-text-container">
              <div
                className="chat-message-text"
                dangerouslySetInnerHTML={{ __html: message.content }}
              />

              {/* Show actions ONLY for bot messages */}
              {message.type === "bot" && (
                <div className="chat-message-actions">
                  <button
                onClick={() => {
                  const tempElement = document.createElement("div");
                  tempElement.innerHTML = message.content;

                  const convertToFormattedText = (element) => {
                    return Array.from(element.childNodes)
                      .map((node) => {
                        if (node.nodeName === "UL") {
                          return "\n" + Array.from(node.children)
                            .map((li) => `• ${li.innerText.trim()}`)
                            .join("\n");
                        } else if (node.nodeName === "B" || node.nodeName === "STRONG") {
                          return `**${node.innerText.trim()}**`;
                        } else if (node.nodeName === "P") {
                          return `\n${node.innerText.trim()}`;
                        }
                        return node.innerText.trim();
                      })
                      .join(" ");
                  };

                  const formattedText = convertToFormattedText(tempElement);

                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(formattedText).catch(() => fallbackCopy(formattedText));
                  } else {
                    fallbackCopy(formattedText);
                  }
                  
                  setCopied(true);
                  setTimeout(() => setCopied(false), 4000);
                }}
                title="Copy"
              >
          {copied ? <Check size={18} className="text-green-500" /> : <Clipboard size={18} />}
        </button>


          <button
            onClick={() => setFeedback(feedback === "up" ? null : "up")}
            className={feedback === "up" ? "active" : ""}
            title="Thumbs Up"
          >
            <ThumbsUp size={18} />
          </button>
          <button
            onClick={() => setFeedback(feedback === "down" ? null : "down")}
            className={feedback === "down" ? "active" : ""}
            title="Thumbs Down"
          >
            <ThumbsDown size={18} />
          </button>

          <div className="translate-container" ref={menuRef}>
            {/* Show Translate button if not translated */}
            {!message.translated ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTranslateMessageId((prev) =>
                    prev === message.id ? null : message.id
                  );
                }}
                title="Translate"
              >
                <Globe size={18} />
              </button>
            ) : (
              /* Show Restore button when translated */
              <button onClick={() => handleRestore(message.id)} title="Restore">
                <RotateCcw size={18} />
              </button>
            )}

            {activeTranslateMessageId === message.id && (
              <div className="language-menu">
                {loadingTranslation && currentMessageId === message.id ? (
                  <div className="chat-transLoad">
                    <div className="loader"></div>
                    <p>Translating into {languages.find(lang => lang.code === loadingTranslation)?.name || loadingTranslation}...</p>
                    <button className="chat-trans-cancel-btn" onClick={handleCancelTranslation}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  languages.map(({ name, code, native }) => (
                    <div
                      key={code}
                      className="language-option"
                      onClick={() => handleTranslate(message.id, code, message.content)}
                    >
                      {name} ({native})
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {message.type === "bot" && (
            <>
              {!speakingMessageId || speakingMessageId !== message.id ? (
                <button onClick={() => speakText(message.content, message.id)} title="Listen">
                  <Volume2 size={18} />
                </button>
              ) : (
                <button onClick={stopSpeech} title="Stop">
                  <SquareDotIcon size={18} />
                </button>
              )}
            </>
          )}

        
          {/* Graph Icon Button */}
          <button
            className="graph-button"
            onClick={() => setPopupMessageId(popupMessageId === message.id ? null : message.id)}
            title="Analyze Probability"
          >
            <BarChart size={18} />
          </button>

          {/* Popup Box */}
          {popupMessageId === message.id && message.type === "bot" && (
           <div className="graph-popup w-[220px] sm:w-[85%] max-w-sm md:w-[220px] text-center p-3 sm:p-4 rounded-lg shadow-xl border bg-white absolute left-1/2 bottom-[70px] translate-x-[-50%] z-[9999] transition-opacity duration-200">
           <p className="text-base sm:text-lg font-semibold text-gray-800">Do you want to analyze the query?</p>
           <p className="popup-subtext text-xs sm:text-sm text-gray-600 mb-2">You have 2 free trials left.</p>
           <button
             type="button"
             className="analyze-button font-bold w-full py-2 sm:py-2.5 px-3 bg-[#007bff] hover:bg-[#0056b3] text-[yellowgreen] text-sm rounded-md transition-all duration-300"
             onClick={() => handleAnalyze(message.content)}
           >
             {loading ? "Analyzing..." : "Analyze"}
           </button>
         </div>
         
          )}
        </div>
      )}
    </div>
  </div>
))}

          {isLoading && (
            <div className="chat-message chat-message-bot">
              <div className="chat-message-avatar">
                <Zap size={24} className="chat-pulse" />
              </div>
              <div className="chat-message-content">
                <div className="chat-message-author">
                  <span>Justice Genie</span>
                </div>
                <div className="chat-message-text chat-typing">
                  <Loader className="chat-spinner" size={20} />
                  <span>{loadingMessage}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="chat-input-container">
      <div className="chat-input-wrapper">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);  // Update input value
             // Set isTyping to true if there is input
          }}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              isLoading ? handleStopRequest() : handleSendMessage();
            }
          }}
          placeholder={
            isOnline
              ? "Ask about your legal rights..."
              : "You're offline. Messages will be sent when you're back online."
          }
          className="chat-input"
          rows={1}
          disabled={!isOnline || isLoading}
        />
       

        <div className="chat-actions">
          <button
            className={`chat-mic-btn ${isListening ? "listening" : ""}`}
            onClick={handleMicClick}
            title={isListening ? "Listening... Click to Stop" : "Click to Speak"}
          >
            {isListening ? <Mic size={20} /> : <MicOff size={20} />}
          </button>
          <button
            onClick={isLoading ? handleStopRequest : handleSendMessage}
            className={`chat-send-btn ${input.trim() || isLoading ? "chat-send-btn-active" : ""}`}
            disabled={!isOnline || (!input.trim() && !isLoading)}
          >
            {isLoading ? <XCircle size={20} /> : <Send size={20} />}
          </button>
          <button
            onClick={handleExportPDF}
            onMouseDown={(e) => e.currentTarget.blur()}
            className="chat-export-btn"
            disabled={messages.length === 0 || !isOnline}
            title="Export conversation as PDF"
          >
            <Download size={20} />
         
          </button>
     
        </div>
      </div>
    </div>
      </main>

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && window.innerWidth < 1024 && (
        <div className="chat-overlay" onClick={toggleSidebar}></div>
      )}
    </div>
  );
};

export default Chat;