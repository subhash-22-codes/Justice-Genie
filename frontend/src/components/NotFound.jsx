// components/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      {/* SVG illustration slightly larger */}
      <div className="max-w-full max-h-full flex items-center justify-center scale-[1.1]">
        <img
          src="/images/404-error.svg"
          alt="Page not found"
          className="w-full h-auto max-h-screen object-contain"
        />
      </div>

      {/* Small descriptive text */}
      <p className="text-gray-600 text-sm md:text-base mt-4 text-center">
        The page you are looking for is not available.
      </p>

      {/* Smaller button */}
      <div className="mt-6 text-center">
        <Link
          to="/"
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-full shadow hover:bg-blue-700 transition-all duration-300"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
