import React, { useState } from 'react';
import '../styles/register.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2';
import { Link } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import Mailcheck from 'mailcheck';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
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

  const validatePhone = (phone) => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
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
  
    if (!validatePhone(phone)) {
      toast.error('Phone number must be 10 digits.');
      return;
    }
  
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
          confirmButtonColor: '#1a365d',
          cancelButtonColor: '#e53e3e',
          confirmButtonText: 'Yes, proceed!',
          cancelButtonText: 'No, let me check'
        });
  
        if (!confirmEmail.isConfirmed) return;
  
        setIsLoading(true);
        try {
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username,
              email,
              phone,
              dob,
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
            setMessage('Verify your email here! Please check your email/Spam for the verification code.');
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

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/verify_code`, {
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
    }
  };

  const handleResendCode = async () => {
    const confirmResend = await Swal.fire({
      title: 'Resend Code?',
      text: 'Are you sure you want to resend the verification code?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1a365d',
      cancelButtonColor: '#e53e3e',
      confirmButtonText: 'Yes, resend!'
    });

    if (!confirmResend.isConfirmed) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/resend_verification_code`, {
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

  return (
    <div className="register-container">
      <div className="register-layout">
        {/* Left Side - Illustration (Desktop Only) */}
        <div className="register-illustration-section">
          <div className="register-illustration-content">
            <div className="register-brand">
              <div className="register-brand-icon">
                <i className="fas fa-balance-scale"></i>
              </div>
              <h1 className="register-brand-title">Justice Genie</h1>
              <p className="register-brand-subtitle">Your AI-Powered Legal Assistant</p>
            </div>
            
            <div className="register-illustration">
              <div className="register-legal-dashboard">
                <div className="register-dashboard-header">
                  <h3>Legal Case Analytics</h3>
                  <div className="register-dashboard-stats">
                    <div className="register-stat">
                      <i className="fas fa-gavel"></i>
                      <span>Accuracy: 95%</span>
                    </div>
                    <div className="register-stat">
                      <i className="fas fa-clock"></i>
                      <span>Avg Response: 2min</span>
                    </div>
                  </div>
                </div>
                
                <div className="register-chart-container">
                  <div className="register-chart">
                    <div className="register-bar" style={{'--height': '60%', '--value': '"60%"'}}></div>
                    <div className="register-bar" style={{'--height': '80%', '--value': '"80%"'}}></div>
                    <div className="register-bar" style={{'--height': '45%', '--value': '"45%"'}}></div>
                    <div className="register-bar" style={{'--height': '90%', '--value': '"90%"'}}></div>
                    <div className="register-bar" style={{'--height': '70%', '--value': '"70%"'}}></div>
                    <div className="register-bar" style={{'--height': '85%', '--value': '"85%"'}}></div>
                    <div className="register-bar" style={{'--height': '55%', '--value': '"55%"'}}></div>
                    <div className="register-bar" style={{'--height': '75%', '--value': '"75%"'}}></div>
                    <div className="register-bar" style={{'--height': '65%', '--value': '"65%"'}}></div>
                    <div className="register-bar" style={{'--height': '95%', '--value': '"95%"'}}></div>
                    <div className="register-bar" style={{'--height': '50%', '--value': '"50%"'}}></div>
                    <div className="register-bar" style={{'--height': '100%', '--value': '"100%"'}}></div>
                  </div>
                  <div className="register-chart-labels">
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                    <span>Jun</span>
                    <span>Jul</span>
                    <span>Aug</span>
                    <span>Sep</span>
                    <span>Oct</span>
                    <span>Nov</span>
                    <span>Dec</span>
                  </div>
                </div>
                
                <div className="register-legal-features">
                  <div className="register-feature">
                    <i className="fas fa-robot"></i>
                    <span>AI Legal Research</span>
                  </div>
                  <div className="register-feature">
                    <i className="fas fa-file-contract"></i>
                    <span>Document Analysis</span>
                  </div>
                  <div className="register-feature">
                    <i className="fas fa-users"></i>
                    <span>Client Management</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="register-form-section">
          <div className="register-form-container">
            {!isVerified ? (
              <>
                <div className="register-header">
                  <div className="register-mobile-brand">
                    <div className="register-mobile-icon">
                      <i className="fas fa-balance-scale"></i>
                    </div>
                    <h1>Justice Genie</h1>
                  </div>
                  <h2 className="register-title">Create Your Account</h2>
                  <p className="register-subtitle">Join thousands of legal professionals using AI-powered assistance</p>
                </div>

                <form onSubmit={handleSubmit} className="register-form">
                  <div className="register-form-grid">
                    <div className="register-input-group">
                      <label htmlFor="username" className="register-label">
                        <i className="fas fa-user"></i>
                        Username
                      </label>
                      <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="register-input"
                        placeholder="Enter your username"
                        required
                      />
                    </div>

                    <div className="register-input-group">
                      <label htmlFor="email" className="register-label">
                        <i className="fas fa-envelope"></i>
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="register-input"
                        placeholder="Enter your email address"
                        required
                      />
                    </div>

                    <div className="register-input-group">
                      <label htmlFor="phone" className="register-label">
                        <i className="fas fa-phone"></i>
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="register-input"
                        placeholder="Enter your phone number"
                        required
                      />
                    </div>

                    <div className="register-input-group">
                      <label htmlFor="dob" className="register-label">
                        <i className="fas fa-calendar"></i>
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        id="dob"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="register-input"
                        required
                      />
                    </div>

                    <div className="register-input-group register-full-width">
                      <label htmlFor="profession" className="register-label">
                        <i className="fas fa-briefcase"></i>
                        Profession
                      </label>
                      <select
                        id="profession"
                        value={profession}
                        onChange={(e) => setProfession(e.target.value)}
                        className="register-input register-select"
                        required
                      >
                        <option value="">Select your profession</option>
                        <option value="lawyer">Lawyer</option>
                        <option value="paralegal">Paralegal</option>
                        <option value="legal_student">Student</option>
                        <option value="business_owner">Business Owner</option>
                        <option value="individual">Individual</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="register-input-group">
                      <label htmlFor="password" className="register-label">
                        <i className="fas fa-lock"></i>
                        Password
                      </label>
                      <div className="register-password-container">
                        <input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="register-input"
                          placeholder="Enter password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="register-password-toggle"
                        >
                          <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
                    </div>

                    <div className="register-input-group">
                      <label htmlFor="confirmPassword" className="register-label">
                        <i className="fas fa-lock"></i>
                        Confirm Password
                      </label>
                      <div className="register-password-container">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          id="confirmPassword"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="register-input"
                          placeholder="Confirm password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="register-password-toggle"
                        >
                          <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  {message && (
                    <div className={`register-message ${messageColor === 'red' ? 'register-message-error' : 'register-message-success'}`}>
                      <i className={`fas ${messageColor === 'red' ? 'fa-exclamation-triangle' : 'fa-check-circle'}`}></i>
                      <span>{message}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="register-submit-btn"
                  >
                    {isLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-user-plus"></i>
                        Create Account
                      </>
                    )}
                  </button>

                  <div className="register-footer">
                    <p>Already have an account? <Link to="/login" className="register-link">Sign In</Link></p>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="register-header">
                  <div className="register-verification-icon">
                    <i className="fas fa-envelope-open-text"></i>
                  </div>
                  <h2 className="register-title">Verify Your Email</h2>
                  <p className="register-subtitle">We've sent a verification code to <strong>{email}</strong></p>
                </div>

                <form onSubmit={handleVerificationSubmit} className="register-form">
                  <div className="register-input-group">
                    <label htmlFor="verificationCode" className="register-label">
                      <i className="fas fa-key"></i>
                      Verification Code
                    </label>
                    <input
                      type="text"
                      id="verificationCode"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="register-input register-verification-input"
                      placeholder="Enter verification code"
                      required
                    />
                  </div>

                  {message && (
                    <div className={`register-message ${messageColor === 'red' ? 'register-message-error' : 'register-message-success'}`}>
                      <i className={`fas ${messageColor === 'red' ? 'fa-exclamation-triangle' : 'fa-check-circle'}`}></i>
                      <span>{message}</span>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="register-submit-btn"
                  >
                    {isLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check"></i>
                        Verify Email
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className="register-resend-btn"
                  >
                    <i className="fas fa-redo"></i>
                    Resend Code
                  </button>
                </form>
              </>
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
        className="register-toast-container"
      />
    </div>
  );
};

export default Register;