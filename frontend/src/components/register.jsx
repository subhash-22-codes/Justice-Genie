import React, { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2';
import { Link } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import Mailcheck from 'mailcheck';
import {
  User, Mail, Phone, Calendar, Briefcase, Lock, Eye, EyeOff,
  AlertTriangle, CheckCircle, Loader, UserPlus, MailOpen, KeyRound, Check, RotateCw
} from 'lucide-react';

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
          confirmButtonColor: '#1e293b',
          cancelButtonColor: '#dc2626',
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
  setIsLoading(true); // start loading

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
  } finally {
    setIsLoading(false); // always stop loading
  }
};

  const handleResendCode = async () => {
    const confirmResend = await Swal.fire({
      title: 'Resend Code?',
      text: 'Are you sure you want to resend the verification code?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1e293b',
      cancelButtonColor: '#dc2626',
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-sm shadow-xl overflow-hidden">
        {/* macOS-style top bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-100 border-b border-slate-200">
          <span className="w-3 h-3 rounded-full bg-red-400"></span>
          <span className="w-3 h-3 rounded-full bg-amber-400"></span>
          <span className="w-3 h-3 rounded-full bg-green-400"></span>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Left - Illustration (desktop only) */}
          <div className="hidden lg:block lg:w-2/5">
            <img
              src="/images/GenieTemplate.png"
              alt="Justice Genie Illustration"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right - Form */}
          <div className="flex-1 p-6 sm:p-10 max-h-[85vh] overflow-y-auto">
            {!isVerified ? (
              <>
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4 lg:hidden">
                    <img src="/images/jg_original_logo_1.png" alt="Logo" className="w-8 h-8 object-contain" />
                    <h1 className="font-poppins font-bold text-slate-800">Justice Genie</h1>
                  </div>
                  <h2 className="font-poppins text-2xl font-bold text-slate-800">Create Your Account</h2>
                  <p className="font-manrope text-sm text-slate-500 mt-1">Join 30+ early users exploring AI-powered legal assistance</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="username" className="flex items-center gap-1.5 font-poppins text-sm font-medium text-slate-700 mb-1.5">
                        <User size={14} />
                        Username
                      </label>
                      <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full font-manrope text-sm px-3 py-2.5 rounded-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your username"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="flex items-center gap-1.5 font-poppins text-sm font-medium text-slate-700 mb-1.5">
                        <Mail size={14} />
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full font-manrope text-sm px-3 py-2.5 rounded-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your email address"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="flex items-center gap-1.5 font-poppins text-sm font-medium text-slate-700 mb-1.5">
                        <Phone size={14} />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full font-manrope text-sm px-3 py-2.5 rounded-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your phone number"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="dob" className="flex items-center gap-1.5 font-poppins text-sm font-medium text-slate-700 mb-1.5">
                        <Calendar size={14} />
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        id="dob"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full font-manrope text-sm px-3 py-2.5 rounded-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="profession" className="flex items-center gap-1.5 font-poppins text-sm font-medium text-slate-700 mb-1.5">
                        <Briefcase size={14} />
                        Profession
                      </label>
                      <select
                        id="profession"
                        value={profession}
                        onChange={(e) => setProfession(e.target.value)}
                        className="w-full font-manrope text-sm px-3 py-2.5 rounded-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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

                    <div>
                      <label htmlFor="password" className="flex items-center gap-1.5 font-poppins text-sm font-medium text-slate-700 mb-1.5">
                        <Lock size={14} />
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full font-manrope text-sm px-3 py-2.5 pr-10 rounded-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="flex items-center gap-1.5 font-poppins text-sm font-medium text-slate-700 mb-1.5">
                        <Lock size={14} />
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          id="confirmPassword"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full font-manrope text-sm px-3 py-2.5 pr-10 rounded-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Confirm password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {message && (
                    <div className={`flex items-center gap-2 font-manrope text-sm px-4 py-2.5 rounded-sm ${messageColor === 'red' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                      {messageColor === 'red' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                      <span>{message}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 font-manrope font-semibold py-3 rounded-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-60"
                  >
                    {isLoading ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} />
                        Create Account
                      </>
                    )}
                  </button>

                  <div className="text-center font-manrope text-sm text-slate-500">
                    <p>Already have an account? <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign In</Link></p>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-sm bg-blue-50 flex items-center justify-center mx-auto mb-4">
                    <MailOpen size={26} className="text-blue-600" />
                  </div>
                  <h2 className="font-poppins text-xl font-bold text-slate-800">Verify Your Email</h2>
                  <p className="font-manrope text-sm text-slate-500 mt-2">
                    We've sent a verification code to <span className="font-semibold text-slate-700">{email}</span>.
                    <br />
                    <span className="text-xs text-slate-400">
                      If you don't see it in your inbox, please check your Spam/Promotions folder.
                    </span>
                  </p>
                </div>

                <form onSubmit={handleVerificationSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="verificationCode" className="flex items-center gap-1.5 font-manrope text-sm font-medium text-slate-700 mb-1.5">
                      <KeyRound size={14} />
                      Verification Code
                    </label>
                    <input
                      type="text"
                      id="verificationCode"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full font-manrope text-sm tracking-widest px-3 py-2.5 rounded-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter verification code"
                      required
                    />
                  </div>

                  {message && (
                    <div className={`flex items-center gap-2 font-manrope text-sm px-4 py-2.5 rounded-sm ${messageColor === 'red' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                      {messageColor === 'red' ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                      <span>{message}</span>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 font-manrope font-semibold py-3 rounded-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-60"
                  >
                    {isLoading ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        Verify Email
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 font-manrope text-sm text-slate-600 hover:bg-slate-100 py-2.5 rounded-sm transition-colors disabled:opacity-60"
                  >
                    <RotateCw size={16} />
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
      />
    </div>
  );
};

export default Register;
