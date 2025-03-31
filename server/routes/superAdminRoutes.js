// backend/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const { Proctor, Supervisor, Dean } = require('../models/Staff.js');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'staff-photos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only .jpg and .png files are allowed'));
    }
  }
});

// Helper function to generate a unique ID
async function generateUniqueId(role) {
  const prefixMap = {
    proctor: 'P',
    supervisor: 'V',
    dean: 'D'
  };
  const prefix = prefixMap[role];
  let lastId = 0;

  // Find the last ID in the appropriate collection
  switch (role) {
    case 'proctor':
      const lastProctor = await Proctor.findOne().sort({ staffId: -1 });
      lastId = lastProctor ? parseInt(lastProctor.staffId.slice(1)) : 0;
      break;
    case 'supervisor':
      const lastSupervisor = await Supervisor.findOne().sort({ staffId: -1 });
      lastId = lastSupervisor ? parseInt(lastSupervisor.staffId.slice(1)) : 0;
      break;
    case 'dean':
      const lastDean = await Dean.findOne().sort({ staffId: -1 });
      lastId = lastDean ? parseInt(lastDean.staffId.slice(1)) : 0;
      break;
  }

  return `${prefix}${String(lastId + 1).padStart(3, '0')}`;
}

// Create Staff Account
router.post('/create-staff', upload.single('profilePhoto'), async (req, res) => {
  try {
    console.log('Received create-staff request');
    const { name, email, phone, role, password } = req.body;
    console.log('Request body:', { name, email, phone, role });

    // Validate required fields
    if (!name || !email || !phone || !role || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if email already exists in any collection
    const existingEmail = await Promise.all([
      Proctor.findOne({ email }),
      Supervisor.findOne({ email }),
      Dean.findOne({ email })
    ]);

    if (existingEmail.some(result => result !== null)) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const staffId = await generateUniqueId(role);
    console.log('Generated staff ID:', staffId);
    
    const hashedPassword = await bcrypt.hash(password, 10);

    let newStaff;
    switch (role) {
      case 'proctor':
        newStaff = new Proctor({
          staffId,
          name,
          email,
          phone,
          role,
          password: hashedPassword,
          profilePhoto: req.file ? req.file.path : null,
        });
        break;
      case 'supervisor':
        newStaff = new Supervisor({
          staffId,
          name,
          email,
          phone,
          role,
          password: hashedPassword,
          profilePhoto: req.file ? req.file.path : null,
        });
        break;
      case 'dean':
        newStaff = new Dean({
          staffId,
          name,
          email,
          phone,
          role,
          password: hashedPassword,
          profilePhoto: req.file ? req.file.path : null,
        });
        break;
      default:
        return res.status(400).json({ error: 'Invalid role' });
    }

    await newStaff.save();
    console.log('Staff created successfully:', staffId);
    
    res.status(201).json({ 
      message: 'Staff account created successfully',
      staffId,
      role,
      email
    });
  } catch (error) {
    console.error('Error creating staff:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email or staff ID already exists' });
    }
    res.status(500).json({ 
      error: 'Failed to create staff account',
      details: error.message 
    });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { userId, password } = req.body;
    
    // Check all collections for the user
    const proctor = await Proctor.findOne({ staffId: userId });
    const supervisor = await Supervisor.findOne({ staffId: userId });
    const dean = await Dean.findOne({ staffId: userId });
    
    const user = proctor || supervisor || dean;

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({ 
        message: 'Login successful', 
        user: {
          staffId: user.staffId,
          name: user.name,
          role: user.role,
          email: user.email
        }
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Change Password
router.post('/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    
    // Check all collections for the user
    const proctor = await Proctor.findOne({ staffId: userId });
    const supervisor = await Supervisor.findOne({ staffId: userId });
    const dean = await Dean.findOne({ staffId: userId });
    
    const user = proctor || supervisor || dean;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({ error: 'Incorrect current password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;