const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const StudentApproval = require('../models/StudentApproval');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

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
            const hashedPassword = await bcrypt.hash(row.studentId, 10); // Default password is student ID
            await StudentApproval.create({
              studentId: row.studentId,
              name: row.name,
              email: row.email,
              password: hashedPassword,
              department: row.department,
              college: row.college,
              status: 'approved' // Auto-approve if in CSV
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
    res.json(approval);
  } catch (error) {
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

// Create new student approval
router.post('/', auth, async (req, res) => {
  try {
    const { studentId, name, email, department, college } = req.body;

    // Check if student ID or email already exists
    const existingStudent = await StudentApproval.findOne({
      $or: [{ studentId }, { email }]
    });

    if (existingStudent) {
      return res.status(400).json({ 
        message: 'Student ID or email already exists' 
      });
    }

    // Create new student approval without password
    const studentApproval = new StudentApproval({
      studentId,
      name,
      email,
      department,
      college,
      status: 'pending'
    });

    await studentApproval.save();
    res.status(201).json(studentApproval);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 