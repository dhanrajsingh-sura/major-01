import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  User,
  LogOut,
  Bell,
  Check,
  CheckCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './AppNavbar.css';

/**
 * AppNavbar — Global navigation bar with persistent in-app notifications.
 */
const AppNavbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={17} /> },
    { label: 'Alumni Directory', path: '/alumni', icon: <Users size={17} /> },
    { label: 'My Profile', path: '/profile', icon: <User size={17} /> },
  ];

  const initials = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.unreadCount);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  return (
    <nav className="app-navbar">
      <div className="app-navbar__container">
        {/* Left: Brand + Nav links */}
        <div className="app-navbar__left">
          <Link to="/dashboard" className="app-navbar__brand">
            <GraduationCap size={26} />
            <span className="app-navbar__brand-text">ANVAYA</span>
          </Link>

          <ul className="app-navbar__nav-links">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`app-navbar__link ${
                      isActive ? 'app-navbar__link--active' : ''
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right: Notifications + User Profile + Logout */}
        <div className="app-navbar__right">
          {/* In-app Notification Bell */}
          <div className="notif-wrapper" ref={notifRef}>
            <button
              type="button"
              className="notif-bell-btn"
              onClick={() => setShowNotifs(!showNotifs)}
              title="Notifications"
              aria-label="View notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>

            {showNotifs && (
              <div className="notif-dropdown">
                <div className="notif-dropdown__header">
                  <span className="notif-dropdown__title">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className="notif-dropdown__mark-all"
                      onClick={handleMarkAllRead}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <ul className="notif-dropdown__list">
                  {notifications.length === 0 ? (
                    <li className="notif-empty">No notifications yet</li>
                  ) : (
                    notifications.map((n) => (
                      <li
                        key={n._id}
                        className={`notif-item ${!n.isRead ? 'notif-item--unread' : ''}`}
                        onClick={(e) => !n.isRead && handleMarkAsRead(n._id, e)}
                      >
                        <div className="notif-item__title">
                          <span>{n.title}</span>
                          {!n.isRead && <span className="notif-item__unread-dot" />}
                        </div>
                        <div className="notif-item__msg">{n.message}</div>
                        <div className="notif-item__time">
                          {new Date(n.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* User Profile Badge */}
          <Link to="/profile" className="app-navbar__user" title="View your profile">
            <div className="app-navbar__avatar">{initials}</div>
            <div className="app-navbar__user-details">
              <span className="app-navbar__user-name">{user?.name}</span>
              <span
                className={`app-navbar__user-role app-navbar__user-role--${
                  user?.role || 'student'
                }`}
              >
                {user?.role === 'alumni' ? 'Alumni Mentor' : 'Student'}
              </span>
            </div>
          </Link>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="app-navbar__logout"
            title="Sign out of your session"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="app-navbar__mobile-bar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`app-navbar__mobile-link ${
                isActive ? 'app-navbar__mobile-link--active' : ''
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default AppNavbar;
