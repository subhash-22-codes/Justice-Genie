import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from "react-router-dom";
import Mailcheck from 'mailcheck';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  Mail, KeyRound, Shield, ArrowLeft, Eye, EyeOff, Loader, CheckCircle 
} from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();

    Mailcheck.run({
      email,
      suggested: function(suggestion) {
        toast.info(`Did you mean ${suggestion.full}?`, { autoClose: 5000 });
      },
      empty: async function() {
        try {
          setIsLoading(true);
          const response = await fetch(`/api/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });

          const data = await response.json();

          if (!response.ok) {
            toast.error(data.error || 'Something went wrong.');
            return;
          }

          toast.success(data.message || 'Reset link sent!', { autoClose: 4000 });
          setTimeout(() => setStep(2), 500);

        } catch (error) {
          toast.error('Failed to send reset email. Try again.');
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const handleResetCodeSubmit = async (e) => {
    e.preventDefault();
    const trimmedResetCode = resetCode.trim();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/verify-forgot-password-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, reset_code: trimmedResetCode })
      });

      const data = await response.json();

      if (data.status === 'fail') {
        toast.error(data.message || 'Code not correct, type correct code');
        setResetCode('');
      } else {
        toast.success(data.message || 'Code verified successfully');
        setStep(3);
      }

    } catch (error) {
      toast.error('Something went wrong. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, new_password: newPassword, reset_code: resetCode.trim() })
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to reset password. Please try again.');
        return;
      }

      toast.success(data.message || 'Password reset successful');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      toast.error('Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    setStep(step - 1);
  };

  const getStepConfig = () => {
    switch(step) {
      case 1:
        return {
          icon: <Mail size={24} className="text-blue-600 dark:text-blue-400 w-5 h-5 sm:w-6 sm:h-6" />,
          title: 'Reset Password',
          subtitle: "Enter your email address and we'll send you a code.",
        };
      case 2:
        return {
          icon: <KeyRound size={24} className="text-blue-600 dark:text-blue-400 w-5 h-5 sm:w-6 sm:h-6" />,
          title: 'Verify Identity',
          subtitle: 'Enter the 6-digit code we sent to your email.',
        };
      case 3:
        return {
          icon: <Shield size={24} className="text-blue-600 dark:text-blue-400 w-5 h-5 sm:w-6 sm:h-6" />,
          title: 'New Password',
          subtitle: 'Choose a strong password to secure your account.',
        };
      default:
        return {};
    }
  };

  const stepConfig = getStepConfig();

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

        {/* Left panel - brand image (Consistent with Login) */}
        <div className="hidden lg:block relative flex-1 overflow-hidden group">
          <img
            src="/images/GenieTemplate.png" 
            alt="Justice Genie Template"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"; 
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 to-slate-900/60"></div>
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-10 py-12">
            <p className="font-poppins text-xl font-semibold mb-4">Justice Genie</p>
            <p className="font-manrope text-sm leading-relaxed text-slate-200 mb-10 max-w-md">
              Securely recover your account and get back to exploring AI-powered legal assistance.
            </p>
            
            <div className="space-y-4 text-left font-manrope text-sm bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20">
              {['Email Verification', 'Secure Code Validation', 'Encrypted Recovery'].map((feature) => (
                <div key={feature} className="flex items-center gap-3 text-slate-100">
                  <CheckCircle size={18} className="text-blue-400" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel - Dynamic Form */}
        <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-slate-900 px-5 py-8 sm:p-10">
          <div className="w-full max-w-sm animate-revealUp relative">
            
            {/* Top Navigation & Step Indicator */}
            <div className="flex items-center justify-between mb-8">
              {step > 1 ? (
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-xs sm:text-sm font-manrope text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors disabled:opacity-40"
                  onClick={goBack}
                  disabled={isLoading}
                >
                  <ArrowLeft size={16} className="w-4 h-4 sm:w-5 sm:h-5" />
                  Back
                </button>
              ) : (
                <Link 
                  to="/login" 
                  className="flex items-center gap-1.5 text-xs sm:text-sm font-manrope text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
                >
                  <ArrowLeft size={16} className="w-4 h-4 sm:w-5 sm:h-5" />
                  Back to login
                </Link>
              )}

              <div className="flex items-center gap-1.5 sm:gap-2 font-poppins">
                {[1, 2, 3].map((stepNum) => (
                  <div
                    key={stepNum}
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-semibold transition-all duration-300 ${
                      step >= stepNum
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {stepNum}
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Branding (Hidden on Desktop) */}
            <div className="flex items-center gap-2.5 mb-8 lg:hidden justify-center sm:justify-start">
              <img src="/images/jg_original_logo_1.png" alt="Justice Genie" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
              <h1 className="font-poppins font-bold text-xl sm:text-2xl text-slate-900 dark:text-slate-100 tracking-tight">Justice Genie</h1>
            </div>

            {/* Step Header */}
            <div className="mb-8 flex flex-col items-center sm:items-start">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-4 border border-blue-100 dark:border-blue-900/30">
                {stepConfig.icon}
              </div>
              <h2 className="font-poppins text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1 text-center sm:text-left">{stepConfig.title}</h2>
              <p className="font-manrope text-slate-400 dark:text-slate-500 text-xs sm:text-sm text-center sm:text-left">{stepConfig.subtitle}</p>
            </div>

            {/* Forms Based on Step */}
            {step === 1 && (
              <form onSubmit={handleEmailSubmit} className="flex flex-col gap-5 sm:gap-6">
                <div className="relative mt-2 sm:mt-0">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="peer w-full py-2 font-manrope text-sm sm:text-base bg-transparent border-0 border-b-2 border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-slate-100 focus:border-blue-600 transition-colors duration-150"
                    required
                    disabled={isLoading}
                  />
                  <label
                    htmlFor="email"
                    className="absolute left-0 top-2 font-manrope text-xs sm:text-sm text-slate-400 dark:text-slate-500 pointer-events-none transition-all duration-200 ease-premium peer-focus:-top-3.5 peer-focus:text-[10px] sm:peer-focus:text-xs peer-focus:text-blue-600 peer-valid:-top-3.5 peer-valid:text-[10px] sm:peer-valid:text-xs peer-valid:text-blue-600"
                  >
                    Registered Email Address
                  </label>
                </div>

                <button
                  type="submit"
                  className="relative w-full py-2.5 sm:py-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-manrope text-sm sm:text-base font-semibold shadow-card hover:shadow-card-hover active:scale-[0.98] transition-all duration-150 disabled:opacity-70 flex items-center justify-center mt-2"
                  disabled={isLoading || !email.trim()}
                >
                  <span className={isLoading ? 'opacity-0' : 'opacity-100'}>
                    Send Verification Code
                  </span>
                  {isLoading && (
                    <span className="absolute inset-0 flex items-center justify-center gap-2">
                      <Loader size={16} className="animate-spin sm:w-5 sm:h-5" />
                      <span className="text-xs sm:text-sm">Sending...</span>
                    </span>
                  )}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleResetCodeSubmit} className="flex flex-col gap-5 sm:gap-6">
                <div className="relative mt-2 sm:mt-0">
                  <input
                    type="text"
                    id="resetCode"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    className="peer w-full py-2 font-manrope tracking-[0.25em] text-sm sm:text-base text-center bg-transparent border-0 border-b-2 border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-slate-100 focus:border-blue-600 transition-colors duration-150"
                    maxLength="6"
                    required
                    disabled={isLoading}
                  />
                  <label
                    htmlFor="resetCode"
                    className="absolute left-1/2 -translate-x-1/2 top-2 font-manrope text-xs sm:text-sm text-slate-400 dark:text-slate-500 pointer-events-none transition-all duration-200 ease-premium peer-focus:-top-3.5 peer-focus:text-[10px] sm:peer-focus:text-xs peer-focus:text-blue-600 peer-valid:-top-3.5 peer-valid:text-[10px] sm:peer-valid:text-xs peer-valid:text-blue-600"
                  >
                    6-Digit Code
                  </label>
                </div>

                <p className="font-manrope text-[10px] sm:text-xs text-center text-slate-400 dark:text-slate-500">
                  Code sent to: <span className="font-semibold text-slate-700 dark:text-slate-300">{email}</span>
                </p>

                <button
                  type="submit"
                  className="relative w-full py-2.5 sm:py-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-manrope text-sm sm:text-base font-semibold shadow-card hover:shadow-card-hover active:scale-[0.98] transition-all duration-150 disabled:opacity-70 flex items-center justify-center mt-2"
                  disabled={isLoading || resetCode.trim().length !== 6}
                >
                  <span className={isLoading ? 'opacity-0' : 'opacity-100'}>
                    Verify Code
                  </span>
                  {isLoading && (
                    <span className="absolute inset-0 flex items-center justify-center gap-2">
                      <Loader size={16} className="animate-spin sm:w-5 sm:h-5" />
                      <span className="text-xs sm:text-sm">Verifying...</span>
                    </span>
                  )}
                </button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-5 sm:gap-6">
                <div className="relative mt-2 sm:mt-0">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="peer w-full py-2 pr-8 font-manrope text-sm sm:text-base bg-transparent border-0 border-b-2 border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-slate-100 focus:border-blue-600 transition-colors duration-150"
                    minLength="6"
                    required
                    disabled={isLoading}
                  />
                  <label
                    htmlFor="newPassword"
                    className="absolute left-0 top-2 font-manrope text-xs sm:text-sm text-slate-400 dark:text-slate-500 pointer-events-none transition-all duration-200 ease-premium peer-focus:-top-3.5 peer-focus:text-[10px] sm:peer-focus:text-xs peer-focus:text-blue-600 peer-valid:-top-3.5 peer-valid:text-[10px] sm:peer-valid:text-xs peer-valid:text-blue-600"
                  >
                    New Password
                  </label>
                  <button
                    type="button"
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} className="sm:w-5 sm:h-5" /> : <Eye size={16} className="sm:w-5 sm:h-5" />}
                  </button>
                </div>
                
                <p className="font-manrope text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 text-center sm:text-left">
                  Password must be at least 6 characters long.
                </p>

                <button
                  type="submit"
                  className="relative w-full py-2.5 sm:py-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-manrope text-sm sm:text-base font-semibold shadow-card hover:shadow-card-hover active:scale-[0.98] transition-all duration-150 disabled:opacity-70 flex items-center justify-center mt-2"
                  disabled={isLoading || newPassword.length < 6}
                >
                  <span className={isLoading ? 'opacity-0' : 'opacity-100'}>
                    Update Password
                  </span>
                  {isLoading && (
                    <span className="absolute inset-0 flex items-center justify-center gap-2">
                      <Loader size={16} className="animate-spin sm:w-5 sm:h-5" />
                      <span className="text-xs sm:text-sm">Updating...</span>
                    </span>
                  )}
                </button>
              </form>
            )}

          </div>
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

export default ForgotPassword;