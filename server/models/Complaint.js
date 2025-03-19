const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    complaintType: { type: String, required: true },
    specificInfo: { type: String, required: true },
    description: { type: String, required: true },
    file: { type: String }, // Store file path
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Complaint', complaintSchema);