const express = require('express');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
    const { fullName, userId, phoneNumber, email, password, gender } = req.body; // Updated destructuring
    try {
        const user = new User({ fullName, userId, phoneNumber, email, password, gender }); // Updated fields
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error("Error registering user:", error); // Log the error for debugging
        res.status(400).json({ message: 'Error registering user', error: error.message }); // Send a more informative error message
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