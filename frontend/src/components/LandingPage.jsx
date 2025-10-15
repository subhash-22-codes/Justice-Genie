import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/LandingPage.css";
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

  // ✅ Redirect if already logged in
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
    <div className="loading-container">
      {/* Spinner and Main Text */}
      <div className="loading-spinner-advanced">
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>

      <div className="loading-text font-poppins">
        <h3>Justice Genie</h3>
        <p>Initializing your legal companion...</p>
      </div>

      {/* Developer Cards */}
     <div className="loading-credits">
        {[
          { img: "/images/Subhash.jpg", name: "Subhash Yaganti", role: "Full Stack Dev & UI/UX Designer" },
          { img: "/images/Siri.jpg", name: "Siri Mahalaxmi Vemula", role: "Backend + API Integration + System Architect" }
        ].map((dev, index) => (
          <div key={index} className="dev-card">
            <img src={dev.img} alt={dev.name} className="dev-avatar" />
            <div className="dev-info">
              <p className="dev-name">{dev.name}</p>
              <span className="dev-role">{dev.role}</span>
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
      color: "#6366f1"
    },
    {
      icon: <FaQuestionCircle />,
      title: "Interactive Legal Quizzes",
      description: "Master Indian law through engaging, adaptive quizzes that adjust to your knowledge level and track your progress over time.",
      benefits: ["Global Leaderboard", "Progress Tracking", "Case-Based Questions", "Self-Evaluation"],
      color: "#f59e0b"
    },
    {
      icon: <FaFilePdf />,
      title: "Legal Document Library",
      description: "Access a comprehensive collection of legal documents, templates, and reference materials curated by legal experts.",
      benefits: ["Expert Curated", "Always Updated", "Instant Download", "Searchable Database"],
      color: "#f12e24ff"
    },
    {
      icon: <FaBookOpen />,
      title: "Curated Legal Resources",
      description: "Discover handpicked legal books, articles, case studies, and educational materials from trusted legal authorities.",
      benefits: ["Trusted Sources", "Regular Updates", "Categorized Content", "Expert Recommendations"],
      color: "#be37aeff"
    }
  ];

  // const testimonials = [
  //   {
  //     name: "Priya Sharma",
  //     role: "Law Student",
  //     content: "Justice Genie transformed how I study law. The AI assistant is incredibly accurate and the quizzes help me retain information better.",
  //     rating: 5,
  //     avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
  //   },
  //   {
  //     name: "Rajesh Kumar",
  //     role: "Legal Professional",
  //     content: "As a practicing lawyer, I find the document library invaluable. It saves me hours of research time every week.",
  //     rating: 5,
  //     avatar: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
  //   },
  //   {
  //     name: "Anita Patel",
  //     role: "Legal Researcher",
  //     content: "The curated resources are exceptional. It's like having a legal library at my fingertips with expert recommendations.",
  //     rating: 5,
  //     avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop"
  //   }
  // ];

  const stats = [
    { number: "100+", label: "Legal Questions Answered", icon: <FaQuestionCircle color="#2563eb" /> },
    { number: "soon", label: "Legal Documents", icon: <FaFilePdf color="#dc2626" /> },
    { number: "30+", label: "Active Users", icon: <FaUsers color="#f97316" /> },
    { number: "90%", label: "Accuracy Rate", icon: <FaCheckCircle color="#16a34a" /> }
  ];

  // const teamMembers = [
  //   {
  //     name: "Subhash Yaganti",
  //     role: "Full-Stack Developer & UI/UX",
  //     description: "Passionate about creating technology solutions that make legal knowledge accessible to everyone.",
  //     email: "subashyagantisubbu@gmail.com",
  //     linkedin: "https://www.linkedin.com/in/subhash-yaganti-a8b3b626a/",
  //     github: "https://github.com/subhash-22-codes",
  //     instagram: "https://instagram.com/subhash.yaganti",
  //     avatar: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop",
  //     skills: ["React", "Node.js", "AI Integration", "UI/UX Design"]
  //   },
  //   {
  //     name: "Siri Mahalaxmi Vemula",
  //     role: "Backend Engineer & Database Architect",
  //     description: "Specializes in building robust, scalable systems that power seamless user experiences.",
  //     email: "sirimahalaxmivemula@gmail.com",
  //     linkedin: "https://www.linkedin.com/in/vemula-siri-mahalaxmi-b4b624319/",
  //     github: "https://github.com/siri-vemula",
  //     instagram: "https://instagram.com/siri.vemula",
  //     avatar: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop",
  //     skills: ["Python", "Database Design", "API Development", "System Architecture"]
  //   }
  // ];

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="nav-container">
        <div className="nav-content">
          <div className="nav-logo">
           <div className="logo-container">
              <img src="/images/jg_original_logo_1.png" alt="Justice Genie Logo" className="logo-img" />
            </div>

          </div>
            <div className="nav-menu font-montserrat">
              <a
                href="#features"
                className="nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Features
              </a>
              <a
                href="#hero"
                className="nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                About       
              </a>
              <a
                href="#cta"
                className="nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Ready to Start?
              </a>
              <a
                href="#team"
                className="nav-link"
                onClick={(e) => { 
                  e.preventDefault();
                  document.getElementById('team')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Team
              </a>
            </div>

          <div className="nav-buttons">
            <button 
              onClick={() => navigate("/login")}
              className="nav-btn Landing-login-btn font-urbanist"
            >
              Login
            </button>
            <button 
              onClick={() => navigate("/register")}
              className="nav-btn Landing-register-btn font-urbanist"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section" id="hero">
        <div className="hero-background">
          <div className="hero-pattern"></div>
        </div>
        
        <div className="hero-container">
          <div className="hero-content">
            
            <h1 className="hero-title">
              <span className="title-main font-urbanist">Justice Genie</span>
              <span className="title-subtitle font-manrope">Making Indian Legal Knowledge Accessible</span>
            </h1>
            
            <p className="hero-description font-spacegrotesk">
              Experience the future of legal education with our AI-powered platform. 
              Get instant answers, master concepts through interactive quizzes, access 
              comprehensive legal documents, and explore curated resources—all designed 
              to democratize legal knowledge in India.
            </p>
            
            <div className="hero-features-preview font-sora">
              <div className="feature-preview">
                <FaCheckCircle className="check-icon" />
                <span>AI-Powered Legal Assistant</span>
              </div>
              <div className="feature-preview">
                <FaCheckCircle className="check-icon" />
                <span>Interactive Learning Quizzes</span>
              </div>
              <div className="feature-preview">
                <FaCheckCircle className="check-icon" />
                <span>Comprehensive Document Library</span>
              </div>
            </div>
            
            <div className="hero-buttons">
              <button 
                onClick={() => navigate("/register")}
                className="primary-btn hero-primary font-urbanist"
              >
                <FaPlay className="btn-icon" />
                Start Your Journey
              </button>
              <button 
                onClick={() => navigate("/login")}
                className="secondary-btn hero-secondary font-urbanist"
              >
                Login to Continue
              </button>
            </div>
            
            <div className="hero-social-proof">
              <div className="social-proof-item">
                <div className="proof-avatars">
                  <img src="https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop" alt="User" />
                  <img src="https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop" alt="User" />
                  <img src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop" alt="User" />
                </div>
                <div className="proof-text">
                  <span className="proof-number font-sora">30+</span>
                  <span className="proof-label font-sora">students already learning</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="hero-dashboard">
              <div className="dashboard-header">
                <div className="dashboard-nav">
                  <div className="nav-dot active"></div>
                  <div className="nav-dot"></div>
                  <div className="nav-dot"></div>
                </div>
                <div className="dashboard-title font-jura">Justice Genie Dashboard</div>
              </div>
              <div className="dashboard-content">
                <div className="dashboard-card">
                  <FaRobot className="card-icon text-blue-600" />
                  <div className="card-content font-urbanist">
                    <h4>AI Assistant</h4>
                    <p>Ask any legal question</p>
                  </div>
                  <div className="card-status active font-sora">Active</div>
                </div>
                <div className="dashboard-card">
                  <FaQuestionCircle className="card-icon text-yellow-600" />
                  <div className="card-content font-urbanist">
                    <h4>Legal Quiz</h4>
                    <p>Test your knowledge</p>
                  </div>
                  <div className="card-status font-sora">Ready</div>
                </div>
                <div className="dashboard-card">
                  <FaFilePdf className="card-icon text-red-600" />
                  <div className="card-content font-urbanist">
                    <h4>PDF Generation</h4>
                    <p>Export your chats & notes</p>
                  </div>
                  <div className="card-status font-sora">Available</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="scroll-indicator font-montserrat" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
          <FaChevronDown className="scroll-icon" />
          <span>Discover More</span>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section font-manrope" id="stats">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className={`stat-card ${isVisible.stats ? 'animate' : ''}`} style={{animationDelay: `${index * 0.1}s`}}>
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="container">
          <div className="section-header">
            <div className="section-badge font-courgette">
              <FaLightbulb className="badge-icon" />
              <span>Powerful Features</span>
            </div>
            <h2 className="section-title font-montserrat">Everything You Need for Legal Learning</h2>
            <p className="section-description font-urbanist">
              Our comprehensive platform combines cutting-edge AI technology with carefully 
              curated legal resources to provide an unmatched learning experience.
            </p>
          </div>
          
          <div className="features-showcase">
            <div className="features-tabs">
              {features.map((feature, index) => (
                <button
                  key={index}
                  className={`feature-tab ${activeFeature === index ? 'active' : ''}`}
                  onClick={() => setActiveFeature(index)}
                  style={{'--tab-color': feature.color}}
                >
                  <div className="tab-icon">{feature.icon}</div>
                  <div className="tab-content font-manrope">
                    <h4>{feature.title}</h4>
                    <p>{feature.description}</p>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="features-display">
              <div className="feature-visual">
                <div className="feature-mockup" style={{'--feature-color': features[activeFeature].color}}>
                  <div className="mockup-header">
                    <div className="mockup-icon">{features[activeFeature].icon}</div>
                    <h3>{features[activeFeature].title}</h3>
                  </div>
                  <div className="mockup-content font-urbanist">
                    <div className="benefits-list">
                      {features[activeFeature].benefits.map((benefit, index) => (
                        <div key={index} className="benefit-item">
                          <FaCheckCircle className="benefit-icon" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {/* <section className="testimonials-section" id="testimonials">
        <div className="container">
          <div className="section-header">
            <div className="section-badge">
              <FaStar className="badge-icon" />
              <span>User Reviews</span>
            </div>
            <h2 className="section-title">What Our Users Say</h2>
            <p className="section-description">
              Join thousands of students and professionals who trust Justice Genie 
              for their legal learning journey.
            </p>
          </div>
          
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className={`testimonial-card ${isVisible.testimonials ? 'animate' : ''}`} style={{animationDelay: `${index * 0.2}s`}}>
                <div className="testimonial-header">
                  <div className="testimonial-avatar">
                    <img src={testimonial.avatar} alt={testimonial.name} />
                  </div>
                  <div className="testimonial-info">
                    <h4>{testimonial.name}</h4>
                    <p>{testimonial.role}</p>
                  </div>
                  <div className="testimonial-rating">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <FaStar key={i} className="star-icon" />
                    ))}
                  </div>
                </div>
                <div className="testimonial-content">
                  <p>"{testimonial.content}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Team Section */}
      {/* <section className="team-section" id="team">
        <div className="container">
          <div className="section-header">
            <div className="section-badge">
              <FaUsers className="badge-icon" />
              <span>Our Team</span>
            </div>
            <h2 className="section-title">Meet the Innovators</h2>
            <p className="section-description">
              Passionate students combining technology and law to create something meaningful 
              that makes legal knowledge accessible to everyone.
            </p>
          </div>

          <div className="team-grid">
            {teamMembers.map((member, index) => (
              <div 
                key={index} 
                className={`team-card ${isVisible.team ? 'animate' : ''}`}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="team-card-inner">
                  
                  <div className="team-avatar-container">
                    <img src={member.avatar} alt={member.name} className="team-avatar" />
                  </div>

                  
                  <div className="team-social-links">
                    <a href={`mailto:${member.email}`} className="social-link email">
                      <FaEnvelope />
                    </a>
                    <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="social-link linkedin">
                      <FaLinkedin />
                    </a>
                    <a href={member.github} target="_blank" rel="noopener noreferrer" className="social-link github">
                      <FaGithub />
                    </a>
                    <a href={member.instagram} target="_blank" rel="noopener noreferrer" className="social-link instagram">
                      <FaInstagram />
                    </a>
                  </div>

                 
                  <div className="team-info">
                    <h3 className="team-name">{member.name}</h3>
                    <p className="team-role">{member.role}</p>
                    <p className="team-description">{member.description}</p>

                    <div className="team-skills">
                      {member.skills.map((skill, skillIndex) => (
                        <span key={skillIndex} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}


      {/* CTA Section */}
      <section className="cta-section" id="cta">
        <div className="container">
          <div className="cta-content">
           <div className="cta-visual">
              <div className="cta-icon-container">
                <div className="logo-circle">
                <img src="/images/jg_original_logo.png" alt="Justice Genie Logo" className="cta-main-logo" />
                </div>
              </div>
            </div>
            <div className="cta-text">
              <h2 className="cta-title font-sora">Ready to Transform Your Legal Learning?</h2>
              <p className="cta-description font-spacegrotesk">
                Join Justice Genie today and experience the future of legal education. 
                Get instant AI assistance, master concepts through interactive learning, 
                and access comprehensive legal resources—all in one powerful platform.
              </p>
              
              <div className="cta-features font-sora">
                <div className="cta-feature">
                  <FaCheckCircle className="cta-check" />
                  <span>Free to start</span>
                </div>
                <div className="cta-feature">
                  <FaCheckCircle className="cta-check" />
                  <span>Instant access to all features</span>
                </div>
                <div className="cta-feature">
                  <FaCheckCircle className="cta-check" />
                  <span>Join 30+ active learners</span>
                </div>
              </div>
              
              <div className="cta-buttons">
                <button 
                  onClick={() => navigate("/register")}
                  className="cta-primary-btn font-urbanist"
                >
                  <FaArrowRight className="btn-icon" />
                  Start Learning Now
                </button>
                <button 
                  onClick={() => navigate("/login")}
                  className="cta-secondary-btn font-urbanist"
                >
                  Already have an account?
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="footer-logo">
                <img src="/images/jg_original_logo.png" alt="Justice Genie Logo" className="footer-logo-img" />
                <span className="logo-text font-manrope">Justice Genie</span>
              </div>

              <p className="footer-description font-manrope">
                Democratizing legal knowledge through innovative technology. Built with passion by students combining technology & law.
              </p>
              <div className="footer-social">
                <a href="https://www.linkedin.com/in/subhash-yaganti-a8b3b626a/" target="_blank" rel="noopener noreferrer" className="footer-social-link linkedin">
                  <FaLinkedin />
                </a>
                <a href="https://github.com/subhash-22-codes" target="_blank" rel="noopener noreferrer" className="footer-social-link github">
                  <FaGithub />
                </a>
                <a href="https://instagram.com/subhash__spiody" target="_blank" rel="noopener noreferrer" className="footer-social-link instagram">
                  <FaInstagram />
                </a>
                <a href="mailto:subashyagantisubbu@gmail.com" className="footer-social-link  mail">
                  <FaEnvelope />
                </a>
              </div>
            </div>

            <div className="footer-links">
              <div className="footer-section font-montserrat">
                <h4>Platform</h4>
                <ul>
                  <li><a href="#features">Features</a></li>
                  <li><a href="/register">Get Started</a></li>
                  <li><a href="/login">Login</a></li>
                  <li><a href="#testimonials">Reviews</a></li>
                </ul>
              </div>
              <div className="footer-section font-montserrat">
                <h4>Resources</h4>
                <ul>
                  <li><a href="/login">AI Chat</a></li>
                  <li><a href="/login">Legal Quizzes</a></li>
                  <li><a href="/login">Document Library</a></li>
                  <li><a href="/login">Learning Resources</a></li>
                </ul>
              </div>
            </div>
          </div>

          <footer className="text-white py-6">
            <p className="text-center text-sm font-urbanist">
              © 2025 Justice Genie. College project by Subhash Yaganti & Siri Mahalaxmi Vemula.
            </p>
          </footer>
        </div>
      </footer>

    </div>
  );
}