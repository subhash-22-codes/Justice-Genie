import React, { useState } from 'react';
import { Mail, Lock, KeyRound, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import '../styles/forgotpassword.css';
import { Link} from "react-router-dom";
import Mailcheck from 'mailcheck'
const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Keeping all your original handlers intact
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
  
    Mailcheck.run({
      email,
      suggested: function(suggestion) {
        setErrorMessage(`Did you mean ${suggestion.full}?`);
      },
      empty: async function() {
        // No suggestion, proceed normally
        try {
          setIsLoading(true);
          const response = await fetch('/api/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });
  
          const data = await response.json();
  
          if (!response.ok) {
            setErrorMessage(data.error || 'Something went wrong.');
            return;
          }
  
          setSuccessMessage(data.message || 'Reset link sent!');
          setStep(2);
        } catch (error) {
          setErrorMessage('Failed to send reset email. Try again.');
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
  setErrorMessage('');
  setSuccessMessage('');

  try {
    const response = await fetch('/api/verify-forgot-password-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, reset_code: trimmedResetCode })
    });

    const data = await response.json();

    if (data.status === 'fail') {
      // Handle failure case
      setErrorMessage(data.message || 'Code not correct, type correct code');
      setResetCode('');  // Clear the input
    } else {
      // Handle success case
      setSuccessMessage(data.message || 'Code verified successfully');
      setStep(3);  // Move to password reset
    }

  } catch (error) {
    setErrorMessage('Something went wrong. Try again.');
  } finally {
    setIsLoading(false);
  }
};




  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      setErrorMessage('');
      setSuccessMessage('');
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, new_password: newPassword }) // Consistent field name
      });
      const data = await response.json();
      console.log(data); // Log the backend response to debug
  
      setSuccessMessage(data.message || 'Password reset successful');
      setTimeout(() => window.location.href = '/login', 2000);
    } catch (error) {
      setErrorMessage('Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        {/* Left Panel */}
        <div className="forgot-left-panel">
          <div className="forgot-brand-content">
            <div className="forgot-logo">
              <KeyRound size={40} />
              <span>GENIE</span>
            </div>
            <div className="forgot-illustration">
              <img 
                src="https://i.pinimg.com/736x/76/38/69/763869a33c8ac9e99a59500992c11127.jpg"
                alt="Security"
                className="forgot-image"
              />
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="forgot-right-panel">
          <div className="forgot-form-container">
            <button 
              onClick={() => step > 1 && setStep(step - 1)} 
              className="forgot-back-button"
              disabled={step === 1}
            >
              <ArrowLeft size={20} />
            </button>

            <div className="forgot-header">
              <h2>{
                step === 1 ? 'Forgot Password?' :
                step === 2 ? 'Enter Reset Code' :
                'Create New Password'
              }</h2>
              <p className="forgot-subtitle">
              {step === 1 ? "No worries, we'll send you reset instructions." :
              step === 2 ? "Check your email for the reset code." :
              "Choose a strong password for your account."}
            </p>
            </div>

            {step === 1 && (
              <form onSubmit={handleEmailSubmit} className="forgot-form">
                <div className="forgot-input-group">
                  <Mail className="forgot-input-icon" />
                  <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setErrorMessage('')} // Clears error when input is focused
                      placeholder="Enter your email"
                      required
                  />

                </div>
                <button type="submit" className="forgot-submit-button" disabled={isLoading}>
                  {isLoading ? <span className="forgot-loader"></span> : 'Send Reset Link'}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleResetCodeSubmit} className="forgot-form">
              <div className="forgot-verification-input flex justify-center items-center w-full px-4">
                <input
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength="6"
                  required
                  inputMode="numeric"
                  className="w-full max-w-[320px] py-2.5 px-4 text-xl tracking-[0.4rem] text-center border border-slate-300 rounded-lg bg-slate-50 placeholder:italic placeholder:text-slate-400 placeholder:text-sm placeholder:tracking-[0.2rem] focus:outline-none transition-all duration-300"
                />
              </div>


                <button type="submit" className="forgot-submit-button" disabled={isLoading}>
                  {isLoading ? <span className="forgot-loader"></span> : 'Verify Code'}
                </button>
              </form>
            )}


            {step === 3 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newPassword.length < 6) {
                    setErrorMessage('Password must be at least 6 characters long');
                    return;
                  }
                  handlePasswordSubmit(e);  // Call actual submit function
                }}
                className="forgot-form"
              >
                <div className="forgot-input-group">
                  <Lock className="forgot-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setErrorMessage(''); // Clear error while typing
                    }}
                    placeholder="New password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="forgot-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <button type="submit" className="forgot-submit-button" disabled={isLoading}>
                  {isLoading ? <span className="forgot-loader"></span> : 'Reset Password'}
                </button>
              </form>
            )}


            {(errorMessage || successMessage) && (
              <div className={`forgot-message ${errorMessage ? 'error' : 'success'}`}>
                {errorMessage || successMessage}
              </div>
            )}

            <div className="forgot-footer">
              <p>Remember your password? <Link to="/login">Back to login</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;