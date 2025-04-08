const Complaint = require('../models/Complaint');

exports.getComplaints = async (req, res) => {
  try {
    const { blockNumber, proctorId } = req.query;
    
    if (!proctorId) {
      return res.status(400).json({ error: 'proctorId is required' });
    }

    const complaints = await Complaint.getComplaintsWithViewStatus(blockNumber, proctorId);
    res.status(200).json(complaints);
  } catch (error) {
    console.error('Error in getComplaints:', error);
    res.status(500).json({ 
      error: 'Failed to fetch complaints',
      details: error.message 
    });
  }
};

exports.markComplaintAsViewed = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { proctorId } = req.body;

    if (!proctorId) {
      return res.status(400).json({ error: 'proctorId is required' });
    }

    const complaint = await Complaint.markAsViewed(complaintId, proctorId);
    
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    
    res.status(200).json(complaint);
  } catch (error) {
    console.error('Error marking complaint as viewed:', error);
    res.status(500).json({ 
      error: 'Failed to mark complaint as viewed',
      details: error.message 
    });
  }
};