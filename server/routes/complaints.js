const express = require('express');
const multer = require('multer');
const Complaint = require('../models/Complaint');
const EscalatedComplaint = require('../models/EscalatedComplaint');
const authMiddleware = require('../middleware/auth');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');

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

// In complaints.js routes
async function determineProctorForBlock(blockNumber) {
  const proctor = await Proctor.findOne({ block: blockNumber });
  return proctor?._id;
}

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

    // Only proceed with notification if complaint was saved successfully
    try {
      // Create notification for proctor
      // You'll need to determine the proctor for this block - this is just an example
      const proctorId = await determineProctorForBlock(blockNumber);

      if (proctorId) {
        const notification = await createNotification({
          recipientId: proctorId,
          recipientModel: 'Proctor',
          senderId: userId,
          senderModel: 'User',
          complaintId: savedComplaint._id,
          type: 'complaint_submitted'
        });

        // Emit real-time notification if socket is available
        if (req.app.get('io')) {
          req.app.get('io').to(proctorId).emit('new_notification', notification);
        }
      }
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
      // Don't fail the whole request if notification fails
    }

    res.status(201).json(savedComplaint);
  } catch (error) {
    console.error('Error saving complaint:', error);
    res.status(400).json({
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get all complaints (for admin or user)
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Create query object
    const query = {};

    // If userId query parameter is provided, filter by that user
    if (req.query.userId) {
      query.userId = req.query.userId;
    }

    // If blockNumber query parameter is provided, filter by that block
    if (req.query.blockNumber) {
      query.blockNumber = req.query.blockNumber;
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

// Update complaint verification to include status update
router.put('/:id/verify', authMiddleware, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    complaint.status = 'verified';
    complaint.viewedByStudent = false; // Student needs to be notified
    await complaint.addStatusUpdate('verified', req.user.userId);


    const notification = await createNotification({
      recipientId: complaint.userId,
      recipientType: 'student',
      senderId: req.user.userId,
      senderType: 'proctor',
      type: 'complaint_verified',
      message: `Your complaint "${complaint.specificInfo}" has been verified`,
      relatedEntityId: complaint._id
    });

    req.app.get('io').to(complaint.userId).emit('new_notification', notification);

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Update complaint status to dismissed
router.put('/:id/dismiss', authMiddleware, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    complaint.status = 'dismissed';
    complaint.viewedByStudent = false; // Student needs to be notified
    await complaint.addStatusUpdate('dismissed', req.user.userId);

    const notification = await createNotification({
      recipientId: complaint.userId,
      recipientType: 'student',
      senderId: req.user.userId,
      senderType: 'proctor',
      type: 'complaint_dismissed',
      message: `Your complaint "${complaint.specificInfo}" has been dismissed`,
      relatedEntityId: complaint._id
    });

    req.app.get('io').to(complaint.userId).emit('new_notification', notification);

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Flag complaint as urgent
// routes/complaint.js
router.put('/:id/flag', authMiddleware, async (req, res) => {
  try {
    const { isUrgent } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      {
        isUrgent,
        $push: {
          statusUpdates: {
            status: isUrgent ? 'flagged as urgent' : 'unflagged',
            changedBy: req.user.userId,
            notificationViewed: false
          }
        }
      },
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

// Resolve complaint (for supervisors)
router.put('/:id/resolve', authMiddleware, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Update complaint status
    complaint.status = 'resolved';
    complaint.resolvedAt = new Date();
    complaint.viewedByStudent = false; // Set to false to notify student
    complaint.viewedByProctor = false; // Set to false to notify proctor
    await complaint.addStatusUpdate('resolved', req.user.userId);

    // Create notification for student
    const notification = await createNotification({
      recipientId: complaint.userId,
      recipientType: 'student',
      senderId: req.user.userId,
      senderType: 'supervisor',
      type: 'complaint_resolved',
      message: `Your complaint "${complaint.specificInfo}" has been resolved`,
      relatedEntityId: complaint._id
    });

    req.app.get('io').to(complaint.userId).emit('new_notification', notification);

    res.json({
      success: true,
      message: 'Complaint resolved successfully',
      data: complaint
    });
  } catch (error) {
    console.error('Error resolving complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve complaint',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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

// Get unread complaints for proctor
router.get('/unread', authMiddleware, async (req, res) => {
  try {
    // Get proctor's assigned block from user data
    const proctor = await User.findById(req.user.userId);
    const complaints = await Complaint.find({
      blockNumber: proctor.assignedBlock,
      viewedByProctor: false
    });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



// Mark complaint as viewed by proctor
router.post('/:id/view-proctor', authMiddleware, async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { viewedByProctor: true },
      { new: true }
    );
    // Create notification for student
    const notification = await createNotification({
      recipientId: complaint.userId,
      recipientModel: 'User',
      senderId: req.user.userId,
      senderModel: 'Proctor',
      complaintId: complaint._id,
      type: 'complaint_viewed'
    });

    // Emit real-time notification
    req.app.get('io').to(complaint.userId).emit('new_notification', notification);
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get unread status updates for student
router.get('/unread-status-updates', authMiddleware, async (req, res) => {
  try {
    const complaints = await Complaint.find({
      userId: req.user.userId,
      'statusUpdates.notificationViewed': false
    }).select('statusUpdates complaintType specificInfo');

    const updates = complaints.flatMap(complaint =>
      complaint.statusUpdates
        .filter(update => !update.notificationViewed)
        .map(update => ({
          ...update.toObject(),
          complaintId: complaint._id,
          complaintType: complaint.complaintType,
          specificInfo: complaint.specificInfo,
          changedAt: update.changedAt || update.createdAt
        }))
    );

    res.json(updates);
  } catch (error) {
    console.error('Error fetching unread status updates:', error);
    res.status(500).json({ message: error.message });
  }
});

// Mark complaint as viewed by student
router.post('/:id/view-student', authMiddleware, async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      {
        $set: { viewedByStudent: true },
        $push: {
          viewedBy: {
            userId: req.user.userId,
            userType: 'student',
            viewedAt: new Date()
          }
        }
      },
      { new: true }
    );
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Mark status update as viewed
router.post('/:complaintId/status-updates/:updateId/view', authMiddleware, async (req, res) => {
  try {
    const complaint = await Complaint.findOneAndUpdate(
      {
        _id: req.params.complaintId,
        'statusUpdates._id': req.params.updateId
      },
      {
        $set: { 'statusUpdates.$.notificationViewed': true }
      },
      { new: true }
    );
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



router.get('/unread-status-updates', authMiddleware, async (req, res) => {
  try {
    const complaints = await Complaint.find({
      userId: req.user.userId,
      'statusUpdates.notificationViewed': false
    }).select('statusUpdates');

    const updates = complaints.flatMap(complaint =>
      complaint.statusUpdates
        .filter(update => !update.notificationViewed)
        .map(update => ({
          ...update.toObject(),
          complaintId: complaint._id
        }))
    );

    res.json(updates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark complaint as viewed by supervisor
router.post('/:id/view-supervisor', authMiddleware, async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      {
        $set: { viewedBySupervisor: true },
        $push: {
          viewedBy: {
            userId: req.user.userId,
            userType: 'supervisor',
            viewedAt: new Date()
          }
        }
      },
      { new: true }
    );
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;