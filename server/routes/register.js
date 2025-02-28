const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

// User Registration Route
router.post('/register', async (req, res) => {
  const { userId, password } = req.body;

  try {
    // Check if the user already exists
    let user = await User.findOne({ userId });
    if (user) return res.status(400).json({ message: 'User already exists' });

    // Create a new user instance
    user = new User({ userId, password });

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save the user to the database
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;