const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const StudentApproval = require('../models/StudentApproval');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const adminAuth = require('../middleware/adminAuth');
const nodemailer = require('nodemailer');

// Configure multer for CSV file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/student-csv');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, 'students-' + Date.now() + '.csv');
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Configure email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Upload and process CSV file
router.post('/upload-csv', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        // Process the CSV data
        for (const row of results) {
          const existingStudent = await StudentApproval.findOne({ studentId: row.studentId });
          if (!existingStudent) {
            await StudentApproval.create({
              studentId: row.studentId,
              name: row.name,
              email: row.email,
              department: row.department,
              college: row.college,
              status: 'pending' // Set to pending by default
            });
          }
        }
        
        // Delete the uploaded file after processing
        fs.unlinkSync(req.file.path);
        
        res.json({ message: 'CSV processed successfully', count: results.length });
      });
  } catch (error) {
    console.error('Error processing CSV:', error);
    res.status(500).json({ message: 'Error processing CSV file' });
  }
});

// Get all student approvals
router.get('/', auth, async (req, res) => {
  try {
    const approvals = await StudentApproval.find()
      .populate('approvedBy', 'name');
    res.json(approvals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update student approval status
router.put('/:id', auth, async (req, res) => {
    try {
        const { status, rejectionReason } = req.body;
        const approval = await StudentApproval.findById(req.params.id);
        
        if (!approval) {
            return res.status(404).json({ message: 'Student approval not found' });
        }

        approval.status = status;
        approval.approvalDate = Date.now();
        approval.approvedBy = req.user.id;
        
        if (status === 'rejected') {
            approval.rejectionReason = rejectionReason;
        }

        await approval.save();

        // Send email notification
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: approval.email,
            subject: `Account ${status === 'approved' ? 'Approved' : 'Rejected'} - Student Facility Complaint Management System`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: ${status === 'approved' ? '#4CAF50' : '#f44336'};">Account ${status === 'approved' ? 'Approved' : 'Rejected'}</h2>
                    <p>Dear ${approval.name},</p>
                    
                    ${status === 'approved' ? `
                        <p>We are pleased to inform you that your account has been approved by the administrator.</p>
                        <p>You can now log in to the Student Facility Complaint Management System using your credentials.</p>
                        <p>Please visit: <a href="http://localhost:5173/login">http://localhost:5173/login</a></p>
                        <p>Your login details:</p>
                        <ul>
                            <li>User ID: ${approval.studentId}</li>
                            <li>Use the password you created during registration</li>
                        </ul>
                    ` : `
                        <p>We regret to inform you that your account registration has been rejected.</p>
                        <p>Reason for rejection: ${rejectionReason || 'Not specified'}</p>
                        <p>If you believe this is a mistake or would like to appeal this decision, please contact the admin office.</p>
                    `}
                    
                    <p>Best regards,<br>Student Facility Complaint Management System</p>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Email sent to ${approval.email} for ${status} status`);
        } catch (emailError) {
            console.error('Error sending email:', emailError);
            // Don't fail the request if email fails
        }

        res.json(approval);
    } catch (error) {
        console.error('Error updating approval status:', error);
        res.status(500).json({ message: error.message });
    }
});

// Delete student approval
router.delete('/:id', auth, async (req, res) => {
  try {
    const approval = await StudentApproval.findByIdAndDelete(req.params.id);
    if (!approval) {
      return res.status(404).json({ message: 'Student approval not found' });
    }
    res.json({ message: 'Student approval deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify student ID (for registration)
router.post('/verify-id', async (req, res) => {
  try {
    const { studentId } = req.body;
    const student = await StudentApproval.findOne({ studentId });
    
    if (!student) {
      return res.status(404).json({ message: 'Student ID not found in records' });
    }
    
    res.json({ 
      exists: true,
      name: student.name,
      department: student.department,
      college: student.college
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new student approval request
router.post('/', async (req, res) => {
    try {
        const { studentId, name, email, department, college } = req.body;
        
        // Check if approval request already exists
        const existingApproval = await StudentApproval.findOne({ studentId });
        if (existingApproval) {
            return res.status(400).json({ message: 'Approval request already exists for this student' });
        }

        const approval = new StudentApproval({
            studentId,
            name,
            email,
            department,
            college,
            status: 'pending'
        });

        await approval.save();
        res.status(201).json(approval);
    } catch (error) {
        res.status(500).json({ message: 'Error creating approval request', error: error.message });
    }
});

// Get approval status for a student
router.get('/:studentId', async (req, res) => {
    try {
        const approval = await StudentApproval.findOne({ studentId: req.params.studentId });
        if (!approval) {
            return res.status(404).json({ message: 'Approval request not found' });
        }
        res.json(approval);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching approval status', error: error.message });
    }
});

// Get all pending approvals (admin only)
router.get('/', adminAuth, async (req, res) => {
    try {
        const approvals = await StudentApproval.find({ status: 'pending' });
        res.json(approvals);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching approvals', error: error.message });
    }
});

// Update approval status (admin only)
router.patch('/:studentId', adminAuth, async (req, res) => {
    try {
        const { status, rejectionReason } = req.body;
        const approval = await StudentApproval.findOne({ studentId: req.params.studentId });
        
        if (!approval) {
            return res.status(404).json({ message: 'Approval request not found' });
        }

        approval.status = status;
        if (status === 'approved') {
            approval.approvalDate = Date.now();
            approval.approvedBy = req.user._id;
        } else if (status === 'rejected') {
            approval.rejectionReason = rejectionReason;
        }

        await approval.save();
        res.json(approval);
    } catch (error) {
        res.status(500).json({ message: 'Error updating approval status', error: error.message });
    }
});

module.exports = router; 