// components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const isLoggedIn = sessionStorage.getItem('isLoggedIn'); // adjust if you're using cookies or localStorage

  return isLoggedIn ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
