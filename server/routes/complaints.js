const express = require('express');
const Complaint = require('../models/Complaint');
const multer = require('multer');
const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/complaints/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
});

const upload = multer({ storage });

// Submit a complaint
router.post('/submit', upload.single('file'), async (req, res) => {
    try {
        const { userId, complaintType, specificInfo, description } = req.body;
        const file = req.file ? req.file.path : null;

        const newComplaint = new Complaint({
            userId,
            complaintType,
            specificInfo,
            description,
            file,
        });

        await newComplaint.save();
        res.status(201).json({ message: 'Complaint submitted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;