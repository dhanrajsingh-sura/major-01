const Notification = require('../models/Notification');

/**
 * Notification Controller
 *
 * Manages in-app notifications, unread counters, and mark-as-read state
 * strictly isolated to the authenticated recipient.
 */

/**
 * GET /api/notifications
 * Retrieves all notifications for the authenticated user, newest first.
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .limit(30)
        .populate('sender', 'name email avatar role')
        .lean(),
      Notification.countDocuments({ recipient: userId, isRead: false }),
    ]);

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    console.error('Error retrieving notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving notifications',
    });
  }
};

/**
 * PUT /api/notifications/:id/read
 * Marks a specific notification as read.
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or access denied',
      });
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error marking notification as read',
    });
  }
};

/**
 * PUT /api/notifications/read-all
 * Marks all unread notifications as read for the authenticated user.
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating notifications',
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
