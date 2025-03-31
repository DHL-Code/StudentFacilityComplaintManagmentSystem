const mongoose = require('mongoose');

// Base schema with common fields
const baseStaffSchema = {
  staffId: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  profilePhoto: { type: String },
  createdAt: { type: Date, default: Date.now }
};

// Proctor Schema
const proctorSchema = new mongoose.Schema({
  ...baseStaffSchema,
  role: { type: String, enum: ['proctor'], required: true }
});

// Supervisor Schema
const supervisorSchema = new mongoose.Schema({
  ...baseStaffSchema,
  role: { type: String, enum: ['supervisor'], required: true }
});

// Dean Schema
const deanSchema = new mongoose.Schema({
  ...baseStaffSchema,
  role: { type: String, enum: ['dean'], required: true }
});

// Create separate models for each role
const Proctor = mongoose.model('Proctor', proctorSchema);
const Supervisor = mongoose.model('Supervisor', supervisorSchema);
const Dean = mongoose.model('Dean', deanSchema);

module.exports = { Proctor, Supervisor, Dean }; 