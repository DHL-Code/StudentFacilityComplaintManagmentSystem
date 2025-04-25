const express = require('express');
const router = express.Router();
const { Proctor, Supervisor, Dean } = require('../models/Staff');
const Complaint = require('../models/Complaint');
const Feedback = require('../models/Feedback');
const User = require('../models/User');

// Generate reports
router.post('/generate-report', async (req, res) => {
  try {
    const { reportType, timePeriod, targetRole } = req.body;

    let startDate, endDate;
    const now = new Date();

    // Set date range based on time period
    switch (timePeriod) {
      case 'weekly':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'monthly':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'quarterly':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      default:
        return res.status(400).json({ message: 'Invalid time period' });
    }

    let reportData = {};

    switch (targetRole) {
      case 'proctor':
        // Get proctor data
        const proctors = await Proctor.find();
        const proctorReports = await Promise.all(proctors.map(async (proctor) => {
          const complaints = await Complaint.find({
            assignedTo: proctor.staffId,
            createdAt: { $gte: startDate }
          });
          
          const resolvedComplaints = complaints.filter(c => c.status === 'resolved').length;
          
          return {
            staffId: proctor.staffId,
            name: proctor.name,
            totalComplaints: complaints.length,
            resolvedComplaints,
            resolutionRate: complaints.length > 0 ? (resolvedComplaints / complaints.length) * 100 : 0,
            averageResolutionTime: await calculateAverageResolutionTime(complaints)
          };
        }));
        reportData.proctors = proctorReports;
        break;

      case 'supervisor':
        // Get supervisor data
        const supervisors = await Supervisor.find();
        const supervisorReports = await Promise.all(supervisors.map(async (supervisor) => {
          const complaints = await Complaint.find({
            assignedTo: supervisor.staffId,
            createdAt: { $gte: startDate }
          });
          
          const resolvedComplaints = complaints.filter(c => c.status === 'resolved').length;
          
          return {
            staffId: supervisor.staffId,
            name: supervisor.name,
            totalComplaints: complaints.length,
            resolvedComplaints,
            resolutionRate: complaints.length > 0 ? (resolvedComplaints / complaints.length) * 100 : 0,
            averageResolutionTime: await calculateAverageResolutionTime(complaints)
          };
        }));
        reportData.supervisors = supervisorReports;
        break;

      case 'dean':
        // Get dean data
        const deans = await Dean.find();
        const deanReports = await Promise.all(deans.map(async (dean) => {
          const feedback = await Feedback.find({
            createdAt: { $gte: startDate }
          });
          
          const positiveFeedback = feedback.filter(f => f.rating >= 4).length;
          
          return {
            staffId: dean.staffId,
            name: dean.name,
            totalFeedback: feedback.length,
            positiveFeedback,
            satisfactionRate: feedback.length > 0 ? (positiveFeedback / feedback.length) * 100 : 0
          };
        }));
        reportData.deans = deanReports;
        break;

      default:
        return res.status(400).json({ message: 'Invalid target role' });
    }

    res.json({
      message: 'Report generated successfully',
      reportData,
      timePeriod,
      startDate,
      endDate: new Date()
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Failed to generate report', error: error.message });
  }
});

// Helper function to calculate average resolution time
async function calculateAverageResolutionTime(complaints) {
  const resolvedComplaints = complaints.filter(c => c.status === 'resolved' && c.resolvedAt);
  if (resolvedComplaints.length === 0) return 0;

  const totalTime = resolvedComplaints.reduce((sum, complaint) => {
    const resolutionTime = new Date(complaint.resolvedAt) - new Date(complaint.createdAt);
    return sum + resolutionTime;
  }, 0);

  return Math.round(totalTime / resolvedComplaints.length / (1000 * 60 * 60)); // Convert to hours
}

module.exports = router; 