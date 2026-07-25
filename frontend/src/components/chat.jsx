import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send,  MessageSquare,
  User,  Zap, Loader, 
   Download, AlertCircle, Menu,Clipboard,ThumbsDown,ThumbsUp,Globe,Mic,BarChart,XCircle,RotateCcw,MicOff,Volume2,SquareDotIcon,Check
} from 'lucide-react';
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Link } from 'react-router-dom';
import { Modal } from "antd";
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";
import ReactMarkdown from 'react-markdown';
import  AnalysisReport  from './AnalysisReport';

// Shared toast helper - replaces native alert() with a proper non-blocking
// notification. Uses Swal's toast mode (already a dependency), so it needs
// no extra library and matches the confirm-dialog styling used elsewhere.
const showToast = (message, icon = 'info') => {
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title: message,
    showConfirmButton: false,
    timer: 3500,
    timerProgressBar: true,
  });
};

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
  const { setAuth, clearAuth } = useContext(AuthContext);
  const chatCacheRef = useRef({});

  const [copied, setCopied] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef(null);
  const [bootLoading, setBootLoading] = useState(false);
  const [isExportPopupOpen, setIsExportPopupOpen] = useState(false);
  const [pdfFilename, setPdfFilename] = useState(`chat_history_${new Date().toISOString().split('T')[0]}`);
  const [analyzingMessageId, setAnalyzingMessageId] = useState(null);
  const handleMicClick = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Speech Recognition is not supported in this browser.", "warning");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US"; 

    let finalTranscript = ""; 

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
        } else {
          interimTranscript = result[0].transcript;
        }
      }

      setInput(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.start();
  };

  const [speakingMessageId, setSpeakingMessageId] = useState(null); 

  const isMobile = /Mobi|Android/i.test(navigator.userAgent); 
  
  const stripHTML = (html) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };
  
  const speakText = async (text, messageId) => {
  try {
    setSpeakingMessageId(messageId);

    const cleanText = stripHTML(text);

    if (isMobile) {
      const speech = new SpeechSynthesisUtterance(cleanText);
      speech.lang = "en-US";
      speech.rate = 1.0;
      speech.pitch = 1.1;
      speech.volume = 1.0;

      speech.onend = () => setSpeakingMessageId(null);
      speech.onerror = () => setSpeakingMessageId(null);

      speechSynthesis.speak(speech);
    } else {
      const response = await fetch(
  `/api/text-to-speech`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", 
    body: JSON.stringify({ text: cleanText, rate: 150 }),
  }
);


      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start speech on the server");
      }

      if (data.message?.toLowerCase().includes("coming soon")) {
        showToast("Text-to-Speech is coming soon.", "info");
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
      const response = await fetch(`/api/stop-speech`, { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to stop speech on the server");
      }

      if (data.message?.toLowerCase().includes("coming soon")) {
        showToast("Stop speech is coming soon.", "info");
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
    const response = await fetch(`/api/translate`, {
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

      if (data.translatedText.includes("coming soon")) {
        showToast("Translation service is coming soon.", "info");
      }
    }
  } catch (error) {
    console.error("Translation request failed:", error);
    showToast("Translation failed. Please try again later.", "error");
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
  setCancelled(true); 
  setLoadingTranslation(null);
  setCurrentMessageId(null);
};



  
useEffect(() => {
  if (!username) return;

  const fetchMessages = async () => {
    try {
      setMessages([]); 
      const response = await fetch(
        `/api/get_chat?username=${username}`,
        {
          method: "GET",
          credentials: "include", 
        }
      );

      const data = await response.json();
      setMessages(data.messages || []); 
    } catch (error) {
      console.error("Error fetching chat history:", error);
      setMessages([]); 
    }
  };

  fetchMessages();

  const handleChatClear = () => {
    console.log("[Chat] chatHistoryClear event received! Clearing messages...");
    setMessages([]); 
  };

  window.addEventListener("chatHistoryClear", handleChatClear);

  return () => {
    window.removeEventListener("chatHistoryClear", handleChatClear);
  };
}, [username]);

  
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
    const response = await fetch(`/api/analyze_probability`, {
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

    await fetch(`/api/save_analysis`, {
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
    
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    
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

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

const fetchUserData = useCallback(async (retries = 6, delay = 10000) => {
  try {
    setError(null);
    setBootLoading(true);

    const response = await fetch(
      `/api/myaccount`,
      { credentials: "include" }
    );

    if (response.status === 401) {
      // Session isn't actually valid — don't retry like this is a slow
      // server, just send the user back to log in.
      clearAuth();
      navigate("/login", { replace: true });
      return;
    }

    if (!response.ok) throw new Error("Failed to fetch user data");

    const data = await response.json();
    setUsername(data.username);
    setProfilePicture(data.profile_picture || "");

    sessionStorage.setItem("userData", JSON.stringify({
      username: data.username,
      profile_picture: data.profile_picture || ""
    }));

    setBootLoading(false); 
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

useEffect(() => {
  const cachedUser = sessionStorage.getItem("userData");
  if (cachedUser) {
    const data = JSON.parse(cachedUser);
    setUsername(data.username);
    setProfilePicture(data.profile_picture || "");
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
    fetch(`/api/get_chat?username=${username}`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setMessages(data.messages || []);
        chatCacheRef.current[username] = data.messages || [];
      })
      .catch(() => setMessages([]));
  }
}, [username]);

useEffect(() => {
  if (chatBoxRef.current) {
    chatBoxRef.current.scrollTo({
      top: chatBoxRef.current.scrollHeight,
      behavior: "smooth",
    });
  }
}, [messages]);

const abortControllerRef = useRef(null);

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
    const response = await fetch(`/api/chat`, {
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

      await fetch(`/api/store_message`, {
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
  if (!messages.length) return showToast('No messages to export.', 'warning');
  setIsExportPopupOpen(false);

  try {
    const response = await fetch(`/api/export-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
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
    showToast('Failed to export chat history. Please try again.', 'error');
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
    }, 6000); 

    return () => clearInterval(interval);
  }
}, [isLoading]); 



  const handleClearChat = useCallback(() => {
    Swal.fire({
      title: "Clear all conversations?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, clear it!",
      cancelButtonText: "Cancel",
      background: isDarkMode ? '#1e293b' : '#ffffff', 
      color: isDarkMode ? '#e2e8f0' : '#1e293b', 
      confirmButtonColor: '#dc2626', 
      cancelButtonColor: isDarkMode ? '#475569' : '#e2e8f0', 
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
    await fetch(`/api/logout`, {
      method: "POST",
      credentials: "include",
    });

    setAuth({ loggedIn: false, role: null, username: null, loading: false });

    sessionStorage.clear(); 
    
    localStorage.removeItem(`chatHistory_${username}`);
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("role");
    localStorage.removeItem("darkMode");

    setMessages([]);

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
    { 
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" fill="#3B82F6" fillOpacity="0.15" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2V8H20" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 13H8" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 17H8" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 9H9H8" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        ), 
        label: 'Digital Law Library', 
        path: '/lawpdf' 
    },
    { 
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3V21" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 7L12 3L21 7L12 11L3 7Z" fill="#8B5CF6" fillOpacity="0.15" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5.5 13.5L3 17L12 21L21 17L18.5 13.5" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        ), 
        label: 'Legal Resources', 
        path: '/resources' 
    },
    { 
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" fill="#10B981" fillOpacity="0.15" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 7H15" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 11H13" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        ), 
        label: 'Genie Quiz', 
        path: '/quizz' 
    },
    { 
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="8" r="4" fill="#F59E0B" fillOpacity="0.15" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 20C4 17.7909 7.58172 16 12 16C16.4183 16 20 17.7909 20 20" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        ), 
        label: 'My Account', 
        path: '/myaccount' 
    }
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

  useEffect(() => {
    if (!isExportPopupOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsExportPopupOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isExportPopupOpen]);

if (bootLoading && !error) {
  return (
    <div className="relative w-full h-full min-h-[calc(100vh-100px)] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-100 dark:bg-blue-900/40 overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-blue-600 dark:bg-blue-400"
          style={{
            width: '100%',
            transformOrigin: '0% 50%',
            animation: 'indeterminate-animation 1.5s infinite linear'
          }}
        ></div>
      </div>

      <div className="flex flex-col items-center animate-fadeIn max-w-sm px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center mb-5 shadow-card">
          <Loader size={26} className="text-blue-600 dark:text-blue-400 animate-spin" />
        </div>
        <p className="text-base sm:text-lg font-poppins font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Getting everything ready for you...
        </p>
        <p className="text-xs sm:text-sm font-manrope text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
          We are setting up your workspace. Just a moment!
        </p>

        <button
          onClick={handleLogout}
          className="mt-6 px-4 py-2 text-xs sm:text-sm font-manrope font-medium text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
        >
          Cancel and Logout
        </button>
      </div>
    </div>
  );
}

if (error) {
  return (
    <div className="w-full min-h-[calc(100vh-100px)] flex items-center justify-center px-4 md:px-8 py-10 bg-slate-50 dark:bg-slate-950 font-manrope">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-card p-6 sm:p-8 animate-fadeIn">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 rounded-xl flex-shrink-0 flex items-center justify-center border border-red-100 dark:border-red-500/20">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-poppins font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 tracking-tight">
              Oops, something went wrong
            </h3>
            <p className="text-xs sm:text-sm font-manrope text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              We couldn't load your chat right now. Please check your internet connection and give it another try.
            </p>
            {error && (
              <div className="mt-3 p-3 bg-red-50/60 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 rounded-xl">
                <p className="text-[11px] sm:text-xs text-red-600 dark:text-red-400 font-mono break-all">
                  {error}
                </p>
              </div>
            )}

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => fetchUserData()}
                className="px-4 py-2 text-xs sm:text-sm font-manrope font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] rounded-xl shadow-sm transition-all duration-150"
              >
                Try Again
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-xs sm:text-sm font-manrope font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors duration-150"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

return (
  <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden">

    {/* Sidebar */}
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-72 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transform transition-transform duration-300 ease-premium lg:static lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between h-16 px-5 border-b border-slate-100 dark:border-slate-800">
       <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
          <img
            src="/images/jg_original_logo_1.png"
            alt="Justice Genie"
            className="w-8 h-8 object-contain"
          />
        </div>

        <h1 className="text-[15px] font-poppins font-bold text-slate-900 dark:text-slate-50 tracking-tight">
          Justice Genie
        </h1>
      </div>
        <button
          className="lg:hidden p-2 rounded-md text-slate-400 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800 transition-colors"
          onClick={toggleSidebar}
          aria-label="Close sidebar"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
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
                <User size={18} className="text-slate-400" />
              )}
            </div>
            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white dark:ring-slate-900 ${isOnline ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}></span>
          </div>
          <div className="min-w-0">
            <h3 className="font-poppins text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{username || 'Guest User'}</h3>
            <span className="text-xs font-manrope text-slate-400 dark:text-slate-500">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <h4 className="px-3 text-[11px] font-manrope font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-600 mb-2">Tools</h4>
          <div className="space-y-0.5">
            {navItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className="group relative flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-manrope font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-colors duration-150"
                onClick={(e) => {
                  if (!isOnline) {
                    e.preventDefault();
                    showToast('This feature is not available offline', 'warning');
                  }
                }}
              >
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-0 w-0.5 bg-blue-600 rounded-r-full group-hover:h-5 transition-all duration-200 ease-premium"></span>
                <span className="text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h4 className="px-3 text-[11px] font-manrope font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-600 mb-2">Preferences</h4>
          <div className="space-y-0.5">
            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-manrope font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-colors duration-150"
              onClick={toggleDarkMode}
            >
              {isDarkMode ? (
                <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="5" fill="#F59E0B" fillOpacity="0.15" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 2V4" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 20V22" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4.92993 4.92993L6.34993 6.34993" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17.65 17.65L19.07 19.07" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12H4" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 12H22" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4.92993 19.07L6.34993 17.65" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17.65 6.34993L19.07 4.92993" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#6366F1" fillOpacity="0.15" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-manrope font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              onClick={handleClearChat}
              disabled={messages.length === 0}
            >
              <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6H5H21" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" fill="#EF4444" fillOpacity="0.15" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 11V17" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 11V17" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Clear Chat</span>
            </button>

            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-manrope font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors duration-150"
              onClick={handleLogout}
            >
              <svg className="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 17L21 12L16 7" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12H9" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 text-[11px] font-manrope text-slate-400 dark:text-slate-600">
        <p>© 2025 Justice Genie</p>
      </div>
    </aside>

    {/* Main area */}
    <main className="flex-1 flex flex-col min-w-0">
      <header className="flex items-center gap-2 sm:gap-3 h-14 sm:h-16 px-4 sm:px-6 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <button
          className="lg:hidden p-2 -ml-2 rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          onClick={toggleSidebar}
          aria-label="Open sidebar"
        >
          <Menu size={20} className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h2 className="font-poppins font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-[15px] truncate">Understand Your Legal Rights</h2>
        </div>
        {!isOnline && (
          <span className="flex items-center gap-1.5 text-[10px] sm:text-xs font-manrope font-medium text-amber-700 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 px-2 sm:px-2.5 py-1 rounded-md ml-auto flex-shrink-0">
            <AlertCircle size={13} />
            Offline
          </span>
        )}
      </header>

      {error && (
        <div className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs sm:text-sm font-manrope">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6" ref={chatBoxRef}>
        <div className="max-w-3xl mx-auto space-y-4 sm:space-y-5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center max-w-lg mx-auto py-10 sm:py-16 md:py-20 animate-revealUp">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-4 sm:mb-5 shadow-card">
              <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-poppins font-bold text-lg sm:text-xl text-slate-900 dark:text-slate-100">Start Your Legal Conversation</h3>
            <p className="font-manrope text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm px-4 sm:px-0">Ask any legal question and get expert guidance from Justice Genie</p>
            <div className="flex flex-col gap-2.5 mt-6 sm:mt-7 w-full">
              {[
                "What are my rights as a tenant?",
                "How do I file a small claims case?",
                "Explain employment discrimination laws"
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => handleSampleQuestion(q)}
                  className="group font-manrope text-xs sm:text-sm text-left px-3 sm:px-4 py-3 sm:py-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 shadow-card hover:shadow-card-hover hover:border-blue-200 dark:hover:border-blue-500/40 hover:-translate-y-0.5 transition-all duration-200 ease-premium flex items-center justify-between"
                >
                  <span>{q}</span>
                  <Send size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors flex-shrink-0 ml-3" />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-2.5 sm:gap-3 animate-revealUp ${message.type === "user" ? "flex-row-reverse" : ""}`}
          >
           {message.type === "user" ? (
              profilePicture ? (
                <img src={profilePicture} alt="You" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0 mt-0.5" />
              ) : (
                <svg className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="8" r="4" fill="#F59E0B" fillOpacity="0.15" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 20C4 17.7909 7.58172 16 12 16C16.4183 16 20 17.7909 20 20" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )
            ) : (
              <img
                src="/images/justice_genie_avatar.png"
                alt="Justice Genie"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover flex-shrink-0 mt-0.5"
              />
            )}

            <div className={`flex flex-col max-w-[92%] sm:max-w-[80%] md:max-w-[75%] ${message.type === "user" ? "items-end" : "items-start"}`}>
              <div
                className={`font-manrope text-sm sm:text-[14.5px] leading-relaxed px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg shadow-card ${
                  message.type === "user"
                    ? "bg-slate-800 dark:bg-slate-700 text-white rounded-tr-md"
                    : "bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-md"
                }`}
              >
                <div className={message.type === "user" ? "prose-invert" : ""}>
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
                {message.analysis && <AnalysisReport data={message.analysis} />}
              </div>

              {/* Actions - bot messages only */}
              {message.type === "bot" && (
                <div className="flex items-center gap-0.5 mt-1.5 text-slate-300 dark:text-slate-600">
                  <button
                    className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 active:scale-90 transition-all duration-150"
                    onClick={() => {
                      navigator.clipboard.writeText(message.content);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 4000);
                    }}
                    title="Copy"
                    aria-label="Copy message"
                  >
                    {copied ? <Check size={14} className="text-green-500" /> : <Clipboard size={14} />}
                  </button>

                  <button
                    onClick={() => setFeedback(feedback === "up" ? null : "up")}
                    className={`p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition-all duration-150 ${feedback === "up" ? "text-green-600" : "hover:text-slate-600 dark:hover:text-slate-300"}`}
                    title="Thumbs Up"
                    aria-label="Mark response as helpful"
                  >
                    <ThumbsUp size={14} />
                  </button>
                  <button
                    onClick={() => setFeedback(feedback === "down" ? null : "down")}
                    className={`p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition-all duration-150 ${feedback === "down" ? "text-red-600" : "hover:text-slate-600 dark:hover:text-slate-300"}`}
                    title="Thumbs Down"
                    aria-label="Mark response as not helpful"
                  >
                    <ThumbsDown size={14} />
                  </button>

                  <div className="relative" ref={menuRef}>
                    {!message.translated ? (
                      <button
                        className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 active:scale-90 transition-all duration-150"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTranslateMessageId((prev) =>
                            prev === message.id ? null : message.id
                          );
                        }}
                        title="Translate"
                        aria-label="Translate message"
                      >
                        <Globe size={14} />
                      </button>
                    ) : (
                      <button
                        className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 active:scale-90 transition-all duration-150"
                        onClick={() => handleRestore(message.id)}
                        title="Restore"
                        aria-label="Restore original message"
                      >
                        <RotateCcw size={14} />
                      </button>
                    )}

                    {activeTranslateMessageId === message.id && (
                      <div className="absolute z-10 bottom-full mb-2 left-0 sm:-left-10 w-48 sm:w-56 max-h-64 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-elevated font-manrope text-xs sm:text-sm animate-scaleIn origin-bottom-left">
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
                              className="px-3 py-2 sm:px-3.5 sm:py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                              onClick={() => handleTranslate(message.id, code, message.content)}
                            >
                              {name} <span className="text-slate-400 dark:text-slate-500">({native})</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {!speakingMessageId || speakingMessageId !== message.id ? (
                    <button
                      className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 active:scale-90 transition-all duration-150"
                      onClick={() => speakText(message.content, message.id)}
                      title="Listen"
                      aria-label="Listen to message"
                    >
                      <Volume2 size={14} />
                    </button>
                  ) : (
                    <button
                      className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 active:scale-90 transition-all duration-150"
                      onClick={stopSpeech}
                      title="Stop"
                      aria-label="Stop speaking"
                    >
                      <SquareDotIcon size={14} />
                    </button>
                  )}

                  {!message.analysis && (
                    <div className="relative">
                      <button
                        className="graph-button p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300 active:scale-90 transition-all duration-150 disabled:opacity-40"
                        onClick={() => {
                          if (!analyzingMessageId) {
                            setPopupMessageId(popupMessageId === message.id ? null : message.id);
                          }
                        }}
                        title="Analyze Probability"
                        aria-label="Analyze case probability"
                        disabled={analyzingMessageId}
                      >
                        {analyzingMessageId === message.id ? (
                          <Loader size={14} className="animate-spin" />
                        ) : (
                          <BarChart size={14} />
                        )}
                      </button>

                      {popupMessageId === message.id && message.type === "bot" && (
                        <div className="graph-popup absolute z-10 bottom-full mb-2 left-0 sm:left-auto sm:right-0 w-56 sm:w-60 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-elevated p-3 sm:p-4 animate-scaleIn origin-bottom-left sm:origin-bottom-right">
                          <p className="font-poppins text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">Analyze this query?</p>
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              className="font-manrope text-[10px] sm:text-xs font-medium px-2 sm:px-3 py-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                              onClick={() => setPopupMessageId(null)}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="font-manrope text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all duration-150"
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
          <div className="flex items-start gap-2.5 sm:gap-3 animate-revealUp">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md flex-shrink-0 flex items-center justify-center bg-blue-50 dark:bg-blue-500/10 mt-0.5">
              <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
            </div>
            <div className="flex items-center gap-2.5 px-3 sm:px-4 py-2 sm:py-3 rounded-lg rounded-tl-md bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-card font-manrope text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 animate-pulse [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 animate-pulse [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 animate-pulse"></span>
              </span>
              <span>{loadingMessage}</span>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-slate-200/70 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl px-3 sm:px-5 py-3">
        <div className="max-w-3xl mx-auto">

          <div className="rounded-[28px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm transition-all duration-200 focus-within:border-slate-300 dark:focus-within:border-slate-600 focus-within:shadow-md">

            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto"; // Changed from 0px for smoother resizing
                el.style.height = `${Math.min(el.scrollHeight, 192)}px`;
              }}
              onKeyDown={(e) => {
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
              rows={1}
              // ❌ REMOVED: style={{ height: "32px" }}
              disabled={!isOnline || isLoading}
              className="w-full resize-none overflow-y-auto bg-transparent border-0 outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 shadow-none px-4 sm:px-5 pt-3 sm:pt-4 pb-2 text-sm sm:text-[15px] leading-6 sm:leading-7 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 max-h-48 font-manrope"
            />

            <div className="flex items-center justify-between px-2 sm:px-3 pb-2 sm:pb-3">

              <button
                onClick={() => setIsExportPopupOpen(true)}
                onMouseDown={(e) => e.currentTarget.blur()}
                disabled={messages.length === 0 || !isOnline}
                title="Export conversation"
                className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition disabled:opacity-40"
              >
                <Download size={16} className="w-[15px] h-[15px] sm:w-[18px] sm:h-[18px]" />
              </button>

              <div className="flex items-center gap-1 sm:gap-2">

                <button
                  onClick={handleMicClick}
                  title={isListening ? "Stop listening" : "Voice input"}
                  aria-label="Voice input"
                  className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full transition ${
                    isListening
                      ? "bg-red-100 text-red-600 dark:bg-red-500/20"
                      : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
                >
                  {isListening ? (
                    <Mic className="w-[15px] h-[15px] sm:w-[18px] sm:h-[18px]" />
                  ) : (
                    <MicOff className="w-[15px] h-[15px] sm:w-[18px] sm:h-[18px]" />
                  )}
                </button>

                <button
                  onClick={isLoading ? handleStopRequest : handleSendMessage}
                  disabled={!isOnline || (!input.trim() && !isLoading)}
                  className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full transition-all active:scale-95 ${
                    input.trim() || isLoading
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-card hover:shadow-card-hover"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600"
                  } disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <XCircle className="w-[15px] h-[15px] sm:w-[18px] sm:h-[18px]" />
                  ) : (
                    <Send className="w-[15px] h-[15px] sm:w-[18px] sm:h-[18px]" />
                  )}
                </button>

              </div>

            </div>

          </div>

        </div>
      </div>
    </main>

    {/* Mobile overlay */}
    {sidebarOpen && (
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-30 lg:hidden animate-fadeIn" onClick={toggleSidebar}></div>
    )}

    {/* Export PDF modal */}
    {isExportPopupOpen && (
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center px-4 animate-fadeIn"
        onClick={() => setIsExportPopupOpen(false)}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-pdf-title"
          className="bg-white dark:bg-slate-800 rounded-lg shadow-elevated w-full max-w-sm p-5 sm:p-6 animate-scaleIn"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 id="export-pdf-title" className="font-poppins font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 mb-1">Export Chat as PDF</h3>
          <p className="font-manrope text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4">Enter a filename for your PDF:</p>
          <input
            type="text"
            value={pdfFilename}
            onChange={(e) => setPdfFilename(e.target.value)}
            className="w-full font-manrope text-xs sm:text-sm px-3.5 py-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all duration-150 mb-5"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsExportPopupOpen(false)}
              className="font-manrope text-xs sm:text-sm font-medium px-4 py-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExportPDF}
              className="font-manrope text-xs sm:text-sm font-semibold px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-card hover:shadow-card-hover transition-all duration-150"
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