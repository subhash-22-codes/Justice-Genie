import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Crown, CheckCircle, XCircle, Clock, Loader2, ArrowLeft } from 'lucide-react';

const AdminCollab = () => {
  const [collabs, setCollabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    if (!isAdmin) {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchCollabs = async () => {
      try {
        const response = await axios.get('/api/admin/collab-requests', {
          withCredentials: true,
        });
        setCollabs(response.data);
      } catch (error) {
        console.error('Error fetching collab data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCollabs();
  }, []);

  const handleAction = async (id, action) => {
    setActionStatus(prev => ({ ...prev, [id]: 'processing' }));
    
    try {
      // Simulating API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 800));
      // const response = await axios.post(`/api/admin/collab-requests/${id}/${action}`, {}, { withCredentials: true });
      
      setActionStatus(prev => ({ ...prev, [id]: action }));
      
      // Update the list after successful action
      setTimeout(() => {
        setCollabs(prev => prev.filter(item => item.id !== id));
        setActionStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[id];
          return newStatus;
        });
      }, 1500);
    } catch (error) {
      console.error(`Error ${action}ing collaboration request:`, error);
      setActionStatus(prev => ({ ...prev, [id]: 'error' }));
      
      // Reset error state after delay
      setTimeout(() => {
        setActionStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[id];
          return newStatus;
        });
      }, 3000);
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getSkillBadge = (skill) => {
    if (!skill) return 'bg-gray-100 text-gray-700';
  
    const normalizedSkill = skill.toLowerCase();
  
    const badges = {
      'react': 'bg-blue-100 text-blue-700',
      'angular': 'bg-red-100 text-red-700',
      'vue': 'bg-green-100 text-green-700',
      'node.js': 'bg-emerald-100 text-emerald-700',
      'node': 'bg-emerald-100 text-emerald-700',
      'python': 'bg-yellow-100 text-yellow-700',
      'java': 'bg-orange-100 text-orange-700',
      'c++': 'bg-purple-100 text-purple-700',
      'c#': 'bg-indigo-100 text-indigo-700',
      'flask': 'bg-gray-100 text-gray-700',
      'django': 'bg-lime-100 text-lime-700',
      'mongodb': 'bg-green-100 text-green-700',
      'mysql': 'bg-blue-100 text-blue-700',
      'postgresql': 'bg-indigo-100 text-indigo-700',
      'firebase': 'bg-orange-100 text-orange-700',
      'cassandra': 'bg-purple-100 text-purple-700',
      'vitejs': 'bg-pink-100 text-pink-700',
      'express': 'bg-teal-100 text-teal-700',
      'typescript': 'bg-sky-100 text-sky-700',
      'html': 'bg-red-100 text-red-700',
      'css': 'bg-blue-100 text-blue-700',
      'javascript': 'bg-yellow-100 text-yellow-700'
    };
  
    return badges[normalizedSkill] || 'bg-gray-100 text-gray-700';
  };
  

  const renderBadges = (items) => {
    if (!items) return null;
  
    const itemList = items
      .split(/\s*(?:,|\band\b|\bor\b)\s*/i) // split only on whole words "and", "or", or commas
      .map(item => item.trim())
      .filter(item => item);
  
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {itemList.map((item, i) => (
          <span 
            key={i} 
            className={`text-xs px-2 py-1 rounded-full ${getSkillBadge(item)}`}
          >
            {item}
          </span>
        ))}
      </div>
    );
  };
  

  const renderCardStatus = (id) => {
    const status = actionStatus[id];
    
    if (!status) return null;
    
    if (status === 'processing') {
      return (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
          <div className="flex flex-col items-center">
            <Loader2 className="animate-spin text-indigo-600 mb-2" size={32} />
            <p className="text-indigo-700 font-medium">Processing...</p>
          </div>
        </div>
      );
    }
    
    if (status === 'accept') {
      return (
        <div className="absolute inset-0 bg-green-50/90 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
          <div className="flex flex-col items-center">
            <CheckCircle className="text-green-600 mb-2" size={32} />
            <p className="text-green-700 font-medium">Accepted!</p>
          </div>
        </div>
      );
    }
    
    if (status === 'reject') {
      return (
        <div className="absolute inset-0 bg-red-50/90 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
          <div className="flex flex-col items-center">
            <XCircle className="text-red-600 mb-2" size={32} />
            <p className="text-red-700 font-medium">Rejected</p>
          </div>
        </div>
      );
    }
    
    if (status === 'error') {
      return (
        <div className="absolute inset-0 bg-orange-50/90 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
          <div className="flex flex-col items-center">
            <div className="text-orange-600 mb-2">⚠️</div>
            <p className="text-orange-700 font-medium">Action failed. Try again.</p>
          </div>
        </div>
      );
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex flex-col items-center justify-center p-4">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
        <p className="text-xl font-medium text-indigo-800">Loading collaboration requests...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-indigo-500 text-center">
            Collaboration Requests
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Empty state */}
        {collabs.length === 0 && (
          <div className="bg-white rounded-2xl shadow-md p-10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              <Clock className="text-indigo-500" size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Pending Requests</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              There are currently no collaboration requests waiting for your review.
            </p>
          </div>
        )}

        {/* Grid View */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {collabs.map((item) => (
            <div
              key={item.id || Math.random().toString()}
              className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 transition-all hover:shadow-lg relative overflow-hidden"
            >
              {renderCardStatus(item.id)}
              
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-indigo-700">{item.name || 'Unnamed'}</h3>
                <div className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-medium rounded-full">
                  {item.collaborationType || 'Collaboration'}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-600 flex items-center">
                  <span className="font-semibold w-24">Email:</span> 
                  <span className="text-gray-800">{item.email || 'No email provided'}</span>
                </p>
                
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Skills:</p>
                  {renderBadges(item.skills)}
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 font-semibold mb-1">Frameworks:</p>
                  {renderBadges(item.frameworks)}
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Language:</p>
                    <div className="mt-1">{renderBadges(item.language)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Database:</p>
                    <div className="mt-1">{renderBadges(item.database)}</div>
                  </div>
                </div>
                
                <div className="mt-3">
                  <p className="text-sm text-gray-600 font-semibold mb-1">Message:</p>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 max-h-24 overflow-y-auto">
                    {item.message || 'No message provided'}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 flex items-center">
                  <Clock size={14} className="mr-1" /> 
                  {formatDate(item.submitted_at || new Date())}
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction(item.id, 'accept')}
                    disabled={actionStatus[item.id]}
                    className="admin-button px-4 py-2 bg-green-100 text-green-700 font-medium rounded-lg hover:bg-green-200 transition-all duration-200 shadow-sm flex items-center gap-1"
                  >
                    <CheckCircle size={16} />
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={() => handleAction(item.id, 'reject')}
                    disabled={actionStatus[item.id]}
                    className="admin-button px-4 py-2 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 transition-all duration-200 shadow-sm flex items-center gap-1"
                  >
                    <XCircle size={16} />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Button */}
        <div className="text-center mt-12">
          <button
            onClick={() => navigate('/admin')}
            className="admin-button inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:from-indigo-700 hover:to-purple-700 hover:scale-105 hover:shadow-xl transition-all duration-300"
          >
            <ArrowLeft size={18} />
            <span>Back to Admin Panel</span>
            <Crown size={18} className="text-yellow-300 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminCollab;