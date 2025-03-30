const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const feedbackRoutes = require('./routes/feedbackRoutes');
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contact'); // Import the contact route
const complaintRoutes = require('./routes/complaints'); // Import complaints route
const adminRoutes = require('./routes/superAdminRoutes'); // Import admin routes
const path = require('path');
const dotenv = require('dotenv');

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

//Routes
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes); 
app.use('/api/feedback', feedbackRoutes);
app.use('/api/complaints', complaintRoutes); // Use complaints route
app.use('/', adminRoutes); // Use your routes
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