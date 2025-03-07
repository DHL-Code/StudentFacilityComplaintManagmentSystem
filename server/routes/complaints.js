const express = require('express');
const router = express.Router();
//const Complaint = require('../models/Complaint'); // Ensure this model matches your existing setup

// Get all complaints
router.get('/', async (req, res) => {
    try {
        const complaints = await Complaint.find();
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new complaint
router.post('/', async (req, res) => {
    const newComplaint = new Complaint(req.body);
    try {
        const savedComplaint = await newComplaint.save();
        res.status(201).json(savedComplaint);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update complaint status
router.put('/:id', async (req, res) => {
    try {
        const updatedComplaint = await Complaint.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedComplaint);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;