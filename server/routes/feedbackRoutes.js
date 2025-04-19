const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Feedback = require('../models/Feedback');
const User = require('../models/User');

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
    res.status(201).json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;