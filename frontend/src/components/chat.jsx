import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, Moon, Sun, Trash2, LogOut, MessageSquare,
  User, FileText, Zap, Loader, Scale, 
  BookOpen, Download, AlertCircle, Menu,Clipboard,ThumbsDown,ThumbsUp,Globe,Mic,BarChart,XCircle,RotateCcw,MicOff,Volume2,SquareDotIcon,Check
} from 'lucide-react';
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Link } from 'react-router-dom';
import { Modal } from "antd";
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";
import ReactMarkdown from 'react-markdown';
import  AnalysisReport  from './AnalysisReport';
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
  const [popupMessageId, setPopupMessageId] = useState(null);
  const [activeTranslateMessageId, setActiveTranslateMessageId] = useState(null);
  const [loadingTranslation, setLoadingTranslation] = useState(null);
  const [currentMessageId, setCurrentMessageId] = useState(null);
  const [cancelled, setCancelled] = useState(false); 
  const { setAuth } = useContext(AuthContext);
  const chatCacheRef = useRef({}); // Add this at the top, with your other refs

  const [copied, setCopied] = useState(false);
  const [isListening, setIsListening] = useState(false);
  // let controller = new AbortController(); // To cancel fetch if stopped

  const recognitionRef = useRef(null); // Store recognition instance
  const [bootLoading, setBootLoading] = useState(false);
  // In chat.jsx, at the top of your component
  const [isExportPopupOpen, setIsExportPopupOpen] = useState(false);
  const [pdfFilename, setPdfFilename] = useState(`chat_history_${new Date().toISOString().split('T')[0]}`);
  // In chat.jsx, at the top of your Chat component
  const [analyzingMessageId, setAnalyzingMessageId] = useState(null);
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
    setSpeakingMessageId(messageId);

    const cleanText = stripHTML(text);

    if (isMobile) {
      // 🔹 Use browser's built-in speech synthesis for mobile
      const speech = new SpeechSynthesisUtterance(cleanText);
      speech.lang = "en-US";
      speech.rate = 1.0;
      speech.pitch = 1.1;
      speech.volume = 1.0;

      speech.onend = () => setSpeakingMessageId(null);
      speech.onerror = () => setSpeakingMessageId(null);

      speechSynthesis.speak(speech);
    } else {
      // 🔹 Call backend API for desktop TTS
      const response = await fetch(
  `${process.env.REACT_APP_BACKEND_URL}/api/text-to-speech`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // 👈 include session cookie
    body: JSON.stringify({ text: cleanText, rate: 150 }),
  }
);


      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start speech on the server");
      }

      // 🔹 Handle "coming soon" message
      if (data.message?.toLowerCase().includes("coming soon")) {
        alert("🔊 Text-to-Speech is coming soon in production!");
        setSpeakingMessageId(null);
      }
    }
  } catch (error) {
    console.error("Error playing speech:", error);
    setSpeakingMessageId(null);
  }
};

