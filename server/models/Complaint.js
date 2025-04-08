const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  complaintType: { type: String, required: true },
  specificInfo: { type: String, required: true },
  description: { type: String, required: true },
  userId: { type: String, required: true },
  blockNumber: { type: String, required: true },
  dormNumber: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'verified', 'dismissed', 'escalated', 'resolved'],
    default: 'pending'
  },
  isUrgent: { type: Boolean, default: false },

  escalationReason: { type: String },
  escalatedAt: { type: Date },
  file: { type: String },
  viewedBy: {
    type: [String],
    ref: 'Staff',
    default: []
  }
}, { timestamps: true });

// Add these static methods
complaintSchema.statics.getComplaintsWithViewStatus = async function(blockNumber, proctorId) {
  const query = blockNumber ? { blockNumber } : {};
  const complaints = await this.find(query).lean();
  
  return complaints.map(complaint => ({
    ...complaint,
    viewedByProctor: complaint.viewedBy?.includes(proctorId) || false
  }));
};

complaintSchema.statics.markAsViewed = async function(complaintId, proctorId) {
  return this.findByIdAndUpdate(
    complaintId,
    { $addToSet: { viewedBy: proctorId } },
    { new: true }
  );
};

module.exports = mongoose.model('Complaint', complaintSchema);