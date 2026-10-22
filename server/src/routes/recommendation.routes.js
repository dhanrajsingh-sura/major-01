const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const { getAlumniRecommendations } = require('../controllers/recommendation.controller');

/**
 * Recommendation Routes
 *
 * GET /api/recommendations/alumni
 *   - Requires a valid JWT (protect middleware)
 *   - Restricted to role 'student' only (authorize middleware)
 *   - Returns ranked alumni mentors with match scores and human-readable reasons
 *
 * VIVA TIP:
 * "We chain two middleware functions — `protect` verifies the JWT and populates
 *  req.user; `authorize('student')` then checks that req.user.role is 'student'.
 *  If an alumni or admin calls this endpoint they get HTTP 403 Forbidden before
 *  the controller is ever reached."
 */
router.get('/alumni', protect, authorize('student'), getAlumniRecommendations);

module.exports = router;
