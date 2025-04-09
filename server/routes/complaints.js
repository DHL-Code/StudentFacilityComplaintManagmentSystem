// routes/complaint.js
const express = require('express');
const multer = require('multer');
const Complaint = require('../models/Complaint');
// In routes/complaintRoutes.js
const complaintController = require('../controllers/complaintController.js');
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

// Get complaints with view status
router.get('/', authMiddleware, complaintController.getComplaints);

// Mark complaint as viewed
router.post('/:complaintId/view', authMiddleware, complaintController.markComplaintAsViewed);


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
// Modify the GET /api/complaints route
router.get('/', authMiddleware, async (req, res) => {
  try {
    let complaints;
    if (req.user.role === 'student') {
      // Return only the student's complaints
      complaints = await Complaint.find({ userId: req.user.userId });
    } else {
      // Handle proctor view with block filter and view status
      complaints = await Complaint.getComplaintsWithViewStatus(
        req.query.blockNumber, 
        req.user.userId // Proctor ID from token
      );
    }
    res.status(200).json(complaints);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    const { isUrgent } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { isUrgent },
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

// Delete a complaint
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Delete the associated file if it exists
    if (complaint.file) {
      const filePath = path.join(__dirname, '..', complaint.file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete the complaint from the database
    await Complaint.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    res.status(500).json({ message: 'Error deleting complaint' });
  }
});
// Add this new route
router.post('/:complaintId/view', authMiddleware, async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { proctorId } = req.body;

    // Simple validation
    if (!proctorId || typeof proctorId !== 'string') {
      return res.status(400).json({ error: 'Valid proctorId (string) is required' });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      complaintId,
      { $addToSet: { viewedBy: proctorId } },  // Now stores string directly
      { new: true }
    );

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    res.status(200).json({
      success: true,
      complaint: {
        ...complaint._doc,
        viewedByProctor: true
      }
    });
  } catch (error) {
    console.error('Error marking as viewed:', error);
    res.status(500).json({ 
      error: 'Failed to mark complaint as viewed',
      details: error.message 
    });
  }
});

module.exports = router;