import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { auth } = useContext(AuthContext);

  if (auth.loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent border-b-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-700 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return auth.loggedIn ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
