// components/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-gray-800 px-4 py-10 text-center">
      <h1 className="text-6xl md:text-8xl font-bold mb-4">404</h1>
      <p className="text-lg md:text-2xl mb-6">
        Oops! The page you're looking for doesn't exist.
      </p>
      <Link
        to="/"
        className="px-6 py-2 bg-blue-600 text-white text-sm md:text-base rounded-full hover:bg-blue-700 transition-all duration-300"
      >
        Go to Home
      </Link>
    </div>
  );
};

export default NotFound;
