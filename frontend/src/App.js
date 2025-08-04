import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion'; // Import AnimatePresence for smooth transitions

// Component Imports
import Login from './components/login'; 
import Chat from './components/chat'; 
import Register from './components/register'; 
import MyAccount from './components/myaccount';
import ForgotPassword from './components/forgotpassword';
import TermsAndPolicy from './components/termsandpolicy';
import Quizz from './components/quizz';
import LawPdf from './components/lawpdf';
import ResourcePage from './components/resources';
import IntroPage from './components/IntroPage';
import AdminPanel from './components/AdminPanel';
import UserManagement from './components/UserManagement';
import AdminCollab from './components/AdminCollab'; // ✅ Add this import
import ProtectedRoute from './components/ProtectedRoute';
import AdminFeedback from './components/AdminFeedback';
import NotFound from './components/NotFound';
import AdminQuiz from './components/AdminQuiz'; 
function AnimatedRoutes() {
  const location = useLocation(); // Get current route location

  return (
    <AnimatePresence mode="wait"> 
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgotpassword" element={<ForgotPassword />} />
        <Route path="/termsandpolicy" element={<TermsAndPolicy />} />
        <Route path="/IntroPage" element={<IntroPage />} />
        <Route path="/chat" element={
            <ProtectedRoute><Chat /></ProtectedRoute>
          } />
        <Route path="/lawpdf" element={
            <ProtectedRoute><LawPdf /></ProtectedRoute>
          } />
        <Route path="/quizz" element={
            <ProtectedRoute><Quizz /></ProtectedRoute>
          } />
        <Route path="/myaccount" element={
            <ProtectedRoute><MyAccount /></ProtectedRoute>
          } />
        <Route path="/resources" element={
            <ProtectedRoute><ResourcePage /></ProtectedRoute>
          } />
        <Route path="/admin" element={
            <ProtectedRoute><AdminPanel /></ProtectedRoute>
          } />
        <Route path="/user-management" element={
            <ProtectedRoute><UserManagement /></ProtectedRoute>
          } />
        <Route path="/collab" element={
            <ProtectedRoute><AdminCollab /></ProtectedRoute>
          } />
          <Route path="/feedbacks" element={
            <ProtectedRoute><AdminFeedback /></ProtectedRoute>
          } />
        <Route path="/admin/quiz-management" element={
            <ProtectedRoute><AdminQuiz /></ProtectedRoute>
          } />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  useEffect(() => {
    // Cleanup on tab/window close
    const handleTabClose = () => {
      // Perform any cleanup or state management here
      console.log("Tab closed or refreshed");
    };

    window.addEventListener("beforeunload", handleTabClose);

    // Cleanup when component unmounts
    return () => {
      window.removeEventListener("beforeunload", handleTabClose);
    };
  }, []);

  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}

export default App;
