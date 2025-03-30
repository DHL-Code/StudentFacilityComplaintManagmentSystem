// backend/models/Staff.js

const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  staffId: { type: String, unique: true, required: true }, // Unique ID for login
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  role: { type: String, enum: ['proctor', 'supervisor', 'dean', 'admin'], required: true }, // Role for access control
  password: { type: String, required: true }, // Hashed password
  profilePhoto: { type: String }, // URL or path to profile photo
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model('StaffS', staffSchema);