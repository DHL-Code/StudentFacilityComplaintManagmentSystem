const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  proctorId: {
    type: String,
    required: true
  },
  proctorName: {
    type: String,
    required: true
  },
  block: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Report', reportSchema); 