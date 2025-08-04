import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import {
  ArrowRight,
  MessageSquare,
  History,
  Brain,
  Globe,
  Zap,
  UserCheck,
  Shield,
  MessageCircleQuestion,
  Bot,
  Save,
  ChevronDown,
  GitBranch,
  InspectionPanel,
  Link2Icon,
  FactoryIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/tailwind.css';
const IntroPage = () => {
  const controls = useAnimation();
  const navigate = useNavigate();

  useEffect(() => {
    controls.start({ opacity: 1, y: 0 });
  }, [controls]);

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const features = [
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "Instant Legal Guidance",
      description: "AI-powered answers for legal queries, available 24/7."
    },
    {
      icon: <History className="w-8 h-8" />,
      title: "Chat History & Resumption",
      description: "Never lose important legal discussions with automatic chat saving."
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Interactive Legal Quizzes",
      description: "Test your legal knowledge with AI-generated quizzes."
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Multilingual Support",
      description: "Understand legal advice in your preferred language."
    }
  ];

  const benefits = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Fast & Reliable",
      description: "Get legal insights in seconds"
    },
    {
      icon: <UserCheck className="w-6 h-6" />,
      title: "User-Friendly",
      description: "No complex legal terms – just simple answers"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure & Private",
      description: "Your data is safe with us"
    }
  ];

  const steps = [
    {
      icon: <MessageCircleQuestion className="w-8 h-8" />,
      title: "Ask Your Question",
      description: "Type your legal query in simple words"
    },
    {
      icon: <Bot className="w-8 h-8" />,
      title: "Get Instant AI Advice",
      description: "AI provides clear, law-based guidance"
    },
    {
      icon: <Save className="w-8 h-8" />,
      title: "Save, Export & Resume",
      description: "Access your past conversations anytime"
    }
  ];


  return (
    
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      {/* Hero Section */}
     <section className="relative min-h-screen flex items-center box-border m-0 p-0 leading-normal antialiased bg-white text-black">
  {/* Background Image Layer */}
  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center opacity-5" />

  {/* Main Content Container */}
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 relative box-border">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="text-center max-w-3xl mx-auto box-border"
    >
      <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-6 m-0 p-0">
        Your AI-Powered Legal Assistant
      </h1>

      <p className="text-xl text-gray-600 mb-8 m-0 p-0">
        Get instant legal insights, save your chat history, and stay informed – all in one place.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center box-border">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 box-border"
        >
          Get Started for Free
          <ArrowRight className="w-5 h-5" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={scrollToFeatures}
          className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2 box-border"
        >
          Learn More
          <ChevronDown className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  </div>
</section>


     {/* Features Section */}
<section
  id="features"
  className="py-20 bg-white box-border m-0 p-0 leading-normal antialiased text-black"
>
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 box-border">
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeInUp}
      className="text-center mb-16 box-border"
    >
      <h2 className="text-4xl font-bold text-gray-900 mb-4 m-0 p-0">
        Why Use Justice Genie?
      </h2>
      <p className="text-xl text-gray-600 m-0 p-0">
        Experience the future of legal assistance
      </p>
    </motion.div>

    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 box-border">
      {features.map((feature, index) => (
        <motion.div
          key={index}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="bg-white p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300 box-border"
        >
          <div className="bg-indigo-100 w-16 h-16 rounded-xl flex items-center justify-center mb-4 text-indigo-600 box-border">
            {feature.icon}
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2 m-0 p-0">
            {feature.title}
          </h3>
          <p className="text-gray-600 m-0 p-0">
            {feature.description}
          </p>
        </motion.div>
      ))}
    </div>
  </div>
</section>


      {/* Why Choose Us Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Justice Genie?
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="bg-white p-6 rounded-xl shadow-lg"
              >
                <div className="text-indigo-600 mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in three simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="relative"
              >
                <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 text-indigo-600">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">
                    {step.description}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
                    <ArrowRight className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-4xl font-bold mb-8">
              Start Your Legal Journey Today!
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2"
                onClick={() => navigate('/register')}
              >
                Sign Up Now
                <ArrowRight className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-indigo-700 text-white rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2"
              >
                Try Demo
                <Bot className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="/AboutUs" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="/PrivacyPolicy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/Faqs" className="hover:text-white transition-colors">FAQs</a></li>
                <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="/TermsOFService" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="/CookiePolicy" className="hover:text-white transition-colors">Cookie Policy</a></li>
                <li><a href="/Disclaimer" className="hover:text-white transition-colors">Disclaimer</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="/Help" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="/Doc" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="/ApiStatus" className="hover:text-white transition-colors">API Status</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg mb-4">Connect</h3>
              <div className="flex space-x-4">
                <a href="/Git" className="hover:text-white transition-colors">
                  <GitBranch className="w-6 h-6" />
                </a>
                <a href="/Twitter" className="hover:text-white transition-colors">
                  <InspectionPanel className="w-6 h-6" />
                </a>
                <a href="/Linkedin" className="hover:text-white transition-colors">
                  <Link2Icon className="w-6 h-6" />
                </a>
                <a href="//Facebook" className="hover:text-white transition-colors">
                  <FactoryIcon className="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p>© 2024 Justice Genie. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
    
  );
};

export default IntroPage;