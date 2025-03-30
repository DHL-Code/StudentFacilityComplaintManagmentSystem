// backend/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const StaffS = require('../models/Staff.js');
const bcrypt = require('bcrypt');

// Helper function to generate a unique ID
async function generateUniqueId(role) {
  const prefixMap = {
    proctor: 'P',
    supervisor: 'V',
    dean: 'D',
  };
  const prefix = prefixMap[role] || 'S';
  let id;
  let isUnique = false;

  while (!isUnique) {
    const randomNum = Math.floor(Math.random() * 900) + 100; // Generate 3-digit number
    id = `${prefix}${randomNum}`;
    const existingUser = await User.findOne({ userId: id });
    if (!existingUser) {
      isUnique = true;
    }
  }
  return id;
}

// Create Staff Account
router.post('/create-staff', async (req, res) => {
  try {
    console.log('Request body:', req.body);

    const { name, email, phone, role, password, profilePhoto } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const staffId = await generateUniqueId(role);
    const hashedPassword = await bcrypt.hash(password, 10);

    const newStaff = new StaffS({
      staffId: staffId,
      name,
      email,
      phone,
      role,
      password: hashedPassword,
      profilePhoto,
    });

    await newStaff.save();
    res.status(201).json({ message: 'Staff account created', staffId, password });
  } catch (error) {
    console.error('Error creating staff:', error);
    res.status(500).json({ error: 'Failed to create staff account' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { userId, password } = req.body;
    const user = await User.findOne({ userId });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({ message: 'Login successful', user });
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
    const user = await User.findOne({ userId });

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