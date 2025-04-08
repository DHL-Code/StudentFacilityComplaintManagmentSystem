// models/Complaint.js
const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  complaintType: { type: String, required: true, maxlength: 50 },
  specificInfo: { type: String, required: true, maxlength: 100 },
  description: { type: String, required: true, maxlength: 500 },
  file: { type: String }, // Store path to uploaded file
  userId: { type: String, required: true }, // Store the user's ID directly
  blockNumber: { type: String, required: true }, // Added block number field
  dormNumber: { type: String, required: true }, // Added dorm number field
  status: { 
    type: String, 
    enum: ['pending', 'verified', 'dismissed', 'escalated', 'resolved'],
    default: 'pending'
  },
  isUrgent: { type: Boolean, default: false },
  escalationReason: { type: String },
  escalatedAt: { type: Date }
}, { timestamps: true });

const Complaint = mongoose.model('Complaint', complaintSchema);
module.exports = Complaint;