import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Search, X, Calendar, Phone, Mail, Clock } from 'lucide-react';
import Swal from 'sweetalert2';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [lockedUsers, setLockedUsers] = useState({});

  useEffect(() => {
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    if (!isAdmin) {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/users');
        const data = await response.json();
        setUsers(data.users || []);
  
        // Filter only locked users
        const lockedUserEmails = data.users
          .filter(user => user.account_locked_until)
          .map(user => user.email);
  
        // Fetch lock status only for locked users
        const lockStatusPromises = lockedUserEmails.map(async (email) => {
          const res = await fetch(`/api/user/lock-status?email=${email}`);
          const data = await res.json();
          if (data.success) {
            if (data.lock_until === null) {
              return { email, lockUntil: null };  // User is unlocked
            }
            // Convert UTC to IST
            const lockUntilUtc = new Date(data.lock_until);
            const lockUntilIst = new Date(lockUntilUtc.getTime() + (5 * 60 + 30) * 60000); // Add 5 hours 30 minutes in milliseconds
  
            return { email, lockUntil: lockUntilIst };
          }
          return null;
        });
  
        const lockStatus = await Promise.all(lockStatusPromises);
        const lockedUsersData = lockStatus.reduce((acc, item) => {
          if (item) acc[item.email] = item.lockUntil;
          return acc;
        }, {});
  
        setLockedUsers(lockedUsersData);
  
      } catch (error) {
        console.error("Error fetching users:", error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to load users. Please try again.',
          icon: 'error',
          confirmButtonColor: '#4F46E5'
        });
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchUsers();
  }, []);
  
  
  
  

  const handleRemove = async (email) => {
    // If the user is already locked, return
    if (lockedUsers[email]) return;
  
    // Ask for confirmation using Swal
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You are about to lock ${email}'s account temporarily.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Lock it!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#4F46E5',
      cancelButtonColor: '#d33',
    });
  
    // If user confirms, lock the user
    if (result.isConfirmed) {
      try {
        // Send request to lock the user
        const response = await fetch(`/api/admin/remove-user`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });
  
        const data = await response.json();
  
        if (data.success) {
          // Lock user and set the lock time (e.g., 5 minutes)
          const lockTime = Date.now() + 5 * 60 * 1000; // 5 minutes from now
          setLockedUsers((prev) => ({
            ...prev,
            [email]: lockTime,
          }));
  
          // Show success alert
          Swal.fire({
            title: 'User Temporarily Locked',
            text: `${email} has been locked for 5 minutes.`,
            icon: 'success',
            confirmButtonColor: '#4F46E5',
            timer: 2000,
            timerProgressBar: true,
          });
  
          // Start a countdown to unlock the user after 5 minutes
          const interval = setInterval(() => {
            setLockedUsers((prev) => {
              const remainingTime = prev[email] - Date.now();
              if (remainingTime <= 0) {
                clearInterval(interval);
                const updated = { ...prev };
                delete updated[email];
                return updated;
              }
              return { ...prev, [email]: prev[email] };
            });
          }, 1000); // Update every second
        } else {
          Swal.fire({
            title: 'Operation Failed',
            text: 'Failed to lock user. Try again.',
            icon: 'error',
            confirmButtonColor: '#4F46E5',
          });
        }
      } catch (error) {
        console.error('Error locking user:', error);
        Swal.fire({
          title: 'Error',
          text: 'Something went wrong. Please try again.',
          icon: 'error',
          confirmButtonColor: '#4F46E5',
        });
      }
    }
  };
  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleColor = (role) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-purple-100 text-purple-700';
      case 'moderator':
        return 'bg-blue-100 text-blue-700';
      case 'premium':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold text-indigo-700 flex items-center gap-2">
            <Crown className="h-7 w-7 text-amber-500" />
            <span>User Management</span>
          </h1>
          
          <button
            onClick={() => navigate('/admin')}
            className="admin-button inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold px-5 py-2.5 rounded-full shadow-md hover:shadow-lg transform hover:translate-y-[-2px] transition-all duration-300"
          >
            <Crown size={18} className="text-amber-300" />
            <span>Admin Panel</span>
          </button>
        </div>
        
        <div className="relative mb-8 max-w-2xl mx-auto">
          <div className={`flex items-center w-full px-4 py-3 bg-white rounded-xl shadow-sm border-2 transition-all duration-300 ${isSearchFocused ? 'border-indigo-400 shadow-md' : 'border-gray-200'}`}>
            <Search className={`h-5 w-5 mr-2 transition-colors duration-300 ${isSearchFocused ? 'text-indigo-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search by username or email..."
              className="w-full bg-transparent border-none outline-none text-gray-700 placeholder-gray-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
            {search && (
              <button
              onClick={() => setSearch('')}
              className="admin-button p-2 rounded-full text-red-400 hover:text-red-600 hover:bg-red-100 transition-all duration-200 ease-in-out shadow-sm active:scale-95"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
            
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No users found</h3>
            <p className="text-gray-500">
              {search ? `No results for "${search}"` : "There are no users to display"}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredUsers.map((user, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-md hover:shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 pt-6 pb-4 px-6">
                  <div className="flex justify-center">
                    <img
                      src={user.profile_picture}
                      alt={`${user.username}'s profile`}
                      className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/80?text=User';
                      }}
                    />
                  </div>
                  <h3 className="text-xl font-bold text-center text-gray-800 mt-3 truncate">{user.username}</h3>
                  <div className="flex justify-center mt-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </div>
                </div>
                
                <div className="px-6 py-4">
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Mail className="w-4 h-4 mr-2 flex-shrink-0 text-indigo-500" />
                      <span className="truncate" title={user.email}>{user.email}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <Phone className="w-4 h-4 mr-2 flex-shrink-0 text-indigo-500" />
                      <span>{user.phone || 'Not provided'}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 flex-shrink-0 text-indigo-500" />
                      <span>{user.dob ? formatDate(user.dob) : 'Not provided'}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2 flex-shrink-0 text-indigo-500" />
                      <span>Joined: {formatDate(user.joinedAt)}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleRemove(user.email)}
                    disabled={lockedUsers[user.email]}
                    className={`admin-button w-full mt-5 px-4 py-2.5 font-medium rounded-xl border shadow-sm flex items-center justify-center gap-2 transition-all duration-200 
                      ${lockedUsers[user.email]
                        ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed'
                        : 'bg-white text-red-600 border-red-200 hover:bg-red-50 focus:ring-2 focus:ring-red-200 active:bg-red-100'}`}
                  >
                    <span>
                      {lockedUsers[user.email] ? `Locked until ${lockedUsers[user.email].toLocaleString()}` : 'Remove User'}
                    </span>
                  </button>



                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;