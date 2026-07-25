import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Bell, BookOpen, Menu } from 'lucide-react';

export default function ResourcePage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const features = [
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Coming Soon",
      description: "Our team is working hard to bring you comprehensive legal resources."
    },
    {
      icon: <Bell className="w-6 h-6" />,
      title: "Stay Updated",
      description: "We'll notify you as soon as new resources become available."
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Comprehensive Content",
      description: "Access to detailed legal information and guidance."
    }
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden font-manrope">
      {/* Sidebar Layout Parity */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transform transition-transform duration-300 ease-premium lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-14 sm:h-16 px-4 sm:px-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center flex-shrink-0">
              <img
                src="/images/jg_original_logo_1.png"
                alt="Justice Genie"
                className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
              />
            </div>
            <h1 className="text-sm sm:text-[15px] font-poppins font-bold text-slate-900 dark:text-slate-50 tracking-tight">
              Justice Genie
            </h1>
          </div>
          <button
            className="lg:hidden p-2 rounded-md text-slate-400 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800 transition-colors"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <ArrowLeft size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-4">
          <button
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-xs sm:text-sm font-manrope font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
            onClick={() => navigate('/chat')}
          >
            <ArrowLeft size={16} className="text-slate-400 dark:text-slate-500" />
            <span>Back to Chat</span>
          </button>

          <div className="space-y-1 pt-2">
            <p className="font-poppins text-[11px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 px-1 mb-2">Navigation</p>
           <Link to="/chat" className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" fill="#8B5CF6" fillOpacity="0.15" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Chat Assistant
            </Link>
            <Link to="/quiz" className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" fill="#10B981" fillOpacity="0.15" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 7H15" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 11H13" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Genie Quiz
            </Link>
            <Link to="/lawpdf" className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" fill="#3B82F6" fillOpacity="0.15" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 2V8H20" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 13H8" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 17H8" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10 9H9H8" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Digital Law Library
            </Link>
            <Link to="/myaccount" className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="8" r="4" fill="#F59E0B" fillOpacity="0.15" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4 20C4 17.7909 7.58172 16 12 16C16.4183 16 20 17.7909 20 20" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                My Account
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-3">
                <button
                    className="lg:hidden p-2 -ml-2 rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Open sidebar"
                >
                    <Menu size={18} />
                </button>
                <h2 className="font-poppins font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-[15px] flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Legal Resources
                </h2>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-4xl mx-auto">

            <div className="text-center mb-10">
              <h1 className="font-poppins text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-3 tracking-tight">
                Resources Coming Soon
              </h1>
              <p className="font-manrope text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
                We're currently developing a comprehensive resource center to provide you with valuable legal information and guidance.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-5 mb-10">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-6 shadow-card hover:border-blue-300 dark:hover:border-blue-500/40 transition-all duration-200"
                >
                  <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 w-fit mb-3">
                    {feature.icon}
                  </div>
                  <h3 className="font-poppins font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-100 mb-1.5">
                    {feature.title}
                  </h3>
                  <p className="font-manrope text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <p className="font-manrope text-xs sm:text-sm text-slate-400 dark:text-slate-500">
                Have questions? Contact our support team for assistance.
              </p>
            </div>
          </div>
        </div>
      </main>

      {sidebarOpen && (
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-30 lg:hidden animate-fadeIn" onClick={() => setSidebarOpen(false)}></div>
      )}
    </div>
  );
}