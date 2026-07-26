import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2';
import { Link, useNavigate } from "react-router-dom";
import Mailcheck from 'mailcheck';
import {
  AlertTriangle, CheckCircle, Loader, Eye, EyeOff, RotateCw
} from 'lucide-react';
import GoogleSignInButton from './GoogleSignInButton';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageColor, setMessageColor] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [profession, setProfession] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleInputFocus = () => {
    if (message) setMessage('');
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const validateEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePassword(password)) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    if (!profession) {
      toast.error('Please select your profession.');
      return;
    }

    if (!validateEmail(email)) {
      toast.error('Invalid email format. Please enter a valid email address.');
      return;
    }

    Mailcheck.run({
      email: email,
      suggested: function (suggestion) {
        setMessage(`Did you mean ${suggestion.full}?`);
        setMessageColor('red');
        return;
      },
      empty: async function () {
        setMessage('');

        const confirmEmail = await Swal.fire({
          title: 'Confirm Email',
          text: `Is this your correct email? ${email}`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#2563eb', 
          cancelButtonColor: '#ef4444',
          confirmButtonText: 'Yes, proceed!',
          cancelButtonText: 'No, let me check',
          customClass: {
            container: 'font-manrope'
          }
        });

        if (!confirmEmail.isConfirmed) return;

        setIsLoading(true);
        try {
          const response = await fetch(`/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username,
              email,
              password,
              profession
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            setMessage(data.error || 'Registration failed');
            setMessageColor('red');
            setIsVerified(false);
            toast.error(data.error || 'Registration failed');

            if (data.error === 'Username already exists. Please choose a different username.') {
              setUsername('');
            }
          } else {
            setMessage('Verify your email here! Please check your email for the code.');
            setMessageColor('green');
            setIsVerified(true);
            toast.success('Please check your email/Spam for the verification code.');
          }
        } catch (error) {
          setMessage('Something went wrong.');
          setMessageColor('red');
          toast.error('Something went wrong. Please try again later.');
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); 

    try {
      const response = await fetch(`/api/verify_code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          verification_code: verificationCode,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage('Verification successful. You can now log in.');
        setMessageColor('green');
        toast.success('Verification successful! Redirecting to login...');

        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setMessage(data.error || 'Verification failed.');
        setMessageColor('red');
        toast.error(data.error || 'Verification failed.');
      }
    } catch (error) {
      setMessage('Something went wrong.');
      setMessageColor('red');
      toast.error('Something went wrong. Please try again later.');
    } finally {
      setIsLoading(false); 
    }
  };

  const handleResendCode = async () => {
    const confirmResend = await Swal.fire({
      title: 'Resend Code?',
      text: 'Are you sure you want to resend the verification code?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2563eb', 
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, resend!',
      customClass: {
        container: 'font-manrope'
      }
    });

    if (!confirmResend.isConfirmed) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/resend_verification_code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage('Verification code has been resent to your email.');
        setMessageColor('green');
        toast.success('Verification code has been resent to your email.');
      } else {
        setMessage(data.error || 'Failed to resend verification code.');
        setMessageColor('red');
        toast.error(data.error || 'Failed to resend verification code.');
      }
    } catch (error) {
      setMessage('Something went wrong.');
      setMessageColor('red');
      toast.error('Something went wrong. Please try again later.');
    } finally {
      setIsLoading(false);
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
        
        {/* Left panel - brand image */}
        <div className="hidden lg:block relative flex-1 overflow-hidden group">
          <img
            src="/images/GenieTemplate.png" 
            alt="Justice Genie Template"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 to-slate-900/60"></div>
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-10 py-12">
            <p className="font-poppins text-xl font-semibold mb-4">Justice Genie</p>
            <p className="font-manrope text-sm leading-relaxed text-slate-200 mb-10 max-w-md">
              Create an account to unlock a world of legal insights and resources tailored to your needs.
            </p>
            <div className="flex justify-center gap-4">
              {['ai.png', 'just.png', 'lawyer1.png', 'hammer.png'].map((icon, i) => (
                <div key={i} className="w-10 h-10 sm:w-12 sm:h-12 rounded-md bg-white/10 backdrop-blur-sm flex items-center justify-center transition-all duration-200 ease-premium hover:-translate-y-1 hover:bg-white/20">
                  <img src={`/images/${icon}`} alt="" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" onError={(e) => e.target.style.display='none'} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel - form */}
        <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-900 px-5 py-8 sm:p-10 custom-scrollbar overflow-y-auto">
          {!isVerified ? (
            <div className="w-full max-w-md animate-revealUp">
              
              {/* Mobile Branding (Hidden on Desktop) */}
              <div className="flex items-center gap-2.5 mb-8 lg:hidden justify-center sm:justify-start">
                <img src="/images/jg_original_logo_1.png" alt="Justice Genie" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
                <h1 className="font-poppins font-bold text-xl sm:text-2xl text-slate-900 dark:text-slate-100 tracking-tight">Justice Genie</h1>
              </div>

              <h2 className="font-poppins text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1 text-center sm:text-left">Create Account</h2>
              <p className="font-manrope text-slate-400 dark:text-slate-500 text-xs sm:text-sm mb-8 text-center sm:text-left">Join early users exploring AI-powered legal assistance.</p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5 sm:gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5 sm:gap-y-6">
                  
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
                      Username
                    </label>
                  </div>

                  <div className="relative mt-2 sm:mt-0">
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onFocus={handleInputFocus}
                      onChange={(e) => setEmail(e.target.value)}
                      className="peer w-full py-2 font-manrope text-sm sm:text-base bg-transparent border-0 border-b-2 border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-slate-100 focus:border-blue-600 transition-colors duration-150"
                      required
                    />
                    <label
                      htmlFor="email"
                      className="absolute left-0 top-2 font-manrope text-xs sm:text-sm text-slate-400 dark:text-slate-500 pointer-events-none transition-all duration-200 ease-premium peer-focus:-top-3.5 peer-focus:text-[10px] sm:peer-focus:text-xs peer-focus:text-blue-600 peer-valid:-top-3.5 peer-valid:text-[10px] sm:peer-valid:text-xs peer-valid:text-blue-600"
                    >
                      Email Address
                    </label>
                  </div>

                  <div className="relative mt-2 sm:mt-0 sm:col-span-2">
                    <select
                      id="profession"
                      value={profession}
                      onFocus={handleInputFocus}
                      onChange={(e) => setProfession(e.target.value)}
                      className="peer w-full appearance-none py-2 font-manrope text-sm sm:text-base bg-transparent border-0 border-b-2 border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-slate-100 focus:border-blue-600 transition-colors duration-150"
                      required
                    >
                      <option value="" disabled hidden></option>
                      <option value="lawyer">Lawyer</option>
                      <option value="paralegal">Paralegal</option>
                      <option value="legal_student">Student</option>
                      <option value="business_owner">Business Owner</option>
                      <option value="individual">Individual</option>
                      <option value="other">Other</option>
                    </select>
                    <label
                      htmlFor="profession"
                      className="absolute left-0 top-2 font-manrope text-xs sm:text-sm text-slate-400 dark:text-slate-500 pointer-events-none transition-all duration-200 ease-premium peer-focus:-top-3.5 peer-focus:text-[10px] sm:peer-focus:text-xs peer-focus:text-blue-600 peer-valid:-top-3.5 peer-valid:text-[10px] sm:peer-valid:text-xs peer-valid:text-blue-600"
                    >
                      Profession
                    </label>
                    <ChevronDownIcon className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  </div>

                  <div className="relative mt-2 sm:mt-0">
                    <input
                      type={showPassword ? 'text' : 'password'}
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
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} className="sm:w-5 sm:h-5" /> : <Eye size={16} className="sm:w-5 sm:h-5" />}
                    </button>
                  </div>

                  <div className="relative mt-2 sm:mt-0">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      value={confirmPassword}
                      onFocus={handleInputFocus}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="peer w-full py-2 pr-8 font-manrope text-sm sm:text-base bg-transparent border-0 border-b-2 border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-slate-100 focus:border-blue-600 transition-colors duration-150"
                      required
                    />
                    <label
                      htmlFor="confirmPassword"
                      className="absolute left-0 top-2 font-manrope text-xs sm:text-sm text-slate-400 dark:text-slate-500 pointer-events-none transition-all duration-200 ease-premium peer-focus:-top-3.5 peer-focus:text-[10px] sm:peer-focus:text-xs peer-focus:text-blue-600 peer-valid:-top-3.5 peer-valid:text-[10px] sm:peer-valid:text-xs peer-valid:text-blue-600"
                    >
                      Confirm Password
                    </label>
                    <button
                      type="button"
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff size={16} className="sm:w-5 sm:h-5" /> : <Eye size={16} className="sm:w-5 sm:h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="relative w-full py-2.5 sm:py-3 mt-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-manrope text-sm sm:text-base font-semibold shadow-card hover:shadow-card-hover active:scale-[0.98] transition-all duration-150 disabled:opacity-70 flex items-center justify-center"
                  disabled={isLoading}
                >
                  <span className={isLoading ? 'opacity-0' : 'opacity-100'}>
                    Create Account
                  </span>
                  {isLoading && (
                    <span className="absolute inset-0 flex items-center justify-center gap-2">
                      <Loader size={16} className="animate-spin sm:w-5 sm:h-5" />
                      <span className="text-xs sm:text-sm">Creating...</span>
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
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Sign In</Link>
              </p>

              {message && (
                <div
                  role="alert"
                  className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-md text-xs sm:text-sm font-medium text-center mt-4 font-manrope animate-fadeIn
                    ${
                      messageColor === 'green'
                        ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400'
                        : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'
                    }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {messageColor === 'red' ? <AlertTriangle size={16} className="w-4 h-4 sm:w-5 sm:h-5" /> : <CheckCircle size={16} className="w-4 h-4 sm:w-5 sm:h-5" />}
                    <span>{message}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full max-w-sm animate-revealUp text-center">
              
              {/* Mobile Branding (Hidden on Desktop) */}
              <div className="flex items-center gap-2.5 mb-8 lg:hidden justify-center sm:justify-start">
                <img src="/images/jg_original_logo_1.png" alt="Justice Genie" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
                <h1 className="font-poppins font-bold text-xl sm:text-2xl text-slate-900 dark:text-slate-100 tracking-tight">Justice Genie</h1>
              </div>

              <h2 className="font-poppins text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">Check your email</h2>
              <p className="font-manrope text-slate-400 dark:text-slate-500 text-xs sm:text-sm mb-8">
                We sent a verification code to <span className="font-semibold text-slate-700 dark:text-slate-300">{email}</span>
              </p>

              <form onSubmit={handleVerificationSubmit} className="flex flex-col gap-5 sm:gap-6 text-left">
                <div className="relative mt-2 sm:mt-0">
                  <input
                    type="text"
                    id="verificationCode"
                    value={verificationCode}
                    onFocus={handleInputFocus}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="peer w-full py-2 font-manrope tracking-[0.25em] text-sm sm:text-base text-center bg-transparent border-0 border-b-2 border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-slate-100 focus:border-blue-600 transition-colors duration-150"
                    maxLength={6}
                    required
                  />
                  <label
                    htmlFor="verificationCode"
                    className="absolute left-1/2 -translate-x-1/2 top-2 font-manrope text-xs sm:text-sm text-slate-400 dark:text-slate-500 pointer-events-none transition-all duration-200 ease-premium peer-focus:-top-3.5 peer-focus:text-[10px] sm:peer-focus:text-xs peer-focus:text-blue-600 peer-valid:-top-3.5 peer-valid:text-[10px] sm:peer-valid:text-xs peer-valid:text-blue-600"
                  >
                    6-Digit Code
                  </label>
                </div>

                <button
                  type="submit"
                  className="relative w-full py-2.5 sm:py-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-manrope text-sm sm:text-base font-semibold shadow-card hover:shadow-card-hover active:scale-[0.98] transition-all duration-150 disabled:opacity-70 flex items-center justify-center mt-2"
                  disabled={isLoading}
                >
                  <span className={isLoading ? 'opacity-0' : 'opacity-100'}>
                    Verify Account
                  </span>
                  {isLoading && (
                    <span className="absolute inset-0 flex items-center justify-center gap-2">
                      <Loader size={16} className="animate-spin sm:w-5 sm:h-5" />
                      <span className="text-xs sm:text-sm">Verifying...</span>
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 font-manrope text-xs sm:text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mt-2"
                >
                  <RotateCw size={14} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Resend Code
                </button>
              </form>

              {message && (
                <div
                  role="alert"
                  className={`w-full px-3 py-2 sm:px-4 sm:py-2.5 rounded-md text-xs sm:text-sm font-medium text-center mt-6 font-manrope animate-fadeIn
                    ${
                      messageColor === 'green'
                        ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400'
                        : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'
                    }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {messageColor === 'red' ? <AlertTriangle size={16} className="w-4 h-4 sm:w-5 sm:h-5" /> : <CheckCircle size={16} className="w-4 h-4 sm:w-5 sm:h-5" />}
                    <span>{message}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </motion.div>
  );
};

// Simple down chevron icon for the select element
const ChevronDownIcon = ({ className, size }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

export default Register;