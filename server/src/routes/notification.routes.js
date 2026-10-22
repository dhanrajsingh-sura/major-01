const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notification.controller');

/**
 * Notification Routes
 * All endpoints require authentication (JWT Bearer token)
 */

router.use(protect); // Enforce authentication across all notification endpoints

router.get('/', getNotifications);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);

module.exports = router;
