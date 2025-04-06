const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// First create the base schema as a Mongoose schema
const baseStaffSchema = new mongoose.Schema({
  staffId: { 
    type: String, 
    unique: true, 
    required: true,
    validate: {
      validator: function(v) {
         // Convert to uppercase for validation
         const upperV = v.toUpperCase();
        // Validate based on role
        if (this.role === 'proctor') return /^P\d+$/i.test(upperV);
        if (this.role === 'supervisor') return /^V\d+$/i.test(upperV);
        if (this.role === 'dean') return /^D\d+$/i.test(upperV);
        return false;
      },
      message: props => `${props.value} is not a valid ID for this role!`
    },
     // Convert to uppercase when saving
     set: v => v.toUpperCase()
  },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  profilePhoto: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Add password hashing middleware to the base schema
baseStaffSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Proctor Schema
const proctorSchema = new mongoose.Schema({
  staffId: { 
    type: String, 
    unique: true, 
    required: true,
    validate: {
      validator: function(v) {
        const upperV = v.toUpperCase();
        return /^P\d+$/i.test(upperV);
      },
      message: props => `${props.value} is not a valid proctor ID!`
    },
    set: v => v.toUpperCase()
  },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  profilePhoto: { type: String },
  createdAt: { type: Date, default: Date.now },
  role: { type: String, enum: ['proctor'], required: true },
  block: { type: String, required: true }
}, { collection: 'proctors' });

// Supervisor Schema
const supervisorSchema = new mongoose.Schema({
  ...baseStaffSchema.obj,
  role: { type: String, enum: ['supervisor'], required: true }
});

// Dean Schema
const deanSchema = new mongoose.Schema({
  ...baseStaffSchema.obj,
  role: { type: String, enum: ['dean'], required: true }
});

// Create separate models for each role
const Proctor = mongoose.model('Proctor', proctorSchema);
const Supervisor = mongoose.model('Supervisor', supervisorSchema);
const Dean = mongoose.model('Dean', deanSchema);

module.exports = { Proctor, Supervisor, Dean };