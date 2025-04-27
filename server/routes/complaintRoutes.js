// Get complaints resolved by a specific dean
router.get('/resolved-by/:staffId', auth, async (req, res) => {
  try {
    const { staffId } = req.params;
    
    // Find all complaints resolved by this dean
    const resolvedComplaints = await Complaint.find({
      resolvedBy: staffId,
      status: 'Resolved'
    }).sort({ resolvedAt: -1 });

    res.json({
      success: true,
      data: resolvedComplaints
    });
  } catch (error) {
    console.error('Error fetching resolved complaints:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resolved complaints',
      error: error.message
    });
  }
});

// Get escalated complaints resolved by a specific dean
router.get('/escalated/resolved-by/:staffId', auth, async (req, res) => {
  try {
    const { staffId } = req.params;
    
    // Find all escalated complaints resolved by this dean
    const resolvedComplaints = await EscalatedComplaint.find({
      resolvedBy: staffId,
      status: 'resolved'
    }).sort({ resolvedAt: -1 });

    res.json({
      success: true,
      data: resolvedComplaints
    });
  } catch (error) {
    console.error('Error fetching resolved escalated complaints:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resolved escalated complaints',
      error: error.message
    });
  }
}); 