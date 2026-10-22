import axios from 'axios';

/**
 * api.js — Centralized Axios instance for all API calls.
 *
 * WHY: Instead of writing `axios.get('http://localhost:5000/api/...')` everywhere,
 * we create ONE configured instance. This makes it easy to:
 * - Change the base URL in one place
 * - Automatically attach auth tokens to every request
 * - Handle errors consistently
 *
 * VIVA TIP: "We use a centralized Axios instance so all API calls go through
 *            one place. The request interceptor automatically attaches the JWT
 *            token, and the response interceptor handles auth errors globally."
 */

const api = axios.create({
  baseURL: '/api', // Vite proxy forwards this to http://localhost:5000/api
  headers: {
    'Content-Type': 'application/json',
  },
});

// ──── Request Interceptor ────
// Before every request, attach the JWT token from localStorage (if it exists).
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('anvaya_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ──── Response Interceptor ────
// If we get a 401 (Unauthorized), clear the token and redirect to login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('anvaya_token');
      // Only redirect if not already on the login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
