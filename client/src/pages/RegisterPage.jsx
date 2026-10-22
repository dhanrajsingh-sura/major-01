import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  Briefcase,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

/**
 * RegisterPage — Handles new user onboarding (Student or Alumni).
 *
 * FLOW & ARCHITECTURE (viva answer):
 * 1. Collects: Name, Email, Password, Confirm Password, and Role ('student' | 'alumni').
 * 2. Client-side validation:
 *    - Validates email syntax using regex
 *    - Enforces minimum 6-character password length
 *    - Confirms that password and confirmPassword match exactly
 * 3. Calls register() from AuthContext:
 *    - Sends POST /api/auth/register payload to Express backend
 * 4. Express backend:
 *    - Validates fields with express-validator
 *    - Checks if email is already taken
 *    - Hashes password using bcrypt (salt rounds = 10)
 *    - Creates User document in MongoDB Atlas
 *    - Generates signed JWT token
 * 5. Frontend receives JWT token + sanitized user object:
 *    - Token stored in localStorage
 *    - Global state updated via AuthContext
 *    - User seamlessly redirected to /dashboard
 */

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, error: authError, clearError } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student', // Default role
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // ── Handle input change ──
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear individual field error on change
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (authError) clearError();
  };

  // ── Handle role selection ──
  const handleRoleSelect = (selectedRole) => {
    setFormData((prev) => ({ ...prev, role: selectedRole }));
  };

  // ── Client-side validation ──
  const validate = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Form submission ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const result = await register(
      formData.name.trim(),
      formData.email.trim().toLowerCase(),
      formData.password,
      formData.role
    );
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="auth-page">
      {/* Left panel — branding & perks */}
      <div className="auth-page__brand">
        <div className="auth-page__brand-content">
          <Link to="/" className="auth-page__logo">
            <GraduationCap size={36} />
            <span>ANVAYA</span>
          </Link>
          <h1 className="auth-page__brand-title">Join ANVAYA</h1>
          <p className="auth-page__brand-text">
            Start your journey today. Unlock direct access to verified alumni mentors,
            exclusive internship listings, and career development programs.
          </p>

          <div className="auth-page__perks">
            <div className="auth-page__perk-item">
              <span className="auth-page__perk-icon">
                <CheckCircle2 size={16} />
              </span>
              <span>1-on-1 Personalized Alumni Mentorship</span>
            </div>
            <div className="auth-page__perk-item">
              <span className="auth-page__perk-icon">
                <CheckCircle2 size={16} />
              </span>
              <span>Exclusive Campus & Industry Job Referrals</span>
            </div>
            <div className="auth-page__perk-item">
              <span className="auth-page__perk-icon">
                <CheckCircle2 size={16} />
              </span>
              <span>Direct Peer & Senior Networking Channels</span>
            </div>
          </div>

          <div className="auth-page__brand-pattern" aria-hidden="true">
            <div className="auth-page__circle auth-page__circle--1"></div>
            <div className="auth-page__circle auth-page__circle--2"></div>
          </div>
        </div>
      </div>

      {/* Right panel — register form */}
      <div className="auth-page__form-panel">
        <div className="auth-page__form-container">
          <div className="auth-page__form-header">
            <Link to="/" className="auth-page__mobile-logo">
              <GraduationCap size={28} />
              <span>ANVAYA</span>
            </Link>
            <h2 className="auth-page__form-title">Create Account</h2>
            <p className="auth-page__form-subtitle">
              Join the student and alumni network in less than a minute
            </p>
          </div>

          {/* Server error alert banner */}
          {authError && (
            <div className="auth-alert auth-alert--error" role="alert">
              <AlertCircle size={18} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {/* Account Role Selector */}
            <div className="form-group">
              <label className="form-label">I am joining as a:</label>
              <div className="role-selector">
                <button
                  type="button"
                  className={`role-card ${
                    formData.role === 'student' ? 'role-card--active' : ''
                  }`}
                  onClick={() => handleRoleSelect('student')}
                >
                  <div className="role-card__icon">
                    <GraduationCap size={22} />
                  </div>
                  <span className="role-card__title">Student</span>
                  <span className="role-card__desc">Seeking guidance & jobs</span>
                </button>

                <button
                  type="button"
                  className={`role-card ${
                    formData.role === 'alumni' ? 'role-card--active' : ''
                  }`}
                  onClick={() => handleRoleSelect('alumni')}
                >
                  <div className="role-card__icon">
                    <Briefcase size={22} />
                  </div>
                  <span className="role-card__title">Alumni</span>
                  <span className="role-card__desc">Mentoring & hiring</span>
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="reg-name" className="form-label">
                Full Name
              </label>
              <div className="form-input-wrapper">
                <User size={18} className="form-input-icon" />
                <input
                  id="reg-name"
                  type="text"
                  name="name"
                  className={`form-input form-input--icon ${
                    formErrors.name ? 'form-input--error' : ''
                  }`}
                  placeholder="e.g. Aarav Sharma"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="name"
                  disabled={loading}
                />
              </div>
              {formErrors.name && (
                <span className="form-error">{formErrors.name}</span>
              )}
            </div>

            {/* Email Address */}
            <div className="form-group">
              <label htmlFor="reg-email" className="form-label">
                College / Personal Email
              </label>
              <div className="form-input-wrapper">
                <Mail size={18} className="form-input-icon" />
                <input
                  id="reg-email"
                  type="email"
                  name="email"
                  className={`form-input form-input--icon ${
                    formErrors.email ? 'form-input--error' : ''
                  }`}
                  placeholder="aarav@college.edu or name@gmail.com"
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
              <label htmlFor="reg-password" className="form-label">
                Password
              </label>
              <div className="form-input-wrapper">
                <Lock size={18} className="form-input-icon" />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className={`form-input form-input--icon ${
                    formErrors.password ? 'form-input--error' : ''
                  }`}
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
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

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="reg-confirm-password" className="form-label">
                Confirm Password
              </label>
              <div className="form-input-wrapper">
                <Lock size={18} className="form-input-icon" />
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  className={`form-input form-input--icon ${
                    formErrors.confirmPassword ? 'form-input--error' : ''
                  }`}
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="form-input-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={
                    showConfirmPassword ? 'Hide password' : 'Show password'
                  }
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <span className="form-error">{formErrors.confirmPassword}</span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary btn-lg auth-form__submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="spinner" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserCheck size={20} />
                  Register as {formData.role === 'student' ? 'Student' : 'Alumni'}
                </>
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <p className="auth-page__footer-text">
            Already have an account?{' '}
            <Link to="/login" className="auth-page__footer-link">
              Sign in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
