const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  getMyProfile,
  updateMyProfile,
  getAlumniDirectory,
  getAlumniById,
  seedAlumni,
} = require('../controllers/profile.controller');

/**
 * Profile Routes
 *
 * /api/profile/me           GET  -> Get current user's profile (student/alumni) [Protected]
 * /api/profile/me           PUT  -> Update current user's profile [Protected]
 * /api/profile/alumni       GET  -> Search & filter alumni directory with pagination
 * /api/profile/alumni/:id   GET  -> Get specific alumni profile details
 * /api/profile/seed-alumni  POST -> Seed demo alumni accounts safely
 */

router.get('/me', protect, getMyProfile);
router.put('/me', protect, updateMyProfile);
router.get('/alumni', getAlumniDirectory);
router.get('/alumni/:id', getAlumniById);
router.post('/seed-alumni', seedAlumni);

module.exports = router;
