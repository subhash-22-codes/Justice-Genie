import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Bell, BookOpen } from 'lucide-react';
import '../styles/resources.css';

export default function ResourcePage() {
  const navigate = useNavigate();

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
    <div className="resource-page-wrapper min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden">
      <div className="resource-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        <div className="resource-header text-center mb-16">
        <div className="resource-icon-wrapper mb-8 animate-bounce">
        <img 
          src="./images/construction.png" 
          alt="Construction Icon" 
          className="w-16 sm:w-20 md:w-24 lg:w-28 xl:w-32 h-auto mx-auto"
        />
      </div>


          <h1 className="resource-title text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Resources Coming Soon
          </h1>
          <p className="resource-subtitle text-xl text-gray-600 max-w-2xl mx-auto">
            We're currently developing a comprehensive resource center to provide you with valuable legal information and guidance.
          </p>
        </div>
  
        <div className="resource-feature-grid grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="resource-feature-card bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="resource-feature-icon text-blue-600 mb-4">
                {feature.icon}
              </div>
              <h3 className="resource-feature-title text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="resource-feature-description text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
  
        <div className="resource-back-button-wrapper flex justify-center">
          <button
            onClick={() => navigate("/chat")}
            className="resource-back-button flex items-center gap-2 px-5 py-2 bg-blue-600 text-white font-semibold rounded-xl shadow-md transition-all duration-300 hover:bg-blue-700 hover:shadow-lg active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Chat
          </button>
        </div>
  
        <div className="resource-footer mt-16 text-center">
          <p className="resource-footer-text text-gray-500">
            Have questions? Contact our support team for assistance.
          </p>
        </div>
      </div>
    </div>
  );
  
}