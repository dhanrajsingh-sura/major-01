import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Users,
  Building,
  GraduationCap,
  MapPin,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  MessageSquare,
  CheckCircle2,
  X,
  Loader2,
  Briefcase,
  Send,
  Database,
} from 'lucide-react';
import AppNavbar from '../components/AppNavbar';
import api from '../services/api';
import './AlumniDirectoryPage.css';

/**
 * AlumniDirectoryPage — Discover, search, and connect with verified alumni.
 *
 * HOW THIS WORKS (viva explanation):
 * 1. Queries Express endpoint GET /api/profile/alumni with search, filter, and page params.
 * 2. MongoDB filters via Mongoose regex and text indexes, populating user details.
 * 3. Never exposes password hashes or private JWT secrets.
 * 4. Includes interactive mentorship request modal and safe demo seeder trigger.
 */
const AlumniDirectoryPage = () => {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Available filters from backend
  const [filterOptions, setFilterOptions] = useState({
    companies: [],
    skills: [],
    graduationYears: [],
  });

  // Current active filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // Mentorship Modal state
  const [selectedAlumni, setSelectedAlumni] = useState(null);
  const [requestTopic, setRequestTopic] = useState('Career Guidance & Placement Prep');
  const [requestMessage, setRequestMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState(null);
  const [requestSent, setRequestSent] = useState(false);
  const [seedingLoading, setSeedingLoading] = useState(false);

  // Fetch alumni from API
  const fetchAlumni = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 9);

      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (selectedCompany) params.append('company', selectedCompany);
      if (selectedSkill) params.append('skill', selectedSkill);
      if (selectedYear) params.append('graduationYear', selectedYear);

      const res = await api.get(`/profile/alumni?${params.toString()}`);
      if (res.data.success) {
        setAlumni(res.data.data);
        setTotalPages(res.data.totalPages);
        setTotalCount(res.data.total);

        // Update available filter chips if provided
        if (res.data.filters) {
          setFilterOptions({
            companies: res.data.filters.companies || [],
            skills: res.data.filters.skills || [],
            graduationYears: res.data.filters.graduationYears || [],
          });
        }
      }
    } catch (err) {
      console.error('Error fetching alumni directory:', err);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, selectedCompany, selectedSkill, selectedYear]);

  useEffect(() => {
    fetchAlumni();
  }, [fetchAlumni]);

  // Reset all filters to default
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCompany('');
    setSelectedSkill('');
    setSelectedYear('');
    setPage(1);
  };

  // Safe Seeder button for examiners / viva demonstrations
  const handleSeedDemoAlumni = async () => {
    try {
      setSeedingLoading(true);
      const res = await api.post('/profile/seed-alumni?force=true');
      if (res.data.success) {
        handleResetFilters();
        await fetchAlumni();
      }
    } catch (err) {
      console.error('Error seeding demo alumni:', err);
    } finally {
      setSeedingLoading(false);
    }
  };

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedCompany !== '' ||
    selectedSkill !== '' ||
    selectedYear !== '';

  return (
    <div className="alumni-page">
      <AppNavbar />

      <main className="alumni-container">
        {/* ── Header ── */}
        <header className="alumni-header">
          <div className="alumni-header__tag">
            <Sparkles size={14} />
            <span>Alumni Mentorship Network</span>
          </div>
          <h1 className="alumni-header__title">Discover Alumni Mentors</h1>
          <p className="alumni-header__subtitle">
            Connect with verified graduates from top tech firms, startups, and
            research institutes. Get personalized 1-on-1 mentorship, resume
            reviews, and placement guidance.
          </p>
        </header>

        {/* ── Search & Filter Controls ── */}
        <section className="alumni-filters-card">
          <div className="alumni-search-row">
            <div className="alumni-search-input-wrapper">
              <Search size={18} className="alumni-search-icon" />
              <input
                type="text"
                className="alumni-search-input"
                placeholder="Search by mentor name, company, role, or technical skill..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                className="btn-reset-filters"
                onClick={handleResetFilters}
                title="Reset all search filters"
              >
                <RotateCcw size={15} />
                <span>Reset</span>
              </button>
            )}
          </div>

          <div className="alumni-filter-selects">
            {/* Filter: Company */}
            <select
              className="alumni-select"
              value={selectedCompany}
              onChange={(e) => {
                setSelectedCompany(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Companies</option>
              {filterOptions.companies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Filter: Skill */}
            <select
              className="alumni-select"
              value={selectedSkill}
              onChange={(e) => {
                setSelectedSkill(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Skills</option>
              {filterOptions.skills.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Filter: Graduation Year */}
            <select
              className="alumni-select"
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Graduation Years</option>
              {filterOptions.graduationYears.map((y) => (
                <option key={y} value={y}>
                  Class of {y}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* ── Results Info Bar ── */}
        <div className="alumni-results-info">
          <span>
            Showing <span className="alumni-count-badge">{alumni.length}</span> of{' '}
            <span className="alumni-count-badge">{totalCount}</span> alumni mentors
          </span>
          {hasActiveFilters && (
            <span style={{ fontSize: '0.825rem', color: '#1D4ED8', fontWeight: 600 }}>
              Filtered Results Active
            </span>
          )}
        </div>

        {/* ── Main Alumni Content ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <Loader2
              size={36}
              className="spinner"
              style={{ color: '#1D4ED8', margin: '0 auto 1rem' }}
            />
            <p style={{ color: '#64748B', fontWeight: 500 }}>
              Fetching verified alumni profiles...
            </p>
          </div>
        ) : alumni.length === 0 ? (
          /* ── Empty State ── */
          <div className="alumni-empty">
            <div className="alumni-empty__icon">
              <Users size={32} />
            </div>
            <h2 className="alumni-empty__title">
              {totalCount === 0
                ? 'No Alumni Profiles Registered Yet'
                : 'No Mentors Matched Your Filters'}
            </h2>
            <p className="alumni-empty__desc">
              {totalCount === 0
                ? 'Your MongoDB Atlas database does not have any alumni profiles yet. Click below to safely populate 6 realistic demo alumni from Google, Microsoft, Amazon, Zomato, etc.'
                : 'Try adjusting your search keywords, clearing company or skill filters, or resetting all filters.'}
            </p>

            {totalCount === 0 ? (
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={handleSeedDemoAlumni}
                disabled={seedingLoading}
                style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {seedingLoading ? (
                  <>
                    <Loader2 size={18} className="spinner" />
                    <span>Seeding Database...</span>
                  </>
                ) : (
                  <>
                    <Database size={18} />
                    <span>Seed 6 Demo Alumni Profiles</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleResetFilters}
                style={{ margin: '0 auto' }}
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          /* ── Alumni Cards Grid ── */
          <>
            <div className="alumni-grid">
              {alumni.map((item) => {
                const initials = item.user?.name
                  ? item.user.name.charAt(0).toUpperCase()
                  : 'A';

                return (
                  <div key={item._id} className="alumni-card">
                    <div>
                      {/* Card Header: Avatar + Name + Company */}
                      <div className="alumni-card__header">
                        <div className="alumni-card__avatar">{initials}</div>
                        <div className="alumni-card__user-info">
                          <h2 className="alumni-card__name">{item.user?.name}</h2>
                          <div className="alumni-card__designation">
                            <Briefcase size={14} />
                            <span>{item.designation}</span>
                          </div>
                          <div className="alumni-card__company">
                            <Building size={14} />
                            <span>{item.company}</span>
                          </div>
                        </div>
                      </div>

                      {/* Meta Pills: Batch + Location + Available */}
                      <div className="alumni-card__meta-bar">
                        <span className="alumni-pill alumni-pill--batch">
                          <GraduationCap size={13} />
                          <span>Batch '{String(item.graduationYear).slice(-2)}</span>
                        </span>
                        {item.location && (
                          <span className="alumni-pill">
                            <MapPin size={13} />
                            <span>{item.location.split(',')[0]}</span>
                          </span>
                        )}
                        {item.availableForMentorship && (
                          <span className="alumni-pill alumni-pill--available">
                            <CheckCircle2 size={13} />
                            <span>Mentoring</span>
                          </span>
                        )}
                      </div>

                      {/* Bio */}
                      <p className="alumni-card__bio">
                        {item.bio || 'Experienced engineering alumnus open for student guidance.'}
                      </p>

                      {/* Skills */}
                      {item.skills && item.skills.length > 0 && (
                        <div>
                          <div className="alumni-card__section-label">Skills</div>
                          <div className="alumni-card__skills">
                            {item.skills.slice(0, 4).map((s, idx) => (
                              <span key={idx} className="skill-tag-small">
                                {s}
                              </span>
                            ))}
                            {item.skills.length > 4 && (
                              <span className="skill-tag-small" style={{ color: '#64748B' }}>
                                +{item.skills.length - 4}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Expertise */}
                      {item.expertise && item.expertise.length > 0 && (
                        <div>
                          <div className="alumni-card__section-label">Mentorship Topics</div>
                          <div className="alumni-card__expertise">
                            {item.expertise.slice(0, 3).map((e, idx) => (
                              <span key={idx} className="expertise-tag-small">
                                {e}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Footer: Action button */}
                    <div className="alumni-card__footer">
                      <button
                        type="button"
                        className="btn-connect"
                        onClick={() => {
                          setSelectedAlumni(item);
                          setRequestMessage('');
                          setRequestSent(false);
                        }}
                      >
                        <MessageSquare size={16} />
                        <span>Request Mentorship</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Pagination Controls ── */}
            {totalPages > 1 && (
              <div className="alumni-pagination">
                <button
                  type="button"
                  className="pagination-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>
                <span className="pagination-page-text">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  className="pagination-btn"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Connect / Mentorship Request Modal ── */}
      {selectedAlumni && (
        <div className="modal-overlay" onClick={() => setSelectedAlumni(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setSelectedAlumni(null)}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            {requestSent ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: '#ECFDF5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                  }}
                >
                  <CheckCircle2 size={32} />
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>
                  Mentorship Request Sent!
                </h2>
                <p style={{ color: '#64748B', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                  Your request has been routed to <strong>{selectedAlumni.user?.name}</strong> at{' '}
                  <strong>{selectedAlumni.company}</strong>. You will receive an email update when they accept.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setSelectedAlumni(null)}
                  style={{ margin: '0 auto' }}
                >
                  Done
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div className="alumni-card__avatar" style={{ width: '44px', height: '44px', fontSize: '1.1rem' }}>
                    {selectedAlumni.user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      Connect with {selectedAlumni.user?.name}
                    </h2>
                    <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>
                      {selectedAlumni.designation} @ {selectedAlumni.company}
                    </p>
                  </div>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', marginBottom: '0.4rem' }}>
                    Topics for Discussion
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {selectedAlumni.expertise?.map((exp, idx) => (
                      <span key={idx} className="expertise-tag-small">
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>

                {requestError && (
                  <div
                    style={{
                      backgroundColor: '#FEF2F2',
                      border: '1px solid #FCA5A5',
                      color: '#991B1B',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      marginBottom: '1rem',
                    }}
                  >
                    {requestError}
                  </div>
                )}

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!selectedAlumni?.user?._id) return;
                    setSubmitting(true);
                    setRequestError(null);
                    try {
                      const res = await api.post('/mentorship/request', {
                        alumniId: selectedAlumni.user._id,
                        topic: requestTopic,
                        message: requestMessage,
                      });
                      if (res.data.success) {
                        setRequestSent(true);
                      }
                    } catch (err) {
                      const msg =
                        err.response?.data?.message ||
                        'Failed to send mentorship request. Please try again.';
                      setRequestError(msg);
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label" htmlFor="mentor-topic">
                      Discussion Topic / Objective
                    </label>
                    <input
                      id="mentor-topic"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Resume Review, Mock Interview, System Design Guidance"
                      value={requestTopic}
                      onChange={(e) => setRequestTopic(e.target.value)}
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label" htmlFor="mentor-msg">
                      Introduction & Mentorship Goal
                    </label>
                    <textarea
                      id="mentor-msg"
                      rows={4}
                      className="form-input"
                      placeholder={`Hello ${selectedAlumni.user?.name?.split(' ')[0]}, I am a student seeking advice on ${selectedAlumni.skills?.[0] || 'career paths'} and would love to ask a few questions about your journey at ${selectedAlumni.company}...`}
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setSelectedAlumni(null);
                        setRequestError(null);
                      }}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submitting}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={16} className="spinner" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          <span>Send Request</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlumniDirectoryPage;
