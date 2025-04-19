// controllers/complaintController.js
const Complaint = require('../models/Complaint');
const Proctor = require('../models/Proctor');
const Notification = require('../models/Notification');
const { io } = require('../server'); // Import your socket.io instance

// Helper function to create and send notifications
const sendNotification = async (recipientId, message, type, relatedEntityId) => {
  try {
    // Save notification to database
    const notification = new Notification({
      recipientId,
      recipientType: 'proctor', // or 'student' depending on context
      message,
      type,
      relatedEntityId,
    });

    const savedNotification = await notification.save();
    
    // Emit socket event
    io.to(recipientId).emit('new_notification', savedNotification);
    
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

// Create Complaint
exports.createComplaint = async (req, res) => {
  try {
    const complaint = new Complaint(req.body);
    const savedComplaint = await complaint.save();

    // Notify student
    await sendNotification(
      savedComplaint.userId,
      'Your complaint has been submitted',
      'complaint_submitted',
      savedComplaint._id
    );

    // Find relevant proctor
    const proctor = await Proctor.findOne({ block: savedComplaint.blockNumber });
    if (proctor) {
      // Notify proctor
      await sendNotification(
        proctor.staffId,
        `New complaint in Block ${savedComplaint.blockNumber}`,
        'new_complaint',
        savedComplaint._id
      );
    }

    res.status(201).json(savedComplaint);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update Complaint Status
exports.updateComplaintStatus = async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    // Notify student of status change
    await sendNotification(
      complaint.userId,
      `Complaint status updated to ${req.body.status}`,
      'status_update',
      complaint._id
    );

    res.json(complaint);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Flag as Urgent
exports.flagComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { isUrgent: req.body.isUrgent },
      { new: true }
    );

    const message = complaint.isUrgent 
      ? 'Complaint marked as urgent' 
      : 'Complaint urgency removed';

    // Notify relevant users
    await sendNotification(
      complaint.userId,
      message,
      'urgency_update',
      complaint._id
    );

    res.json(complaint);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};