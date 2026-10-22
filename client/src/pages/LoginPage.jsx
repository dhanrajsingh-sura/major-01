import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

/**
 * LoginPage — Authenticates a user with email and password.
 *
 * FLOW (viva answer):
 * 1. User fills in email and password
 * 2. Frontend validates inputs are not empty
 * 3. We call auth.login() from AuthContext
 * 4. AuthContext sends POST /api/auth/login to Express
 * 5. Server validates, checks password hash with bcrypt
 * 6. If valid, server returns JWT + user data
 * 7. AuthContext stores the JWT in localStorage and sets the user state
 * 8. We redirect to the dashboard
 * 9. If invalid, server returns an error message and we display it
 */

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, error: authError, clearError } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // ── Handle input changes ──
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (authError) clearError();
  };

  // ── Client-side validation ──
  const validate = () => {
    const errors = {};
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Handle form submission ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const result = await login(formData.email, formData.password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    }
    // If login failed, authError is set by AuthContext and displayed below
  };

  return (
    <div className="auth-page">
      {/* Left panel — branding */}
      <div className="auth-page__brand">
        <div className="auth-page__brand-content">
          <Link to="/" className="auth-page__logo">
            <GraduationCap size={36} />
            <span>ANVAYA</span>
          </Link>
          <h1 className="auth-page__brand-title">Welcome Back</h1>
          <p className="auth-page__brand-text">
            Sign in to continue your journey of growth, mentorship, and 
            meaningful connections with your alumni community.
          </p>
          <div className="auth-page__brand-pattern" aria-hidden="true">
            <div className="auth-page__circle auth-page__circle--1"></div>
            <div className="auth-page__circle auth-page__circle--2"></div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="auth-page__form-panel">
        <div className="auth-page__form-container">
          <div className="auth-page__form-header">
            <h2 className="auth-page__form-title">Sign In</h2>
            <p className="auth-page__form-subtitle">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Server error display */}
          {authError && (
            <div className="auth-alert auth-alert--error" role="alert">
              <AlertCircle size={18} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {/* Email */}
            <div className="form-group">
              <label htmlFor="login-email" className="form-label">
                Email Address
              </label>
              <div className="form-input-wrapper">
                <Mail size={18} className="form-input-icon" />
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  className={`form-input form-input--icon ${
                    formErrors.email ? 'form-input--error' : ''
                  }`}
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
              {formErrors.email && (
                <span className="form-error">{formErrors.email}</span>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="login-password" className="form-label">
                Password
              </label>
              <div className="form-input-wrapper">
                <Lock size={18} className="form-input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className={`form-input form-input--icon ${
                    formErrors.password ? 'form-input--error' : ''
                  }`}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="form-input-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {formErrors.password && (
                <span className="form-error">{formErrors.password}</span>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-lg auth-form__submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Footer link */}
          <p className="auth-page__footer-text">
            Don't have an account?{' '}
            <Link to="/register" className="auth-page__footer-link">
              Create one here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
