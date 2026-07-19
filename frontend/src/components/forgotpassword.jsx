import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faKey, faArrowLeft, faEye, faEyeSlash, faSpinner, faShieldAlt, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { Link } from "react-router-dom";
import Mailcheck from 'mailcheck';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/forgot-password`, {
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
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/verify-forgot-password-code`, {
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
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, new_password: newPassword })
      });
      const data = await response.json();
      console.log(data);

      toast.success(data.message || 'Password reset successful');
      setTimeout(() => window.location.href = '/login', 2000);
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
          icon: faEnvelope,
          title: 'Reset Your Password',
          subtitle: 'Enter your email address and we\'ll send you a verification code',
        };
      case 2:
        return {
          icon: faKey,
          title: 'Verify Your Identity',
          subtitle: 'Enter the 6-digit code we sent to your email',
        };
      case 3:
        return {
          icon: faShieldAlt,
          title: 'Create New Password',
          subtitle: 'Choose a strong password to secure your account',
        };
      default:
        return {};
    }
  };

  const stepConfig = getStepConfig();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="flex flex-col lg:flex-row w-full max-w-4xl rounded-sm overflow-hidden shadow-xl bg-white">

        {/* Left panel - branding */}
        <div className="flex-1 bg-slate-800 text-white p-8 sm:p-10 flex flex-col justify-center">
          <img
            src="/images/jg_original_logo_1.png"
            alt="Brand Logo"
            className="w-12 h-12 object-contain mb-6"
          />
          <h1 className="font-poppins text-2xl font-bold mb-3">Secure Account Recovery</h1>
          <p className="font-manrope text-sm text-slate-300 leading-relaxed mb-8">
            Your security is our priority. Follow our secure 3-step process to regain access to your account safely.
          </p>
          <div className="space-y-3 font-manrope text-sm">
            {['Email Verification', 'Secure Code Validation', 'Password Encryption'].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-slate-200">
                <FontAwesomeIcon icon={faCheckCircle} className="text-blue-400" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel - form */}
        <div className="flex-1 p-8 sm:p-10">
          <div className="flex items-center gap-3 mb-6">
            {step > 1 && (
              <button
                type="button"
                className="w-9 h-9 rounded-sm flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-40"
                onClick={goBack}
                disabled={isLoading}
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
            )}

            <div className="flex items-center gap-2 font-poppins">
              {[1, 2, 3].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold transition-colors ${
                    step >= stepNum
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  {stepNum}
                </div>
              ))}
            </div>
          </div>

          <div className="w-12 h-12 rounded-sm bg-blue-600 text-white flex items-center justify-center mb-4">
            <FontAwesomeIcon icon={stepConfig.icon} />
          </div>

          <h2 className="font-poppins text-xl font-bold text-slate-800 mb-1">{stepConfig.title}</h2>
          <p className="font-manrope text-sm text-slate-500 mb-6">{stepConfig.subtitle}</p>

          {step === 1 && (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <div>
                <label className="font-poppins text-sm font-medium text-slate-700 block mb-1.5">Email Address</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full font-manrope text-sm pl-10 pr-3 py-2.5 rounded-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 font-manrope font-medium py-2.5 rounded-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
                disabled={isLoading || !email.trim()}
              >
                {isLoading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faEnvelope} />
                    Send Verification Code
                  </>
                )}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleResetCodeSubmit} className="space-y-5">
              <div>
                <label className="font-poppins text-sm font-medium text-slate-700 block mb-1.5">Verification Code</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faKey} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="000000"
                    className="w-full font-manrope text-sm tracking-widest pl-10 pr-3 py-2.5 rounded-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                    maxLength="6"
                    required
                    disabled={isLoading}
                  />
                </div>
                <p className="font-manrope text-xs text-slate-400 mt-1.5">
                  Code sent to: <strong className="text-slate-600">{email}</strong>
                </p>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 font-manrope font-medium py-2.5 rounded-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
                disabled={isLoading || resetCode.length !== 6}
              >
                {isLoading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faKey} />
                    Verify Code
                  </>
                )}
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <div>
                <label className="font-poppins text-sm font-medium text-slate-700 block mb-1.5">New Password</label>
                <div className="relative">
                  <FontAwesomeIcon icon={faLock} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                    className="w-full font-manrope text-sm pl-10 pr-10 py-2.5 rounded-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                    minLength="6"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
                <p className="font-manrope text-xs text-slate-400 mt-1.5">Password must be at least 6 characters long</p>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 font-manrope font-medium py-2.5 rounded-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
                disabled={isLoading || newPassword.length < 6}
              >
                {isLoading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faShieldAlt} />
                    Reset Password
                  </>
                )}
              </button>
            </form>
          )}

          <div className="font-manrope text-sm text-slate-500 text-center mt-6">
            <p>
              Remember your password?{' '}
              <Link to="/login" className="text-blue-600 font-medium hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
