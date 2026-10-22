import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Briefcase,
  BookOpen,
  Calendar,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  User,
  Compass,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Video,
  Send,
  Loader2,
  CalendarCheck,
  Building,
  GraduationCap,
  AlertCircle,
  X,
  Target,
  Star,
  Info,
} from 'lucide-react';
import AppNavbar from '../components/AppNavbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './DashboardPage.css';

/**
 * DashboardPage — Role-Aware Dashboard for Students & Alumni.
 *
 * Implements Phase 4:
 * - Alumni: Profile completion meter, incoming requests, acceptance/rejection, session scheduling.
 * - Student: Sent request status tracking, response notes, scheduled meeting visibility.
 * - Real API integration with live MongoDB persistence.
 */
const DashboardPage = () => {
  const { user } = useAuth();
  const isAlumni = user?.role === 'alumni';

  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(isAlumni ? 'pending' : 'all');

  // Phase 5: Recommendation state (students only)
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(false);
  const [recProfileComplete, setRecProfileComplete] = useState(true);

  // Modal states
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    time: '4:00 PM',
    duration: 45,
    mode: 'online',
    locationDetails: 'Google Meet link will be provided in calendar invite',
    notes: '',
  });

  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [declineNote, setDeclineNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionAlert, setActionAlert] = useState(null);

  // Fetch all dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, reqsRes, sessRes] = await Promise.all([
        api.get('/mentorship/stats'),
        api.get('/mentorship/my-requests'),
        api.get('/mentorship/sessions'),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (reqsRes.data.success) setRequests(reqsRes.data.data);
      if (sessRes.data.success) setSessions(sessRes.data.data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Phase 5: Fetch personalised recommendations for students
  const loadRecommendations = useCallback(async () => {
    if (isAlumni) return; // alumni do not use this endpoint
    try {
      setRecLoading(true);
      const res = await api.get('/recommendations/alumni?limit=6');
      if (res.data.success) {
        setRecommendations(res.data.data);
        setRecProfileComplete(res.data.studentProfileComplete !== false);
      }
    } catch (err) {
      console.error('Error loading recommendations:', err);
    } finally {
      setRecLoading(false);
    }
  }, [isAlumni]);

  useEffect(() => {
    loadDashboardData();
    loadRecommendations();
  }, [loadDashboardData, loadRecommendations]);

  // Handle Accept Request
  const handleAcceptRequest = async (requestId) => {
    try {
      setActionLoading(true);
      const res = await api.put(`/mentorship/${requestId}/status`, {
        status: 'accepted',
        responseNote: 'Accepted! Looking forward to guiding you.',
      });
      if (res.data.success) {
        setActionAlert({ type: 'success', message: 'Mentorship request accepted!' });
        await loadDashboardData();
        setTimeout(() => setActionAlert(null), 3500);
      }
    } catch (err) {
      setActionAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to accept request',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Decline Request
  const handleDeclineSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    try {
      setActionLoading(true);
      const res = await api.put(`/mentorship/${selectedRequest._id}/status`, {
        status: 'rejected',
        responseNote: declineNote,
      });
      if (res.data.success) {
        setDeclineModalOpen(false);
        setDeclineNote('');
        setActionAlert({ type: 'success', message: 'Request declined' });
        await loadDashboardData();
        setTimeout(() => setActionAlert(null), 3500);
      }
    } catch (err) {
      setActionAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to decline request',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Schedule Session Submit
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/mentorship/${selectedRequest._id}/schedule`, scheduleForm);
      if (res.data.success) {
        setScheduleModalOpen(false);
        setActionAlert({
          type: 'success',
          message: 'Mentorship session scheduled and notified to student!',
        });
        await loadDashboardData();
        setTimeout(() => setActionAlert(null), 3500);
      }
    } catch (err) {
      setActionAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to schedule session',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Filter requests according to active tab
  const filteredRequests = requests.filter((r) => {
    if (activeTab === 'all') return true;
    return r.status === activeTab;
  });

  const initials = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="dashboard-layout">
      <AppNavbar />

      <main className="dashboard-main">
        {/* ── Action Alert Toast ── */}
        {actionAlert && (
          <div
            style={{
              padding: '0.85rem 1.25rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              fontSize: '0.925rem',
              fontWeight: 600,
              backgroundColor: actionAlert.type === 'success' ? '#ECFDF5' : '#FEF2F2',
              color: actionAlert.type === 'success' ? '#065F46' : '#991B1B',
              border: `1px solid ${actionAlert.type === 'success' ? '#A7F3D0' : '#FCA5A5'}`,
            }}
          >
            {actionAlert.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{actionAlert.message}</span>
          </div>
        )}

        {/* ── Welcome Banner ── */}
        <section className="dashboard-banner">
          <div className="dashboard-banner__content">
            <div className="dashboard-banner__badge">
              <Sparkles size={14} />
              <span>
                {isAlumni
                  ? 'Alumni Mentor Workspace (Phase 4 Active)'
                  : 'Student Mentorship Workspace (Phase 4 Active)'}
              </span>
            </div>
            <h1 className="dashboard-banner__title">
              Welcome back, {user?.name?.split(' ')[0]}!
            </h1>
            <p className="dashboard-banner__text">
              {isAlumni
                ? 'Review student mentorship applications, accept requests, and schedule virtual or on-campus mentoring sessions.'
                : 'Track the status of your mentorship requests, review alumni feedback, and attend scheduled guidance sessions.'}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
              <Link
                to="/alumni"
                className="btn btn-accent"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
              >
                <Compass size={18} />
                <span>Browse Alumni Mentors</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/profile"
                className="btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                }}
              >
                <User size={18} />
                <span>My Profile</span>
              </Link>
            </div>
          </div>
          <div className="dashboard-banner__bg-circle" aria-hidden="true"></div>
        </section>

        {/* ── Profile Summary Card with Completion Meter ── */}
        <section className="profile-summary-box">
          <div className="profile-summary-left">
            <div className="profile-summary-avatar">{initials}</div>
            <div className="profile-summary-details">
              <span className="profile-summary-name">{user?.name}</span>
              <span className="profile-summary-sub">
                {isAlumni
                  ? `${stats?.profile?.designation || 'Alumni Mentor'} ${
                      stats?.profile?.company ? `@ ${stats.profile.company}` : ''
                    }`
                  : `${stats?.profile?.branch || 'Student Member'} ${
                      stats?.profile?.academicYear ? `(${stats.profile.academicYear})` : ''
                    }`}
              </span>
            </div>
          </div>

          <div className="profile-completion-wrap">
            <div className="profile-completion-header">
              <span>Profile Strength</span>
              <span>{stats?.profileCompletion || 70}%</span>
            </div>
            <div className="profile-completion-bar">
              <div
                className="profile-completion-fill"
                style={{ width: `${stats?.profileCompletion || 70}%` }}
              ></div>
            </div>
          </div>
        </section>

        {/* ── Metrics Counter Cards ── */}
        <div className="dashboard-grid">
          {isAlumni ? (
            <>
              <div className="dashboard-card">
                <div className="dashboard-card__header">
                  <div className="dashboard-card__icon dashboard-card__icon--amber">
                    <Clock size={22} />
                  </div>
                  <span className="tech-tag" style={{ color: '#D97706', borderColor: '#FDE68A' }}>
                    Action Needed
                  </span>
                </div>
                <h2 className="dashboard-card__title">Pending Requests</h2>
                <div className="dashboard-card__value">{stats?.pendingCount || 0}</div>
                <p className="dashboard-card__desc">Awaiting your response</p>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card__header">
                  <div className="dashboard-card__icon dashboard-card__icon--blue">
                    <CheckCircle2 size={22} />
                  </div>
                  <span className="tech-tag" style={{ color: '#1D4ED8', borderColor: '#BFDBFE' }}>
                    Active
                  </span>
                </div>
                <h2 className="dashboard-card__title">Accepted Mentorships</h2>
                <div className="dashboard-card__value">{stats?.acceptedCount || 0}</div>
                <p className="dashboard-card__desc">Students connected</p>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card__header">
                  <div className="dashboard-card__icon dashboard-card__icon--teal">
                    <CalendarCheck size={22} />
                  </div>
                  <span className="tech-tag">Live</span>
                </div>
                <h2 className="dashboard-card__title">Scheduled Meetings</h2>
                <div className="dashboard-card__value">{stats?.scheduledCount || 0}</div>
                <p className="dashboard-card__desc">Upcoming calendar sessions</p>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card__header">
                  <div className="dashboard-card__icon dashboard-card__icon--purple">
                    <Users size={22} />
                  </div>
                  <span className="tech-tag">Total</span>
                </div>
                <h2 className="dashboard-card__title">Total Requests Handled</h2>
                <div className="dashboard-card__value">{stats?.totalRequests || 0}</div>
                <p className="dashboard-card__desc">Lifetime student reach</p>
              </div>
            </>
          ) : (
            <>
              <div className="dashboard-card">
                <div className="dashboard-card__header">
                  <div className="dashboard-card__icon dashboard-card__icon--blue">
                    <Send size={22} />
                  </div>
                  <span className="tech-tag">Outgoing</span>
                </div>
                <h2 className="dashboard-card__title">Requests Sent</h2>
                <div className="dashboard-card__value">{stats?.sentCount || 0}</div>
                <p className="dashboard-card__desc">Applications sent to mentors</p>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card__header">
                  <div className="dashboard-card__icon dashboard-card__icon--amber">
                    <Clock size={22} />
                  </div>
                  <span className="tech-tag">Pending</span>
                </div>
                <h2 className="dashboard-card__title">Under Review</h2>
                <div className="dashboard-card__value">{stats?.pendingCount || 0}</div>
                <p className="dashboard-card__desc">Awaiting mentor review</p>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card__header">
                  <div className="dashboard-card__icon dashboard-card__icon--teal">
                    <CheckCircle2 size={22} />
                  </div>
                  <span className="tech-tag" style={{ color: '#059669', borderColor: '#A7F3D0' }}>
                    Accepted
                  </span>
                </div>
                <h2 className="dashboard-card__title">Approved Mentors</h2>
                <div className="dashboard-card__value">{stats?.acceptedCount || 0}</div>
                <p className="dashboard-card__desc">Ready for session booking</p>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card__header">
                  <div className="dashboard-card__icon dashboard-card__icon--purple">
                    <CalendarCheck size={22} />
                  </div>
                  <span className="tech-tag">Upcoming</span>
                </div>
                <h2 className="dashboard-card__title">Booked Sessions</h2>
                <div className="dashboard-card__value">{stats?.scheduledCount || 0}</div>
                <p className="dashboard-card__desc">Confirmed meeting dates</p>
              </div>
            </>
          )}
        </div>

        {/* ════════════════════════════════════════════════════
            Phase 5: Recommended Mentors For You (Students)
            ════════════════════════════════════════════════════ */}
        {!isAlumni && (
          <section className="rec-section">
            <div className="rec-section__header">
              <h2 className="rec-section__title">
                <Target size={20} color="#1D4ED8" />
                Recommended Mentors For You
                <span className="rec-section__subtitle">— based on your skills &amp; interests</span>
              </h2>
              {recommendations.length > 0 && (
                <span className="rec-section__badge">
                  <Sparkles size={13} />
                  {recommendations.length} Match{recommendations.length !== 1 ? 'es' : ''} Found
                </span>
              )}
            </div>

            {/* Nudge if profile is incomplete */}
            {!recProfileComplete && (
              <div className="rec-incomplete-notice">
                <Info size={18} className="rec-incomplete-notice__icon" />
                <p className="rec-incomplete-notice__text">
                  Your profile has no skills, interests, or career goals yet. Recommendations work
                  best when your profile is complete.{' '}
                  <Link to="/profile" className="rec-incomplete-notice__link">
                    Update your profile →
                  </Link>
                </p>
              </div>
            )}

            {recLoading ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                <Loader2 size={30} className="spinner" style={{ color: '#1D4ED8', margin: '0 auto 0.5rem' }} />
                <p style={{ color: '#64748B', fontSize: '0.9rem' }}>Finding your best mentor matches...</p>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="dashboard-empty">
                <div className="dashboard-empty__icon"><Users size={22} /></div>
                <h3 className="dashboard-empty__title">No Recommendations Yet</h3>
                <p style={{ fontSize: '0.9rem', maxWidth: '440px' }}>
                  Add your skills, interests, and career goals to your profile so ANVAYA can
                  suggest the best mentors for you.
                </p>
                <Link to="/profile" className="btn btn-primary" style={{ marginTop: '0.25rem' }}>
                  Complete My Profile
                </Link>
              </div>
            ) : (
              <div className="rec-grid">
                {recommendations.map((rec) => {
                  const initial = rec.user?.name ? rec.user.name.charAt(0).toUpperCase() : '?';
                  const scoreClass =
                    rec.score >= 60 ? 'rec-score-fill--high'
                    : rec.score >= 30 ? 'rec-score-fill--medium'
                    : 'rec-score-fill--low';

                  return (
                    <div key={String(rec._id)} className="rec-card">
                      {/* Header */}
                      <div className="rec-card__header">
                        <div className="rec-card__avatar">{initial}</div>
                        <div>
                          <div className="rec-card__name">{rec.user?.name}</div>
                          <div className="rec-card__role">
                            {rec.designation} @ {rec.company}
                          </div>
                        </div>
                      </div>

                      {/* Match score bar */}
                      <div className="rec-score-wrap">
                        <div className="rec-score-header">
                          <span>Match Score</span>
                          <span className="rec-score-value">{rec.score}%</span>
                        </div>
                        <div className="rec-score-bar">
                          <div
                            className={`rec-score-fill ${scoreClass}`}
                            style={{ width: `${Math.max(rec.score, 4)}%` }}
                          />
                        </div>
                      </div>

                      {/* Why this mentor */}
                      <div className="rec-reasons">
                        <div className="rec-reasons__label">Why this match?</div>
                        {rec.reasons && rec.reasons.length > 0 ? (
                          rec.reasons.map((reason, idx) => (
                            <div key={idx} className="rec-reason-item">
                              <span className="rec-reason-dot" />
                              <span>{reason}</span>
                            </div>
                          ))
                        ) : (
                          <span className="rec-no-reason">
                            Add profile details to see personalised reasons.
                          </span>
                        )}
                      </div>

                      {/* Connect button — reuses the Alumni Directory mentorship workflow */}
                      <div className="rec-card__footer">
                        <Link
                          to="/alumni"
                          className="rec-card__cta"
                          state={{ highlightAlumniUserId: rec.user?._id }}
                        >
                          <Send size={15} />
                          Connect with {rec.user?.name?.split(' ')[0]}
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── Scheduled Sessions Section ── */}
        {sessions.length > 0 && (
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 className="dashboard-section-title">
              <span>Upcoming Scheduled Mentorship Sessions</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1D4ED8' }}>
                {sessions.length} Session(s) Booked
              </span>
            </h2>

            <div className="meeting-grid">
              {sessions.map((sess) => (
                <div key={sess._id} className="meeting-card">
                  <div className="meeting-card__header">
                    <span className="meeting-card__date-pill">
                      <Calendar size={14} />
                      <span>
                        {new Date(sess.session.date).toLocaleDateString([], {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </span>
                    <span className="meeting-card__mode-pill">
                      {sess.session.mode === 'in-person' ? <MapPin size={13} /> : <Video size={13} />}
                      <span>{sess.session.mode}</span>
                    </span>
                  </div>

                  <div className="meeting-card__participants">
                    {isAlumni
                      ? `Student: ${sess.student?.name}`
                      : `Mentor: ${sess.alumni?.name}`}
                  </div>

                  <div className="meeting-card__meta-row">
                    <Clock size={15} />
                    <span>
                      {sess.session.time} • {sess.session.duration} minutes
                    </span>
                  </div>

                  <div className="meeting-card__location">
                    <strong>Meeting Details:</strong> {sess.session.locationDetails}
                  </div>

                  {sess.session.notes && (
                    <div style={{ fontSize: '0.825rem', color: '#64748B', fontStyle: 'italic' }}>
                      "Note: {sess.session.notes}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Requests Section Header & Tabs ── */}
        <section>
          <div className="dashboard-section-title">
            <span>
              {isAlumni ? 'Incoming Mentorship Requests' : 'My Mentorship Requests'}
            </span>
          </div>

          <div className="dashboard-tabs">
            {isAlumni && (
              <button
                type="button"
                className={`dashboard-tab ${activeTab === 'pending' ? 'dashboard-tab--active' : ''}`}
                onClick={() => setActiveTab('pending')}
              >
                <span>Pending Review</span>
                <span className="tab-badge">{stats?.pendingCount || 0}</span>
              </button>
            )}
            <button
              type="button"
              className={`dashboard-tab ${activeTab === 'accepted' ? 'dashboard-tab--active' : ''}`}
              onClick={() => setActiveTab('accepted')}
            >
              <span>Accepted</span>
              <span className="tab-badge">{stats?.acceptedCount || 0}</span>
            </button>
            <button
              type="button"
              className={`dashboard-tab ${activeTab === 'all' ? 'dashboard-tab--active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <span>All Requests</span>
              <span className="tab-badge">{requests.length}</span>
            </button>
          </div>

          {/* ── Request Cards List ── */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <Loader2 size={32} className="spinner" style={{ color: '#1D4ED8', margin: '0 auto 0.75rem' }} />
              <p style={{ color: '#64748B' }}>Loading mentorship requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="dashboard-empty">
              <div className="dashboard-empty__icon">
                <Users size={24} />
              </div>
              <h3 className="dashboard-empty__title">
                {isAlumni
                  ? 'No Mentorship Requests In This Category'
                  : 'You Have Not Sent Any Requests In This Category'}
              </h3>
              <p style={{ fontSize: '0.9rem', maxWidth: '460px' }}>
                {isAlumni
                  ? 'When students submit mentorship requests to you from the Alumni Directory, they will appear here.'
                  : 'Explore the Alumni Directory to discover verified alumni mentors and submit mentorship requests.'}
              </p>
              {!isAlumni && (
                <Link to="/alumni" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                  Explore Alumni Directory
                </Link>
              )}
            </div>
          ) : (
            <div className="request-list">
              {filteredRequests.map((r) => {
                const partnerName = isAlumni ? r.student?.name : r.alumni?.name;
                const partnerInitials = partnerName ? partnerName.charAt(0).toUpperCase() : '?';

                return (
                  <div key={r._id} className="request-card">
                    <div className="request-card__top">
                      <div className="request-card__person">
                        <div className="request-card__avatar">{partnerInitials}</div>
                        <div>
                          <h3 className="request-card__person-name">{partnerName}</h3>
                          <div className="request-card__person-meta">
                            {isAlumni ? (
                              <span>
                                {r.studentProfile?.branch || 'Student'} •{' '}
                                {r.studentProfile?.academicYear || '1st Year'}
                              </span>
                            ) : (
                              <span>
                                {r.alumniProfile?.designation || 'Alumni'} @{' '}
                                {r.alumniProfile?.company || 'Industry'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span className={`status-badge status-badge--${r.status}`}>
                        {r.status === 'accepted' && <CheckCircle2 size={13} />}
                        {r.status === 'pending' && <Clock size={13} />}
                        {r.status === 'rejected' && <XCircle size={13} />}
                        <span>{r.status}</span>
                      </span>
                    </div>

                    <div className="request-card__topic">
                      Topic: {r.topic || 'Career Guidance'}
                    </div>

                    <div className="request-card__message">"{r.message}"</div>

                    {r.responseNote && (
                      <div className="request-card__note">
                        <strong>Mentor Response:</strong> "{r.responseNote}"
                      </div>
                    )}

                    <div className="request-card__footer">
                      <span className="request-card__time">
                        Submitted on{' '}
                        {new Date(r.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>

                      {/* Action buttons for Alumni */}
                      {isAlumni && (
                        <div className="request-card__actions">
                          {r.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                className="btn-reject"
                                onClick={() => {
                                  setSelectedRequest(r);
                                  setDeclineNote('');
                                  setDeclineModalOpen(true);
                                }}
                                disabled={actionLoading}
                              >
                                <XCircle size={15} />
                                <span>Decline</span>
                              </button>
                              <button
                                type="button"
                                className="btn-accept"
                                onClick={() => handleAcceptRequest(r._id)}
                                disabled={actionLoading}
                              >
                                <CheckCircle2 size={15} />
                                <span>Accept Request</span>
                              </button>
                            </>
                          )}

                          {r.status === 'accepted' && (
                            <button
                              type="button"
                              className="btn-schedule"
                              onClick={() => {
                                setSelectedRequest(r);
                                setScheduleModalOpen(true);
                              }}
                            >
                              <CalendarCheck size={15} />
                              <span>
                                {r.session?.isScheduled ? 'Reschedule Session' : 'Schedule Session'}
                              </span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Architecture Highlights Panel ── */}
        <section className="dashboard-viva-panel">
          <div className="dashboard-viva-panel__header">
            <ShieldCheck size={26} className="dashboard-viva-panel__icon" />
            <h2 className="dashboard-viva-panel__title">
              Technical Architecture Highlights (Phase 5: Recommendation Engine)
            </h2>
          </div>
          <div className="dashboard-viva-panel__content">
            <p>
              Phase 5 adds a transparent, explainable <strong>weighted recommendation algorithm</strong>
              that scores every alumni mentor against the student&apos;s profile across four dimensions:
            </p>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', lineHeight: '1.7' }}>
              <li><strong>Shared Skills (40 pts):</strong> Points proportional to matched skills ratio, capped at 40.</li>
              <li><strong>Interest ↔ Expertise Match (30 pts):</strong> Student interests matched against alumni expertise tags.</li>
              <li><strong>Career Goals ↔ Expertise (20 pts):</strong> Free-text goals tokenised and cross-matched against expertise.</li>
              <li><strong>Branch Relevance (10 pts):</strong> Academic branch matched to alumni designation, company, or skills.</li>
            </ul>
            <p style={{ marginTop: '0.75rem' }}>
              <strong>Security:</strong> Protected by <code>protect</code> (JWT verification) + <code>authorize('student')</code> (role guard). Alumni tokens receive HTTP 403 Forbidden.
            </p>
            <div className="dashboard-viva-panel__badge-row">
              <span className="tech-tag"><CheckCircle size={14} color="#16A34A" /> Deterministic Weighted Scoring</span>
              <span className="tech-tag"><CheckCircle size={14} color="#16A34A" /> Student-Only Authorization</span>
              <span className="tech-tag"><CheckCircle size={14} color="#16A34A" /> Human-Readable Match Reasons</span>
              <span className="tech-tag"><CheckCircle size={14} color="#16A34A" /> Missing-Field Safe</span>
            </div>
          </div>
        </section>
      </main>

      {/* ── Modal: Schedule Session (Alumni) ── */}
      {scheduleModalOpen && selectedRequest && (
        <div className="modal-overlay" onClick={() => setScheduleModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setScheduleModalOpen(false)}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.35rem', color: '#0F172A' }}>
              Schedule Mentorship Session
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Setting up session with <strong>{selectedRequest.student?.name}</strong> for topic:{' '}
              <em>"{selectedRequest.topic}"</em>.
            </p>

            <form onSubmit={handleScheduleSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" htmlFor="sess-date">Session Date</label>
                <input
                  id="sess-date"
                  type="date"
                  className="form-input"
                  min={new Date().toISOString().split('T')[0]}
                  value={scheduleForm.date}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="sess-time">Time</label>
                  <input
                    id="sess-time"
                    type="text"
                    className="form-input"
                    placeholder="e.g. 4:30 PM"
                    value={scheduleForm.time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="sess-duration">Duration</label>
                  <select
                    id="sess-duration"
                    className="form-input"
                    value={scheduleForm.duration}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, duration: e.target.value })}
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Meeting Mode</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="mode"
                      value="online"
                      checked={scheduleForm.mode === 'online'}
                      onChange={() => setScheduleForm({ ...scheduleForm, mode: 'online' })}
                    />
                    <span>Online (Video Call)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="mode"
                      value="in-person"
                      checked={scheduleForm.mode === 'in-person'}
                      onChange={() => setScheduleForm({ ...scheduleForm, mode: 'in-person' })}
                    />
                    <span>In-Person (On Campus)</span>
                  </label>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" htmlFor="sess-location">Location / Link Details</label>
                <input
                  id="sess-location"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Google Meet link will be provided via email / Tech Hub Room 204"
                  value={scheduleForm.locationDetails}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, locationDetails: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" htmlFor="sess-notes">Preparation Notes (Optional)</label>
                <textarea
                  id="sess-notes"
                  rows={3}
                  className="form-input"
                  placeholder="e.g. Please bring an updated PDF copy of your resume and questions regarding distributed systems."
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setScheduleModalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {actionLoading ? (
                    <>
                      <Loader2 size={16} className="spinner" />
                      <span>Scheduling...</span>
                    </>
                  ) : (
                    <>
                      <CalendarCheck size={16} />
                      <span>Confirm Session</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Decline Request Note (Alumni) ── */}
      {declineModalOpen && selectedRequest && (
        <div className="modal-overlay" onClick={() => setDeclineModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setDeclineModalOpen(false)}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.35rem', color: '#0F172A' }}>
              Decline Mentorship Request
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Provide a courteous note to <strong>{selectedRequest.student?.name}</strong> explaining why
              you cannot mentor right now (e.g. project deadlines, domain mismatch).
            </p>

            <form onSubmit={handleDeclineSubmit}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" htmlFor="decline-note">Reason / Constructive Feedback</label>
                <textarea
                  id="decline-note"
                  rows={4}
                  className="form-input"
                  placeholder="e.g. I am currently preparing for a major production launch and unable to take on new mentees this month. I recommend connecting with alumni in the Systems domain."
                  value={declineNote}
                  onChange={(e) => setDeclineNote(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDeclineModalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-reject"
                  disabled={actionLoading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {actionLoading ? (
                    <>
                      <Loader2 size={16} className="spinner" />
                      <span>Declining...</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={16} />
                      <span>Confirm Decline</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
