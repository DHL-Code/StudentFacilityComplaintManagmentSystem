// backend/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const { Proctor, Supervisor, Dean } = require('../models/Staff.js');
const Admin = require('../models/Admin.js');
const bcrypt = require('bcryptjs');
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
    dean: 'D',
    admin: 'A'
  };
  
  const prefix = prefixMap[role];
  let lastId = 0;

  // Find the highest existing ID
  let Model;
  switch(role) {
    case 'proctor': Model = Proctor; break;
    case 'supervisor': Model = Supervisor; break;
    case 'dean': Model = Dean; break;
    case 'admin': Model = Admin; break;
  }

  const lastUser = await Model.findOne().sort({ 
    [role === 'admin' ? 'id' : 'staffId']: -1 
  });
  
  if (lastUser) {
    const idField = role === 'admin' ? 'id' : 'staffId';
    const lastIdStr = lastUser[idField].slice(1);
    lastId = parseInt(lastIdStr) || 0;
  }

  return `${prefix}${String(lastId + 1).padStart(4, '0')}`; // 4-digit number
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
    const { name, email, phone, password } = req.body;
    
    // Validate required fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ 
        error: 'All fields are required',
        missingFields: {
          name: !name,
          email: !email,
          phone: !phone,
          password: !password
        }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long' 
      });
    }

    // Check for existing email (case-insensitive)
    const existingEmail = await Admin.findOne({ 
      email: { $regex: new RegExp(`^${email.trim()}$`, 'i') } 
    });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Generate admin ID (more flexible format)
    const lastAdmin = await Admin.findOne().sort({ id: -1 });
    const lastId = lastAdmin ? parseInt(lastAdmin.id.slice(1)) || 0 : 0;
    const adminId = `A${String(lastId + 1).padStart(3, '0')}`;

    // Create new admin with PLAIN TEXT password
    // Let the model's pre-save hook handle hashing
    const admin = new Admin({
      id: adminId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password: password, // Will be hashed by pre-save hook
      profilePhoto: req.file ? req.file.path : null
    });

    await admin.save();
    
    // Omit sensitive data from response
    const adminData = admin.toObject();
    delete adminData.password;

    // Format profile photo path
    if (adminData.profilePhoto) {
      adminData.profilePhoto = adminData.profilePhoto.replace(/\\/g, '/');
    }

    return res.status(201).json({ 
      message: 'Admin account created successfully',
      admin: adminData,
      adminId: admin.id
    });
    
  } catch (error) {
    console.error('Admin creation error:', error);
    
    if (error.code === 11000) {
      const field = error.message.includes('email') ? 'Email' : 'Admin ID';
      return res.status(400).json({ 
        error: `${field} already exists`,
        details: error.message
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to create admin account',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
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

// Get Staff by ID
router.get('/staff/:staffId', async (req, res) => {
  try {
    const { staffId } = req.params;
    console.log('Fetching staff with ID:', staffId);
    console.log('Request headers:', req.headers);

    // Normalize the staffId to uppercase
    const normalizedStaffId = staffId.toUpperCase();
    console.log('Normalized staff ID:', normalizedStaffId);

    // Check all collections for the staff member
    console.log('Checking Proctor collection...');
    const proctor = await Proctor.findOne({ staffId: normalizedStaffId });
    console.log('Proctor found:', proctor ? 'Yes' : 'No');

    console.log('Checking Supervisor collection...');
    const supervisor = await Supervisor.findOne({ staffId: normalizedStaffId });
    console.log('Supervisor found:', supervisor ? 'Yes' : 'No');

    console.log('Checking Dean collection...');
    const dean = await Dean.findOne({ staffId: normalizedStaffId });
    console.log('Dean found:', dean ? 'Yes' : 'No');

    const staff = proctor || supervisor || dean;

    if (!staff) {
      console.log('No staff member found with ID:', normalizedStaffId);
      return res.status(404).json({ 
        error: 'Staff member not found',
        details: `No staff member found with ID: ${normalizedStaffId}`
      });
    }

    // Return staff data without sensitive information
    const staffData = {
      staffId: staff.staffId,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
      profilePhoto: staff.profilePhoto,
      block: staff.block,
      createdAt: staff.createdAt
    };

    console.log('Found staff data:', staffData);
    res.json(staffData);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ 
      error: 'Failed to fetch staff data',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update Staff Profile
router.put('/staff/:staffId', upload.single('profilePhoto'), async (req, res) => {
  try {
    const { staffId } = req.params;
    const { name, email, phone, currentPassword, newPassword } = req.body;

    // Normalize the staffId to uppercase
    const normalizedStaffId = staffId.toUpperCase();

    // Check all collections for the staff member
    const proctor = await Proctor.findOne({ staffId: normalizedStaffId });
    const supervisor = await Supervisor.findOne({ staffId: normalizedStaffId });
    const dean = await Dean.findOne({ staffId: normalizedStaffId });
    
    const staff = proctor || supervisor || dean;

    if (!staff) {
      return res.status(404).json({ 
        error: 'Staff member not found',
        details: `No staff member found with ID: ${normalizedStaffId}`
      });
    }

    // Verify current password if trying to change password
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, staff.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
      staff.password = await bcrypt.hash(newPassword, 10);
    }

    // Update profile fields
    if (name) staff.name = name;
    if (email) staff.email = email;
    if (phone) staff.phone = phone;
    
    // Handle profile photo upload
    if (req.file) {
      // Store the relative path for the profile photo
      staff.profilePhoto = req.file.path;
    }

    await staff.save();

    // Return updated staff data without sensitive information
    const staffData = {
      staffId: staff.staffId,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
      profilePhoto: staff.profilePhoto,
      block: staff.block,
      createdAt: staff.createdAt
    };

    res.json(staffData);
  } catch (error) {
    console.error('Error updating staff:', error);
    res.status(500).json({ 
      error: 'Failed to update staff profile',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get admin profile by ID
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find admin by ID
    const admin = await Admin.findOne({ id: userId });
    
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    // Return admin data without sensitive information
    const adminData = admin.toObject();
    delete adminData.password;
    
    // Format profile photo path
    if (adminData.profilePhoto) {
      adminData.profilePhoto = adminData.profilePhoto.replace(/\\/g, '/');
    }
    
    return res.status(200).json(adminData);
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch admin profile',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get Admin by ID
router.get('/admin/:adminId', async (req, res) => {
  try {
    const { adminId } = req.params;
    console.log('Fetching admin with ID:', adminId);

    // Normalize the adminId to uppercase
    const normalizedAdminId = adminId.toUpperCase();
    console.log('Normalized admin ID:', normalizedAdminId);

    // Find admin by ID
    const admin = await Admin.findOne({ id: normalizedAdminId });
    console.log('Admin found:', admin ? 'Yes' : 'No');

    if (!admin) {
      console.log('No admin found with ID:', normalizedAdminId);
      return res.status(404).json({ 
        error: 'Admin not found',
        details: `No admin found with ID: ${normalizedAdminId}`
      });
    }

    // Return admin data without sensitive information
    const adminData = {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      role: 'Admin',
      profilePhoto: admin.profilePhoto ? admin.profilePhoto.replace(/\\/g, '/') : null,
      createdAt: admin.createdAt
    };

    console.log('Found admin data:', adminData);
    res.json(adminData);
  } catch (error) {
    console.error('Error fetching admin:', error);
    res.status(500).json({ 
      error: 'Failed to fetch admin data',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;