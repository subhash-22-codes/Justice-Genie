import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Mail, Calendar } from 'lucide-react';
import '../styles/admin.css';
const AdminFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

    useEffect(() => {
       const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
       if (!isAdmin) {
         navigate('/');
       }
     }, [navigate]);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const response = await fetch('/api/admin/feedbacks', {
          method: 'GET',
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('Failed to fetch feedbacks');
        }
        const data = await response.json();
        setFeedbacks(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Admin Feedbacks</h1>

      {error && (
        <div className="bg-red-500 text-white p-4 rounded-md mb-4 text-center">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center">
          <svg className="w-10 h-10 animate-spin text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V1a10 10 0 00-10 10h2z"></path>
          </svg>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="text-center text-gray-500">No feedbacks found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {feedbacks.map((feedback) => (
            <div key={feedback._id} className="bg-white rounded-xl shadow-md p-5 transition-transform hover:scale-[1.02]">
              <div className="flex items-center gap-2 mb-2 text-indigo-600 font-medium">
                <Mail size={18} />
                {feedback.email}
              </div>
              <div className="flex items-center gap-2 mb-3 text-gray-600 text-sm">
                <Calendar size={16} />
                {new Date(feedback.submitted_at).toLocaleString()}
              </div>
              <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-md shadow-sm">
            
                <p className="text-sm leading-relaxed text-gray-700 italic">"{feedback.feedback_text}"</p>
              </div>

            </div>
          ))}
        </div>
      )}

      <div className="text-center mt-10">
        <button
          onClick={() => navigate('/admin')}
          className="admin-button inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-300"
        >
          <Crown size={18} className="text-yellow-300" />
          Go to Admin Panel
        </button>
      </div>
    </div>
  );
};

export default AdminFeedback;
