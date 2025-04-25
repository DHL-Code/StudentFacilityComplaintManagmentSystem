const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Staff = require('../models/Staff');
const Block = require('../models/Block');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/staff-photos/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Generate staff ID based on role
const generateStaffId = (role) => {
  const prefix = {
    proctor: 'P',
    supervisor: 'S',
    dean: 'D'
  }[role] || 'X';
  
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${randomNum}`;
};

// Create new staff
router.post('/create-staff', upload.single('profilePhoto'), async (req, res) => {
  try {
    const { name, email, phone, role, password, block } = req.body;
    
    // Validate required fields
    if (!name || !email || !phone || !role || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate block for proctors
    if (role === 'proctor') {
      if (!block) {
        return res.status(400).json({ error: 'Block is required for proctors' });
      }
      
      // Check if block exists by number
      const existingBlock = await Block.findOne({ number: block });
      if (!existingBlock) {
        return res.status(400).json({ error: 'Block not found' });
      }
    }

    // Check if email already exists
    const existingStaff = await Staff.findOne({ email });
    if (existingStaff) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Generate staff ID
    const staffId = generateStaffId(role);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new staff
    const newStaff = new Staff({
      name,
      email,
      phone,
      role,
      password: hashedPassword,
      staffId,
      block: role === 'proctor' ? block : undefined,
      profilePhoto: req.file ? req.file.filename : undefined
    });

    await newStaff.save();

    // Send email with credentials
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Staff Account Credentials',
      html: `
        <h2>Welcome to the Student Facility Complaint Management System</h2>
        <p>Dear ${name},</p>
        <p>Your staff account has been created successfully. Here are your login credentials:</p>
        <ul>
          <li><strong>Staff ID:</strong> ${staffId}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Password:</strong> ${password}</li>
          <li><strong>Role:</strong> ${role}</li>
          ${role === 'proctor' ? `<li><strong>Block:</strong> ${block}</li>` : ''}
        </ul>
        <p>Please keep these credentials secure and change your password after first login.</p>
        <p>Best regards,<br>System Administrator</p>
      `
    };

    await transporter.sendMail(mailOptions);

    // Return the created staff data including block information
    res.status(201).json({
      message: 'Staff account created successfully',
      staffId,
      staff: {
        name,
        email,
        phone,
        role,
        block: role === 'proctor' ? block : undefined,
        staffId
      }
    });
  } catch (error) {
    console.error('Error creating staff:', error);
    res.status(500).json({ error: 'Failed to create staff account' });
  }
});

module.exports = router; 