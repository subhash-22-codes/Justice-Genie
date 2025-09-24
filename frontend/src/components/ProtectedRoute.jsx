import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { FaSpinner } from "react-icons/fa";
const ProtectedRoute = ({ children }) => {
  const { auth } = useContext(AuthContext);

if (auth.loading) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <div className="flex space-x-4 mb-4">
        
        <FaSpinner className="text-green-500 text-4xl animate-spin" />
      
      </div>
      <p className="text-gray-700 font-semibold text-lg">
        Preparing your legal companion...
      </p>
    </div>
  );
}

  return auth.loggedIn ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
