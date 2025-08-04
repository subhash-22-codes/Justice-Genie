import React, { useState } from 'react';
import '../styles/register.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2';
import { Loader2, Scale, BookOpen, Briefcase, GraduationCap,Layers,Globe ,Lightbulb} from 'lucide-react';
// import { motion } from 'framer-motion';
import { Link} from "react-router-dom";
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
  const navigate = useNavigate();
  const validatePhone = (phone) => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };
  
  const validateEmail = (email) => {
    // Simple regex for basic email validation
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Validate phone number
    if (!validatePhone(phone)) {
      setMessage('Phone number must be 10 digits.');
      setMessageColor('red');
      return;
    }
  
    // Validate password
    if (!validatePassword(password)) {
      setMessage('Password must be at least 6 characters long.');
      setMessageColor('red');
      return;
    }
  
    // Check password match
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      setMessageColor('red');
      return;
    }
  
    // Validate profession selection
    if (!profession) {
      setMessage('Please select your profession.');
      setMessageColor('red');
      return;
    }
  
    // Validate email format with regex
    if (!validateEmail(email)) {
      setMessage('Invalid email format. Please enter a valid email address.');
      setMessageColor('red');
      return;
    }
  
    // 🧠 Mailcheck suggestion instead of hard regex
    Mailcheck.run({
      email: email,
      suggested: function (suggestion) {
        // If Mailcheck finds a suggestion, show it to the user
        setMessage(`Did you mean ${suggestion.full}?`);
        setMessageColor('red');
        return; // Stop further execution if suggestion is found
      },
      empty: async function () {
        // Proceed to email confirmation if no suggestion
        setMessage(''); // Clear any previous message
  
        // Ask user to confirm the email
        const confirmEmail = await Swal.fire({
          title: 'Confirm Email',
          text: `Is this your correct email? ${email}`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, proceed!',
          cancelButtonText: 'No, let me check'
        });
  
        if (!confirmEmail.isConfirmed) return; // Stop if user doesn't confirm
  
        setIsLoading(true);
        try {
          const response = await fetch('/api/register', {
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
  
            // Handle "Username already exists" error
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
      const response = await fetch('/api/verify_code', {
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
          navigate('/login'); // Soft navigation without a page reload
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
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, resend!'
    });

    if (!confirmResend.isConfirmed) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/resend_verification_code', {
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
    
    <>
      <ToastContainer />
      <div className="register-page">
        <div className="register-container">
          
          <div className="register-left">
            <div className="register-left-content">
            <div className="register-logo">
            <img
              src="./images/JGLogo.png"
              alt="Justice Genie Logo"
              className="register-logo-icon w-[48px] h-[48px] sm:w-[56px] sm:h-[56px] md:w-[64px] md:h-[64px]"
            />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-900"><strong>Justice Genie 2.0</strong></h1>
          </div>


              <h2 className="register-tagline">Understand Your Legal Rights</h2>
              
              <div className="register-features">
                <div className="register-feature">
                  <div className="register-feature-icon">
                    <BookOpen />
                  </div>
                  <div className="register-feature-text">
                    <h3>Legal Knowledge</h3>
                    <p>Access comprehensive legal information tailored to your needs</p>
                  </div>
                </div>
                
                <div className="register-feature">
                  <div className="register-feature-icon">
                    <Scale />
                  </div>
                  <div className="register-feature-text">
                    <h3>Case Analysis</h3>
                    <p>Get AI-powered insights on legal precedents and case outcomes</p>
                  </div>
                </div>
                
                <div className="register-feature">
                  <div className="register-feature-icon">
                    <Briefcase />
                  </div>
                  <div className="register-feature-text">
                    <h3>Document Assistance</h3>
                    <p>Generate and review legal documents with expert guidance</p>
                  </div>
                </div>
                <div className="register-feature">
              <div className="register-feature-icon">
                <Lightbulb />
              </div>
              <div className="register-feature-text">
                <h3>Know Your Legal Rights</h3>
                <p>Explore easy-to-understand legal insights that empower you to navigate the law with confidence.</p>
              </div>
            </div>

              <div className="register-feature">
                <div className="register-feature-icon">
                  <Globe />
                </div>
                <div className="register-feature-text">
                  <h3>Multilingual Support</h3>
                  <p>Get legal assistance in multiple languages for better accessibility</p>
                </div>
              </div>

              <div className="register-features">
                <div className="register-feature">
                  <div className="register-feature-icon">
                    <Layers />
                  </div>
                  <div className="register-feature-text">
                    <h3>5-Level Quiz</h3>
                    <p>Test your legal knowledge with quizzes designed to enhance your understanding</p>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
          
          <div className="register-right">
            <div className="register-form-container">
              <h2 className="register-form-title">Create Your Account</h2>
              <p className="register-form-subtitle">Join thousands of users getting legal assistance</p>
              
              {!isVerified ? (
                <form className="register-form" onSubmit={handleSubmit}>
                  <div className="register-form-group">
                    <label className="register-label" htmlFor="username">Username</label>
                    <input
                      className="register-input"
                      type="text"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      placeholder="Choose a username"
                    />
                  </div>
                  
                  <div className="register-form-group">
                    <label className="register-label" htmlFor="email">Email Address</label>
                    <input
                      className="register-input"
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Your email address"
                    />
                  </div>
                  
                  <div className="register-form-row">
                    <div className="register-form-group">
                      <label className="register-label" htmlFor="phone">Phone Number</label>
                      <input
                        className="register-input"
                        type="tel"
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        placeholder="10-digit number"
                      />
                    </div>
                    
                    <div className="register-form-group">
                      <label className="register-label" htmlFor="dob">Date of Birth</label>
                      <input
                        className="register-input"
                        type="date"
                        id="dob"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="register-form-group">
                    <label className="register-label">What best describes you?</label>
                    <div className="register-profession-options">
                      <div 
                        className={`register-profession-option ${profession === 'student' ? 'register-profession-selected' : ''}`}
                        onClick={() => setProfession('student')}
                      >
                        <GraduationCap className="register-profession-icon" />
                        <span>Student</span>
                      </div>
                      <div 
                        className={`register-profession-option ${profession === 'professional' ? 'register-profession-selected' : ''}`}
                        onClick={() => setProfession('professional')}
                      >
                        <Briefcase className="register-profession-icon" />
                        <span>Working Professional</span>
                      </div>
                      <div 
                        className={`register-profession-option ${profession === 'lawyer' ? 'register-profession-selected' : ''}`}
                        onClick={() => setProfession('lawyer')}
                      >
                        <Scale className="register-profession-icon" />
                        <span>Lawyer</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="register-form-row">
                    <div className="register-form-group">
                      <label className="register-label" htmlFor="password">Password</label>
                      <input
                        className="register-input"
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Minimum 6 characters"
                      />
                    </div>
                    
                    <div className="register-form-group">
                      <label className="register-label" htmlFor="confirmPassword">Confirm Password</label>
                      <input
                        className="register-input"
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Re-enter password"
                      />
                    </div>
                  </div>
                  
                  <div className="register-terms">
                    <input type="checkbox" id="terms" required />
                    <label htmlFor="terms" className="text-sm text-gray-700">
                    I agree to the{" "}
                    <span
                      onClick={() => navigate('/termsandpolicy')}
                      className="text-blue-600 hover:underline cursor-pointer"
                    >
                      Terms of Service
                    </span>{" "}
                    and{" "}
                    <span
                      onClick={() => navigate('/termsandpolicy')}
                      className="text-blue-600 hover:underline cursor-pointer"
                    >
                      Privacy Policy
                    </span>
                  </label>

                  </div>
                  
                  <button
                    type="submit"
                    className="register-submit-btn flex justify-center items-center w-fullflex justify-center items-center w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2 animate-pulse text-sm text-white">
                        <Loader2 className="animate-spin" size={20} />
                        Creating Account...
                      </span>
                    ) : (
                      'Create Account'
                    )}
                  </button>

  
                  {message && <div className="register-message" style={{ color: messageColor }}>{message}</div>}
                  
                  <div className="text-center mt-4 text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-blue-600 font-semibold hover:underline hover:text-blue-800 transition-all duration-200"
                  >
                    Sign in
                  </Link>
                </div>


                <div className="text-center mt-6 text-xs text-gray-600 px-4">
                  <p className="text-indigo-700 dark:text-indigo-400 font-semibold tracking-wide">
                  ✨ Justice Genie is your 24×7 AI-powered legal assistant.
                  </p>
                </div>



                </form>
              ) : (
                <div className="register-verification-container">
                  <h3 className="register-verification-title">Email Verification</h3>
                  <p className="register-verification-text">We've sent a verification code to your email. Please enter it below to complete your registration.</p>
                  
                  <form className="register-verification-form" onSubmit={handleVerificationSubmit}>
                    <div className="register-form-group">
                      <label className="register-label" htmlFor="verificationCode">Verification Code</label>
                      <input
                        className="register-input register-verification-input"
                        type="text"
                        id="verificationCode"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        required
                        placeholder="Enter the 6-digit code"
                      />
                    </div>
                    
                    <button type="submit" className="register-verification-submit-btn" disabled={isLoading}>
                      {isLoading ? (
                        <span className="register-loading">
                          <Loader2 className="register-spinner" size={20} />
                          Verifying...
                        </span>
                      ) : (
                        'Verify Code'
                      )}
                    </button>
                    
                    <button 
                      type="button" 
                      className="register-resend-btn" 
                      onClick={handleResendCode} 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="register-loading">
                          <Loader2 className="register-spinner" size={20} />
                          Resending...
                        </span>
                      ) : (
                        'Resend Verification Code'
                      )}
                    </button>
                      
                    
                    {message && <div className="register-message" style={{ color: messageColor }}>{message}</div>}
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
    
  );
};

export default Register;