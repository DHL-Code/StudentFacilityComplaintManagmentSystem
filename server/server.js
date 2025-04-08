const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const feedbackRoutes = require('./routes/feedbackRoutes');
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contact'); // Import the contact route
const complaintRoutes = require('./routes/complaints'); // Import complaints route
const adminRoutes = require('./routes/superAdminRoutes'); // Import admin routes
const collegeRoutes = require('./routes/colleges');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables first
dotenv.config();

// Create Express app
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const profilePhotosDir = path.join(uploadsDir, 'profile_photos');
const staffPhotosDir = path.join(uploadsDir, 'staff-photos');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(profilePhotosDir)) {
  fs.mkdirSync(profilePhotosDir, { recursive: true });
}

if (!fs.existsSync(staffPhotosDir)) {
  fs.mkdirSync(staffPhotosDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Routes
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes); 
app.use('/api/feedback', feedbackRoutes);
app.use('/api/complaints', complaintRoutes); // Use complaints route
app.use('/api/admin', adminRoutes); // Use your routes
// Use college routes
app.use('/api/colleges', collegeRoutes);
// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});