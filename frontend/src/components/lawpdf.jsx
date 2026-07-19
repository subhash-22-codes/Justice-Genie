import React, { useState, useEffect,useCallback } from 'react';
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
  Loader
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const LawPDF = () => {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const categories = [
    { id: 'all', name: 'All Documents', icon: Filter },
    { id: 'popular', name: 'Most Popular', icon: Award },
    { id: 'recent', name: 'Recently Added', icon: Clock },
    { id: 'Basics', name: 'Simple Law Basics', icon: FileText },
    { id: 'criminal', name: 'Criminal Law', icon: FileText },
    { id: 'civil', name: 'Civil Law', icon: FileText }
  ];

  // Memoized fetchBooks function using useCallback
  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/books${selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''}`,
        { withCredentials: true } // important for production
      );

      setBooks(response.data);
    } catch (err) {
      setError('Failed to fetch books. Please try again later.');
      console.error('Error fetching books:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]); // Updates only when selectedCategory changes

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]); // Safe to include fetchBooks now

// Helper to call backend for stats update
// Helper to safely update book stats in backend
const updateBookStats = async (bookId, action) => {
  if (!bookId) return;
  try {
    await axios.get(
      `${process.env.REACT_APP_BACKEND_URL}/api/books/${bookId}/${action}`,
      { withCredentials: true } // include session cookies
    );
  } catch (err) {
    console.error(`Failed to update ${action} count:`, err);
  }
};


// Download PDF safely
const handleDownload = async (book) => {
  if (!book || !book.id || !book.file_path) {
    alert('Book data is missing.');
    return;
  }

  // Update backend download count
  await updateBookStats(book.id, 'download');

  // Trigger browser download via Cloudinary
  const link = document.createElement('a');
  link.href = book.file_path + (book.file_path.includes('?') ? '&fl_attachment=true' : '?fl_attachment=true');
  link.setAttribute('download', book.title + ".pdf");
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Update UI optimistically
  setBooks(prev =>
    prev.map(b => b.id === book.id ? { ...b, downloads: (b.downloads || 0) + 1 } : b)
  );
};

// View PDF safely
const handleView = async (book) => {
  if (!book || !book.id || !book.file_path) {
    alert('Book data is missing.');
    return;
  }

  // Update backend view count
  await updateBookStats(book.id, 'view');

  // Open PDF in new tab
  const newWindow = window.open(book.file_path, '_blank');
  if (!newWindow) alert('Please allow pop-ups to view the PDF');

  // Update UI optimistically
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
    <div className="min-h-screen bg-slate-50 px-4 sm:px-8 py-8">
      <header className="flex items-center gap-4 mb-6">
        <button
          className="flex items-center gap-2 font-manrope font-medium bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-sm transition-colors"
          onClick={() => navigate('/chat')}
          aria-label="Back to Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Chat</span>
        </button>

        <h1 className="font-poppins text-2xl font-bold text-slate-800">Digital Law Library</h1>
      </header>

      <div className="mb-8 space-y-4">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, author, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full font-manrope text-sm pl-10 pr-4 py-2.5 rounded-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Search documents"
          />
        </div>

        <div className="flex flex-wrap gap-2" role="tablist">
          {categories.map((category) => (
            <button
              key={category.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs sm:text-sm font-manrope font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
              onClick={() => setSelectedCategory(category.id)}
              role="tab"
              aria-selected={selectedCategory === category.id}
              aria-controls={`${category.id}-panel`}
            >
              <category.icon size={14} className="shrink-0" />
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 font-manrope p-4 rounded-sm mb-6 flex items-center justify-between" role="alert">
          <p className="text-sm">{error}</p>
          <button onClick={fetchBooks} className="text-sm font-medium underline hover:no-underline">
            Try Again
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20" role="status">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mb-3" aria-hidden="true" />
          <p className="font-poppins text-slate-500">Loading legal documents...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" role="main">
          {filteredBooks.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 font-manrope text-slate-400" role="alert">
              <FileText size={48} />
              <p className="mt-3">No documents found matching your criteria</p>
            </div>
          ) : (
            filteredBooks.map((book) => (
              <article key={book.id} className="bg-white border border-slate-200 rounded-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="w-full aspect-[3/2] overflow-hidden bg-slate-100">
                  <img 
                      src={book.image || "/images/IPC.jpg"} 
                      alt={`${book.title} cover`} 
                      className="w-full h-full object-cover transition-transform duration-300 ease-in-out hover:scale-105"
                      loading="lazy"
                    />
                  </div>

                <div className="p-5">
                  <span className="inline-block font-manrope text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-sm mb-2">
                    {book.category || 'Legal Document'}
                  </span>

                  <h2 className="font-poppins font-semibold text-slate-800 mb-1">{book.title}</h2>
                  <p className="font-manrope text-xs text-slate-500 mb-2">
                    <span className="font-medium">Author:</span> {book.author}
                  </p>
                  <p className="font-manrope text-sm text-slate-500 line-clamp-2 mb-3">{book.description}</p>

                  <div className="flex items-center gap-4 font-manrope text-xs text-slate-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Eye size={14} />
                      {book.views || 0} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Download size={14} />
                      {book.downloads || 0} downloads
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={(event) => { 
                        event.preventDefault();
                        handleView(book);
                      }} 
                      className="flex-1 flex items-center justify-center gap-1.5 font-manrope text-sm font-medium px-3 py-2 rounded-sm border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <BookOpen size={16} />
                      <span>View</span>
                    </button>

                    <button 
                      onClick={() => handleDownload(book)}
                      className="flex-1 flex items-center justify-center gap-1.5 font-manrope text-sm font-medium px-3 py-2 rounded-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      <Download size={16} />
                      <span>Download</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 font-manrope text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="font-poppins font-semibold text-slate-500">PDF</span>
                      <span>
                        {(book.file_size / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </div>
                    <div>
                      Updated: {new Date(book.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default LawPDF;
