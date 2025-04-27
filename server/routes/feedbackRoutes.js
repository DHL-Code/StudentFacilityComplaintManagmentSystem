const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { createNotification } = require('../services/notificationService');

router.post('/submit', authMiddleware, async (req, res) => {
  try {
    // Get user from database using ID from token
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create feedback with user's student ID (userId field)
    const feedback = new Feedback({
      rating: req.body.rating,
      comment: req.body.comment,
      userId: user.userId // Use the student ID from user document
    });

    await feedback.save();

    // Create notification for admin
    await createNotification({
      recipientId: 'admin', // This will be received by all admins
      recipientType: 'admin',
      senderId: user.userId,
      senderType: 'student',
      type: 'feedback_submitted',
      message: `New feedback submitted by student ${user.userId}`,
      relatedEntityId: feedback._id
    });

    res.status(201).json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to get all feedback
router.get('/', async (req, res) => {
  try {
    const feedback = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete feedback
router.delete('/:id', async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    await feedback.deleteOne();
    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;