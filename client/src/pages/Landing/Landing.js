import React, { useRef } from 'react';
import './Landing.css';
import { FaSearch, FaBars, FaTimes, FaGithub, FaLinkedin, FaRocket, FaShieldAlt, FaUsers, FaCheckCircle } from 'react-icons/fa';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

// ============================================
// TEAM MEMBER CONFIGURATION
// ============================================
// Update these with your team member information
const TEAM_MEMBERS = [
  {
    name: 'Your Name',
    role: 'Developer',
    image: require('../../assets/images/default-user-image.png'), // Update with your image path
    github: 'https://github.com/yourusername',
    linkedin: 'https://www.linkedin.com/in/yourprofile'
  },
  {
    name: 'Teammate Name',
    role: 'Developer',
    image: require('../../assets/images/default-user-image.png'), // Update with your image path
    github: 'https://github.com/teammateusername',
    linkedin: 'https://www.linkedin.com/in/teammateprofile'
  }
];

// ============================================
// PROJECT INFORMATION
// ============================================
const PROJECT_INFO = {
  name: 'FreelanceConnect',
  tagline: 'Connecting Talent with Opportunity',
  description: 'An innovative platform designed to revolutionize the world of freelancing. Connect talented freelancers with businesses seeking their expertise.',
  developerNames: 'Your Name & Teammate Name' // Update this
};

function Landing() {
  const navRef = useRef();

  const showNavbar = () => {
    navRef.current.classList.toggle("responsive_nav");
  };

  return (
    <div className="landing-page__wrapper">
      {/* Hero Section */}
      <section className="hero-section">
        <header className="main-header">
          <h3 className="logo">{PROJECT_INFO.name}</h3>
          <nav ref={navRef} className="main-nav">
            <a href="#features">Features</a>
            <a href="#about">About</a>
            <a href="#team">Team</a>
            <button
              className="nav-btn nav-close-btn"
              onClick={showNavbar}
              aria-label="Close menu"
            >
              <FaTimes />
            </button>
          </nav>
          <button
            className="nav-btn"
            onClick={showNavbar}
            aria-label="Open menu"
          >
            <FaBars />
          </button>
          <div className="auth-buttons">
            <a href="/login" className="btn-login">Login</a>
            <a href="/signup" className="btn-signup">Get Started</a>
          </div>
        </header>

        <div className="hero-content">
          <h1 className="hero-title">{PROJECT_INFO.tagline}</h1>
          <p className="hero-subtitle">Find the best freelance services for your business or showcase your talent</p>
          <div className="search-container">
            <input 
              type="text" 
              placeholder="Search for any service..." 
              className="search-input"
            />
            <FaSearch className="search-icon" />
          </div>
        </div>
        
        <div className="hero-wave">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z" fill="#ffffff"></path>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose {PROJECT_INFO.name}?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <FaRocket />
              </div>
              <h3>Fast & Efficient</h3>
              <p>Connect with freelancers and clients quickly. Get your projects done faster with our streamlined platform.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FaShieldAlt />
              </div>
              <h3>Secure Platform</h3>
              <p>Your data and transactions are protected with enterprise-grade security measures.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FaUsers />
              </div>
              <h3>Trusted Community</h3>
              <p>Join thousands of verified freelancers and clients building success together.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="container">
          <div className="about-content">
            <div className="about-text">
              <h2 className="section-title">About {PROJECT_INFO.name}</h2>
              <p className="about-description">
                {PROJECT_INFO.description}
              </p>
              <div className="about-highlights">
                <div className="highlight-item">
                  <FaCheckCircle className="check-icon" />
                  <span>Easy to use interface</span>
                </div>
                <div className="highlight-item">
                  <FaCheckCircle className="check-icon" />
                  <span>Secure payment system</span>
                </div>
                <div className="highlight-item">
                  <FaCheckCircle className="check-icon" />
                  <span>24/7 customer support</span>
                </div>
              </div>
              <a href="/signup" className="btn-primary">Get Started Today</a>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="team-section">
        <div className="container">
          <h2 className="section-title">Meet The Team</h2>
          <p className="section-subtitle">Built by {PROJECT_INFO.developerNames}</p>
          <div className="team-grid">
            {TEAM_MEMBERS.map((member, index) => (
              <div key={index} className="team-card">
                <div className="team-image-wrapper">
                  <LazyLoadImage
                    src={member.image}
                    alt={member.name}
                    className="team-image"
                    effect="blur"
                  />
                </div>
                <h3 className="team-name">{member.name}</h3>
                <p className="team-role">{member.role}</p>
                <div className="team-social">
                  <a 
                    href={member.github} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="social-link"
                    aria-label={`${member.name}'s GitHub`}
                  >
                    <FaGithub />
                  </a>
                  <a 
                    href={member.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="social-link"
                    aria-label={`${member.name}'s LinkedIn`}
                  >
                    <FaLinkedin />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="main-footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} {PROJECT_INFO.name}. All rights reserved.</p>
          <p className="footer-credits">Developed by {PROJECT_INFO.developerNames}</p>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
