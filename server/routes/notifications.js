const express = require('express');
const router = express.Router();
const {
  getUnreadNotifications,
  markAsRead,
  markAllAsRead
} = require('../services/notificationService');
const authMiddleware = require('../middleware/auth');

// Get unread notifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await getUnreadNotifications(req.user.userId);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark single notification as read
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await markAsRead(req.params.id, req.user.userId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark all notifications as read
router.patch('/read-all', authMiddleware, async (req, res) => {
  try {
    await markAllAsRead(req.user.userId);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;