import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft,  
  Download, 
  BookOpen, 
  Search, 
  Filter, 
  Clock, 
  Award, 
  Eye,
  FileText,
  Loader,
  Menu,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const LawPDF = () => {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const categories = [
    { id: 'all', name: 'All Documents', icon: Filter },
    { id: 'popular', name: 'Most Popular', icon: Award },
    { id: 'recent', name: 'Recently Added', icon: Clock },
    { id: 'Basics', name: 'Simple Law Basics', icon: FileText },
    { id: 'criminal', name: 'Criminal Law', icon: FileText },
    { id: 'civil', name: 'Civil Law', icon: FileText }
  ];

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/books${selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''}`,
        { withCredentials: true }
      );
      setBooks(response.data);
    } catch (err) {
      setError('Failed to fetch books. Please try again later.');
      console.error('Error fetching books:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const updateBookStats = async (bookId, action) => {
    if (!bookId) return;
    try {
      await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/books/${bookId}/${action}`,
        { withCredentials: true }
      );
    } catch (err) {
      console.error(`Failed to update ${action} count:`, err);
    }
  };

  const handleDownload = async (book) => {
    if (!book || !book.id || !book.file_path) {
      alert('Book data is missing.');
      return;
    }

    await updateBookStats(book.id, 'download');

    const link = document.createElement('a');
    link.href = book.file_path + (book.file_path.includes('?') ? '&fl_attachment=true' : '?fl_attachment=true');
    link.setAttribute('download', book.title + ".pdf");
    document.body.appendChild(link);
    link.click();
    link.remove();

    setBooks(prev =>
      prev.map(b => b.id === book.id ? { ...b, downloads: (b.downloads || 0) + 1 } : b)
    );
  };

  const handleView = async (book) => {
    if (!book || !book.id || !book.file_path) {
      alert('Book data is missing.');
      return;
    }

    await updateBookStats(book.id, 'view');

    const newWindow = window.open(book.file_path, '_blank');
    if (!newWindow) alert('Please allow pop-ups to view the PDF');

    setBooks(prev =>
      prev.map(b => b.id === book.id ? { ...b, views: (b.views || 0) + 1 } : b)
    );
  };

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedCategory === 'all') return matchesSearch;
    if (selectedCategory === 'popular') return matchesSearch && book.views > 50;
    if (selectedCategory === 'recent') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return matchesSearch && new Date(book.created_at) > oneWeekAgo;
    }
    return matchesSearch && book.category === selectedCategory;
  });

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
            <Link to="/quizz" className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs sm:text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" fill="#10B981" fillOpacity="0.15" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 7H15" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 11H13" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Genie Quiz
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
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Digital Law Library
                </h2>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="space-y-4">
              <div className="relative max-w-xl">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by title, author, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full font-manrope text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                  aria-label="Search documents"
                />
              </div>

              <div className="flex flex-wrap gap-2" role="tablist">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-manrope font-medium transition-all shadow-sm ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                    role="tab"
                    aria-selected={selectedCategory === category.id}
                  >
                    <category.icon size={14} className="shrink-0" />
                    <span>{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 font-manrope p-4 rounded-lg flex items-center justify-between" role="alert">
                <p className="text-xs sm:text-sm">{error}</p>
                <button onClick={fetchBooks} className="text-xs sm:text-sm font-semibold underline hover:no-underline">
                  Try Again
                </button>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24" role="status">
                <Loader className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 mb-3" aria-hidden="true" />
                <p className="font-poppins text-xs sm:text-sm text-slate-500 dark:text-slate-400">Loading legal documents...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" role="main">
                {filteredBooks.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 font-manrope text-slate-400 dark:text-slate-500" role="alert">
                    <FileText size={48} className="mb-2" />
                    <p className="text-sm">No documents found matching your criteria</p>
                  </div>
                ) : (
                  filteredBooks.map((book) => (
                    <article key={book.id} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between">
                      <div>
                        <div className="w-full aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
                          <img 
                            src={book.image || "/images/IPC.jpg"} 
                            alt={`${book.title} cover`} 
                            className="w-full h-full object-cover transition-transform duration-300 ease-in-out hover:scale-105"
                            loading="lazy"
                          />
                        </div>

                        <div className="p-5">
                          <span className="inline-block font-manrope text-[11px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 px-2.5 py-0.5 rounded-md mb-2.5">
                            {book.category || 'Legal Document'}
                          </span>

                          <h2 className="font-poppins font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base mb-1 line-clamp-1">{book.title}</h2>
                          <p className="font-manrope text-xs text-slate-400 dark:text-slate-500 mb-2">
                            <span className="font-medium">Author:</span> {book.author}
                          </p>
                          <p className="font-manrope text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">{book.description}</p>

                          <div className="flex items-center gap-4 font-manrope text-xs text-slate-400 dark:text-slate-500 mb-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <span className="flex items-center gap-1">
                              <Eye size={14} />
                              {book.views || 0} views
                            </span>
                            <span className="flex items-center gap-1">
                              <Download size={14} />
                              {book.downloads || 0} downloads
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="px-5 pb-5">
                        <div className="flex gap-2 mb-3">
                          <button 
                            type="button"
                            onClick={(event) => { 
                              event.preventDefault();
                              handleView(book);
                            }} 
                            className="flex-1 flex items-center justify-center gap-1.5 font-manrope text-xs sm:text-sm font-medium px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <BookOpen size={16} />
                            <span>View</span>
                          </button>

                          <button 
                            onClick={() => handleDownload(book)}
                            className="flex-1 flex items-center justify-center gap-1.5 font-manrope text-xs sm:text-sm font-semibold px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all"
                          >
                            <Download size={16} />
                            <span>Download</span>
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 font-manrope text-[11px] text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <span className="font-poppins font-semibold text-slate-500 dark:text-slate-400">PDF</span>
                            <span>
                              {book.file_size ? `${(book.file_size / 1024 / 1024).toFixed(1)} MB` : 'Standard'}
                            </span>
                          </div>
                          <div>
                            Updated: {new Date(book.updated_at || Date.now()).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {sidebarOpen && (
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-30 lg:hidden animate-fadeIn" onClick={() => setSidebarOpen(false)}></div>
      )}
    </div>
  );
};

export default LawPDF;