import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';
import { Loader } from 'lucide-react';

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
    setLoginMessage('🌐 Contacting server… it may take a few seconds if it’s waking up');

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) throw new Error('Invalid credentials');

      const data = await response.json();

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
      className="w-full min-h-screen flex items-center justify-center bg-slate-50 p-4 sm:p-8"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="flex flex-col lg:flex-row w-full max-w-6xl h-auto lg:h-[800px] max-h-[90vh] rounded-sm overflow-hidden shadow-xl bg-white">

        {/* Left panel - brand image */}
        <div className="relative flex-1 min-h-[280px] lg:min-h-0 overflow-hidden group">
          <img
            src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
            alt="Justice Scale"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/80 to-black/60"></div>
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-8 py-12">
            <p className="font-poppins text-lg sm:text-xl font-light opacity-90 mb-6"><strong className="font-semibold">Justice Genie</strong></p>
            <p className="font-manrope text-sm sm:text-base leading-relaxed opacity-85 mb-10 max-w-md">
              Welcome to <strong className="text-amber-300 font-bold">GENIE</strong>! Log in to unlock a world of legal insights and resources tailored to your needs.
            </p>
            <div className="flex justify-center gap-3 sm:gap-6 flex-wrap">
              {['ai.png', 'just.png', 'lawyer1.png', 'hammer.png'].map((icon, i) => (
                <div key={i} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:bg-white/25">
                  <img src={`./images/${icon}`} alt={`Law Icon ${i + 1}`} className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel - form */}
        <div className="flex-1 flex items-center justify-center bg-white p-6 sm:p-10">
          <div className="w-full max-w-sm">
            <h2 className="font-poppins text-2xl sm:text-3xl font-bold text-slate-800 mb-1">Welcome Back</h2>
            <p className="font-manrope text-slate-500 text-sm mb-8">Sign in to continue</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="relative">
                <input
                  type="text"
                  id="username"
                  value={username}
                  onFocus={handleInputFocus}
                  onChange={(e) => setUsername(e.target.value)}
                  className="peer w-full py-2 font-manrope text-sm sm:text-base bg-transparent border-0 border-b-2 border-slate-200 outline-none text-slate-800 focus:border-blue-600"
                  required
                />
                <label
                  htmlFor="username"
                  className="absolute left-0 top-2 font-manrope text-slate-400 pointer-events-none transition-all duration-200 peer-focus:-top-3.5 peer-focus:text-xs peer-focus:text-blue-600 peer-valid:-top-3.5 peer-valid:text-xs peer-valid:text-blue-600"
                >
                  Username or Registered Email
                </label>
              </div>

              <div className="relative">
                <input
                  type={isGenieOpen ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onFocus={handleInputFocus}
                  onChange={(e) => setPassword(e.target.value)}
                  className="peer w-full py-2 pr-8 font-manrope text-sm sm:text-base bg-transparent border-0 border-b-2 border-slate-200 outline-none text-slate-800 focus:border-blue-600"
                  required
                />
                <label
                  htmlFor="password"
                  className="absolute left-0 top-2 font-manrope text-slate-400 pointer-events-none transition-all duration-200 peer-focus:-top-3.5 peer-focus:text-xs peer-focus:text-blue-600 peer-valid:-top-3.5 peer-valid:text-xs peer-valid:text-blue-600"
                >
                  Password
                </label>
                <div
                  id="genie"
                  className="absolute right-0 top-1/2 -translate-y-1/2 cursor-pointer w-5 h-5"
                  onClick={toggleGenie}
                >
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/1680/1680326.png"
                    alt="Genie"
                    className={`w-full h-full object-contain transition-all duration-200 ${isGenieOpen ? 'opacity-100 scale-110' : 'opacity-70'}`}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center w-full text-sm text-slate-600 font-manrope">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <span>Remember me</span>
                </label>

                <Link
                  to="/forgotpassword"
                  className="text-blue-600 hover:text-blue-700 transition-colors duration-200 whitespace-nowrap"
                >
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                className="relative w-full py-3 rounded-sm bg-blue-600 hover:bg-blue-700 text-white font-manrope font-semibold transition-colors disabled:opacity-70 flex items-center justify-center"
                disabled={loading}
              >
                <span className={loading ? 'opacity-0' : 'opacity-100'}>
                  Login
                </span>
                {loading && (
                  <span className="absolute inset-0 flex items-center justify-center gap-2">
                    <Loader size={18} className="animate-spin" />
                    <span className="text-sm">Waking up server…</span>
                  </span>
                )}
              </button>
            </form>

            <p className="text-center mt-6 text-sm text-slate-500 font-manrope">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 font-semibold hover:underline">Create one now</Link>
            </p>

            {loginMessage && (
              <div
                className={`w-full px-4 py-2 rounded-sm text-sm font-medium text-center mt-4 border font-manrope
                  ${
                    loginMessage.toLowerCase().includes('successful')
                      ? 'bg-white text-green-600 border-green-300'
                      : loginMessage.toLowerCase().includes('contacting')
                      ? 'bg-white text-blue-600 border-blue-300'
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
