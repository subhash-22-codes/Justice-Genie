import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Loader } from 'lucide-react';
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
  FaLightbulb,
  FaLinkedin,
  FaGithub,
  FaInstagram,
  FaEnvelope
} from "react-icons/fa";

export default function LandingPage() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [isVisible, setIsVisible] = useState({});
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (!auth.loading && auth.loggedIn) {
      navigate(auth.role === "admin" ? "/admin" : "/chat", { replace: true });
    }
  }, [auth, navigate]);

  // IntersectionObserver for animations/visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(prev => ({
            ...prev,
            [entry.target.id]: entry.isIntersecting
          }));
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll("[id]").forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  // Feature carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Show loader while auth is loading
 if (auth.loading) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <Loader size={36} className="animate-spin text-blue-600 mb-6" />

      <div className="font-poppins text-center mb-8">
        <h3 className="text-xl font-bold text-slate-800">Justice Genie</h3>
        <p className="text-sm text-slate-500 mt-1">Initializing your legal companion...</p>
      </div>

      {/* Developer Cards */}
      <div className="flex flex-col sm:flex-row gap-3">
        {[
          { img: "/images/Subhash.jpg", name: "Subhash Yaganti", role: "Full Stack Dev & UI/UX Designer" },
          { img: "/images/Siri.jpg", name: "Siri Mahalaxmi Vemula", role: "Backend + API Integration + System Architect" }
        ].map((dev, index) => (
          <div key={index} className="flex items-center gap-3 bg-white border border-slate-200 rounded-sm px-4 py-3">
            <img src={dev.img} alt={dev.name} className="w-10 h-10 rounded-full object-cover" />
            <div>
              <p className="font-manrope text-sm font-semibold text-slate-800">{dev.name}</p>
              <span className="font-manrope text-xs text-slate-500">{dev.role}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

  const features = [
    {
      icon: <FaRobot />,
      title: "AI Legal Assistant",
      description: "Get instant, accurate answers to complex Indian legal questions with our advanced AI that understands legal nuances and provides contextual guidance.",
      benefits: ["24/7 Availability", "Instant Responses", "Legal Accuracy", "Context Aware"],
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

  const stats = [
    { number: "100+", label: "Legal Questions Answered", icon: <FaQuestionCircle /> },
    { number: "soon", label: "Legal Documents", icon: <FaFilePdf /> },
    { number: "30+", label: "Active Users", icon: <FaUsers /> },
    { number: "90%", label: "Accuracy Rate", icon: <FaCheckCircle /> }
  ];

  const teamMembers = [
    {
      name: "Subhash Yaganti",
      role: "Full-Stack Developer + UI/UX Designer",
      email: "subashyagantisubbu@gmail.com",
      linkedin: "https://www.linkedin.com/in/subhash-yaganti-a8b3b626a/",
      github: "https://github.com/subhash-22-codes",
      instagram: "https://instagram.com/subhash__spiody",
      avatar: "/images/Subhash.jpg",
    },
    {
      name: "Siri Mahalaxmi Vemula",
      role: "Backend Engineer + API Integration + System Architect",
      email: "sirimahalaxmivemula@gmail.com",
      linkedin: "https://www.linkedin.com/in/vemula-siri-mahalaxmi-b4b624319/",
      github: "https://github.com/armycodes",
      instagram: "https://instagram.com/heysiri_0_0",
      avatar: "/images/Siri.jpg",
    }
  ];

  return (
    <div className="bg-slate-50 text-slate-800">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <img src="/images/jg_original_logo_1.png" alt="Justice Genie Logo" className="h-8 w-8 object-contain" />

          <div className="hidden md:flex items-center gap-8 font-manrope text-sm font-medium">
            <a
              href="#features"
              className="text-slate-600 hover:text-slate-900"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Features
            </a>
            <a
              href="#hero"
              className="text-slate-600 hover:text-slate-900"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              About
            </a>
            <a
              href="#cta"
              className="text-slate-600 hover:text-slate-900"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Ready to Start?
            </a>
            <a
              href="#team"
              className="text-slate-600 hover:text-slate-900"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('team')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Team
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/login")}
              className="font-manrope text-sm font-medium px-4 py-2 rounded-sm text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/register")}
              className="font-manrope text-sm font-medium px-4 py-2 rounded-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden" id="hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="font-poppins font-bold text-4xl sm:text-5xl text-slate-900 leading-tight">
              Justice Genie
              <span className="block font-manrope font-medium text-lg sm:text-xl text-slate-500 mt-2">
                Making Indian Legal Knowledge Accessible
              </span>
            </h1>

            <p className="font-manrope text-base text-slate-600 mt-6 leading-relaxed max-w-lg">
              Experience the future of legal education with our AI-powered platform.
              Get instant answers, master concepts through interactive quizzes, access
              comprehensive legal documents, and explore curated resources—all designed
              to democratize legal knowledge in India.
            </p>

            <div className="flex flex-col gap-2 mt-6">
              {['AI-Powered Legal Assistant', 'Interactive Learning Quizzes', 'Comprehensive Document Library'].map((item) => (
                <div key={item} className="flex items-center gap-2 font-manrope text-sm text-slate-600">
                  <FaCheckCircle className="text-green-600 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 mt-8">
              <button
                onClick={() => navigate("/register")}
                className="flex items-center gap-2 font-manrope font-semibold px-6 py-3 rounded-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <FaPlay size={14} />
                Start Your Journey
              </button>
              <button
                onClick={() => navigate("/login")}
                className="font-manrope font-semibold px-6 py-3 rounded-sm border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Login to Continue
              </button>
            </div>

            <div className="flex items-center gap-3 mt-8">
              <div className="flex -space-x-2">
                <img className="w-9 h-9 rounded-full border-2 border-white object-cover" src="https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop" alt="User" />
                <img className="w-9 h-9 rounded-full border-2 border-white object-cover" src="https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop" alt="User" />
                <img className="w-9 h-9 rounded-full border-2 border-white object-cover" src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop" alt="User" />
              </div>
              <div className="font-manrope text-sm">
                <span className="font-semibold text-slate-800">30+</span>
                <span className="text-slate-500"> students already learning</span>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white border border-slate-200 rounded-sm shadow-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
                </div>
                <div className="font-manrope text-xs text-slate-500 ml-2">Justice Genie Dashboard</div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3 border border-slate-200 rounded-sm p-3">
                  <FaRobot className="text-blue-600 text-xl flex-shrink-0" />
                  <div className="font-manrope flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-800">AI Assistant</h4>
                    <p className="text-xs text-slate-500">Ask any legal question</p>
                  </div>
                  <span className="font-manrope text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-sm flex-shrink-0">Active</span>
                </div>
                <div className="flex items-center gap-3 border border-slate-200 rounded-sm p-3">
                  <FaQuestionCircle className="text-amber-600 text-xl flex-shrink-0" />
                  <div className="font-manrope flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-800">Legal Quiz</h4>
                    <p className="text-xs text-slate-500">Test your knowledge</p>
                  </div>
                  <span className="font-manrope text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm flex-shrink-0">Ready</span>
                </div>
                <div className="flex items-center gap-3 border border-slate-200 rounded-sm p-3">
                  <FaFilePdf className="text-red-600 text-xl flex-shrink-0" />
                  <div className="font-manrope flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-800">PDF Generation</h4>
                    <p className="text-xs text-slate-500">Export your chats & notes</p>
                  </div>
                  <span className="font-manrope text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm flex-shrink-0">Available</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="flex flex-col items-center gap-1 pb-8 cursor-pointer text-slate-400 hover:text-slate-600 font-manrope text-xs"
          onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
        >
          <FaChevronDown className="animate-bounce" />
          <span>Discover More</span>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-slate-800" id="stats">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-14 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`text-center transition-all duration-500 ${isVisible.stats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="text-blue-400 text-2xl flex justify-center mb-2">{stat.icon}</div>
              <div className="font-poppins text-2xl sm:text-3xl font-bold text-white">{stat.number}</div>
              <div className="font-manrope text-xs sm:text-sm text-slate-300 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 font-manrope text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-sm mb-4">
              <FaLightbulb />
              <span>Powerful Features</span>
            </div>
            <h2 className="font-poppins text-3xl font-bold text-slate-900">Everything You Need for Legal Learning</h2>
            <p className="font-manrope text-slate-500 mt-3">
              Our comprehensive platform combines cutting-edge AI technology with carefully
              curated legal resources to provide an unmatched learning experience.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-2">
              {features.map((feature, index) => (
                <button
                  key={index}
                  className={`w-full text-left flex items-start gap-4 p-4 rounded-sm border transition-colors ${
                    activeFeature === index
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                  onClick={() => setActiveFeature(index)}
                >
                  <div className="text-xl flex-shrink-0 mt-0.5" style={{ color: feature.color }}>{feature.icon}</div>
                  <div className="font-manrope">
                    <h4 className="text-sm font-semibold text-slate-800">{feature.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{feature.description}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-sm p-6 lg:sticky lg:top-24">
              <div className="flex items-center gap-3 mb-5">
                <div className="text-2xl" style={{ color: features[activeFeature].color }}>{features[activeFeature].icon}</div>
                <h3 className="font-poppins font-semibold text-lg text-slate-800">{features[activeFeature].title}</h3>
              </div>
              <div className="space-y-2.5">
                {features[activeFeature].benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2 font-manrope text-sm text-slate-600">
                    <FaCheckCircle className="text-green-600 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-white" id="team">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 font-manrope text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-sm mb-4">
              <FaUsers />
              <span>Our Team</span>
            </div>
            <h2 className="font-poppins text-3xl font-bold text-slate-900">Meet the Developers</h2>
            <p className="font-manrope text-slate-500 mt-3">
              Passionate students combining technology and law to create something meaningful
              that makes legal knowledge accessible to everyone.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className={`bg-slate-50 border border-slate-200 rounded-sm p-6 text-center transition-all duration-500 ${isVisible.team ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <img src={member.avatar} alt={member.name} className="w-20 h-20 rounded-full object-cover mx-auto mb-4" />

                <div className="flex items-center justify-center gap-2 mb-4">
                  <a href={`mailto:${member.email}`} className="w-8 h-8 rounded-sm bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-300">
                    <FaEnvelope size={14} />
                  </a>
                  <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-sm bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-300">
                    <FaLinkedin size={14} />
                  </a>
                  <a href={member.github} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-sm bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-300">
                    <FaGithub size={14} />
                  </a>
                  <a href={member.instagram} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-sm bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-300">
                    <FaInstagram size={14} />
                  </a>
                </div>

                <h3 className="font-poppins font-semibold text-slate-800">{member.name}</h3>
                <p className="font-manrope text-sm text-slate-500 mt-1">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-800" id="cta">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 text-center">
          <div className="w-16 h-16 rounded-sm bg-white/10 flex items-center justify-center mx-auto mb-6">
            <img src="/images/jg_original_logo.png" alt="Justice Genie Logo" className="w-10 h-10 object-contain" />
          </div>

          <h2 className="font-poppins text-3xl font-bold text-white">Ready to Transform Your Legal Learning?</h2>
          <p className="font-manrope text-slate-300 mt-4 leading-relaxed">
            Join Justice Genie today and experience the future of legal education.
            Get instant AI assistance, master concepts through interactive learning,
            and access comprehensive legal resources—all in one powerful platform.
          </p>

          <div className="flex flex-col items-center gap-2 mt-6">
            {['Free to start', 'Instant access to all features', 'Join 30+ active learners'].map((item) => (
              <div key={item} className="flex items-center gap-2 font-manrope text-sm text-slate-200">
                <FaCheckCircle className="text-green-400 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <button
              onClick={() => navigate("/register")}
              className="flex items-center gap-2 font-manrope font-semibold px-6 py-3 rounded-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <FaArrowRight size={14} />
              Start Learning Now
            </button>
            <button
              onClick={() => navigate("/login")}
              className="font-manrope font-semibold px-6 py-3 rounded-sm border border-slate-500 text-slate-200 hover:bg-slate-700 transition-colors"
            >
              Already have an account?
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 pt-14 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid sm:grid-cols-2 gap-10 pb-10 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img src="/images/jg_original_logo.png" alt="Justice Genie Logo" className="w-7 h-7 object-contain" />
                <span className="font-manrope font-semibold text-white">Justice Genie</span>
              </div>
              <p className="font-manrope text-sm text-slate-400 max-w-sm">
                Democratizing legal knowledge through innovative technology. Built with passion by students combining technology & law.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-poppins text-sm font-semibold text-white mb-3">Platform</h4>
                <ul className="space-y-2 font-manrope text-sm text-slate-400">
                  <li><a href="#features" className="hover:text-white">Features</a></li>
                  <li><a href="/register" className="hover:text-white">Get Started</a></li>
                  <li><a href="/login" className="hover:text-white">Login</a></li>
                  <li><a href="#testimonials" className="hover:text-white">Reviews</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-poppins text-sm font-semibold text-white mb-3">Resources</h4>
                <ul className="space-y-2 font-manrope text-sm text-slate-400">
                  <li><a href="/login" className="hover:text-white">AI Chat</a></li>
                  <li><a href="/login" className="hover:text-white">Legal Quizzes</a></li>
                  <li><a href="/login" className="hover:text-white">Document Library</a></li>
                  <li><a href="/login" className="hover:text-white">Learning Resources</a></li>
                </ul>
              </div>
            </div>
          </div>

          <p className="text-center font-manrope text-sm text-slate-500 pt-6">
            © 2025 Justice Genie. College project by Subhash Yaganti & Siri Mahalaxmi Vemula.
          </p>
        </div>
      </footer>
    </div>
  );
}
