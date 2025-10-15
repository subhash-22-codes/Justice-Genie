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

          toast.success(data.message || 'Reset link sent!');
          setStep(2);
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
          color: '#2563eb'
        };
      case 2:
        return {
          icon: faKey,
          title: 'Verify Your Identity',
          subtitle: 'Enter the 6-digit code we sent to your email',
          color: '#2563eb'
        };
      case 3:
        return {
          icon: faShieldAlt,
          title: 'Create New Password',
          subtitle: 'Choose a strong password to secure your account',
          color: '#2563eb'
        };
      default:
        return {};
    }
  };

  const stepConfig = getStepConfig();

  return (
    <div className="forgot-container">
      <div className="forgot-content">
        <div className="forgot-branding">
          <div className="forgot-brand-content">
            <div className="forgot-brand-icon">
              <img
                src="/images/jg_original_logo_1.png"
                alt="Brand Logo"
                className="forgot-logo"
              />
            </div>
            <h1 className="forgot-brand-title font-poppins">Secure Account Recovery</h1>
            <p className="forgot-brand-description font-urbanist">
              Your security is our priority. Follow our secure 3-step process to regain access to your account safely.
            </p>
            <div className="forgot-features font-manrope">
              <div className="forgot-feature">
                <FontAwesomeIcon icon={faCheckCircle} />
                <span>Email Verification</span>
              </div>
              <div className="forgot-feature">
                <FontAwesomeIcon icon={faCheckCircle} />
                <span>Secure Code Validation</span>
              </div>
              <div className="forgot-feature">
                <FontAwesomeIcon icon={faCheckCircle} />
                <span>Password Encryption</span>
              </div>
            </div>
          </div>
        </div>

        <div className="forgot-form-section">
          <div className="forgot-card">
            <div className="forgot-header">
              {step > 1 && (
                <button
                  type="button"
                  className="forgot-back-btn"
                  onClick={goBack}
                  disabled={isLoading}
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                </button>
              )}

              <div className="forgot-step-indicator">
                <div className="forgot-steps font-poppins">
                  {[1, 2, 3].map((stepNum) => (
                    <div
                      key={stepNum}
                      className={`forgot-step ${step >= stepNum ? 'active' : ''} ${step === stepNum ? 'current' : ''}`}
                    >
                      <span>{stepNum}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="forgot-icon" style={{ backgroundColor: stepConfig.color }}>
                <FontAwesomeIcon icon={stepConfig.icon} />
              </div>

              <h2 className="forgot-title font-poppins">{stepConfig.title}</h2>
              <p className="forgot-subtitle font-urbanist">{stepConfig.subtitle}</p>
            </div>

            <div className="forgot-form-container">
              {step === 1 && (
                <form onSubmit={handleEmailSubmit} className="forgot-form">
                  <div className="forgot-input-group">
                    <label className="forgot-label font-poppins">Email Address</label>
                    <div className="forgot-input-wrapper">
                      <FontAwesomeIcon icon={faEnvelope} className="forgot-input-icon" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="forgot-input font-manrope"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="forgot-button forgot-primary font-manrope"
                    disabled={isLoading || !email.trim()}
                  >
                    {isLoading ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="forgot-spinner" />
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
                <form onSubmit={handleResetCodeSubmit} className="forgot-form">
                  <div className="forgot-input-group">
                    <label className="forgot-label font-poppins">Verification Code</label>
                    <div className="forgot-input-wrapper">
                      <FontAwesomeIcon icon={faKey} className="forgot-input-icon" />
                      <input
                        type="text"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        placeholder="000000"
                        className="forgot-input forgot-code-input font-manrope"
                        maxLength="6"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <p className="forgot-help-text font-urbanist">
                      Code sent to: <strong>{email}</strong>
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="forgot-button forgot-primary font-manrope"
                    disabled={isLoading || resetCode.length !== 6}
                  >
                    {isLoading ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="forgot-spinner" />
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
                <form onSubmit={handlePasswordSubmit} className="forgot-form">
                  <div className="forgot-input-group">
                    <label className="forgot-label font-poppins">New Password</label>
                    <div className="forgot-input-wrapper">
                      <FontAwesomeIcon icon={faLock} className="forgot-input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter your new password"
                        className="forgot-input font-manrope"
                        minLength="6"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="forgot-toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                      </button>
                    </div>
                    <div className="forgot-password-requirements font-urbanist">
                      <p>Password must be at least 6 characters long</p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="forgot-button forgot-primary font-manrope"
                    disabled={isLoading || newPassword.length < 6}
                  >
                    {isLoading ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="forgot-spinner" />
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

            <div className="forgot-footer font-urbanist">
              <p>
                Remember your password?
                <Link to="/login" className="forgot-link">
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
