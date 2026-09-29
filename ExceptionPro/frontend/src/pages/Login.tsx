import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Login: React.FC = () => {
  const { login, socialLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError('Please fill in all credentials fields.');
      return;
    }

    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token, email: userEmail, role, accountType, profileComplete } = response.data;
      
      login(token, userEmail, role, accountType, profileComplete);
      
      if (profileComplete) {
        navigate(role === 'ROLE_ADMIN' ? '/admin' : '/feed');
      } else {
        navigate('/profile-completion');
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Connection failed. Please check backend server.');
      }
    }
  };

  const handleSocialSignIn = async (provider: 'Google') => {
    setError(null);
    // Mocking standard social emails for testing purposes
    const mockEmail = 'googleuser@gmail.com';
    try {
      const isComplete = await socialLogin(mockEmail);
      if (isComplete) {
        navigate('/profile');
      } else {
        navigate('/profile-completion');
      }
    } catch (err: any) {
      setError(`Failed to authenticate with ${provider}.`);
    }
  };

  const handleCancel = () => {
    setEmail('');
    setPassword('');
    setError(null);
    setSuccess(null);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    if (!forgotEmail) {
      setForgotError('Please enter your email address.');
      return;
    }

    try {
      const response = await api.post(`/api/auth/forgot-password`, { email: forgotEmail });
      setForgotSuccess(response.data.message || 'Temporary password sent to your email successfully.');
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Action failed. Verify connectivity.';
      setForgotError(errMsg);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-left-section">
        <h1 className="login-slogan">
          Find Buyers. Meet Suppliers. Connect. Collaborate and Grow Business.
        </h1>
        <div className="login-image-container">
          <img src="/b2b-showcase.png" alt="B2B Collaboration Showcase" className="login-showcase-image" />
        </div>
      </div>

      <div className="login-right-section">
        <div className="glass-card glass-card-sm">
          <h2 className="card-title">Sign In</h2>
          <p className="card-subtitle">Enter your credentials to access ExceptionPro</p>

          {error && <div className="alert-error">{error}</div>}
          {success && <div className="alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address or Username</label>
              <input
                type="text"
                className="form-input"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="submit" className="btn-primary" style={{ flex: 1, marginTop: 0 }}>Sign In</button>
              <button type="button" className="btn-secondary" onClick={handleCancel} style={{ flex: 1, marginTop: 0 }}>Cancel</button>
            </div>
          </form>

          <span className="helper-link" onClick={() => setShowForgotModal(true)}>
            Forgotten Password?
          </span>

          <div className="separator">or</div>

          <div className="social-buttons-container">
            <button className="btn-social btn-google" onClick={() => handleSocialSignIn('Google')}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.91c1.7-1.56 2.69-3.86 2.69-6.62z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.8.54-1.83.86-3.05.86-2.34 0-4.32-1.58-5.03-3.7H.95v2.33A9 9 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.97 10.76a5.4 5.4 0 0 1 0-3.52V4.91H.95a9 9 0 0 0 0 8.18l3.02-2.33z" fill="#FBBC05"/>
                <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.4A9 9 0 0 0 .95 4.91l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Sign In With Google
            </button>
          </div>

          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '1.5rem', textAlign: 'center' }}>
            Don't have an account? <Link to="/register" className="helper-link" style={{ display: 'inline', marginTop: 0 }}>Create New Account</Link>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-btn" onClick={() => { setShowForgotModal(false); setForgotSuccess(null); setForgotError(null); }}>&times;</button>
            <h3 className="card-title" style={{ fontSize: '1.5rem' }}>Password Recovery</h3>
            <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>Enter your registered email to request a reset link.</p>

            {forgotError && <div className="alert-error">{forgotError}</div>}
            {forgotSuccess && <div className="alert-success">{forgotSuccess}</div>}

            <form onSubmit={handleForgotSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@company.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-primary">Send Reset Link</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
