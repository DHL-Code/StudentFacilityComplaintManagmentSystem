// models/Complaint.js
const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  complaintType: { type: String, required: true, maxlength: 50 },
  specificInfo: { type: String, required: true, maxlength: 100 },
  description: { type: String, required: true, maxlength: 500 },
  file: { type: String }, // Store path to uploaded file
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true }, // Reference to User
}, { timestamps: true });

const Complaint = mongoose.model('Complaint', complaintSchema);
module.exports = Complaint;