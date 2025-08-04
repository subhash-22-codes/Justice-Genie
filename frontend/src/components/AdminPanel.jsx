import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, ClipboardList, MessageSquare, Star, 
  MessageCircle, LogOut, Crown
} from 'lucide-react';

const AdminPanel = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    if (!isAdmin) {
      navigate('/');
    }
  }, [navigate]);

  const handleExit = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  // Admin menu items with icons and paths
  const adminMenuItems = [
    {
      title: 'User Management',
      description: 'Manage user accounts, permissions, and access controls',
      icon: <Users className="h-8 w-8 text-indigo-500" />,
      path: '/user-management'
    },
    {
      title: 'Quiz Manager',
      description: 'Create, edit, and organize quizzes and assessments',
      icon: <ClipboardList className="h-8 w-8 text-indigo-500" />,
      path: '/admin/quiz-management'
    },
    {
      title: 'Collaboration Management',
      description: 'Manage team collaborations and shared projects',
      icon: <MessageSquare className="h-8 w-8 text-indigo-500" />,
      path: '/collab'
    },
    {
      title: 'Feedbacks',
      description: 'Review and respond to user feedback and suggestions',
      icon: <Star className="h-8 w-8 text-indigo-500" />,
      path: '/feedbacks'
    },
    {
      title: 'Chat History & Behavior',
      description: 'Monitor conversations and optimize chat behaviors',
      icon: <MessageCircle className="h-8 w-8 text-indigo-500" />,
      path: ''
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 px-4 py-6 md:px-8 md:py-10 transition-all duration-300">
      {/* Header Section */}
      <header className="relative mb-8 md:mb-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-3">
            <Crown className="h-8 w-8 text-purple-700" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800">
              Justice Genie Admin
            </h1>
          </div>
          
          <button
            onClick={handleExit}
            className="admin-button mt-4 md:mt-0 inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 text-white font-medium rounded-full transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            <span>Exit Admin</span>
          </button>
        </div>
        
        <p className="mt-2 text-indigo-600 max-w-2xl">
          Welcome to your admin dashboard. Manage all aspects of your Justice Genie application from here.
        </p>
      </header>

      {/* Admin Navigation Grid */}
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3"> 
        {adminMenuItems.map((item, index) => (
          <div
            key={index}
            onClick={() => navigate(item.path)}
            className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-transparent hover:border-indigo-100"
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-lg bg-indigo-50 group-hover:bg-indigo-100 transition-colors duration-300">
                  {item.icon}
                </div>
                <h2 className="ml-3 text-xl font-bold text-gray-800 group-hover:text-indigo-700 transition-colors duration-300">
                  {item.title}
                </h2>
              </div>
              
              <p className="text-gray-600 mb-4 text-sm">
                {item.description}
              </p>
              
              <div className="mt-2 flex justify-end">
                <span className="inline-flex items-center text-indigo-600 font-medium text-sm group-hover:text-indigo-800 transition-colors duration-300">
                  Manage
                  <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </div>
            </div>
            <div className="h-1 w-0 group-hover:w-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"></div>
          </div>
        ))}
      </div>

      {/* Status Footer */}
      <footer className="mt-10 text-center text-sm text-gray-500">
        <p>Justice Genie Admin Portal • All actions are logged and monitored</p>
      </footer>
    </div>
  );
};

export default AdminPanel;