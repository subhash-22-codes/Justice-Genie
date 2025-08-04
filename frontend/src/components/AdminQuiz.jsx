import React, { useState, useEffect } from 'react';
import { Search, ArrowUpDown, Download, User, Mail, Trophy, Crown,  TrendingDown} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/admin.css';
const AdminQuiz = () => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'score', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [playersPerPage] = useState(10);
  const navigate = useNavigate();
    useEffect(() => {
       const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
       if (!isAdmin) {
         navigate('/');
       }
     }, [navigate]);
  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/quiz_participants');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        setParticipants(data.participants || []);
        setError(null);
      } catch (err) {
        setError(`Failed to fetch participants: ${err.message}`);
        console.error('Error fetching participants:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
  }, []);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = () => {
    const filteredData = participants.filter(player => 
      player.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return [...filteredData].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  };

  const getPerformanceBadge = (score) => {
    const percentage = (score / 15) * 100;
    if (percentage >= 80) return 'bg-emerald-100 text-emerald-800';
    if (percentage >= 60) return 'bg-amber-100 text-amber-800';
    return 'bg-rose-100 text-rose-800';
  };

  const exportCSV = () => {
    const headers = ['Username', 'Email', 'Score', 'Game Name', 'Rank'];
    const csvData = getSortedData().map(player => [
      player.username,
      player.email,
      player.score,
      player.gameName,
      player.rank
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `quiz_participants_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const MetricsCards = () => {
    if (!participants.length) return null;

    const totalParticipants = participants.length;
    const averageScore = participants.reduce((sum, player) => sum + (player.score || 0), 0) / totalParticipants;
    const highScorers = participants.filter(player => ((player.score || 0) / 15) * 100 >= 80).length;
    const lowScorers = participants.filter(player => ((player.score || 0) / 15) * 100 < 50).length;

    const metrics = [
      {
        title: 'Total Participants',
        value: totalParticipants,
        description: 'Total quiz takers',
        color: 'border-blue-500',
        icon: User
      },
      {
        title: 'Average Score',
        value: averageScore.toFixed(2),
        description: 'Average points',
        color: 'border-emerald-500',
        icon: Trophy
      },
      {
        title: 'High Performers',
        value: `${highScorers} (${Math.round((highScorers/totalParticipants)*100)}%)`,
        description: 'Users with 80%+ score',
        color: 'border-amber-500',
        icon: Crown
      },
      {
        title: 'Low Performers',
        value: `${lowScorers} (${Math.round((lowScorers/totalParticipants)*100)}%)`,
        description: 'Users below 50%',
        color: 'border-rose-500',
        icon: TrendingDown
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <div 
            key={index}
            className={`bg-white rounded-lg shadow-sm p-6 border-l-4 ${metric.color} transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-gray-500 text-sm font-medium">{metric.title}</h3>
              <metric.icon className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-2">{metric.value}</p>
            <div className="mt-2 text-xs text-gray-500">{metric.description}</div>
          </div>
        ))}
      </div>
    );
  };

  const Pagination = () => {
    const sortedData = getSortedData();
    const totalPages = Math.ceil(sortedData.length / playersPerPage);
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
              currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing page <span className="font-medium">{currentPage}</span> of{' '}
              <span className="font-medium">{totalPages}</span>
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                  currentPage === 1 ? 'cursor-not-allowed' : 'hover:text-gray-500'
                }`}
              >
                <span className="sr-only">Previous</span>
                <ArrowUpDown className="h-5 w-5" />
              </button>
              {pageNumbers.map(number => (
                <button
                  key={number}
                  onClick={() => setCurrentPage(number)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    currentPage === number
                      ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                  }`}
                >
                  {number}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                  currentPage === totalPages ? 'cursor-not-allowed' : 'hover:text-gray-500'
                }`}
              >
                <span className="sr-only">Next</span>
                <ArrowUpDown className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="text-rose-500 text-lg font-medium mb-2">Error</div>
          <p className="text-gray-700">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const sortedData = getSortedData();
  const indexOfLastPlayer = currentPage * playersPerPage;
  const indexOfFirstPlayer = indexOfLastPlayer - playersPerPage;
  const currentPlayers = sortedData.slice(indexOfFirstPlayer, indexOfLastPlayer);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Quiz Leaderboard Dashboard</h1>
            <p className="text-blue-100 mt-2">
              Monitor participant rankings and performance
            </p>
          </div>

          <div className="p-6">
            <MetricsCards />

            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="admin-search pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search by username or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <button
                onClick={exportCSV}
                className="admin-button flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                <Download className="h-5 w-5" />
                <span>Export Data</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      { key: 'rank', label: 'Rank', icon: Crown },
                      { key: 'username', label: 'Username', icon: User },
                      { key: 'email', label: 'Email', icon: Mail },
                      { key: 'score', label: 'Score', icon: Trophy },
                      { key: 'gameName', label: 'Game Name', icon: null }
                    ].map(column => (
                      <th
                        key={column.key}
                        onClick={() => column.key !== 'gameName' && requestSort(column.key)}
                        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                          column.key !== 'gameName' ? 'cursor-pointer hover:bg-gray-100' : ''
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          {column.icon && <column.icon className="h-4 w-4" />}
                          <span>{column.label}</span>
                          {column.key !== 'gameName' && <ArrowUpDown className="h-4 w-4" />}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentPlayers.length > 0 ? (
                    currentPlayers.map((player, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">#{player.rank}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{player.username}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{player.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPerformanceBadge(player.score)}`}>
                            {player.score} / 15
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{player.game_name || 'Justice Warrior'}</div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                        {participants.length === 0
                          ? "No quiz participants found."
                          : "No matching results found."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {participants.length > 0 && <Pagination />}
          </div>
        </div>
      </div>
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

export default AdminQuiz;