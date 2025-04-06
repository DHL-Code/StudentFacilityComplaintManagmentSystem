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
      userId,
      blockNumber,
      dormNumber
    });

    const savedComplaint = await newComplaint.save();
    console.log('Saved complaint:', savedComplaint);
    res.status(201).json(savedComplaint);
  } catch (error) {
    console.error('Error saving complaint:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get all complaints (for admin or user)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { userId, blockNumber } = req.query;
    
    let query = {};
    
    // If userId is provided, filter complaints for that user
    if (userId) {
      query.userId = userId;
    }
    
    // If blockNumber is provided, filter complaints for that block
    if (blockNumber) {
      query.blockNumber = blockNumber;
    }
    
    const complaints = await Complaint.find(query);
    res.json(complaints);
  } catch (error) {
    console.error('Error retrieving complaints:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update complaint status to verified
router.put('/:id/verify', authMiddleware, async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status: 'verified' },
      { new: true }
    );
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    
    res.json(complaint);
  } catch (error) {
    console.error('Error verifying complaint:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update complaint status to dismissed
router.put('/:id/dismiss', authMiddleware, async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status: 'dismissed' },
      { new: true }
    );
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    
    res.json(complaint);
  } catch (error) {
    console.error('Error dismissing complaint:', error);
    res.status(500).json({ message: error.message });
  }
});

// Flag complaint as urgent
router.put('/:id/flag', authMiddleware, async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { isUrgent: true },
      { new: true }
    );
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    
    res.json(complaint);
  } catch (error) {
    console.error('Error flagging complaint:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;