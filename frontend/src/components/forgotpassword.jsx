import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faKey, faArrowLeft, faEye, faEyeSlash, faSpinner, faShieldAlt, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import '../styles/forgotpassword.css';
import { Link } from "react-router-dom";
import Mailcheck from 'mailcheck';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
  
    Mailcheck.run({
      email,
      suggested: function(suggestion) {
        setErrorMessage(`Did you mean ${suggestion.full}?`);
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
            setErrorMessage(data.error || 'Something went wrong.');
            toast.error(data.error || 'Something went wrong.');
            return;
          }
  
          setSuccessMessage(data.message || 'Reset link sent!');
          toast.success(data.message || 'Reset link sent!');
          setStep(2);
        } catch (error) {
          setErrorMessage('Failed to send reset email. Try again.');
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
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/verify-forgot-password-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, reset_code: trimmedResetCode })
      });

      const data = await response.json();

      if (data.status === 'fail') {
        setErrorMessage(data.message || 'Code not correct, type correct code');
        toast.error(data.message || 'Code not correct, type correct code');
        setResetCode('');
      } else {
        setSuccessMessage(data.message || 'Code verified successfully');
        toast.success(data.message || 'Code verified successfully');
        setStep(3);
      }

    } catch (error) {
      setErrorMessage('Something went wrong. Try again.');
      toast.error('Something went wrong. Try again.');
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
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, new_password: newPassword })
      });
      const data = await response.json();
      console.log(data);
  
      setSuccessMessage(data.message || 'Password reset successful');
      toast.success(data.message || 'Password reset successful');
      setTimeout(() => window.location.href = '/login', 2000);
    } catch (error) {
      setErrorMessage('Failed to reset password');
      toast.error('Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    setStep(step - 1);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const getStepConfig = () => {
    switch(step) {
      case 1:
        return {
          icon: faEnvelope,
          title: 'Reset Your Password',
          subtitle: 'Enter your email address and we\'ll send you a verification code',
          color: '#4F46E5'
        };
      case 2:
        return {
          icon: faKey,
          title: 'Verify Your Identity',
          subtitle: 'Enter the 6-digit code we sent to your email',
          color: '#059669'
        };
      case 3:
        return {
          icon: faShieldAlt,
          title: 'Create New Password',
          subtitle: 'Choose a strong password to secure your account',
          color: '#DC2626'
        };
      default:
        return {};
    }
  };

  const stepConfig = getStepConfig();

  return (
    <div className="forgetpassword-container">

      {/* Main Content */}
      <div className="forgetpassword-content">
        {/* Left Side - Branding (Desktop Only) */}
        <div className="forgetpassword-branding">
          <div className="forgetpassword-brand-content">
            <div className="forgetpassword-brand-icon">
              <img 
                src="/images/jg_original_logo_1.png" 
                alt="Brand Logo" 
                className="forgetpassword-logo" 
              />
            </div>
            <h1 className="forgetpassword-brand-title">Secure Account Recovery</h1>
            <p className="forgetpassword-brand-description font-urbanist">
              Your security is our priority. Follow our secure 3-step process to regain access to your account safely.
            </p>
            <div className="forgetpassword-features font-manrope">
              <div className="forgetpassword-feature">
                <FontAwesomeIcon icon={faCheckCircle} />
                <span>Email Verification</span>
              </div>
              <div className="forgetpassword-feature">
                <FontAwesomeIcon icon={faCheckCircle} />
                <span>Secure Code Validation</span>
              </div>
              <div className="forgetpassword-feature">
                <FontAwesomeIcon icon={faCheckCircle} />
                <span>Password Encryption</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="forgetpassword-form-section">
          <div className="forgetpassword-card">
            {/* Header */}
            <div className="forgetpassword-header">
              {step > 1 && (
                <button 
                  type="button" 
                  className="forgetpassword-back-btn"
                  onClick={goBack}
                  disabled={isLoading}
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                </button>
              )}
              
              <div className="forgetpassword-step-indicator">
                <div className="forgetpassword-steps font-poppins">
                  {[1, 2, 3].map((stepNum) => (
                    <div 
                      key={stepNum}
                      className={`forgetpassword-step ${step >= stepNum ? 'active' : ''} ${step === stepNum ? 'current' : ''}`}
                    >
                      <span>{stepNum}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="forgetpassword-icon" style={{ backgroundColor: stepConfig.color }}>
                <FontAwesomeIcon icon={stepConfig.icon} />
              </div>
              
              <h2 className="forgetpassword-title">{stepConfig.title}</h2>
              <p className="forgetpassword-subtitle font-urbanist">{stepConfig.subtitle}</p>
            </div>

            {/* Messages */}
            {successMessage && (
              <div className="forgetpassword-message forgetpassword-success font-urbanist">
                <FontAwesomeIcon icon={faCheckCircle} />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="forgetpassword-message forgetpassword-error font-urbanist">
                <FontAwesomeIcon icon={faKey} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Forms */}
            <div className="forgetpassword-form-container">
              {/* Step 1: Email */}
              {step === 1 && (
                <form onSubmit={handleEmailSubmit} className="forgetpassword-form">
                  <div className="forgetpassword-input-group">
                    <label className="forgetpassword-label font-poppins">Email Address</label>
                    <div className="forgetpassword-input-wrapper">
                      <FontAwesomeIcon icon={faEnvelope} className="forgetpassword-input-icon" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="forgetpassword-input font-manrope"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  
                  <button 
                    type="submit" 
                    className="forgetpassword-button forgetpassword-primary font-manrope"
                    disabled={isLoading || !email.trim()}
                  >
                    {isLoading ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="forgetpassword-spinner" />
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

              {/* Step 2: Reset Code */}
              {step === 2 && (
                <form onSubmit={handleResetCodeSubmit} className="forgetpassword-form">
                  <div className="forgetpassword-input-group">
                    <label className="forgetpassword-label font-poppins">Verification Code</label>
                    <div className="forgetpassword-input-wrapper">
                      <FontAwesomeIcon icon={faKey} className="forgetpassword-input-icon" />
                      <input
                        type="text"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        placeholder="000000"
                        className="forgetpassword-input forgetpassword-code-input font-manrope"
                        maxLength="6"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <p className="forgetpassword-help-text font-urbanist">
                      Code sent to: <strong>{email}</strong>
                    </p>
                  </div>
                  
                  <button 
                    type="submit" 
                    className="forgetpassword-button forgetpassword-primary font-manrope"
                    disabled={isLoading || resetCode.length !== 6}
                  >
                    {isLoading ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="forgetpassword-spinner" />
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

              {/* Step 3: New Password */}
              {step === 3 && (
                <form onSubmit={handlePasswordSubmit} className="forgetpassword-form">
                  <div className="forgetpassword-input-group">
                    <label className="forgetpassword-label font-poppins">New Password</label>
                    <div className="forgetpassword-input-wrapper">
                      <FontAwesomeIcon icon={faLock} className="forgetpassword-input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter your new password"
                        className="forgetpassword-input font-manrope"
                        minLength="6"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="forgetpassword-toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                      </button>
                    </div>
                    <div className="forgetpassword-password-requirements font-urbanist">
                      <p>Password must be at least 6 characters long</p>
                    </div>
                  </div>
                  
                  <button 
                    type="submit" 
                    className="forgetpassword-button forgetpassword-primary font-manrope"
                    disabled={isLoading || newPassword.length < 6}
                  >
                    {isLoading ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="forgetpassword-spinner" />
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
            </div>

            {/* Footer */}
            <div className="forgetpassword-footer font-urbanist">
              <p>
                Remember your password? 
                <Link to="/login" className="forgetpassword-link">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;