const stopSpeech = async () => {
  try {
    if (isMobile) {
      speechSynthesis.cancel();
    } else {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/stop-speech`, { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to stop speech on the server");
      }

      if (data.message?.toLowerCase().includes("coming soon")) {
        alert("⏹️ Stop speech is coming soon in production!");
      }
    }
  } catch (error) {
    console.error("Error stopping speech:", error);
  } finally {
    setSpeakingMessageId(null);
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
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/translate`, {
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
            ? {
                ...msg,
                originalContent: msg.content,
                content: data.translatedText,
                translated: true,
              }
            : msg
        )
      );

      // Optional: show a notification if it's the placeholder
      if (data.translatedText.includes("coming soon")) {
        alert("Translation service is coming soon!", "info");
      }
    }
  } catch (error) {
    console.error("Translation request failed:", error);
    alert("Translation failed. Please try again later.", "error");
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
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/get_chat?username=${username}`,
        {
          method: "GET",
          credentials: "include", // send cookies/session
        }
      );

      const data = await response.json();
      setMessages(data.messages || []); // Always use backend data
    } catch (error) {
      console.error("Error fetching chat history:", error);
      setMessages([]); // fallback to empty
    }
  };

  fetchMessages();

  const handleChatClear = () => {
    console.log("[Chat] chatHistoryClear event received! Clearing messages...");
    setMessages([]); // Clear immediately after delete
  };

  // ✅ Listen for clear event
  window.addEventListener("chatHistoryClear", handleChatClear);

  return () => {
    window.removeEventListener("chatHistoryClear", handleChatClear);
  };
}, [username]);

  
   // ✅ Store messages in MongoDB instead of local storage
   // This code in your chat.jsx is correct and does not need any more changes.

const handleAnalyze = async (botMessageId) => {
  setAnalyzingMessageId(botMessageId);
  setPopupMessageId(null);

  const botMessageIndex = messages.findIndex(m => m.id === botMessageId);
  if (botMessageIndex < 1) {
    console.error("Could not find the preceding user query to analyze.");
    return;
  }
  
  const botMessage = messages[botMessageIndex];
  const userQuery = messages[botMessageIndex - 1];

  try {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/analyze_probability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        user_query: userQuery.content,
        bot_response: botMessage.content
      }),
    });

    const analysisData = await response.json();
    if (analysisData.error) throw new Error(analysisData.error);

    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === botMessageId
          ? { ...msg, analysis: analysisData }
          : msg
      )
    );

    // This part correctly sends the data to your new backend endpoint
    await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/save_analysis`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        message_id: botMessageId,
        analysis_data: analysisData,
      }),
    });

  } catch (error) {
    console.error("Error analyzing:", error);
  }

  setAnalyzingMessageId(null);
};
  // Extracted MongoDB store function

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

  // Apply dark mode - toggles the 'dark' class on <html>, which is what
  // Tailwind's dark: variant looks for (darkMode: 'class' in tailwind.config.js).
  // Scoped to <html> is safe: only Tailwind classes with a dark: prefix respond
  // to it, so other pages that don't use dark: are completely unaffected.
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

 // Fetch User Data (Ensure unique chat storage per user)
const fetchUserData = useCallback(async (retries = 6, delay = 10000) => {
  try {
    setError(null);
    setBootLoading(true); // show loader

    // Fetch from backend
    const response = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/api/myaccount`,
      { credentials: "include" }
    );

    if (!response.ok) throw new Error("Failed to fetch user data");

    const data = await response.json();
    setUsername(data.username);
    setProfilePicture(data.profile_picture || "");

    // Save to sessionStorage for next visits (optional, only user info)
    sessionStorage.setItem("userData", JSON.stringify({
      username: data.username,
      profile_picture: data.profile_picture || ""
    }));

    setBootLoading(false); // hide loader
  } catch (err) {
    console.error("Error fetching user data:", err);

    if (retries > 0) {
      setTimeout(() => fetchUserData(retries - 1, delay), delay);
    } else {
      setBootLoading(false);
      setError("Server is taking too long to respond. Please refresh later.");
    }
  }
}, []);

// -----------------------------
// Run fetch once on mount or if no cached data
// -----------------------------
useEffect(() => {
  const cachedUser = sessionStorage.getItem("userData");
  if (cachedUser) {
    const data = JSON.parse(cachedUser);
    setUsername(data.username);
    setProfilePicture(data.profile_picture || "");
    // ❌ Removed localStorage chat preload
  } else {
    fetchUserData();
  }
}, [fetchUserData]);


useEffect(() => {
  if (!username) return;

  if (chatCacheRef.current[username]) {
    setMessages(chatCacheRef.current[username]);
  } else {
    setMessages([]);
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/get_chat?username=${username}`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setMessages(data.messages || []);
        chatCacheRef.current[username] = data.messages || [];
      })
      .catch(() => setMessages([]));
  }
}, [username]);


// -----------------------------
// Auto-scroll (unchanged)
useEffect(() => {
  if (chatBoxRef.current) {
    chatBoxRef.current.scrollTo({
      top: chatBoxRef.current.scrollHeight,
      behavior: "smooth",
    });
  }
}, [messages]);

// -----------------------------
// Abort Controller (unchanged)
const abortControllerRef = useRef(null);

