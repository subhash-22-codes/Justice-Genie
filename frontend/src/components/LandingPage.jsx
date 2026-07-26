import { useEffect, useState, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Loader, ShieldCheck } from 'lucide-react';
import BenchmarkLibrary from "./BenchmarkLibrary";
import {
  FaRobot,
  FaQuestionCircle,
  FaFilePdf,
  FaBookOpen,
  FaArrowRight,
  FaUsers,
  FaCheckCircle,
  FaPlay,
  FaChevronDown,
  FaChevronUp,
  FaLightbulb,
  FaLinkedin,
  FaGithub,
  FaEnvelope,
  FaLock,
  FaSearch,
  FaTimes,
  FaQuoteLeft,
} from "react-icons/fa";

export default function LandingPage() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [isVisible, setIsVisible] = useState({});
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Safely check for reduced motion without breaking Server-Side Rendering (Vercel safe)
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (!auth.loading && auth.loggedIn) {
      navigate(auth.role === "admin" ? "/admin" : "/chat", { replace: true });
    }
  }, [auth, navigate]);

  // IntersectionObserver for scroll-reveal animations
  useEffect(() => {
    if (auth.loading || typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({
              ...prev,
              [entry.target.id]: true
            }));
          }
        });
      },
      { threshold: 0.1 }
    );

    // Observe specific sections for fade-in animations
    const timer = setTimeout(() => {
      const sections = ['how-it-works', 'features', 'benchmark', 'stats', 'pricing', 'faq'];
      sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [auth.loading]);

  // Feature carousel
  useEffect(() => {
    if (prefersReducedMotion.current || isCarouselPaused) return;
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 4);
    }, 4500);
    return () => clearInterval(interval);
  }, [isCarouselPaused]);

  // Handle Escape key for Modal (Safe for Vercel deployments)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsTeamModalOpen(false);
    };
    
    if (isTeamModalOpen) {
      window.addEventListener('keydown', handleEsc);
      // Prevent background scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isTeamModalOpen]);

  // Scroll handler function (Safe for deployments)
  const handleScrollTo = (e, id) => {
    e.preventDefault();
    if (typeof document !== 'undefined') {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ 
          behavior: prefersReducedMotion.current ? 'auto' : 'smooth' 
        });
      }
    }
  };

  if (auth.loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <Loader size={32} className="animate-spin text-blue-600 dark:text-blue-400 mb-6" />
        <div className="font-poppins text-center mb-8">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Justice Genie</h3>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Initializing your legal companion...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: <FaRobot />,
      title: "AI Legal Assistant",
      description: "Get instant, accurate answers to complex Indian legal questions with our advanced AI that understands legal nuances and provides contextual guidance.",
      benefits: ["24/7 Availability", "Instant Responses", "Plain-English Answers", "Context Aware"],
      color: "#2563eb"
    },
    {
      icon: <FaQuestionCircle />,
      title: "Interactive Legal Quizzes",
      description: "Master Indian law through engaging, adaptive quizzes that adjust to your knowledge level and track your progress over time.",
      benefits: ["Global Leaderboard", "Progress Tracking", "Case-Based Questions", "Self-Evaluation"],
      color: "#d97706"
    },
    {
      icon: <FaFilePdf />,
      title: "Legal Document Library",
      description: "Access a comprehensive collection of legal documents, templates, and reference materials curated by legal experts.",
      benefits: ["Expert Curated", "Always Updated", "Instant Download", "Searchable Database"],
      color: "#dc2626"
    },
    {
      icon: <FaBookOpen />,
      title: "Curated Legal Resources",
      description: "Discover handpicked legal books, articles, case studies, and educational materials from trusted legal authorities.",
      benefits: ["Trusted Sources", "Regular Updates", "Categorized Content", "Expert Recommendations"],
      color: "#7c3aed"
    }
  ];

  const pricingTiers = [
    {
      name: "Free",
      price: "\u20b90",
      period: "forever",
      badge: null,
      description: "Everything you need to explore Indian legal knowledge, on us.",
      features: [
        "Unlimited AI legal Q&A",
        "Interactive legal quizzes",
        "Full document library access",
        "Curated legal resources",
        "Chat history & PDF export",
      ],
      cta: "Get Started Free",
      action: () => navigate("/register"),
      highlighted: true,
    },
    {
      name: "Pro",
      price: "Coming Soon",
      period: null,
      badge: "Coming Soon",
      description: "For individuals who want deeper, faster, more personalized legal support.",
      features: [
        "Everything in Free",
        "Priority AI response times",
        "Advanced case analysis",
        "Unlimited saved conversations",
      ],
      cta: "Coming Soon",
      action: null,
      highlighted: false,
    },
  ];

  const faqs = [
    {
      question: "Is Justice Genie a replacement for a real lawyer?",
      answer: "No. Justice Genie is an educational tool designed to help you understand Indian law, draft basic documents, and prepare for legal consultations. It does not provide binding legal advice. Always consult a licensed advocate for official legal matters."
    },
    {
      question: "Is it actually free to use?",
      answer: "Yes! Currently, Justice Genie is a student-built research project running on free-tier infrastructure. All core features are 100% free while we are in early access."
    },
    {
      question: "Are my legal questions private?",
      answer: "We take privacy seriously. Your chat history is stored securely for your own access. However, because we use AI models to generate answers, we strongly advise against entering sensitive personal information (like Aadhaar numbers, real names of opposing parties, or exact financial details)."
    },
    {
      question: "What laws is the AI trained on?",
      answer: "The AI is designed to reference the Indian Constitution, the Bharatiya Nyaya Sanhita (BNS), major civil/criminal acts, and general Indian legal frameworks."
    }
  ];

  const teamMembers = [
    {
      name: "Subhash Yaganti",
      role: "Full-Stack Developer + UI/UX",
      email: "subashyagantisubbu@gmail.com",
      linkedin: "https://www.linkedin.com/in/subhash-yaganti-a8b3b626a/",
      github: "https://github.com/subhash-22-codes",
      instagram: "https://instagram.com/subhash__spiody",
      avatar: "/images/Subhash.jpg",
    },
    {
      name: "Siri Mahalaxmi Vemula",
      role: "Backend & Systems Architect",
      email: "sirimahalaxmivemula@gmail.com",
      linkedin: "https://www.linkedin.com/in/vemula-siri-mahalaxmi-b4b624319/",
      github: "https://github.com/armycodes",
      instagram: "https://instagram.com/heysiri_0_0",
      avatar: "/images/Siri.jpg",
    }
  ];

  return (
    <div className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            <img src="/images/jg_original_logo_1.png" alt="Justice Genie" className="h-6 w-6 sm:h-7 sm:w-7 object-contain" />
            <span className="font-poppins font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 hidden sm:inline">Justice Genie</span>
          </div>

          <div className="hidden md:flex items-center gap-8 font-manrope text-sm font-medium">
            {[
              { label: 'How it Works', id: 'how-it-works' },
              { label: 'Features', id: 'features' },
              { label: 'Benchmark', id: 'benchmark' },
              { label: 'Pricing', id: 'pricing' },
              { label: 'FAQ', id: 'faq' },
            ].map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                onClick={(e) => handleScrollTo(e, item.id)}
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate("/login")}
              className="font-manrope text-xs sm:text-sm font-medium px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/register")}
              className="font-manrope text-xs sm:text-sm font-semibold px-3 py-1.5 sm:px-4 sm:py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 shadow-card hover:shadow-card-hover active:scale-[0.97] transition-all duration-150 whitespace-nowrap"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden" id="hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-14 lg:py-24 grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="animate-revealUp text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 font-manrope text-[10px] sm:text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full mb-4 sm:mb-5">
              Free during early access
            </span>
            <h1 className="font-poppins font-bold text-3xl sm:text-4xl lg:text-5xl text-slate-900 dark:text-slate-50 leading-tight">
              Justice Genie
              <span className="block font-manrope font-medium text-base sm:text-lg lg:text-xl text-slate-500 dark:text-slate-400 mt-2">
                Demystifying Indian Law with AI
              </span>
            </h1>

            <p className="font-manrope text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-4 sm:mt-6 leading-relaxed max-w-lg mx-auto lg:mx-0">
              Stop getting lost in complex legal jargon. Get instant answers, study case laws, and generate legal document templates with your personal AI legal assistant.
            </p>

            <div className="flex flex-col gap-2 mt-6 max-w-sm mx-auto lg:mx-0">
              {['Plain-English Legal Explanations', 'Interactive Learning Quizzes', 'Document Generation'].map((item) => (
                <div key={item} className="flex items-center gap-2 font-manrope text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  <FaCheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap justify-center lg:justify-start gap-3 mt-8">
              <button
                onClick={() => navigate("/register")}
                className="flex items-center gap-2 font-manrope text-sm sm:text-base font-semibold px-5 sm:px-6 py-2.5 sm:py-3 rounded-md bg-blue-600 text-white hover:bg-blue-700 shadow-card hover:shadow-card-hover active:scale-[0.98] transition-all duration-150"
              >
                <FaPlay size={12} className="sm:w-3.5 sm:h-3.5" />
                Start Free, No Card Needed
              </button>
            </div>
          </div>

          <div className="animate-revealUp mt-4 lg:mt-0" style={{ animationDelay: '100ms' }}>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-elevated overflow-hidden max-w-md mx-auto lg:max-w-none">
              <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-400"></span>
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-400"></span>
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-green-400"></span>
                </div>
                <div className="font-manrope text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 ml-2">Justice Genie AI</div>
              </div>
              <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                <div className="flex gap-2 sm:gap-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center">
                    <FaUsers className="text-slate-500 text-[10px] sm:text-xs" />
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm font-manrope text-slate-700 dark:text-slate-300 rounded-tl-none">
                    What is the legal procedure for starting a private limited company in India?
                  </div>
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex-shrink-0 flex items-center justify-center">
                    <FaRobot className="text-blue-600 dark:text-blue-400 text-[10px] sm:text-xs" />
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm font-manrope text-slate-700 dark:text-slate-300 rounded-tr-none">
                    <p className="mb-2">To register a Private Limited Company in India under the Companies Act, 2013, you need to follow these main steps:</p>
                    <ul className="list-disc pl-4 space-y-1 text-[10px] sm:text-xs">
                      <li>Obtain Digital Signature Certificate (DSC)</li>
                      <li>Apply for Director Identification Number (DIN)</li>
                      <li>Name Approval via SPICe+ Part A</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem / Agitation Section */}
      <section className="py-10 sm:py-12 bg-slate-50 dark:bg-slate-900/50 text-center border-y border-slate-100 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-poppins text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50">
            Indian Law is Complex. Finding Answers Shouldn't Be.
          </h2>
          <p className="font-manrope text-slate-500 dark:text-slate-400 mt-3 sm:mt-4 text-sm sm:text-base md:text-lg">
            Whether you are a law student prepping for exams or a citizen trying to understand your rights, sifting through endless legal sections is exhausting. We built Justice Genie to translate complexity into clarity.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section 
        id="how-it-works" 
        className={`py-12 sm:py-20 transition-all duration-1000 ease-out ${isVisible['how-it-works'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="font-poppins text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50">How Justice Genie Works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 relative">
            {/* Connecting Line for Desktop */}
            <div className="hidden md:block absolute top-1/2 left-1/6 right-1/6 h-0.5 bg-slate-200 dark:bg-slate-800 -z-10 -translate-y-1/2"></div>
            
            {[
              { icon: <FaQuestionCircle />, title: "1. Ask Your Question", desc: "Type your legal query, upload a document, or select a quiz in plain English." },
              { icon: <FaSearch />, title: "2. AI Analyzes the Law", desc: "Our engine scans relevant Indian legal frameworks, sections, and penal codes." },
              { icon: <FaRobot />, title: "3. Get Clear Answers", desc: "Receive a structured, easy-to-understand breakdown without the confusing jargon." }
            ].map((step, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 text-center shadow-sm relative z-10">
                <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xl sm:text-2xl mb-3 sm:mb-4">
                  {step.icon}
                </div>
                <h3 className="font-poppins font-semibold text-base sm:text-lg text-slate-900 dark:text-slate-100 mb-2">{step.title}</h3>
                <p className="font-manrope text-xs sm:text-sm text-slate-500 dark:text-slate-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        id="features" 
        className={`py-12 sm:py-20 bg-slate-50 dark:bg-slate-900/30 transition-all duration-1000 ease-out ${isVisible['features'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 font-manrope text-[10px] sm:text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full mb-3 sm:mb-4">
              <FaLightbulb />
              <span>Powerful Features</span>
            </div>
            <h2 className="font-poppins text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50">Everything You Need for Legal Learning</h2>
          </div>

          <div
            className="grid lg:grid-cols-2 gap-6 sm:gap-8 items-start"
            onMouseEnter={() => setIsCarouselPaused(true)}
            onMouseLeave={() => setIsCarouselPaused(false)}
            onFocus={() => setIsCarouselPaused(true)}
            onBlur={() => setIsCarouselPaused(false)}
          >
            <div className="space-y-2">
              {features.map((feature, index) => (
                <button
                  key={index}
                  className={`w-full text-left flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border transition-all duration-200 ease-premium ${
                    activeFeature === index
                      ? 'border-blue-200 dark:border-blue-500/40 bg-white dark:bg-blue-500/5 shadow-card'
                      : 'border-slate-200 dark:border-slate-800 bg-transparent hover:bg-white/50 dark:hover:bg-slate-800/60'
                  }`}
                  onClick={() => setActiveFeature(index)}
                >
                  <div className="text-lg sm:text-xl flex-shrink-0 mt-0.5" style={{ color: feature.color }}>{feature.icon}</div>
                  <div className="font-manrope">
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{feature.title}</h4>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1">{feature.description}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-card p-5 sm:p-6 lg:sticky lg:top-24">
              <div className="flex items-center gap-3 mb-4 sm:mb-5">
                <div className="text-xl sm:text-2xl" style={{ color: features[activeFeature].color }}>{features[activeFeature].icon}</div>
                <h3 className="font-poppins font-semibold text-base sm:text-lg text-slate-800 dark:text-slate-100">{features[activeFeature].title}</h3>
              </div>
              <div className="space-y-2 sm:space-y-2.5">
                {features[activeFeature].benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2 font-manrope text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    <FaCheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BRAND NEW COMPONENT IMPORTED HERE */}
      <BenchmarkLibrary />

      {/* Realistic Social Proof */}
      <section 
        id="stats" 
        className={`py-12 sm:py-20 transition-all duration-1000 ease-out ${isVisible['stats'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 sm:p-8 rounded-2xl relative">
              <FaQuoteLeft className="text-slate-200 dark:text-slate-800 text-3xl sm:text-4xl absolute top-6 left-6 -z-0" />
              <p className="font-manrope text-slate-700 dark:text-slate-300 relative z-10 text-sm sm:text-base lg:text-lg leading-relaxed mb-6">
                "As a law student, finding specific precedents used to take hours. This tool breaks down the exact sections of the Constitution and BNS so much faster. It's an incredible research companion."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 text-sm sm:text-base">R</div>
                <div>
                  <h4 className="font-poppins font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100">Rahul M.</h4>
                  <p className="font-manrope text-[10px] sm:text-xs text-slate-500">Law Student / Early Beta Tester</p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 sm:p-8 rounded-2xl relative">
              <FaQuoteLeft className="text-slate-200 dark:text-slate-800 text-3xl sm:text-4xl absolute top-6 left-6 -z-0" />
              <p className="font-manrope text-slate-700 dark:text-slate-300 relative z-10 text-sm sm:text-base lg:text-lg leading-relaxed mb-6">
                "I run a small digital agency and constantly get confused by basic contract terms. Justice Genie helped me understand what an NDA actually protects before I paid a lawyer to draft one."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center font-bold text-amber-600 dark:text-amber-400 text-sm sm:text-base">A</div>
                <div>
                  <h4 className="font-poppins font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100">Ananya S.</h4>
                  <p className="font-manrope text-[10px] sm:text-xs text-slate-500">Startup Founder</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section 
        id="pricing" 
        className={`py-12 sm:py-24 bg-slate-50 dark:bg-slate-900/50 transition-all duration-1000 ease-out ${isVisible['pricing'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
            <h2 className="font-poppins text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50">Simple, Honest Pricing</h2>
            <p className="font-manrope text-slate-500 dark:text-slate-400 mt-3 sm:mt-4 text-sm sm:text-lg">
              Full access is free during our beta testing phase.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto items-stretch">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-2xl p-6 sm:p-8 transition-all duration-300 ${
                  tier.highlighted
                    ? 'bg-white dark:bg-slate-900 border-2 border-blue-600 shadow-xl scale-100 md:scale-105 z-10'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm opacity-95 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-poppins font-bold text-lg sm:text-xl text-slate-900 dark:text-slate-100">{tier.name}</h3>
                  {tier.badge && (
                    <span className="flex items-center gap-1 sm:gap-1.5 font-manrope text-[10px] sm:text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 sm:px-2.5 py-1 rounded-full">
                      <FaLock size={10} />
                      {tier.badge}
                    </span>
                  )}
                  {tier.highlighted && (
                    <span className="font-manrope text-[10px] sm:text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 sm:px-2.5 py-1 rounded-full">
                      Available Now
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1 mt-4 mb-3">
                  <span className={`font-poppins font-bold text-slate-900 dark:text-slate-100 ${tier.price === 'Coming Soon' ? 'text-xl sm:text-2xl' : 'text-3xl sm:text-4xl lg:text-5xl'}`}>
                    {tier.price}
                  </span>
                  {tier.period && <span className="font-manrope text-sm sm:text-base text-slate-400 dark:text-slate-500 font-medium">/ {tier.period}</span>}
                </div>
                <p className="font-manrope text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-8 h-10">{tier.description}</p>

                <ul className="space-y-3 sm:space-y-4 mb-8 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 sm:gap-3 font-manrope text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      <FaCheckCircle className={`flex-shrink-0 mt-0.5 text-base sm:text-lg ${tier.highlighted ? 'text-blue-600 dark:text-blue-500' : 'text-slate-300 dark:text-slate-600'}`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={tier.action || undefined}
                  disabled={!tier.action}
                  className={`w-full flex justify-center items-center font-manrope text-sm sm:text-base font-semibold py-3 sm:py-3.5 rounded-xl transition-all duration-200 ${
                    tier.highlighted
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg active:scale-[0.98]'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section 
        id="faq" 
        className={`py-12 sm:py-20 transition-all duration-1000 ease-out ${isVisible['faq'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="font-poppins text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 overflow-hidden"
              >
                <button
                  className="w-full text-left px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center focus:outline-none"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-manrope text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 pr-4">{faq.question}</span>
                  <span className="text-slate-400 flex-shrink-0">
                    {openFaq === index ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
                  </span>
                </button>
                {openFaq === index && (
                  <div className="px-4 sm:px-6 pb-4 pt-1 font-manrope text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-slate-900 dark:bg-slate-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 text-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-white/10 flex items-center justify-center mx-auto mb-5 sm:mb-6">
            <img src="/images/jg_original_logo.png" alt="" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
          </div>

          <h2 className="font-poppins text-2xl sm:text-3xl font-bold text-white">Start Understanding Your Legal Rights Today</h2>
          <p className="font-manrope text-sm sm:text-base text-slate-400 mt-3 sm:mt-4 leading-relaxed px-2">
            No credit card, no waitlist. Create an account and get full access to everything
            Justice Genie offers right now, completely free.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mt-6 sm:mt-8">
            <button
              onClick={() => navigate("/register")}
              className="flex items-center gap-2 font-manrope text-sm sm:text-base font-semibold px-5 sm:px-6 py-2.5 sm:py-3 rounded-md bg-blue-600 text-white hover:bg-blue-700 shadow-card hover:shadow-card-hover active:scale-[0.98] transition-all duration-150"
            >
              <FaArrowRight size={12} className="sm:w-3.5 sm:h-3.5" />
              Create Free Account
            </button>
          </div>
        </div>
      </section>

      {/* Legal Disclaimer */}
      <section className="bg-slate-950 dark:bg-black py-6 sm:py-8 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 flex items-start gap-2.5 sm:gap-3">
          <ShieldCheck className="text-slate-500 flex-shrink-0 mt-0.5 w-4 h-4 sm:w-5 sm:h-5" />
          <p className="font-manrope text-[10px] sm:text-xs text-slate-500 leading-relaxed">
            Justice Genie provides general legal information for educational purposes and does not
            constitute legal advice. It is not a substitute for consultation with a qualified lawyer.
            For advice on your specific situation, please consult a licensed legal professional.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 dark:bg-black pt-10 sm:pt-14 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 pb-8 sm:pb-10 border-b border-slate-800">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <img src="/images/jg_original_logo.png" alt="" className="w-6 h-6 sm:w-7 sm:h-7 object-contain" />
                <span className="font-manrope text-sm sm:text-base font-semibold text-white">Justice Genie</span>
              </div>
              <p className="font-manrope text-xs sm:text-sm text-slate-500 max-w-sm mb-4">
                Making Indian legal knowledge more accessible through technology.
              </p>
              <button 
                onClick={() => setIsTeamModalOpen(true)}
                className="font-manrope text-[10px] sm:text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors border border-blue-900/50 hover:border-blue-700 bg-blue-900/20 px-3 py-1.5 rounded"
              >
                About the Creators
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 lg:col-span-2">
              <div>
                <h4 className="font-poppins text-xs sm:text-sm font-semibold text-white mb-3">Platform</h4>
                <ul className="space-y-2 font-manrope text-xs sm:text-sm text-slate-500">
                  <li><a href="#how-it-works" onClick={(e) => handleScrollTo(e, 'how-it-works')} className="hover:text-white transition-colors">How it Works</a></li>
                  <li><a href="#features" onClick={(e) => handleScrollTo(e, 'features')} className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="#benchmark" onClick={(e) => handleScrollTo(e, 'benchmark')} className="hover:text-white transition-colors">Benchmark</a></li>
                  <li><a href="#pricing" onClick={(e) => handleScrollTo(e, 'pricing')} className="hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="#faq" onClick={(e) => handleScrollTo(e, 'faq')} className="hover:text-white transition-colors">FAQ</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-poppins text-xs sm:text-sm font-semibold text-white mb-3">Account</h4>
                <ul className="space-y-2 font-manrope text-xs sm:text-sm text-slate-500">
                  <li><a href="/login" className="hover:text-white transition-colors">Login</a></li>
                  <li><a href="/register" className="hover:text-white transition-colors">Create Account</a></li>
                </ul>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <h4 className="font-poppins text-xs sm:text-sm font-semibold text-white mb-3">Legal</h4>
                <ul className="space-y-2 font-manrope text-xs sm:text-sm text-slate-500 flex flex-row gap-4 sm:flex-col sm:gap-0">
                  <li><a href="/privacy-policy" onClick={(e) => { e.preventDefault(); navigate('/privacy-policy'); }} className="hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="/terms-of-service" onClick={(e) => { e.preventDefault(); navigate('/terms-of-service'); }} className="hover:text-white transition-colors">Terms of Service</a></li>
                </ul>
              </div>
            </div>
          </div>

          <p className="text-center font-manrope text-[10px] sm:text-sm text-slate-600 pt-6">
            © {new Date().getFullYear()} Justice Genie. A Student Research Project.
          </p>
        </div>
      </footer>

      {/* Team Modal */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-revealUp max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h3 className="font-poppins font-bold text-lg sm:text-xl text-slate-900 dark:text-slate-100">About the Creators</h3>
              <button 
                onClick={() => setIsTeamModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar">
              <p className="font-manrope text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 sm:mb-8 text-center px-2">
                Justice Genie is a college project built by two students combining their passion for technology and making legal knowledge accessible.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                {teamMembers.map((member, index) => (
                  <div key={index} className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 text-center">
                    <img src={member.avatar} alt={member.name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover mx-auto mb-3" />
                    <h4 className="font-poppins text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">{member.name}</h4>
                    <p className="font-manrope text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 font-medium mb-4">{member.role}</p>
                    
                    <div className="flex items-center justify-center gap-2">
                      <a href={`mailto:${member.email}`} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors">
                        <FaEnvelope className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </a>
                      <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors">
                        <FaLinkedin className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </a>
                      <a href={member.github} target="_blank" rel="noopener noreferrer" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-blue-600 transition-colors">
                        <FaGithub className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}