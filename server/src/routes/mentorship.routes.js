const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  createRequest,
  getMyRequests,
  updateRequestStatus,
  scheduleSession,
  getScheduledSessions,
  getMentorshipStats,
} = require('../controllers/mentorship.controller');

/**
 * Mentorship Routes
 * All endpoints require authentication (JWT Bearer token)
 */

router.use(protect); // Enforce authentication across all mentorship endpoints

router.post('/request', createRequest);
router.get('/my-requests', getMyRequests);
router.put('/:id/status', updateRequestStatus);
router.post('/:id/schedule', scheduleSession);
router.get('/sessions', getScheduledSessions);
router.get('/stats', getMentorshipStats);

module.exports = router;
