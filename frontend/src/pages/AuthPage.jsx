import { 
  BookOpen, 
  Video, 
  Book, 
  PenTool, 
  GraduationCap, 
  Monitor, 
  Phone, 
  Wrench, 
  Link2,
  CheckCircle,
  Radio
} from 'lucide-react';

export default function AuthPage({
  authMode,
  setAuthMode,
  authForm,
  setAuthForm,
  authLoading,
  authError,
  authSuccess,
  onSubmit
}) {
  return (
    <div className="auth-page">
      {/* Top Navigation Bar */}
      <nav className="top-navbar">
        <div className="nav-wrapper">
          <div className="nav-brand">
            <BookOpen size={24} color="#fff" />
            <span className="brand-text">Student Portal</span>
          </div>
          
          <div className="nav-links">
            <a href="#about" className="nav-link">About</a>
            <a href="#content" className="nav-link">Content</a>
            <a href="#contact" className="nav-link">Contact</a>
          </div>

          <div className="nav-actions">
            <button 
              className="nav-btn register-btn"
              onClick={() => setAuthMode('register')}
            >
              Register Free
            </button>
            <button className="nav-btn arrow-btn">→</button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="auth-main">
        {/* Left Hero Section */}
        <div className="hero-section">
          <div className="hero-content">
            <h1>Future of Learning,</h1>
            <h1 className="highlight">Future of Nepal</h1>
            
            <p className="hero-description">
              Brilliant academic platform with 4,500+ live videos and e-books for SEE and NEB examinations — mapped to Nepal's Curriculum Development Centre syllabus.
            </p>

            <div className="hero-tags">
              <span className="tag"><BookOpen size={14} style={{ marginRight: '6px' }} /> NEB Preparation</span>
              <span className="tag"><CheckCircle size={14} style={{ marginRight: '6px' }} /> NEB Coverage</span>
              <span className="tag"><Video size={14} style={{ marginRight: '6px' }} /> Pre Videos</span>
              <span className="tag"><Radio size={14} style={{ marginRight: '6px' }} /> Live Classes</span>
            </div>

            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number">5,000+</div>
                <div className="stat-label">Hours</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">12,000+</div>
                <div className="stat-label">Questions</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">98%</div>
                <div className="stat-label">Pass Rate</div>
              </div>
            </div>
          </div>

          {/* Wave Design */}
          <div className="wave-container">
            <svg className="wave" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M0,50 Q300,0 600,50 T1200,50 L1200,120 L0,120 Z" fill="rgba(20, 184, 166, 0.3)"></path>
              <path d="M0,60 Q300,20 600,60 T1200,60 L1200,120 L0,120 Z" fill="rgba(20, 184, 166, 0.1)"></path>
            </svg>
          </div>
        </div>

        {/* Right Login Section */}
        <div className="login-section">
          <form className="login-card" onSubmit={onSubmit} autoComplete="off">
            <h2>{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="login-subtitle">
              {authMode === 'login' 
                ? 'Sign in to continue your learning journey' 
                : 'Join our learning community today'}
            </p>

            {authMode === 'register' ? (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={authForm.name}
                    onChange={(event) => setAuthForm((prev) => ({ ...prev, name: event.target.value }))}
                    className="form-input"
                  />
                </div>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '-0.25rem 0 0.5rem', fontStyle: 'italic' }}>
                  Student registration only. Teacher accounts are created by administrators.
                </p>
              </>
            ) : null}



            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                required
                autoComplete="off"
                placeholder="your.email@school.com"
                value={authForm.email}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, email: event.target.value }))}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                placeholder="Enter your password"
                value={authForm.password}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, password: event.target.value }))}
                className="form-input"
              />
            </div>

            {authSuccess ? <p className="form-success" style={{ color: 'green', marginBottom: '1rem' }}>{authSuccess}</p> : null}
            {authError ? <p className="form-error" style={{ color: 'red', marginBottom: '1rem' }}>{authError}</p> : null}

            <button 
              type="submit" 
              className="login-btn" 
              disabled={authLoading}
            >
              {authLoading ? (
                <>
                  <span className="spinner"></span>
                  Please wait...
                </>
              ) : authMode === 'login' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>

            <div className="auth-footer">
              <p>
                {authMode === 'login' 
                  ? "Don't have an account? " 
                  : 'Already have an account? '}
                <button
                  type="button"
                  className="toggle-link"
                  onClick={() => setAuthMode((mode) => (mode === 'login' ? 'register' : 'login'))}
                >
                  {authMode === 'login' ? 'Register' : 'Sign In'}
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Additional Info Sections */}
      <div className="info-sections">
        <section id="about" className="info-section">
          <div className="section-content">
            <h2>About Our Website</h2>
            <p>
              Our Student Portal is Nepal's premier digital learning platform, specifically engineered to support SEE and NEB students. 
              We provide a seamless interface for accessing high-quality academic resources mapped precisely to the 
              Curriculum Development Centre (CDC) syllabus.
            </p>
            <div className="fix-highlights">
              <div className="fix-card">
                <Wrench size={24} color="#2563eb" style={{ flexShrink: 0 }} />
                <div>
                  <h4>Course System Stability</h4>
                  <p>Resolved critical syntax errors in identifying course structures, ensuring 100% platform uptime.</p>
                </div>
              </div>
              <div className="fix-card">
                <Link2 size={24} color="#2563eb" style={{ flexShrink: 0 }} />
                <div>
                  <h4>Database Sync Fix</h4>
                  <p>Fixed synchronization issues between the frontend and backend database to ensure secure student logins.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="content" className="info-section alternate">
          <div className="section-content">
            <h2>What You Can Do</h2>
            <div className="feature-grid">
              <div className="feature-item">
                <Video size={40} color="#2563eb" style={{ display: 'block', margin: '0 auto 1.2rem' }} />
                <h4>4,500+ Video Lessons</h4>
                <p>Learn complex topics through chapter-wise video explanations by Nepal's top educators.</p>
              </div>
              <div className="feature-item">
                <Book size={40} color="#2563eb" style={{ display: 'block', margin: '0 auto 1.2rem' }} />
                <h4>E-Books & Notes</h4>
                <p>Access digitized textbooks and premium PDF notes anytime, anywhere, even offline.</p>
              </div>
              <div className="feature-item">
                <PenTool size={40} color="#2563eb" style={{ display: 'block', margin: '0 auto 1.2rem' }} />
                <h4>Practice & Exams</h4>
                <p>Master your subjects with 12,000+ practice questions and solutions for past year exams.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="info-section">
          <div className="section-content">
            <h2>Contact Us</h2>
            <div className="contact-grid">
              <div className="contact-card">
                <div className="contact-card-header">
                  <GraduationCap size={24} color="#2563eb" />
                  <h3>Academic Support</h3>
                </div>
                <p>For questions about courses, syllabus, or academic materials.</p>
                <span className="contact-info">academic@studentportal.com.np</span>
              </div>

              <div className="contact-card">
                <div className="contact-card-header">
                  <Monitor size={24} color="#2563eb" />
                  <h3>Technical Help</h3>
                </div>
                <p>For login issues, account management, or platform bugs.</p>
                <span className="contact-info">tech-support@studentportal.com.np</span>
              </div>

              <div className="contact-card">
                <div className="contact-card-header">
                  <Phone size={24} color="#2563eb" />
                  <h3>General Inquiry</h3>
                </div>
                <p>For partnerships, advertisements, or other general questions.</p>
                <span className="contact-info">+977-1-4XXXXXX</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