// -----------------------------
// Handle sending message (unchanged)
const handleSendMessage = async () => {
  if (!input.trim() || isLoading || !isOnline) return;

  const messageId = Date.now().toString();
  const userMessage = {
    id: messageId,
    type: "user",
    content: input,
    timestamp: new Date().toISOString(),
  };

  setMessages((prev) => [...prev, userMessage]);
  setInput("");
  setIsLoading(true);
  setError(null);

  abortControllerRef.current = new AbortController();

  try {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
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

      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/store_message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username,
          messages: [userMessage, botMessage],
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
    abortControllerRef.current.abort();
    setIsLoading(false);
  }
};

 const handleExportPDF = async () => {
  if (!messages.length) return alert('No messages to export.');
  setIsExportPopupOpen(false);

  try {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/export-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      // SIMPLIFIED: Just send the raw message content.
      // The backend will handle all formatting.
      body: JSON.stringify({
        messages: messages.map(({ type, content }) => ({
          user: type === 'user' ? 'You' : 'Justice Genie',
          text: content 
        }))
      }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = `${pdfFilename || 'chat_history'}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error exporting PDF:', error);
    // You can use your setError state function here if you have one
    alert('Failed to export chat history. Please try again.');
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



  const handleClearChat = useCallback(() => {
    Swal.fire({
      title: "Clear all conversations?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, clear it!",
      cancelButtonText: "Cancel",
      background: isDarkMode ? '#1e293b' : '#ffffff', // slate-800 / white
      color: isDarkMode ? '#e2e8f0' : '#1e293b', // slate-200 / slate-800
      confirmButtonColor: '#dc2626', // red-600 - destructive action
      cancelButtonColor: isDarkMode ? '#475569' : '#e2e8f0', // slate-600 / slate-200
    }).then((result) => {
      if (result.isConfirmed) {
        setMessages([]);
        setFeedback(null);
        localStorage.removeItem(`chatHistory_${username}`);
      }
    });
  }, [username, isDarkMode]);
  
const handleLogout = useCallback(() => {
  Modal.confirm({
    title: "Log out?",
    content: "Do you want to save your chat before logging out?",
    okText: "Save & Log Out",
    cancelText: "Cancel",
    okType: "danger",
    onOk: async () => {
  try {
    await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/logout`, {
      method: "POST",
      credentials: "include",
    });

    // Clear context
    setAuth({ loggedIn: false, role: null, username: null, loading: false });

    // --- THIS IS THE FIX ---
    // This one line removes ALL data for the session, including the stale 'userData'.
    sessionStorage.clear(); 
    
    // You should also clear localStorage if you are storing user-specific data there
    localStorage.removeItem(`chatHistory_${username}`);
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("role");
    localStorage.removeItem("darkMode");
    // ----------------------

    // Clear chat history from state
    setMessages([]);

    // Navigate to login page
    navigate("/login", { replace: true });
  } catch (error) {
    console.error("Error logging out:", error);
  }
},
    onCancel: () => {
      console.log("Logout cancelled");
    },
  });
}, [username, navigate, setMessages, setAuth]);


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

if (bootLoading && !error) {
  return (
    <div className="relative w-full h-full min-h-[calc(100vh-100px)] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="absolute top-0 left-0 w-full h-1 bg-blue-200 dark:bg-blue-900/50 overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-blue-500 dark:bg-blue-400"
          style={{
            width: '100%',
            transformOrigin: '0% 50%',
            animation: 'indeterminate-animation 1.5s infinite linear'
          }}
        ></div>
      </div>

      <div className="flex flex-col items-center animate-fadeIn">
        <Loader size={40} className="mb-4 text-blue-500 dark:text-blue-400 animate-spin" />
        <p className="text-lg font-manrope font-medium text-slate-700 dark:text-slate-300 text-center">
          Connecting to Justice Genie...
        </p>
        <p className="text-sm font-manrope text-slate-500 dark:text-slate-400 mt-1 text-center">
          Please wait a moment.
        </p>
        <p className="text-xs sm:text-sm font-manrope text-slate-400 dark:text-slate-500 mt-6 text-center max-w-xs">
          Loading may take a few seconds depending on server response.
        </p>

        <button
          onClick={handleLogout}
          className="mt-6 px-4 py-2 text-sm font-manrope text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline underline-offset-2"
        >
          Cancel and Logout
        </button>
      </div>
    </div>
  );
}

