// components/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center px-4 font-manrope">
      {/* SVG illustration */}
      <div className="max-w-md w-full flex items-center justify-center mb-2">
        <img
          src="/images/404-error.svg"
          alt="Page not found"
          className="w-full h-auto max-h-[300px] object-contain"
        />
      </div>

      {/* Title */}
      <h1 className="font-poppins font-bold text-xl sm:text-2xl text-slate-900 dark:text-slate-100 mt-2 text-center">
        Page Not Found
      </h1>

      {/* Small descriptive text */}
      <p className="font-manrope text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 text-center max-w-sm">
        The page you are looking for is not available or has been moved.
      </p>

      {/* Action button matching application design system */}
      <div className="mt-6 text-center">
        <Link
          to="/chat"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-manrope text-xs sm:text-sm font-semibold rounded-xl shadow-sm hover:shadow active:scale-95 transition-all duration-150"
        >
          <ArrowLeft size={16} />
          <span>Back to Chat</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;