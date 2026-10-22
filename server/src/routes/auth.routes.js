const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * Auth Routes — Maps URLs to controller functions.
 *
 * POST /api/auth/register — Create a new account
 * POST /api/auth/login    — Log in and get a JWT
 * GET  /api/auth/me       — Get current user profile (protected)
 *
 * VALIDATION (viva answer):
 * "We use express-validator to validate request bodies BEFORE they reach
 *  the controller. This ensures name, email, and password meet our rules.
 *  The controller then checks validationResult() and returns errors if
 *  validation failed. This is server-side validation — we never rely only
 *  on frontend form checks because an attacker can bypass them."
 */

// ──── POST /api/auth/register ────
router.post(
  '/register',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('role')
      .optional()
      .isIn(['student', 'alumni'])
      .withMessage('Role must be student or alumni'),
  ],
  register
);

// ──── POST /api/auth/login ────
router.post(
  '/login',
  [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
  login
);

// ──── GET /api/auth/me ────
// Protected: requires a valid JWT in the Authorization header
router.get('/me', protect, getMe);

module.exports = router;
