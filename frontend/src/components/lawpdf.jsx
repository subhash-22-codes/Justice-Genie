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
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/lawpdf.css';

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
        `/api/books${selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''}`
      );
      console.log('Fetched Books:', response.data); // 🔍 Debugging log
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
 


  const handleDownload = async (bookId, fileName) => {
    try {
        const res = await axios.get(`/api/books/${bookId}/download`, {
            responseType: 'blob',
        });
    
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName); // dynamic name
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url); // Clean up the URL object
    
        // Optimistic UI update
        setBooks((prevBooks) =>
            prevBooks.map((book) =>
                book.id === bookId
                    ? { ...book, downloads: (book.downloads || 0) + 1 }
                    : book
            )
        );
    } catch (err) {
        console.error('Error downloading the book:', err);
        alert('Failed to download the book. Please try again.');
    }
};

const handleView = async (bookId) => {
    try {
        const response = await axios.get(`/api/books/${bookId}/view`, {
            responseType: 'blob'
        });

        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        
        // Open PDF in a new tab
        const pdfWindow = window.open();
        if (pdfWindow) {
            pdfWindow.location.href = url;
            
            // Clean up the URL object when the window is closed
            pdfWindow.onbeforeunload = () => {
                window.URL.revokeObjectURL(url);
            };
            
            // Update view count
            setBooks((prevBooks) =>
                prevBooks.map((book) =>
                    book.id === bookId ? { ...book, views: (book.views || 0) + 1 } : book
                )
            );
        } else {
            alert('Please allow pop-ups to view the PDF');
        }
    } catch (err) {
        console.error("Error viewing the book:", err);
        alert('Failed to view the PDF. Please try again.');
    }
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
    <div className="law-pdf-container">
      <header className="law-pdf-header">
      <button
  className="law-pdf-back-button flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105"
  onClick={() => navigate('/chat')}
  aria-label="Back to Dashboard"
>
  <ArrowLeft className="w-5 h-5" />
  <span>Back to Chat</span>
</button>


        <h1 className="law-pdf-title">Digital Law Library</h1>
      </header>

      <div className="law-pdf-search-filter">
        <div className="law-pdf-search">
          <Search className="law-pdf-search-icon" />
          <input
            type="text"
            placeholder="Search by title, author, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="law-pdf-search-input"
            aria-label="Search documents"
          />
        </div>

   <div className="law-pdf-categories flex flex-wrap gap-2 sm:gap-3" role="tablist">
  {categories.map((category) => (
    <button
      key={category.id}
      className={`law-pdf-category-btn ${selectedCategory === category.id ? 'law-pdf-active' : ''} flex items-center gap-1 px-2 py-1 text-xs sm:text-sm`}
      onClick={() => setSelectedCategory(category.id)}
      role="tab"
      aria-selected={selectedCategory === category.id}
      aria-controls={`${category.id}-panel`}
    >
      <category.icon size={16} className="shrink-0" />
      <span>{category.name}</span>
    </button>
  ))}
</div>


      </div>

      {error && (
        <div className="law-pdf-error" role="alert">
          <p>{error}</p>
          <button onClick={fetchBooks} className="law-pdf-retry-btn">
            Try Again
          </button>
        </div>
      )}

      {loading ? (
        <div className="law-pdf-loading" role="status">
          <div className="law-pdf-spinner" aria-hidden="true"></div>
          <p>Loading legal documents...</p>
        </div>
      ) : (
        <div className="law-pdf-grid" role="main">
          {filteredBooks.length === 0 ? (
            <div className="law-pdf-no-results">
              <FileText size={48} />
              <p>No documents found matching your criteria</p>
            </div>
          ) : (
            filteredBooks.map((book) => (
              <article key={book.id} className="law-pdf-card">
                  <div className="w-full aspect-[3/2] overflow-hidden rounded-t-xl bg-gray-100">
                  <img 
                      src={book.image || "/images/IPC.jpg"} 
                      alt={`${book.title} cover`} 
                      className="w-full h-full object-cover transition-transform duration-300 ease-in-out hover:scale-105"
                      loading="lazy"
                    />
                  </div>


                <div className="law-pdf-card-content">
                  <div className="law-pdf-card-header">
                    <span className="law-pdf-tag">{book.category || 'Legal Document'}</span>
                    <div className="law-pdf-card-actions">
                    </div>
                  </div>

                  <h2 className="law-pdf-card-title">{book.title}</h2>
                  <p className="law-pdf-author">
                    <span>Author:</span> {book.author}
                  </p>
                  <p className="law-pdf-description">{book.description}</p>
                  
                  <div className="law-pdf-stats">
                    <span className="law-pdf-views">
                      <Eye size={16} />
                      {book.views || 0} views
                    </span>
                    <span className="law-pdf-downloads">
                      <Download size={16} />
                      {book.downloads || 0} downloads
                    </span>
                  </div>

                  <div className="law-pdf-actions">
                  <button 
                    type="button"  // Explicitly set type to prevent unintended form submission
                    onClick={(event) => { 
                      event.preventDefault();  // Prevent page reload
                      handleView(book.id);  // Call your function
                    }} 
                    className="law-pdf-btn law-pdf-view-btn"
                  >
                    <BookOpen size={18} />
                    <span>View Document</span>
                  </button>

                    
                    <button 
                      onClick={() => handleDownload(book.id, `${book.title}.pdf`)}
                      className="law-pdf-btn law-pdf-download-btn"
                    >
                      <Download size={18} />
                      <span>Download PDF</span>
                    </button>
                  </div>

                  <div className="law-pdf-card-footer">
                    <div className="law-pdf-file-info">
                      <span className="law-pdf-file-type">PDF</span>
                      <span className="law-pdf-file-size">
                        {(book.file_size / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </div>
                    <div className="law-pdf-updated">
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