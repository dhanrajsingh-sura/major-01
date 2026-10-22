const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import route files
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const mentorshipRoutes = require('./routes/mentorship.routes');
const notificationRoutes = require('./routes/notification.routes');
const recommendationRoutes = require('./routes/recommendation.routes');

/**
 * app.js — Configures the Express application.
 *
 * WHY SEPARATE app.js FROM server.js?
 * app.js defines WHAT our server does (middleware, routes).
 * server.js defines WHERE it runs (port, database connection).
 * This separation makes the app testable — you can import app.js
 * in tests without actually starting the server.
 *
 * MIDDLEWARE EXPLAINED (viva answer):
 * - helmet: Sets HTTP security headers (prevents common attacks)
 * - cors: Allows our React frontend (port 5173) to call our API (port 5000)
 * - morgan: Logs each incoming request for debugging ("GET /api/health 200 3ms")
 * - express.json(): Parses JSON request bodies so we can read req.body
 */

const app = express();

// ──── Security & Utility Middleware ────
app.use(helmet());                      // Security headers
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,                    // Allow cookies/auth headers
}));
app.use(morgan('dev'));                  // Request logging
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// ──── API Routes ────
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/mentorship', mentorshipRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/recommendations', recommendationRoutes);

// ──── 404 Handler — catches requests to undefined routes ────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ──── Global Error Handler ────
// Express recognises a 4-argument function as an error handler.
// Any error thrown or passed via next(err) lands here.
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.stack || err.message);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
