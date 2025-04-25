const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const staffSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    enum: ['proctor', 'supervisor', 'dean']
  },
  password: {
    type: String,
    required: true
  },
  staffId: {
    type: String,
    required: true,
    unique: true
  },
  block: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Block',
    required: function() {
      return this.role === 'proctor';
    }
  },
  profilePhoto: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes
staffSchema.index({ email: 1 }, { unique: true });
staffSchema.index({ staffId: 1 }, { unique: true });
staffSchema.index({ role: 1 });

// Add password hashing middleware to the base schema
staffSchema.pre('save', async function(next) {
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
  ...staffSchema.obj,
  role: { type: String, enum: ['supervisor'], required: true }
});

// Dean Schema
const deanSchema = new mongoose.Schema({
  ...staffSchema.obj,
  role: { type: String, enum: ['dean'], required: true }
});

// Create separate models for each role
const Proctor = mongoose.model('Proctor', proctorSchema);
const Supervisor = mongoose.model('Supervisor', supervisorSchema);
const Dean = mongoose.model('Dean', deanSchema);

const Staff = mongoose.model('Staff', staffSchema);

module.exports = { Proctor, Supervisor, Dean, Staff };