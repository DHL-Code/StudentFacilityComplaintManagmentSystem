const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Admin = require('../models/Admin');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/staff-photos');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'admin-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Upload profile photo
router.post('/upload-profile-photo', upload.single('profilePhoto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Get admin ID from the request body or headers
    const adminId = req.body.adminId || req.headers['x-admin-id'];
    if (!adminId) {
      // Delete the uploaded file if no admin ID
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Admin ID is required' });
    }

    // Update admin profile with new photo path
    const photoPath = req.file.path.replace(/\\/g, '/'); // Convert Windows paths to forward slashes
    const relativePath = photoPath.split('uploads/')[1]; // Get relative path for storage

    // Find admin by id field instead of adminId
    const admin = await Admin.findOneAndUpdate(
      { id: adminId },
      { profilePhoto: relativePath },
      { new: true }
    );

    if (!admin) {
      // Delete the uploaded file if admin not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Return the photo URL
    res.json({
      profilePhotoUrl: `http://localhost:5000/uploads/${relativePath}`
    });
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    // Delete the uploaded file if there's an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ 
      message: 'Failed to upload profile photo',
      error: error.message 
    });
  }
});

// Update profile information
router.put('/update-profile', async (req, res) => {
  try {
    const { name, email, phone, adminId, currentPassword, newPassword } = req.body;
    
    if (!adminId) {
      return res.status(400).json({ message: 'Admin ID is required' });
    }

    // Validate input
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // Find the admin
    const admin = await Admin.findOne({ id: adminId });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // If password change is requested
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to change password' });
      }

      // Verify current password
      const isMatch = await admin.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      // Update the password
      admin.password = newPassword;
    }

    // Update other fields
    admin.name = name;
    admin.email = email;
    if (phone) admin.phone = phone;

    // Save the admin - this will trigger the pre-save hook to hash the password
    await admin.save();

    res.json({
      message: 'Profile updated successfully',
      admin: {
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        profilePhoto: admin.profilePhoto
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ 
      message: 'Failed to update profile',
      error: error.message 
    });
  }
});

module.exports = router; 