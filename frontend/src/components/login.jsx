import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';
import { Loader, Eye, EyeOff } from 'lucide-react';
import GoogleSignInButton from './GoogleSignInButton';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isGenieOpen, setIsGenieOpen] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useContext(AuthContext); // use context
  const navigate = useNavigate();

  const handleInputFocus = () => {
    if (loginMessage) setLoginMessage('');
  };

  // Genie animation toggle
  const toggleGenie = () => {
    setIsGenieOpen(!isGenieOpen);
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setLoginMessage('Please fill in all fields');
      return;
    }

    setLoading(true);
    setLoginMessage('Contacting server, this may take a few seconds if it\u2019s waking up.');

    try {
      const response = await fetch(`/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) throw new Error('Invalid credentials');

      const data = await response.json();

      // A previous account's cached name/photo must never survive into a
      // new login - always start clean the moment a login succeeds.
      sessionStorage.removeItem("userData");

      // Update context immediately
      setAuth({
        loggedIn: true,
        role: data.role || (data.isAdmin ? 'admin' : 'user'),
        username: data.username,
        loading: false
      });

      // Persist in localStorage for reloads
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('role', data.role || (data.isAdmin ? 'admin' : 'user'));
      localStorage.setItem('username', data.username);
      toast.success('Login successful!');

      // Navigate after context update
      navigate(data.role === 'admin' ? '/admin' : '/chat', { replace: true });

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
      className="w-full min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 px-4 py-6 sm:p-8"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="flex flex-col lg:flex-row w-full max-w-6xl lg:h-[720px] rounded-lg overflow-hidden shadow-elevated bg-white dark:bg-slate-900">

        {/* Left panel - brand image, desktop/laptop only */}
        <div className="hidden lg:block relative flex-1 overflow-hidden group">
          <img
            src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
            alt="Justice Scale"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 to-slate-900/60"></div>
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-10 py-12">
            <p className="font-poppins text-xl font-semibold mb-4">Justice Genie</p>
            <p className="font-manrope text-sm leading-relaxed text-slate-200 mb-10 max-w-md">
              Log in to unlock a world of legal insights and resources tailored to your needs.
            </p>
            <div className="flex justify-center gap-4">
              {['ai.png', 'just.png', 'lawyer1.png', 'hammer.png'].map((icon, i) => (
                <div key={i} className="w-10 h-10 sm:w-12 sm:h-12 rounded-md bg-white/10 backdrop-blur-sm flex items-center justify-center transition-all duration-200 ease-premium hover:-translate-y-1 hover:bg-white/20">
                  <img src={`./images/${icon}`} alt="" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel - form */}
        <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-900 px-5 py-8 sm:p-10">
          <div className="w-full max-w-sm animate-revealUp">
            
            {/* Mobile Branding (Hidden on Desktop) */}
            <div className="flex items-center gap-2.5 mb-8 lg:hidden justify-center sm:justify-start">
              <img src="/images/jg_original_logo_1.png" alt="Justice Genie" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
              <h1 className="font-poppins font-bold text-xl sm:text-2xl text-slate-900 dark:text-slate-100 tracking-tight">Justice Genie</h1>
            </div>

            <h2 className="font-poppins text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1 text-center sm:text-left">Welcome Back</h2>
            <p className="font-manrope text-slate-400 dark:text-slate-500 text-xs sm:text-sm mb-8 text-center sm:text-left">Sign in to continue</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5 sm:gap-6">
              <div className="relative mt-2 sm:mt-0">
                <input
                  type="text"
                  id="username"
                  value={username}
                  onFocus={handleInputFocus}
                  onChange={(e) => setUsername(e.target.value)}
                  className="peer w-full py-2 font-manrope text-sm sm:text-base bg-transparent border-0 border-b-2 border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-slate-100 focus:border-blue-600 transition-colors duration-150"
                  required
                />
                <label
                  htmlFor="username"
                  className="absolute left-0 top-2 font-manrope text-xs sm:text-sm text-slate-400 dark:text-slate-500 pointer-events-none transition-all duration-200 ease-premium peer-focus:-top-3.5 peer-focus:text-[10px] sm:peer-focus:text-xs peer-focus:text-blue-600 peer-valid:-top-3.5 peer-valid:text-[10px] sm:peer-valid:text-xs peer-valid:text-blue-600"
                >
                  Username or Registered Email
                </label>
              </div>

              <div className="relative mt-2 sm:mt-0">
                <input
                  type={isGenieOpen ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onFocus={handleInputFocus}
                  onChange={(e) => setPassword(e.target.value)}
                  className="peer w-full py-2 pr-8 font-manrope text-sm sm:text-base bg-transparent border-0 border-b-2 border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-slate-100 focus:border-blue-600 transition-colors duration-150"
                  required
                />
                <label
                  htmlFor="password"
                  className="absolute left-0 top-2 font-manrope text-xs sm:text-sm text-slate-400 dark:text-slate-500 pointer-events-none transition-all duration-200 ease-premium peer-focus:-top-3.5 peer-focus:text-[10px] sm:peer-focus:text-xs peer-focus:text-blue-600 peer-valid:-top-3.5 peer-valid:text-[10px] sm:peer-valid:text-xs peer-valid:text-blue-600"
                >
                  Password
                </label>
                <button
                  type="button"
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  onClick={toggleGenie}
                  aria-label={isGenieOpen ? "Hide password" : "Show password"}
                >
                  {isGenieOpen ? <EyeOff size={16} className="sm:w-5 sm:h-5" /> : <Eye size={16} className="sm:w-5 sm:h-5" />}
                </button>
              </div>

              <div className="flex justify-between items-center w-full text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-manrope mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500/40"
                  />
                  <span>Remember me</span>
                </label>

                <Link
                  to="/forgotpassword"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-150 whitespace-nowrap"
                >
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                className="relative w-full py-2.5 sm:py-3 mt-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-manrope text-sm sm:text-base font-semibold shadow-card hover:shadow-card-hover active:scale-[0.98] transition-all duration-150 disabled:opacity-70 flex items-center justify-center"
                disabled={loading}
              >
                <span className={loading ? 'opacity-0' : 'opacity-100'}>
                  Login
                </span>
                {loading && (
                  <span className="absolute inset-0 flex items-center justify-center gap-2">
                    <Loader size={16} className="animate-spin sm:w-5 sm:h-5" />
                    <span>Logging in...</span>
                  </span>
                )}
              </button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs text-slate-400 dark:text-slate-500 font-manrope">or</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>

            <GoogleSignInButton />

            <p className="text-center mt-6 text-xs sm:text-sm text-slate-400 dark:text-slate-500 font-manrope">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Create one now</Link>
            </p>

            {loginMessage && (
              <div
                role="alert"
                className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-md text-xs sm:text-sm font-medium text-center mt-4 font-manrope animate-fadeIn
                  ${
                    loginMessage.toLowerCase().includes('successful')
                      ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400'
                      : loginMessage.toLowerCase().includes('logging in')
                      ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
                      : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'
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