// backend/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const { Proctor, Supervisor, Dean } = require('../models/Staff.js');
const Admin = require('../models/Admin.js');
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

// Helper function to generate admin ID
async function generateAdminId() {
  const lastAdmin = await Admin.findOne().sort({ id: -1 });
  const lastId = lastAdmin ? parseInt(lastAdmin.id.slice(1)) : 0;
  return `A${String(lastId + 1).padStart(3, '0')}`;
}

// Create Staff Account
router.post('/create-staff', upload.single('profilePhoto'), async (req, res) => {
  try {
    console.log('Received create-staff request');
    const { name, email, phone, role, password, block } = req.body;
    console.log('Request body:', { name, email, phone, role, block });

    // Validate required fields
    if (!name || !email || !phone || !role || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate block field for proctors
    if (role === 'proctor' && !block) {
      return res.status(400).json({ error: 'Block field is required for proctors' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate phone number format (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: 'Phone number must be exactly 10 digits' });
    }

    // Check if email already exists in any collection
    const existingEmail = await Promise.all([
      Proctor.findOne({ email }),
      Supervisor.findOne({ email }),
      Dean.findOne({ email })
    ]);

    if (existingEmail.some(result => result !== null)) {
      return res.status(400).json({ error: 'Email already exists in the system' });
    }

    // Check if phone number already exists in any collection
    const existingPhone = await Promise.all([
      Proctor.findOne({ phone }),
      Supervisor.findOne({ phone }),
      Dean.findOne({ phone })
    ]);

    if (existingPhone.some(result => result !== null)) {
      return res.status(400).json({ error: 'Phone number already exists in the system' });
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
          block: block || ''
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

// Create Admin Account
router.post('/create-admin', upload.single('profilePhoto'), async (req, res) => {
  try {
    console.log('Received create-admin request');
    console.log('Full request body:', req.body);
    console.log('Request file:', req.file);
    
    const { name, email, phone, password } = req.body;
    
    // Log each field individually
    console.log('Parsed fields:', {
      name: name || 'missing',
      email: email || 'missing',
      phone: phone || 'missing',
      password: password ? 'present' : 'missing'
    });

    // Validate required fields
    if (!name || !email || !phone || !password) {
      console.log('Missing required fields:', {
        name: !name,
        email: !email,
        phone: !phone,
        password: !password
      });
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if email already exists
    const existingEmail = await Admin.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const adminId = await generateAdminId();
    console.log('Generated admin ID:', adminId);
    
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin
    const admin = new Admin({
      id: adminId,
      name,
      email,
      phone,
      password: hashedPassword,
      profilePhoto: req.file ? req.file.path : null
    });

    await admin.save();
    console.log('Admin created successfully:', adminId);
    
    res.status(201).json({ 
      message: 'Admin account created successfully',
      adminId,
      email
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email or admin ID already exists' });
    }
    res.status(500).json({ 
      error: 'Failed to create admin account',
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