if (error) {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-10">
      <div className="flex justify-start items-start space-x-4">
        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-sm flex-shrink-0 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-slate-500 dark:text-slate-400" />
        </div>

        <div className="flex-1">
          <div className="bg-red-50 dark:bg-slate-800 border border-red-200 dark:border-red-500/30 rounded-sm rounded-bl-none p-4 max-w-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-poppins font-semibold text-slate-800 dark:text-slate-200">
                  Connection Error
                </p>
                <p className="text-sm font-manrope text-slate-600 dark:text-slate-400 mt-1">
                  Apologies, I'm having trouble connecting to my services at the moment.
                </p>
                {error && (
                  <p className="text-xs text-red-500/80 dark:text-red-500/50 mt-2 font-mono">
                    Details: {error}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3">
            <button
              onClick={() => fetchUserData()}
              className="px-4 py-2 text-sm font-manrope font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-sm transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

return (
  <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-900 overflow-hidden">

    {/* Sidebar */}
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-72 flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-300 lg:static lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-2">
          <img
            src="/images/jg_original_logo_1.png"
            alt="Justice Genie Logo"
            className="w-6 h-6 object-contain"
          />
          <h1 className="text-lg font-poppins font-bold text-slate-800 dark:text-slate-100">Justice Genie</h1>
        </div>
        <button
          className="lg:hidden p-1.5 rounded-sm text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
          onClick={toggleSidebar}
          aria-label="Close sidebar"
        >
          <Menu size={22} />
        </button>
      </div>

      <div className="flex items-center space-x-3 px-4 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="w-12 h-12 rounded-sm overflow-hidden bg-slate-100 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center">
          {profilePicture ? (
            <img
              src={profilePicture}
              alt="Profile"
              loading="lazy"
              className="w-full h-full object-cover"
              srcSet={`${profilePicture}?w=300 300w, ${profilePicture}?w=500 500w, ${profilePicture}?w=800 800w`}
              sizes="(max-width: 600px) 300px, (max-width: 1024px) 500px, 800px"
            />
          ) : (
            <User size={26} className="text-slate-400" />
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-poppins font-semibold text-slate-800 dark:text-slate-100 truncate">{username || 'Guest User'}</h3>
          <span className="text-xs font-manrope text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-slate-400'}`}></span>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <h4 className="px-2 text-xs font-manrope font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">Tools</h4>
          <div className="space-y-1">
            {navItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className="flex items-center gap-3 px-2 py-2 rounded-sm text-sm font-manrope text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
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
        </div>

        <div>
          <h4 className="px-2 text-xs font-manrope font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-2">Preferences</h4>
          <div className="space-y-1">
            <button
              className="w-full flex items-center gap-3 px-2 py-2 rounded-sm text-sm font-manrope text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={toggleDarkMode}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            <button
              className="w-full flex items-center gap-3 px-2 py-2 rounded-sm text-sm font-manrope text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={handleClearChat}
              disabled={messages.length === 0}
            >
              <Trash2 size={20} />
              <span>Clear Chat</span>
            </button>

            <button
              className="w-full flex items-center gap-3 px-2 py-2 rounded-sm text-sm font-manrope text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
              onClick={handleLogout}
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-700 text-xs font-manrope text-slate-400 dark:text-slate-500">
        <p>© 2025 Justice Genie</p>
        <p>All rights reserved</p>
      </div>
    </aside>

    {/* Main area */}
    <main className="flex-1 flex flex-col min-w-0">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <button
          className="lg:hidden p-1.5 rounded-sm text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
          onClick={toggleSidebar}
          aria-label="Open sidebar"
        >
          <Menu size={22} />
        </button>
        <h2 className="font-poppins font-semibold text-slate-800 dark:text-slate-100">Understand Your Legal Rights</h2>
        {!isOnline && (
          <span className="flex items-center gap-1 text-xs font-manrope text-amber-700 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 px-2 py-1 rounded-sm ml-auto">
            <AlertCircle size={14} />
            Offline
          </span>
        )}
      </header>

      {error && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 text-sm font-manrope">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4" ref={chatBoxRef}>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center max-w-lg mx-auto py-16">
            <div className="w-14 h-14 rounded-sm bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-4">
              <MessageSquare size={26} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-poppins font-semibold text-lg text-slate-800 dark:text-slate-100">Start Your Legal Conversation</h3>
            <p className="font-manrope text-sm text-slate-500 dark:text-slate-400 mt-1">Ask any legal question and get expert guidance from Justice Genie</p>
            <div className="flex flex-col gap-2 mt-6 w-full">
              <button
                onClick={() => handleSampleQuestion("What are my rights as a tenant?")}
                className="font-manrope text-sm text-left px-4 py-3 rounded-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-slate-700"
              >
                What are my rights as a tenant?
              </button>
              <button
                onClick={() => handleSampleQuestion("How do I file a small claims case?")}
                className="font-manrope text-sm text-left px-4 py-3 rounded-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-slate-700"
              >
                How do I file a small claims case?
              </button>
              <button
                onClick={() => handleSampleQuestion("Explain employment discrimination laws")}
                className="font-manrope text-sm text-left px-4 py-3 rounded-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-slate-700"
              >
                Explain employment discrimination laws
              </button>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-3 ${message.type === "user" ? "flex-row-reverse" : ""}`}
          >
            <div className="w-8 h-8 rounded-sm flex-shrink-0 flex items-center justify-center bg-slate-100 dark:bg-slate-700 overflow-hidden">
              {message.type === "user" ? (
                profilePicture ? (
                  <img src={profilePicture} alt="You" className="w-full h-full object-cover" />
                ) : (
                  <User size={18} className="text-slate-500" />
                )
              ) : (
                <Zap size={18} className="text-blue-600 dark:text-blue-400" />
              )}
            </div>

            <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${message.type === "user" ? "items-end" : "items-start"}`}>
              <div
                className={`font-manrope text-sm md:text-base px-4 py-3 rounded-sm ${
                  message.type === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-bl-none"
                }`}
              >
                <div className={message.type === "user" ? "prose-invert" : ""}>
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
                {message.analysis && <AnalysisReport data={message.analysis} />}
              </div>

              {/* Actions - bot messages only */}
              {message.type === "bot" && (
                <div className="flex items-center gap-1 mt-1.5 text-slate-400 dark:text-slate-500">
                  <button
                    className="p-1.5 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300"
                    onClick={() => {
                      navigator.clipboard.writeText(message.content);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 4000);
                    }}
                    title="Copy"
                  >
                    {copied ? <Check size={16} className="text-green-500" /> : <Clipboard size={16} />}
                  </button>

                  <button
                    onClick={() => setFeedback(feedback === "up" ? null : "up")}
                    className={`p-1.5 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-700 ${feedback === "up" ? "text-green-600" : "hover:text-slate-600 dark:hover:text-slate-300"}`}
                    title="Thumbs Up"
                  >
                    <ThumbsUp size={16} />
                  </button>
                  <button
                    onClick={() => setFeedback(feedback === "down" ? null : "down")}
                    className={`p-1.5 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-700 ${feedback === "down" ? "text-red-600" : "hover:text-slate-600 dark:hover:text-slate-300"}`}
                    title="Thumbs Down"
                  >
                    <ThumbsDown size={16} />
                  </button>

                  <div className="relative" ref={menuRef}>
                    {!message.translated ? (
                      <button
                        className="p-1.5 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTranslateMessageId((prev) =>
                            prev === message.id ? null : message.id
                          );
                        }}
                        title="Translate"
                      >
                        <Globe size={16} />
                      </button>
                    ) : (
                      <button
                        className="p-1.5 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300"
                        onClick={() => handleRestore(message.id)}
                        title="Restore"
                      >
                        <RotateCcw size={16} />
                      </button>
                    )}

                    {activeTranslateMessageId === message.id && (
                      <div className="absolute z-10 bottom-full mb-2 left-0 w-56 max-h-64 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm shadow-lg font-manrope text-sm">
                        {loadingTranslation && currentMessageId === message.id ? (
                          <div className="flex flex-col items-center gap-2 p-4 text-center">
                            <Loader size={18} className="animate-spin text-blue-500" />
                            <p className="font-poppins text-xs text-slate-600 dark:text-slate-300">
                              Translating into {languages.find(lang => lang.code === loadingTranslation)?.name || loadingTranslation}...
                            </p>
                            <button
                              className="text-xs text-red-600 hover:underline"
                              onClick={handleCancelTranslation}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          languages.map(({ name, code, native }) => (
                            <div
                              key={code}
                              className="px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                              onClick={() => handleTranslate(message.id, code, message.content)}
                            >
                              {name} ({native})
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {!speakingMessageId || speakingMessageId !== message.id ? (
                    <button
                      className="p-1.5 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300"
                      onClick={() => speakText(message.content, message.id)}
                      title="Listen"
                    >
                      <Volume2 size={16} />
                    </button>
                  ) : (
                    <button
                      className="p-1.5 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300"
                      onClick={stopSpeech}
                      title="Stop"
                    >
                      <SquareDotIcon size={16} />
                    </button>
                  )}

                  {!message.analysis && (
                    <div className="relative">
                      <button
                        className="graph-button p-1.5 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-40"
                        onClick={() => {
                          if (!analyzingMessageId) {
                            setPopupMessageId(popupMessageId === message.id ? null : message.id);
                          }
                        }}
                        title="Analyze Probability"
                        disabled={analyzingMessageId}
                      >
                        {analyzingMessageId === message.id ? (
                          <Loader size={16} className="animate-spin" />
                        ) : (
                          <BarChart size={16} />
                        )}
                      </button>

                      {popupMessageId === message.id && message.type === "bot" && (
                        <div className="graph-popup absolute z-10 bottom-full mb-2 left-0 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm shadow-lg p-3">
                          <p className="font-poppins text-sm text-slate-700 dark:text-slate-200 mb-3">Do you want to analyze the query?</p>
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              className="font-manrope text-xs px-3 py-1.5 rounded-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                              onClick={() => setPopupMessageId(null)}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="font-manrope text-xs px-3 py-1.5 rounded-sm bg-blue-600 text-white hover:bg-blue-700"
                              onClick={() => {
                                handleAnalyze(message.id);
                              }}
                            >
                              Analyze
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-sm flex-shrink-0 flex items-center justify-center bg-slate-100 dark:bg-slate-700">
              <Zap size={18} className="text-blue-600 dark:text-blue-400 animate-pulse" />
            </div>
            <div className="flex items-center gap-2 px-4 py-3 rounded-sm rounded-bl-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-manrope text-sm text-slate-500 dark:text-slate-400">
              <Loader size={16} className="animate-spin" />
              <span>{loadingMessage}</span>
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
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
            className="flex-1 resize-none font-manrope text-sm md:text-base bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm px-4 py-2.5 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-40"
            rows={1}
            disabled={!isOnline || isLoading}
          />

          <button
            className={`p-2.5 rounded-sm border ${isListening ? "bg-red-50 border-red-300 text-red-600 dark:bg-red-500/10 dark:border-red-500/30" : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"}`}
            onClick={handleMicClick}
            title={isListening ? "Listening... Click to Stop" : "Click to Speak"}
          >
            {isListening ? <Mic size={20} /> : <MicOff size={20} />}
          </button>
          <button
            onClick={isLoading ? handleStopRequest : handleSendMessage}
            className={`p-2.5 rounded-sm ${input.trim() || isLoading ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500"} disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={!isOnline || (!input.trim() && !isLoading)}
          >
            {isLoading ? <XCircle size={20} /> : <Send size={20} />}
          </button>
          <button
            onClick={() => setIsExportPopupOpen(true)}
            onMouseDown={(e) => e.currentTarget.blur()}
            className="p-2.5 rounded-sm border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={messages.length === 0 || !isOnline}
            title="Export conversation as PDF"
          >
            <Download size={20} />
          </button>
        </div>
      </div>
    </main>

    {/* Mobile overlay */}
    {sidebarOpen && (
      <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={toggleSidebar}></div>
    )}

    {/* Export PDF modal */}
    {isExportPopupOpen && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-slate-800 rounded-sm shadow-xl w-full max-w-sm p-6">
          <h3 className="font-poppins font-semibold text-lg text-slate-800 dark:text-slate-100 mb-1">Export Chat as PDF</h3>
          <p className="font-manrope text-sm text-slate-500 dark:text-slate-400 mb-3">Enter a filename for your PDF:</p>
          <input
            type="text"
            value={pdfFilename}
            onChange={(e) => setPdfFilename(e.target.value)}
            className="w-full font-manrope text-sm px-3 py-2 rounded-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-5"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsExportPopupOpen(false)}
              className="font-manrope text-sm px-4 py-2 rounded-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleExportPDF}
              className="font-manrope text-sm px-4 py-2 rounded-sm bg-blue-600 text-white hover:bg-blue-700"
            >
              Download
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
};

export default Chat;