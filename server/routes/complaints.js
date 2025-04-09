// routes/complaint.js
const express = require('express');
const multer = require('multer');
const Complaint = require('../models/Complaint');
const EscalatedComplaint = require('../models/EscalatedComplaint');
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

// Mark complaint as viewed
router.post('/:complaintId/view', authMiddleware, async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { proctorId } = req.body;
    
    if (!proctorId) {
      return res.status(400).json({ message: 'Proctor ID is required' });
    }
    
    const updatedComplaint = await Complaint.markAsViewed(complaintId, proctorId);
    
    if (!updatedComplaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    
    res.status(200).json(updatedComplaint);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
// In your complaints route (backend)
router.get('/', authMiddleware, async (req, res) => {
  try {
      // Create query object
      const query = {};
      
      // If userId query parameter is provided, filter by that user
      if (req.query.userId) {
          query.userId = req.query.userId;
      }
      
      // If the user is a proctor/admin, you might want to add additional filters
      const complaints = await Complaint.find(query).sort({ createdAt: -1 });
      res.status(200).json(complaints);
  } catch (error) {
      console.error('Error fetching complaints:', error);
      res.status(500).json({ 
          error: error.message,
          message: 'Failed to fetch complaints' 
      });
  }
});
// Get verified complaints
router.get('/verified', authMiddleware, async (req, res) => {
  try {
    console.log('Fetching verified complaints...');
    const complaints = await Complaint.find({ status: 'verified' });
    console.log('Found complaints:', complaints);
    res.json({
      success: true,
      data: complaints
    });
  } catch (error) {
    console.error('Error retrieving verified complaints:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve verified complaints',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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

// Get escalated complaints
router.get('/escalated', authMiddleware, async (req, res) => {
  try {
    const escalatedComplaints = await EscalatedComplaint.find()
      .sort({ escalatedAt: -1 }); // Sort by escalation date, newest first
    
    res.json({
      success: true,
      data: escalatedComplaints
    });
  } catch (error) {
    console.error('Error retrieving escalated complaints:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve escalated complaints',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Escalate complaint to dean
router.put('/:id/escalate', authMiddleware, async (req, res) => {
  try {
    const { reason, supervisorId } = req.body;
    
    if (!reason) {
      return res.status(400).json({ message: 'Escalation reason is required' });
    }

    if (!supervisorId) {
      return res.status(400).json({ message: 'Supervisor ID is required' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Update the original complaint
    complaint.status = 'escalated';
    complaint.escalationReason = reason;
    complaint.escalatedAt = new Date();
    complaint.supervisorId = supervisorId;
    await complaint.save();

    // Create a new escalated complaint
    const escalatedComplaint = new EscalatedComplaint({
      originalComplaintId: complaint._id,
      complaintType: complaint.complaintType,
      specificInfo: complaint.specificInfo,
      description: complaint.description,
      blockNumber: complaint.blockNumber,
      dormNumber: complaint.dormNumber,
      userId: complaint.userId,
      supervisorId: supervisorId,
      escalationReason: reason,
      isUrgent: complaint.isUrgent,
      status: 'Escalated to dean',
      escalatedAt: new Date(),
      file: complaint.file // Copy the file reference if it exists
    });

    await escalatedComplaint.save();

    res.json({
      success: true,
      message: 'Complaint escalated successfully',
      complaint: escalatedComplaint
    });
  } catch (error) {
    console.error('Error escalating complaint:', error);
    res.status(500).json({ message: error.message });
  }
});

// Resolve escalated complaint
router.put('/escalated/:id/resolve', authMiddleware, async (req, res) => {
  try {
    const escalatedComplaint = await EscalatedComplaint.findById(req.params.id);
    if (!escalatedComplaint) {
      return res.status(404).json({ message: 'Escalated complaint not found' });
    }

    // Update escalated complaint status
    escalatedComplaint.status = 'resolved';
    escalatedComplaint.resolvedAt = new Date();
    await escalatedComplaint.save();

    // Update original complaint status
    await Complaint.findByIdAndUpdate(
      escalatedComplaint.originalComplaintId,
      { status: 'resolved', resolvedAt: new Date() }
    );

    res.json({
      success: true,
      message: 'Complaint resolved successfully',
      data: escalatedComplaint
    });
  } catch (error) {
    console.error('Error resolving escalated complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve complaint',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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

module.exports = router;