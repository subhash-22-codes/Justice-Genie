import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Mail, Calendar, Loader } from 'lucide-react';
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
        const response = await fetch(`/api/admin/feedbacks?page=1&limit=100`, {
          method: 'GET',
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('Failed to fetch feedbacks');
        }
        const data = await response.json();
        setFeedbacks(data.feedbacks || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-10 px-4">
      <div className="container mx-auto">
        <h1 className="font-poppins text-3xl font-bold text-center text-slate-800 dark:text-slate-100 mb-8">Admin Feedbacks</h1>

        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 font-manrope p-4 rounded-sm mb-4 text-center">
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center font-manrope text-slate-400 dark:text-slate-500">No feedbacks found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feedbacks.map((feedback) => (
              <div key={feedback._id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-5">
                <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400 font-manrope font-medium">
                  <Mail size={16} />
                  {feedback.email}
                </div>
                <div className="flex items-center gap-2 mb-3 text-slate-400 dark:text-slate-500 font-manrope text-xs">
                  <Calendar size={14} />
                  {new Date(feedback.submitted_at).toLocaleString()}
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-sm">
                  <p className="font-manrope text-sm leading-relaxed text-slate-600 dark:text-slate-300 italic">"{feedback.feedback_text}"</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-manrope font-medium px-5 py-2.5 rounded-sm transition-colors"
          >
            <Crown size={16} />
            Go to Admin Panel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminFeedback;
