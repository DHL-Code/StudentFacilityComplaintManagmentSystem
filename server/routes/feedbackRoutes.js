// routes/feedbackRoutes.js
const express = require('express');
const Feedback = require('../models/Feedback');

const router = express.Router();

// Route to submit feedback
router.post('/submit', async (req, res) => {
    const { rating, comment, userId } = req.body;

    console.log('Received feedback:', { rating, comment, userId }); // Log received data

    try {
        const feedback = new Feedback({ rating, comment, userId });
        await feedback.save();
        res.status(201).json({ message: 'Feedback submitted successfully', feedback });
    } catch (error) {
        console.error('Error saving feedback:', error); // Log error
        res.status(400).json({ error: error.message });
    }
});

// Route to get all feedback
router.get('/', async (req, res) => {
    try {
        const feedbacks = await Feedback.find();
        res.status(200).json(feedbacks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;