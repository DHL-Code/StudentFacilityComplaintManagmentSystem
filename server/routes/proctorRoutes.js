const express = require('express');
const router = express.Router();
const Report = require('../models/Report');

// Get all proctor reports
router.get('/reports', async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ success: false, message: 'Error fetching reports', error: error.message });
  }
});

// Submit a new report
router.post('/submit-report', async (req, res) => {
  try {
    console.log('Received report submission request:', req.body);

    const { proctorId, proctorName, block, content } = req.body;

    if (!proctorId || !proctorName || !block || !content) {
      console.log('Missing fields:', { proctorId, proctorName, block, content });
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newReport = new Report({
      proctorId,
      proctorName,
      block,
      content
    });

    console.log('Saving report:', newReport);
    await newReport.save();
    console.log('Report saved successfully');
    
    res.status(201).json({ message: 'Report submitted successfully', report: newReport });
  } catch (error) {
    console.error('Error submitting report:', error);
    res.status(500).json({ message: 'Error submitting report', error: error.message });
  }
});

module.exports = router; 