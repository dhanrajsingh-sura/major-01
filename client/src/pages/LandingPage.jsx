import { useState, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  Briefcase,
  BookOpen,
  ArrowRight,
  Sparkles,
  CheckCircle,
  ChevronRight,
  Globe,
  MessageCircle,
  Target,
  TrendingUp,
  Heart,
  Shield,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './LandingPage.css';

/**
 * LandingPage — The first page users see.
 *
 * It displays:
 * 1. A hero section with the ANVAYA tagline
 * 2. Key features of the platform
 * 3. How it works (3 steps)
 * 4. Stats counter
 * 5. Call-to-action
 *
 * We also call the /api/health endpoint to verify the backend is running
 * and display a subtle connection indicator.
 */

const LandingPage = () => {
  const [serverStatus, setServerStatus] = useState('checking');

  useEffect(() => {
    // Check if the backend API is reachable
    const checkHealth = async () => {
      try {
        const response = await api.get('/health');
        if (response.data.success) {
          setServerStatus('connected');
        }
      } catch {
        setServerStatus('disconnected');
      }
    };
    checkHealth();
  }, []);

  const features = [
    {
      icon: <Users size={28} />,
      title: 'Alumni Network',
      description: 'Connect with alumni across industries, companies, and geographies. Build meaningful professional relationships.',
      color: 'primary',
    },
    {
      icon: <MessageCircle size={28} />,
      title: 'Mentorship',
      description: 'Get matched with experienced alumni mentors based on your career interests, skills, and goals.',
      color: 'accent',
    },
    {
      icon: <Briefcase size={28} />,
      title: 'Jobs & Internships',
      description: 'Discover exclusive opportunities posted by alumni from top companies and startups.',
      color: 'secondary',
    },
    {
      icon: <BookOpen size={28} />,
      title: 'Learning Resources',
      description: 'Access curated study materials, project ideas, and skill-building resources shared by alumni.',
      color: 'primary',
    },
    {
      icon: <Target size={28} />,
      title: 'Smart Matching',
      description: 'Our intelligent algorithm recommends the best alumni mentors based on your profile and aspirations.',
      color: 'accent',
    },
    {
      icon: <Globe size={28} />,
      title: 'Events & Webinars',
      description: 'Join virtual and in-person events — guest lectures, career fairs, and alumni meetups.',
      color: 'secondary',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Create Your Profile',
      description: 'Sign up as a student or alumni. Add your skills, interests, and career goals.',
      icon: <GraduationCap size={32} />,
    },
    {
      number: '02',
      title: 'Discover & Connect',
      description: 'Browse alumni profiles, search by skills or company, and send mentorship requests.',
      icon: <Sparkles size={32} />,
    },
    {
      number: '03',
      title: 'Learn & Grow',
      description: 'Get mentored, apply for opportunities, attend events, and accelerate your career.',
      icon: <TrendingUp size={32} />,
    },
  ];

  const stats = [
    { value: '500+', label: 'Alumni Registered' },
    { value: '1,200+', label: 'Students Connected' },
    { value: '150+', label: 'Mentorships Active' },
    { value: '80+', label: 'Opportunities Posted' },
  ];

  return (
    <div className="landing-page">
      {/* ── Server Status Indicator ── */}
      <div className={`server-status server-status--${serverStatus}`}>
        <CheckCircle size={14} />
        <span>
          {serverStatus === 'connected' && 'API Connected'}
          {serverStatus === 'checking' && 'Connecting...'}
          {serverStatus === 'disconnected' && 'API Offline'}
        </span>
      </div>

      {/* ── Hero Section ── */}
      <section className="hero">
        <div className="hero__bg-pattern" aria-hidden="true">
          <div className="hero__circle hero__circle--1"></div>
          <div className="hero__circle hero__circle--2"></div>
          <div className="hero__circle hero__circle--3"></div>
        </div>

        <div className="container hero__content">
          <div className="hero__badge animate-fade-in">
            <Sparkles size={16} />
            <span>Intelligent Student–Alumni Platform</span>
          </div>

          <h1 className="hero__title animate-fade-in">
            <span className="hero__title-main">ANVAYA</span>
            <span className="hero__title-tagline">
              Connect. Learn. <span className="text-accent">Grow Together.</span>
            </span>
          </h1>

          <p className="hero__description animate-fade-in">
            Bridge the gap between students and alumni. Find mentors who've walked 
            your path, discover career opportunities, and build a network that 
            propels your future.
          </p>

          <div className="hero__actions animate-fade-in">
            <Link to="/register" className="btn btn-accent btn-lg">
              Get Started
              <ArrowRight size={20} />
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg hero__login-btn">
              Sign In
              <ChevronRight size={20} />
            </Link>
          </div>

          <div className="hero__trust animate-fade-in">
            <Shield size={16} />
            <span>Trusted by students and alumni across India</span>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Why ANVAYA?</span>
            <h2 className="section-title">Everything You Need to Thrive</h2>
            <p className="section-subtitle">
              A complete platform designed to foster meaningful connections 
              between students and the alumni community.
            </p>
          </div>

          <div className="features__grid stagger-children">
            {features.map((feature, index) => (
              <div className={`feature-card feature-card--${feature.color}`} key={index}>
                <div className={`feature-card__icon feature-card__icon--${feature.color}`}>
                  {feature.icon}
                </div>
                <h3 className="feature-card__title">{feature.title}</h3>
                <p className="feature-card__description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Simple Process</span>
            <h2 className="section-title">How ANVAYA Works</h2>
            <p className="section-subtitle">
              Get started in three easy steps and begin your mentorship journey.
            </p>
          </div>

          <div className="steps stagger-children">
            {steps.map((step, index) => (
              <div className="step-card" key={index}>
                <div className="step-card__number">{step.number}</div>
                <div className="step-card__icon">{step.icon}</div>
                <h3 className="step-card__title">{step.title}</h3>
                <p className="step-card__description">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="stats">
        <div className="container">
          <div className="stats__grid">
            {stats.map((stat, index) => (
              <div className="stat-item" key={index}>
                <span className="stat-item__value">{stat.value}</span>
                <span className="stat-item__label">{stat.label}</span>
              </div>
            ))}
          </div>
          <p className="stats__note">* Demo statistics for illustration</p>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="cta">
        <div className="container">
          <div className="cta__content">
            <Heart size={32} className="cta__icon" />
            <h2 className="cta__title">Ready to Start Your Journey?</h2>
            <p className="cta__description">
              Join ANVAYA today and connect with alumni who can guide you 
              toward your dream career.
            </p>
            <Link to="/register" className="btn btn-accent btn-lg">
              Create Free Account
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="container">
          <div className="footer__content">
            <div className="footer__brand">
              <GraduationCap size={24} />
              <span className="footer__brand-name">ANVAYA</span>
            </div>
            <p className="footer__text">
              Connect. Learn. Grow Together. — An intelligent student–alumni networking platform.
            </p>
            <p className="footer__copyright">
              © {new Date().getFullYear()} ANVAYA. Built as a college minor project.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
