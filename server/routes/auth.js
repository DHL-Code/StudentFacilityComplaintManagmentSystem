const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
    if (successful) {
        return res.status(201).json({ message: 'User registered successfully' });
    } else {
        return res.status(400).json({ message: 'Error registering user' });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { userId, password } = req.body;
    try {
        const user = await User.findOne({ userId });
        if (user && (await user.matchPassword(password))) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.json({ token });
        } else {
            res.status(401).json({ message: 'Invalid user ID or password' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Error logging in', error });
    }
});

module.exports = router;