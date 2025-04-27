const mongoose = require('mongoose');

const statusUpdateSchema = new mongoose.Schema({
  status: { type: String, required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, required: true },
  changedAt: { type: Date, default: Date.now },
  notificationViewed: { type: Boolean, default: false }
}, { _id: true });

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
  hiddenByStudent: { type: Boolean, default: false },
  escalationReason: { type: String },
  escalatedAt: { type: Date },
  file: { type: String },
  statusUpdates: [statusUpdateSchema],
  viewedByProctor: { type: Boolean, default: false },
  viewedByStudent: { type: Boolean, default: false },
  viewedBySupervisor: { type: Boolean, default: false },
  viewedBy: [
    {
      userId: String,
      userType: String, // 'proctor', 'student', or 'supervisor'
      viewedAt: Date
    }
  ],
  statusUpdates: [
    {
      status: String,
      changedBy: String, // proctorId
      changedAt: Date,
      notificationViewed: Boolean
    }
  ]
}, { timestamps: true });

// Add these static methods
complaintSchema.statics.getComplaintsWithViewStatus = async function (blockNumber, proctorId) {
  const query = blockNumber ? { blockNumber } : {};
  const complaints = await this.find(query).lean();

  return complaints.map(complaint => ({
    ...complaint,
    viewedByProctor: complaint.viewedBy?.includes(proctorId) || false
  }));
};

complaintSchema.statics.markAsViewed = async function (complaintId, proctorId) {
  return this.findByIdAndUpdate(
    complaintId,
    { $addToSet: { viewedBy: proctorId } },
    { new: true }
  );
};

// Add method to create status update
complaintSchema.methods.addStatusUpdate = function (status, changedBy) {
  this.statusUpdates.push({
    status,
    changedBy,
    notificationViewed: false
  });
  return this.save();
};

module.exports = mongoose.model('Complaint', complaintSchema);