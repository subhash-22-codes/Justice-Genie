// components/ProtectedRoute.js
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/check-session`, {
      method: "GET",
      credentials: "include", // important to send cookies
    })
      .then((res) => res.json())
      .then((data) => {
        setIsLoggedIn(data.loggedIn);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>; // optional spinner

  return isLoggedIn ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
