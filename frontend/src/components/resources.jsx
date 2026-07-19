import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Bell, BookOpen } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        <div className="text-center mb-14">
          <h1 className="font-poppins text-4xl md:text-5xl font-bold text-slate-800 dark:text-slate-100 mb-4">
            Resources Coming Soon
          </h1>
          <p className="font-manrope text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            We're currently developing a comprehensive resource center to provide you with valuable legal information and guidance.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-14">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-6 hover:border-blue-300 dark:hover:border-blue-500/40 transition-colors duration-300"
            >
              <div className="text-blue-600 dark:text-blue-400 mb-3">
                {feature.icon}
              </div>
              <h3 className="font-poppins font-semibold text-slate-800 dark:text-slate-100 mb-1">
                {feature.title}
              </h3>
              <p className="font-manrope text-sm text-slate-500 dark:text-slate-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => navigate("/chat")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-sm bg-blue-600 text-white font-manrope font-medium hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Chat
          </button>
        </div>

        <div className="mt-14 text-center">
          <p className="font-manrope text-sm text-slate-400 dark:text-slate-500">
            Have questions? Contact our support team for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}
