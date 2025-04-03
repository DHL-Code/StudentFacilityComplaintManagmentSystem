// routes/complaint.js
const express = require('express');
const multer = require('multer');
const Complaint = require('../models/Complaint');
const authMiddleware = require('../middleware/auth');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const User = require('../models/User');

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/complaints/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Create a new complaint
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  const { complaintType, specificInfo, description, blockNumber, dormNumber, userId } = req.body;
  const file = req.file ? req.file.path : null;

  console.log('Received complaint data:', { complaintType, specificInfo, description, blockNumber, dormNumber, userId, file });

  try {
    const newComplaint = new Complaint({
      complaintType,
      specificInfo,
      description,
      file,
      userId, // Store the user ID directly
      blockNumber,
      dormNumber
    });

    const savedComplaint = await newComplaint.save();
    console.log('Saved complaint:', savedComplaint); // Log saved complaint
    res.status(201).json(savedComplaint);
  } catch (error) {
    console.error('Error saving complaint:', error); // Log the error for debugging
    res.status(400).json({ message: error.message });
  }
});

// Get all complaints (for admin or user)
router.get('/', async (req, res) => {
  try {
    const complaints = await Complaint.find();
    res.json(complaints);
  } catch (error) {
    console.error('Error retrieving complaints:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;