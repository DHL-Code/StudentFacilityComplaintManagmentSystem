const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { Proctor, Supervisor, Dean } = require('../models/Staff');
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
console.log('Email Configuration Debug:', {
  user: process.env.EMAIL_USER,
  hasPass: !!process.env.EMAIL_PASS,
  envKeys: Object.keys(process.env),
  nodeEnv: process.env.NODE_ENV
});

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Test the connection immediately
(async () => {
  try {
    await transporter.verify();
    console.log('Email server connection verified successfully');
  } catch (error) {
    console.error('Email server connection failed:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
  }
})();

// Helper function to find the last ID for a given role
async function findLastStaffId(role) {
  let Model;
  switch(role) {
    case 'proctor': Model = Proctor; break;
    case 'supervisor': Model = Supervisor; break;
    case 'dean': Model = Dean; break;
    default: return 0;
  }

  const lastStaff = await Model.findOne().sort({ staffId: -1 });
  if (lastStaff) {
    const lastIdStr = lastStaff.staffId.slice(1);
    return parseInt(lastIdStr) || 0;
  }
  return 0;
}

// Generate staff ID based on role
const generateStaffId = async (role) => {
  const prefix = {
    proctor: 'P',
    supervisor: 'S',
    dean: 'D'
  }[role] || 'X';
  
  const lastId = await findLastStaffId(role);
  return `${prefix}${String(lastId + 1).padStart(4, '0')}`;
};

// Create new staff
router.post('/create-staff', upload.single('profilePhoto'), async (req, res) => {
  try {
    const { name, email, phone, role, password, block } = req.body;
    
    // Log the request data
    console.log('Creating staff with data:', {
      name,
      email,
      phone,
      role,
      password: !!password,
      block
    });

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

    // Check if email already exists in any collection
    const existingEmail = await Promise.all([
      Proctor.findOne({ email }),
      Supervisor.findOne({ email }),
      Dean.findOne({ email })
    ]);

    if (existingEmail.some(result => result !== null)) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Generate staff ID
    const staffId = await generateStaffId(role);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new staff based on role
    let newStaff;
    switch (role) {
      case 'proctor':
        newStaff = new Proctor({
          name,
          email,
          phone,
          role,
          password: hashedPassword,
          staffId,
          block,
          profilePhoto: req.file ? req.file.filename : undefined
        });
        break;
      case 'supervisor':
        newStaff = new Supervisor({
          name,
          email,
          phone,
          role,
          password: hashedPassword,
          staffId,
          profilePhoto: req.file ? req.file.filename : undefined
        });
        break;
      case 'dean':
        newStaff = new Dean({
          name,
          email,
          phone,
          role,
          password: hashedPassword,
          staffId,
          profilePhoto: req.file ? req.file.filename : undefined
        });
        break;
      default:
        return res.status(400).json({ error: 'Invalid role' });
    }

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

    try {
      console.log('Attempting to send email to:', email);
      console.log('Mail options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      });
      
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully');
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Continue with staff creation even if email fails
    }

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
        staffId,
        profilePhoto: req.file ? `/uploads/staff-photos/${req.file.filename}` : undefined
      }
    });
  } catch (error) {
    console.error('Error creating staff:', error);
    res.status(500).json({ error: 'Failed to create staff account' });
  }
});

module.exports = router; 