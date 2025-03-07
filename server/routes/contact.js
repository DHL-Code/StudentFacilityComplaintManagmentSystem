const express = require('express');
const Contact = require('../models/Contact'); // Adjust the path as necessary
const router = express.Router();

// POST route to handle contact form submissions
router.post('/', async (req, res) => {
    const { name, email, message } = req.body;

    try {
        const newContact = new Contact({ name, email, message });
        await newContact.save();
        res.status(201).json({ message: 'Contact form submitted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error saving contact form', error });
    }
});

module.exports = router;