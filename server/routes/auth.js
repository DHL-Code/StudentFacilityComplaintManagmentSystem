const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const multer = require('multer'); // Import multer
const router = express.Router();
const path = require('path');
const fs = require('fs');


// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = 'uploads/profile_photos/';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  });
  
  const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'), false);
      }
    }
  });
  //Signup
  router.post('/signup', upload.single('profilePhoto'), async (req, res) => {
    try {
      const { fullName, email, userId, phoneNumber, password, gender,college, department } = req.body;
      const profilePhoto = req.file ? req.file.path : null;
  
      // Basic validation
      if (!fullName || !email || !userId || !phoneNumber || !password || !gender || !department|| !college) {
        return res.status(400).json({ message: 'All fields are required' });
      }
  
      // Check if user already exists
      const existingUser = await User.findOne({ $or: [{ email }, { userId }] });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email or ID' });
      }
  
      // Create new user
      const newUser = new User({
        fullName,
        email,
        userId,
        phoneNumber,
        password,
        gender,
        college,
        department,
        profilePhoto,
      });
  
      await newUser.save();
      res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ message: error.message || 'Server error during registration' });
    }
  });

// Login
router.post('/login', async (req, res) => {
    const { userId, password } = req.body;
    try {
        const user = await User.findOne({ userId });
        if (user && (await user.matchPassword(password))) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
            console.log('Generated Token:', token); // Debugging: Log the generated token
            res.json({ token });
        } else {
            res.status(401).json({ message: 'Invalid user ID or password' });
        }
    } catch (error) {
        console.error('Login Error:', error); // Debugging: Log login errors
        res.status(400).json({ message: 'Error logging in', error });
    }
});

router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password').lean();
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.profilePhoto) {
            user.profilePhoto = `http://localhost:5000/${user.profilePhoto}`;
        }
        res.json(user);
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update Profile Route
router.put('/profile', authMiddleware, upload.single('profilePhoto'), async (req, res) => {
  try {
      const user = await User.findById(req.user.id);

      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Update profile fields
      user.fullName = req.body.fullName || user.fullName;
      user.email = req.body.email || user.email;
      user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
      user.department = req.body.department || user.department;
      user.gender = req.body.gender || user.gender;

      // Handle profile photo upload
      if (req.file) {
          user.profilePhoto = `/uploads/profile_photos/${req.file.filename}`;
      }

      // Handle password change
      if (req.body.currentPassword && req.body.newPassword) {
          const isMatch = await bcrypt.compare(req.body.currentPassword, user.password);
          if (!isMatch) {
              return res.status(400).json({ message: 'Current password is incorrect' });
          }
          user.password = await bcrypt.hash(req.body.newPassword, 12);
      }

      const updatedUser = await user.save();

      // Return user data without password
      const userData = updatedUser.toObject();
      delete userData.password;

      res.json({ user: userData });

  } catch (error) {
      console.error(error);
      res.status(500).json({
          message: error.message || 'Error updating profile'
      });
  }
});

module.exports = router;