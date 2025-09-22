// App.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { AuthProvider } from './context/AuthContext';

// Component Imports
import Login from './components/login'; 
import Chat from './components/chat'; 
import Register from './components/register'; 
import MyAccount from './components/myaccount';
import ForgotPassword from './components/forgotpassword';
import Quizz from './components/quizz';
import LawPdf from './components/lawpdf';
import ResourcePage from './components/resources';
import IntroPage from './components/IntroPage';
import AdminPanel from './components/AdminPanel';
import UserManagement from './components/UserManagement';
import AdminCollab from './components/AdminCollab';
import ProtectedRoute from './components/ProtectedRoute';
import AdminFeedback from './components/AdminFeedback';
import NotFound from './components/NotFound';
import AdminQuiz from './components/AdminQuiz'; 
import LandingPage from './components/LandingPage';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait"> 
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgotpassword" element={<ForgotPassword />} />
        <Route path="/IntroPage" element={<IntroPage />} />

        {/* Protected Routes */}
        <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/lawpdf" element={<ProtectedRoute><LawPdf /></ProtectedRoute>} />
        <Route path="/quizz" element={<ProtectedRoute><Quizz /></ProtectedRoute>} />
        <Route path="/myaccount" element={<ProtectedRoute><MyAccount /></ProtectedRoute>} />
        <Route path="/resources" element={<ProtectedRoute><ResourcePage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
        <Route path="/user-management" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
        <Route path="/collab" element={<ProtectedRoute><AdminCollab /></ProtectedRoute>} />
        <Route path="/feedbacks" element={<ProtectedRoute><AdminFeedback /></ProtectedRoute>} />
        <Route path="/admin/quiz-management" element={<ProtectedRoute><AdminQuiz /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  useEffect(() => {
    const handleTabClose = () => {
      console.log("Tab closed or refreshed");
    };

    window.addEventListener("beforeunload", handleTabClose);

    return () => {
      window.removeEventListener("beforeunload", handleTabClose);
    };
  }, []);

  return (
    <AuthProvider>
      <div className='font-poppins'>
        <Router>
          <AnimatedRoutes />
          <ToastContainer 
            position="top-right"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
            draggable
          />
        </Router>
      </div>
    </AuthProvider>
  );
}

export default App;
