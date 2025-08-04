import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Shield, Book, UserCheck, Scale, Lock, 
  FileText, Cookie, Globe, Clock, MessageSquare,
  ChevronRight, Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/termsandpolicy.css';
const TermsAndPolicy = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const handleBackClick = () => {
    navigate('/register'); // Navigate to /register
  };
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = window.scrollY / totalScroll;
      setScrollProgress(progress);

      const sections = document.querySelectorAll('[data-section]');
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 100 && rect.bottom >= 100) {
          setActiveSection(section.id);
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const sections = [
    {
      id: 'overview',
      title: 'Overview',
      icon: <Shield className="w-6 h-6" />,
      content: `Welcome to Justice Genie - Your AI-Powered Legal Assistant. This comprehensive document outlines our terms of service and privacy policy. By using our platform, you agree to these terms and our commitment to protecting your privacy while providing innovative legal assistance through artificial intelligence.`
    },
    {
      id: 'terms',
      title: 'Terms of Service',
      icon: <Book className="w-6 h-6" />,
      content: `1. Service Description\n• AI-powered legal information and assistance\n• Document analysis and legal research support\n• 24/7 automated legal information access\n\n2. User Agreement\n• Must be 18 years or older\n• Provide accurate registration information\n• Maintain account security\n• Use services legally and ethically\n\n3. Service Limitations\n• Not a substitute for professional legal advice\n• No attorney-client relationship is formed\n• Results and accuracy not guaranteed\n• Service availability may vary`
    },
    {
      id: 'user-conduct',
      title: 'User Conduct',
      icon: <UserCheck className="w-6 h-6" />,
      content: `1. Acceptable Use\n• Legal and ethical use only\n• No unauthorized access attempts\n• Respect system limitations\n• No harmful or malicious activities\n\n2. Content Guidelines\n• No illegal or harmful content\n• Respect intellectual property rights\n• No misleading information\n• Keep communications professional\n\n3. Account Security\n• Strong password requirements\n• Regular security updates\n• Two-factor authentication recommended\n• Immediate breach reporting`
    },
    {
      id: 'legal',
      title: 'Legal Considerations',
      icon: <Scale className="w-6 h-6" />,
      content: `1. Disclaimer\n• Not a law firm or legal service provider\n• No attorney-client privilege\n• General information only\n• Consult qualified attorneys for specific advice\n\n2. Liability Limitations\n• No warranty on service accuracy\n• Not responsible for user decisions\n• Force majeure conditions apply\n• Limited financial liability`
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      icon: <Lock className="w-6 h-6" />,
      content: `1. Data Collection\n• User registration information\n• Usage patterns and interactions\n• Technical data and analytics\n• Communication preferences\n\n2. Data Protection\n• Industry-standard encryption\n• Regular security audits\n• Employee access controls\n• Breach notification procedures\n\n3. User Rights\n• Access to personal data\n• Right to data correction\n• Data portability options\n• Right to be forgotten`
    },
    {
      id: 'data-usage',
      title: 'Data Usage',
      icon: <FileText className="w-6 h-6" />,
      content: `1. Purpose of Collection\n• Service improvement\n• User experience optimization\n• Security and fraud prevention\n• Legal compliance\n\n2. Data Sharing\n• No third-party sales\n• Limited partner sharing\n• Regulatory compliance\n• Anonymous analytics`
    },
    {
      id: 'cookies',
      title: 'Cookie Policy',
      icon: <Cookie className="w-6 h-6" />,
      content: `1. Cookie Types\n• Essential cookies\n• Performance cookies\n• Functionality cookies\n• Analytics cookies\n\n2. Cookie Management\n• Browser controls\n• Opt-out options\n• Cookie preferences\n• Regular updates`
    },
    {
      id: 'international',
      title: 'International Users',
      icon: <Globe className="w-6 h-6" />,
      content: `1. Global Access\n• Service availability by region\n• Local law compliance\n• Language support\n• Regional restrictions\n\n2. Data Transfer\n• International data protection\n• Cross-border transfers\n• Regional data centers\n• Compliance measures`
    },
    {
      id: 'changes',
      title: 'Changes & Updates',
      icon: <Clock className="w-6 h-6" />,
      content: `1. Policy Updates\n• Regular review and updates\n• User notifications\n• Version tracking\n• Archive access\n\n2. Service Changes\n• Feature updates\n• System improvements\n• Maintenance notices\n• Version history`
    },
    {
      id: 'support',
      title: 'Support & Contact',
      icon: <MessageSquare className="w-6 h-6" />,
      content: `1. Technical Support\n• 24/7 chat support\n• Email: support@justicegenie.ai\n• Response time: 24-48 hours\n• Priority support options\n\n2. Legal Inquiries\n• legal@justicegenie.ai\n• Compliance questions\n• Data protection officer\n• Business hours: 9 AM - 6 PM EST`
    }
  ];

  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

    return (
      <div className="termsandpolicy-wrapper min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
        {/* Progress Bar */}
        <motion.div 
          className="termsandpolicy-progress fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 origin-left z-50"
          style={{ scaleX: scrollProgress }}
        />
    
        {/* Header */}
        <header className="termsandpolicy-header fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 z-40">
          <div className="termsandpolicy-header-inner max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <motion.button 
              className="termsandpolicy-backbtn flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBackClick}
            >
              <ArrowLeft className="termsandpolicy-arrow w-5 h-5" />
              <span className="termsandpolicy-backtext font-medium">Back</span>
            </motion.button>
    
            <div className="termsandpolicy-search-container relative max-w-md w-full">
              <Search className="termsandpolicy-searchicon absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search terms and policies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="termsandpolicy-search w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
              />
            </div>
          </div>
        </header>
    
        <div className="termsandpolicy-body pt-24 pb-16">
          <div className="termsandpolicy-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="termsandpolicy-title text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="termsandpolicy-heading text-5xl font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Terms of Service & Privacy Policy
              </h1>
              <p className="termsandpolicy-date text-gray-600 text-lg">
                Last updated: March 2024
              </p>
            </motion.div>
    
            <div className="termsandpolicy-layout grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Sidebar */}
              <nav className="termsandpolicy-sidebar lg:col-span-3">
                <div className="termsandpolicy-sidebar-sticky sticky top-24">
                  <AnimatePresence>
                    {filteredSections.map((section) => (
                      <motion.button
                        key={section.id}
                        className={`termsandpolicy-sectionbtn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all mb-2 ${
                          activeSection === section.id
                            ? 'bg-white shadow-lg shadow-indigo-100'
                            : 'hover:bg-white/50'
                        }`}
                        onClick={() => {
                          setActiveSection(section.id);
                          document.getElementById(section.id)?.scrollIntoView({ 
                            behavior: 'smooth',
                            block: 'start'
                          });
                        }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className={`termsandpolicy-iconbox p-2 rounded-lg ${
                          activeSection === section.id
                            ? 'bg-indigo-100 text-indigo-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {section.icon}
                        </div>
                        <span className={`termsandpolicy-sectiontitle flex-1 font-medium ${
                          activeSection === section.id
                            ? 'text-indigo-600'
                            : 'text-gray-600'
                        }`}>
                          {section.title}
                        </span>
                        <ChevronRight 
                          className={`termsandpolicy-chevron w-5 h-5 transition-transform ${
                            activeSection === section.id
                              ? 'rotate-90 text-indigo-600'
                              : 'text-gray-400'
                          }`}
                        />
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
              </nav>
    
              {/* Content */}
              <div className="termsandpolicy-main lg:col-span-9">
                <AnimatePresence mode="wait">
                  {filteredSections.map((section) => (
                    <motion.section
                      key={section.id}
                      id={section.id}
                      data-section
                      className="termsandpolicy-content mb-8"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      viewport={{ once: true, margin: "-100px" }}
                    >
                      <div className="termsandpolicy-card bg-white rounded-2xl shadow-xl shadow-indigo-100/20 p-8 hover:shadow-2xl transition-shadow duration-300">
                        <div className="termsandpolicy-card-head flex items-center gap-4 mb-6">
                          <div className="termsandpolicy-icon p-3 bg-gradient-to-br from-indigo-500 via-blue-500 to-purple-500 rounded-xl text-white shadow-lg">
                            {section.icon}
                          </div>
                          <h2 className="termsandpolicy-sectionheading text-2xl font-bold text-gray-900">
                            {section.title}
                          </h2>
                        </div>
                        <div className="termsandpolicy-description prose prose-lg prose-indigo max-w-none">
                          <pre className="termsandpolicy-pre whitespace-pre-wrap font-sans text-gray-600 leading-relaxed">
                            {section.content}
                          </pre>
                        </div>
                      </div>
                    </motion.section>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
    
        {/* Footer */}
        <motion.footer 
          className="termsandpolicy-footer bg-white border-t border-gray-200"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="termsandpolicy-footer-inner max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="termsandpolicy-footer-text text-center">
              <p className="termsandpolicy-copyright text-gray-600 mb-2">
                © 2024 Justice Genie. All rights reserved.
              </p>
              <p className="termsandpolicy-devnote text-gray-500">
                Developed with <span className="text-red-500">❤️</span> by Subhash Yaganti and Siri Mahalaxmi Vemula
              </p>
            </div>
          </div>
        </motion.footer>
      </div>
    );
    
};

export default TermsAndPolicy;