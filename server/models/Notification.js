const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: String,
    required: true,
    index: true
  },
  recipientType: {
    type: String,
    required: true,
    enum: ['student', 'proctor', 'supervisor', 'dean', 'admin']
  },
  senderId: {
    type: String,
    required: false
  },
  senderType: {
    type: String,
    enum: ['student', 'proctor', 'supervisor', 'dean', 'admin'],
    required: false
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'complaint_submitted',
      'complaint_viewed', 
      'complaint_verified',
      'complaint_escalated',
      'complaint_resolved',
      'feedback_submitted'
    ]
  },
  relatedEntityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for faster queries
notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);