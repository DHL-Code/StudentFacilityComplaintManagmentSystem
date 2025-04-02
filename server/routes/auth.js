require('dotenv').config(); // Load environment variables
const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const multer = require('multer'); // Import multer
const router = express.Router();
const path = require('path');
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const crypto = require('crypto');
const fs = require('fs');
const bcrypt = require('bcrypt'); // Import bcrypt


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
        // Destructure from req.body
        const { fullName, email, userId, phoneNumber, password, gender, college, department, blockNumber, dormNumber } = req.body;

        // Create new user WITH PLAIN TEXT PASSWORD
        const newUser = new User({
            fullName,
            email,
            userId,
            phoneNumber,
            password, // Pass the raw password here
            gender,
            college,
            department,
            blockNumber,
            dormNumber,
            profilePhoto: req.file ? req.file.path : null
        });

        // The pre-save hook will automatically hash this password before saving
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
        if (!userId || !password) {
            return res.status(400).json({ message: 'User ID and password are required.' });
        }

        const user = await User.findOne({ userId });
        if (!user) {
            console.log('User not found:', userId);
            return res.status(401).json({ message: 'Invalid user ID or password' });
        }

        const isMatch = await user.matchPassword(password);
        console.log('Password Match:', isMatch);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid user ID or password' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(400).json({ message: 'Error logging in', error: error.message });
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
      user.dormNumber = req.body.dormNumber || user.dormNumber;
      user.blockNumber = req.body.blockNumber || user.blockNumber;
      // Handle profile photo upload
      if (req.file) {
          user.profilePhoto = `/uploads/profile_photos/${req.file.filename}`;
      }

      // Handle password change
      if (req.body.currentPassword && req.body.newPassword) {
        const isMatch = await user.matchPassword(req.body.currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }
        user.password = req.body.newPassword; // Store the *plain text* new password.  The model must hash this on save.
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

// Forgot Password Route (Modified)
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(404).json({ message: 'Email not found.' });
      }

      // Generate OTP
      const otp = otpGenerator.generate(6, { // You can adjust OTP length and options
          upperCaseAlphabets: false,
          specialChars: false,
      });

      const otpExpiry = Date.now() + 600000; // OTP expires in 10 minutes (adjust as needed)

      user.resetPasswordOTP = otp;
      user.resetPasswordOTPExpires = otpExpiry;
      await user.save();

      // Send OTP via Email
      const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
          },
      });

      const mailOptions = {
          to: email,
          subject: 'Password Reset OTP',
          text: `Your OTP for password reset is: ${otp}\n\nThis OTP will expire in 10 minutes.`,
      };

      await transporter.sendMail(mailOptions);

      res.json({ message: 'OTP sent successfully. Please verify.' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'An error occurred.' });
  }
});

// Verify OTP Route
// Modify your /verify-otp route:
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({
            email,
            resetPasswordOTP: otp, // Corrected field name
            resetPasswordOTPExpires: { $gt: Date.now() }, // Corrected field name
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' }); // Use env variable

        res.json({ message: 'OTP verified', token: token }); // Send token
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error during OTP verification' }); // Improved error message
    }
});

// Reset Password Route (Modified)

router.post('/reset-password', async (req, res) => {
    try {
        const { token, password, otp } = req.body;

        // Verify JWT token
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findOne({
            _id: decodedToken.id,
            resetPasswordOTP: otp,
            resetPasswordOTPExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Set the plain text password - pre-save hook will hash it
        user.password = password;
        
        user.resetPasswordOTP = null;
        user.resetPasswordOTPExpires = null;

        await user.save();

        res.json({ message: 'Password reset successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error during password reset' });
    }
});



module.exports = router;