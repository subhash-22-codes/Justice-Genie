import React, { useState } from 'react';
import '../styles/login.css';
import { motion } from 'framer-motion';
import { Link} from "react-router-dom";
import { useNavigate } from 'react-router-dom';
const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isGenieOpen, setIsGenieOpen] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputFocus = () => {
    if (loginMessage) setLoginMessage('');
  };

  // Genie animation handler
  const toggleGenie = () => {
    setIsGenieOpen(!isGenieOpen);
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setLoginMessage('Please fill in all fields');
      return;
    }
  
    setLoading(true);
    setLoginMessage('');
  
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
  
      if (!response.ok) {
        throw new Error('Invalid credentials');
      }
  
      const data = await response.json(); // contains isAdmin
  
      setLoginMessage('Login successful!');
      setTimeout(() => {
        sessionStorage.setItem('isLoggedIn', 'true');           // ✅ Required for ProtectedRoute
        sessionStorage.setItem('isAdmin', data.isAdmin);        // Optional
  
        if (data.isAdmin) {
          navigate('/admin');
        } else {
          navigate('/chat');
        }
      }, 1000);
    } catch (error) {
      setLoginMessage(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  return (
    <motion.div
      className="login-wrapper"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="login-page-container">
        <div className="login-left-panel">
          <img
            src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
            alt="Justice Scale"
            className="login-background-image"
          />
          <div className="login-overlay"></div>
          <div className="login-brand-content">
          <img 
            src="./images/JGLogo.png" 
            alt="Justice Genie Logo" 
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain mt-4 mb-4" 
          />
            <p className="login-brand-subtitle"><strong>Justice Genie 2.0</strong></p>
            <p className="login-welcome-message">
              Welcome to <strong>GENIE</strong>! Log in to unlock a world of legal insights and resources tailored to your needs.
            </p>
            <div className="login-law-icons">
              <div className="login-icon-container">
                <img src="./images/ai.png" alt="Law Icon 1" className="login-icon" />
              </div>
              <div className="login-icon-container">
                <img src="./images/just.png" alt="Law Icon 2" className="login-icon" />
              </div>
              <div className="login-icon-container">
                <img src="./images/lawyer1.png" alt="Law Icon 3" className="login-icon" />
              </div>
              <div className="login-icon-container">
                <img src="./images/hammer.png" alt="Law Icon 4" className="login-icon" />
              </div>
            </div>
          </div>
        </div>

        <div className="login-right-panel">
          <div className="login-container">
            <h2 className="login-heading">Welcome Back</h2>
            <p className="login-subtitle">Sign in to continue</p>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="login-input-group">
                <input
                  type="text"
                  id="username"
                  value={username}
                  onFocus={handleInputFocus}
                  onChange={(e) => setUsername(e.target.value)}
                  className="login-input"
                  required
                />
                <label htmlFor="username" className="login-label">Username or Registered Email</label>

                <div className="login-input-line"></div>
              </div>

              <div className="login-input-group">
                <input
                  type={isGenieOpen ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onFocus={handleInputFocus}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input"
                  required
                />
                <label htmlFor="password" className="login-label">Password</label>
                <div className="login-input-line"></div>
                <div id="genie" className="login-genie" onClick={toggleGenie}>
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/1680/1680326.png"
                    alt="Genie"
                    className={isGenieOpen ? 'login-genie-open' : 'login-genie-closed'}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center w-full mt-4 text-sm text-gray-700">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span>Remember me</span>
                </label>

                <Link
                  to="/forgotpassword"
                  className="text-indigo-600 hover:text-indigo-700 transition-colors duration-200 whitespace-nowrap"
                >
                  Forgot Password?
                </Link>
              </div>



              <button type="submit" className={`login-button ${loading ? 'login-loading' : ''}`}>
                <span className="login-button-text">Login</span>
                <div className="login-spinner"></div>
              </button>
            </form>

            <p className="login-register-link">
              Don't have an account?{' '}
              <Link to="/register" className="login-register-anchor">Create one now</Link>
            </p>

            {loginMessage && (
              <div
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium text-center mb-4 border ${
                  loginMessage.toLowerCase().includes('successful')
                    ? 'bg-white text-green-600 border-green-300'
                    : 'bg-white text-red-600 border-red-300'
                }`}
              >
                {loginMessage}
              </div>
            )}


          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Login;