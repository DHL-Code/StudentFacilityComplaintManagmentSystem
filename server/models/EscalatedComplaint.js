const mongoose = require('mongoose');

const escalatedComplaintSchema = new mongoose.Schema({
    originalComplaintId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Complaint',
        required: true
    },
    complaintType: {
        type: String,
        required: true
    },
    specificInfo: {
        type: String,
        required: true
    },
    description: String,
    blockNumber: {
        type: String,
        required: true
    },
    dormNumber: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    supervisorId: {
        type: String,
        required: true
    },
    escalationReason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: 'Escalated to dean',
        enum: ['Escalated to dean']
    },
    isUrgent: {
        type: Boolean,
        default: false
    },
    escalatedAt: {
        type: Date,
        default: Date.now
    },
    resolvedAt: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('EscalatedComplaint', escalatedComplaintSchema); 