import { useState, useEffect } from 'react';
import {
  GraduationCap,
  Briefcase,
  BookOpen,
  Target,
  Edit3,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Code2,
  Sparkles,
  ExternalLink,
  MapPin,
  Calendar,
  Building,
} from 'lucide-react';
import AppNavbar from '../components/AppNavbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './StudentProfilePage.css';

/**
 * StudentProfilePage — View and Edit student/alumni profile.
 *
 * HOW THIS WORKS (viva explanation):
 * 1. Fetches current profile via GET /api/profile/me (authenticated with JWT).
 * 2. If student: manages branch, academicYear, skills, interests, bio, careerGoals.
 * 3. If alumni: manages company, designation, experience, skills, expertise, bio.
 * 4. Updates profile via PUT /api/profile/me with optimistic UI feedback.
 */
const StudentProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error', message: '' }

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    branch: '',
    academicYear: '1st Year',
    skills: '',
    interests: '',
    bio: '',
    careerGoals: '',
    githubUrl: '',
    linkedinUrl: '',
    portfolioUrl: '',
    // Alumni specific fields
    company: '',
    designation: '',
    graduationYear: 2024,
    experience: 1,
    expertise: '',
    location: '',
  });

  // Fetch profile on component mount
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/profile/me');
      if (res.data.success) {
        const p = res.data.data.profile || {};
        const u = res.data.data.user || user;
        setProfile(p);

        setFormData({
          name: u.name || '',
          branch: p.branch || '',
          academicYear: p.academicYear || '1st Year',
          skills: Array.isArray(p.skills) ? p.skills.join(', ') : '',
          interests: Array.isArray(p.interests) ? p.interests.join(', ') : '',
          bio: p.bio || '',
          careerGoals: p.careerGoals || '',
          githubUrl: p.githubUrl || '',
          linkedinUrl: p.linkedinUrl || '',
          portfolioUrl: p.portfolioUrl || '',
          company: p.company || '',
          designation: p.designation || '',
          graduationYear: p.graduationYear || 2024,
          experience: p.experience || 1,
          expertise: Array.isArray(p.expertise) ? p.expertise.join(', ') : '',
          location: p.location || '',
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setAlert({
        type: 'error',
        message: 'Could not load profile. Please refresh or try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setAlert(null);

    try {
      const res = await api.put('/profile/me', formData);
      if (res.data.success) {
        setProfile(res.data.data.profile);
        setIsEditing(false);
        setAlert({
          type: 'success',
          message: 'Profile updated successfully!',
        });
        setTimeout(() => setAlert(null), 4000);
      }
    } catch (err) {
      const message =
        err.response?.data?.message || 'Failed to update profile. Please try again.';
      setAlert({ type: 'error', message });
    } finally {
      setSaving(false);
    }
  };

  const isAlumni = user?.role === 'alumni';
  const initials = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  if (loading) {
    return (
      <div className="profile-page">
        <AppNavbar />
        <div className="profile-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <Loader2 size={36} className="spinner" style={{ color: '#1D4ED8', margin: '0 auto 1rem' }} />
          <p style={{ color: '#64748B', fontWeight: 500 }}>Loading profile details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <AppNavbar />

      <main className="profile-container">
        {/* ── Status Alert ── */}
        {alert && (
          <div className={`profile-alert profile-alert--${alert.type}`} role="alert">
            {alert.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{alert.message}</span>
          </div>
        )}

        {/* ── Header Card ── */}
        <section className="profile-header-card">
          <div className="profile-header-card__left">
            <div className="profile-avatar-large">{initials}</div>
            <div className="profile-header-info">
              <h1 className="profile-header-name">{user?.name}</h1>
              <div className="profile-header-meta">
                <span
                  className={`profile-header-badge profile-header-badge--${
                    isAlumni ? 'alumni' : 'student'
                  }`}
                >
                  {isAlumni ? 'Alumni Mentor' : 'Student'}
                </span>
                <span>•</span>
                <span>{user?.email}</span>
                {profile?.branch && (
                  <>
                    <span>•</span>
                    <span>{profile.branch}</span>
                  </>
                )}
                {profile?.academicYear && !isAlumni && (
                  <>
                    <span>•</span>
                    <span>{profile.academicYear}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            className={`btn ${isEditing ? 'btn-secondary' : 'btn-primary'} btn-toggle-edit`}
            onClick={() => {
              setIsEditing(!isEditing);
              setAlert(null);
            }}
          >
            {isEditing ? (
              <>
                <X size={18} />
                <span>Cancel Editing</span>
              </>
            ) : (
              <>
                <Edit3 size={18} />
                <span>Edit Profile</span>
              </>
            )}
          </button>
        </section>

        {/* ── Profile Content: View Mode vs Edit Mode ── */}
        {isEditing ? (
          /* ======================================================
             EDIT MODE FORM
             ====================================================== */
          <form onSubmit={handleSave} className="profile-edit-form">
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '1.5rem', color: '#0F172A' }}>
              Edit Your Profile Information
            </h2>

            {/* Row 1: Full Name */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" htmlFor="edit-name">Full Name</label>
              <input
                id="edit-name"
                type="text"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={saving}
              />
            </div>

            {/* Student Specific Fields */}
            {!isAlumni && (
              <>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-branch">Academic Branch / Major</label>
                    <input
                      id="edit-branch"
                      type="text"
                      name="branch"
                      className="form-input"
                      placeholder="e.g. Computer Science and Engineering"
                      value={formData.branch}
                      onChange={handleChange}
                      disabled={saving}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-year">Current Academic Year</label>
                    <select
                      id="edit-year"
                      name="academicYear"
                      className="form-input"
                      value={formData.academicYear}
                      onChange={handleChange}
                      disabled={saving}
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="Postgraduate">Postgraduate</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" htmlFor="edit-skills">
                    Technical Skills (comma-separated)
                  </label>
                  <input
                    id="edit-skills"
                    type="text"
                    name="skills"
                    className="form-input"
                    placeholder="e.g. React, Node.js, Python, MongoDB, DSA, Git"
                    value={formData.skills}
                    onChange={handleChange}
                    disabled={saving}
                  />
                  <span className="form-input-help">
                    Separate multiple skills with commas. They will automatically render as tags.
                  </span>
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" htmlFor="edit-interests">
                    Areas of Interest & Learning Goals (comma-separated)
                  </label>
                  <input
                    id="edit-interests"
                    type="text"
                    name="interests"
                    className="form-input"
                    placeholder="e.g. Cloud Computing, Artificial Intelligence, Open Source, System Design"
                    value={formData.interests}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" htmlFor="edit-bio">About Me / Bio</label>
                  <textarea
                    id="edit-bio"
                    name="bio"
                    rows={4}
                    className="form-input"
                    placeholder="Brief background about yourself, campus involvement, and what you are currently building..."
                    value={formData.bio}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" htmlFor="edit-goals">Career Aspirations & Target Roles</label>
                  <textarea
                    id="edit-goals"
                    name="careerGoals"
                    rows={3}
                    className="form-input"
                    placeholder="e.g. Seeking Summer 2027 SDE Internships; interested in distributed backend systems and fintech."
                    value={formData.careerGoals}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-github">GitHub Profile URL</label>
                    <input
                      id="edit-github"
                      type="url"
                      name="githubUrl"
                      className="form-input"
                      placeholder="https://github.com/username"
                      value={formData.githubUrl}
                      onChange={handleChange}
                      disabled={saving}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-linkedin">LinkedIn Profile URL</label>
                    <input
                      id="edit-linkedin"
                      type="url"
                      name="linkedinUrl"
                      className="form-input"
                      placeholder="https://linkedin.com/in/username"
                      value={formData.linkedinUrl}
                      onChange={handleChange}
                      disabled={saving}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Alumni Specific Fields */}
            {isAlumni && (
              <>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-company">Current Company</label>
                    <input
                      id="edit-company"
                      type="text"
                      name="company"
                      className="form-input"
                      placeholder="e.g. Google India"
                      value={formData.company}
                      onChange={handleChange}
                      disabled={saving}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-designation">Designation / Role</label>
                    <input
                      id="edit-designation"
                      type="text"
                      name="designation"
                      className="form-input"
                      placeholder="e.g. Senior Software Engineer"
                      value={formData.designation}
                      onChange={handleChange}
                      disabled={saving}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-grad-year">Graduation Year</label>
                    <input
                      id="edit-grad-year"
                      type="number"
                      name="graduationYear"
                      className="form-input"
                      value={formData.graduationYear}
                      onChange={handleChange}
                      disabled={saving}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-exp">Years of Experience</label>
                    <input
                      id="edit-exp"
                      type="number"
                      name="experience"
                      className="form-input"
                      value={formData.experience}
                      onChange={handleChange}
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" htmlFor="edit-skills">Technical Skills (comma-separated)</label>
                  <input
                    id="edit-skills"
                    type="text"
                    name="skills"
                    className="form-input"
                    value={formData.skills}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" htmlFor="edit-expertise">Mentorship Expertise Areas</label>
                  <input
                    id="edit-expertise"
                    type="text"
                    name="expertise"
                    className="form-input"
                    placeholder="e.g. System Design, Resume Review, Mock Interviews"
                    value={formData.expertise}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" htmlFor="edit-bio">Bio & Background</label>
                  <textarea
                    id="edit-bio"
                    name="bio"
                    rows={4}
                    className="form-input"
                    value={formData.bio}
                    onChange={handleChange}
                    disabled={saving}
                  />
                </div>
              </>
            )}

            {/* Form Actions */}
            <div className="profile-form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsEditing(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="spinner" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Save Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* ======================================================
             VIEW MODE
             ====================================================== */
          <div className="profile-grid">
            {/* Card 1: Bio */}
            <div className="profile-card profile-card--full">
              <div className="profile-card__header">
                <Sparkles size={20} className="profile-card__icon" />
                <h2 className="profile-card__title">About Me</h2>
              </div>
              <p className="profile-card__content">
                {profile?.bio || (
                  <span className="profile-card__empty-text">
                    No bio added yet. Click "Edit Profile" above to share a short summary about yourself.
                  </span>
                )}
              </p>
            </div>

            {/* Card 2: Academic / Industry Info */}
            <div className="profile-card">
              <div className="profile-card__header">
                {isAlumni ? <Building size={20} className="profile-card__icon" /> : <GraduationCap size={20} className="profile-card__icon" />}
                <h2 className="profile-card__title">
                  {isAlumni ? 'Professional Experience' : 'Academic Details'}
                </h2>
              </div>
              <div className="profile-card__content">
                {isAlumni ? (
                  <>
                    <div className="profile-info-row">
                      <span className="profile-info-label">Company</span>
                      <span className="profile-info-value">{profile?.company || 'Not specified'}</span>
                    </div>
                    <div className="profile-info-row">
                      <span className="profile-info-label">Designation</span>
                      <span className="profile-info-value">{profile?.designation || 'Not specified'}</span>
                    </div>
                    <div className="profile-info-row">
                      <span className="profile-info-label">Graduation Year</span>
                      <span className="profile-info-value">{profile?.graduationYear || '—'}</span>
                    </div>
                    <div className="profile-info-row">
                      <span className="profile-info-label">Experience</span>
                      <span className="profile-info-value">{profile?.experience ? `${profile.experience} years` : '1+ year'}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="profile-info-row">
                      <span className="profile-info-label">Department / Branch</span>
                      <span className="profile-info-value">{profile?.branch || 'Not specified'}</span>
                    </div>
                    <div className="profile-info-row">
                      <span className="profile-info-label">Academic Year</span>
                      <span className="profile-info-value">{profile?.academicYear || '1st Year'}</span>
                    </div>
                    <div className="profile-info-row">
                      <span className="profile-info-label">Account Status</span>
                      <span className="profile-info-value" style={{ color: '#16A34A' }}>Verified Active</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Card 3: Skills */}
            <div className="profile-card">
              <div className="profile-card__header">
                <Code2 size={20} className="profile-card__icon" />
                <h2 className="profile-card__title">Technical Skills</h2>
              </div>
              <div className="profile-card__content">
                {profile?.skills && profile.skills.length > 0 ? (
                  <div className="tag-container">
                    {profile.skills.map((skill, index) => (
                      <span key={index} className="tag-chip">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="profile-card__empty-text">
                    No skills listed. Click "Edit Profile" to add technical skills like React, Python, Java, etc.
                  </p>
                )}
              </div>
            </div>

            {/* Card 4: Interests or Expertise */}
            <div className="profile-card">
              <div className="profile-card__header">
                <BookOpen size={20} className="profile-card__icon" />
                <h2 className="profile-card__title">
                  {isAlumni ? 'Mentorship Expertise' : 'Interests & Focus Areas'}
                </h2>
              </div>
              <div className="profile-card__content">
                {isAlumni ? (
                  profile?.expertise && profile.expertise.length > 0 ? (
                    <div className="tag-container">
                      {profile.expertise.map((exp, idx) => (
                        <span key={idx} className="tag-chip tag-chip--interest">
                          {exp}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="profile-card__empty-text">No mentorship areas specified yet.</p>
                  )
                ) : profile?.interests && profile.interests.length > 0 ? (
                  <div className="tag-container">
                    {profile.interests.map((interest, idx) => (
                      <span key={idx} className="tag-chip tag-chip--interest">
                        {interest}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="profile-card__empty-text">
                    No interests specified yet. Add domains like Web Dev, AI, Cloud, etc.
                  </p>
                )}
              </div>
            </div>

            {/* Card 5: Career Aspirations */}
            {!isAlumni && (
              <div className="profile-card">
                <div className="profile-card__header">
                  <Target size={20} className="profile-card__icon" />
                  <h2 className="profile-card__title">Career Aspirations</h2>
                </div>
                <div className="profile-card__content">
                  <p>
                    {profile?.careerGoals || (
                      <span className="profile-card__empty-text">
                        Specify target roles, desired industries, and internship goals.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Card 6: Links */}
            {(profile?.githubUrl || profile?.linkedinUrl || profile?.portfolioUrl) && (
              <div className="profile-card profile-card--full">
                <div className="profile-card__header">
                  <ExternalLink size={20} className="profile-card__icon" />
                  <h2 className="profile-card__title">Links & Portfolio</h2>
                </div>
                <div className="profile-links-row">
                  {profile.githubUrl && (
                    <a
                      href={profile.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="profile-link-btn"
                    >
                      <Code2 size={16} />
                      <span>GitHub</span>
                    </a>
                  )}
                  {profile.linkedinUrl && (
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="profile-link-btn"
                    >
                      <Briefcase size={16} />
                      <span>LinkedIn</span>
                    </a>
                  )}
                  {profile.portfolioUrl && (
                    <a
                      href={profile.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="profile-link-btn"
                    >
                      <ExternalLink size={16} />
                      <span>Portfolio</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentProfilePage;
