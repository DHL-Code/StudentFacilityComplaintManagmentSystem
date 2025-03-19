const express = require('express');
const Profile = require('../models/Profile');
const multer = require('multer');
const router = express.Router();

// Multer configuration for profile photo uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/profile_photos/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
});

const upload = multer({ storage });

// Update profile
router.put('/update/:userId', upload.single('profilePhoto'), async (req, res) => {
    try {
        const { fullName, email, phoneNumber, gender, department } = req.body;
        const profilePhoto = req.file ? req.file.path : null;

        const updatedProfile = await Profile.findOneAndUpdate(
            { userId: req.params.userId },
            { fullName, email, phoneNumber, gender, department, profilePhoto },
            { new: true }
        );

        if (!updatedProfile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        res.status(200).json({ message: 'Profile updated successfully', profile: updatedProfile });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;