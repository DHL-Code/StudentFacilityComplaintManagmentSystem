const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const http = require('http');
const socketio = require('socket.io');
const feedbackRoutes = require('./routes/feedbackRoutes');
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contact');
const complaintRoutes = require('./routes/complaints');
const adminRoutes = require('./routes/superAdminRoutes');
const collegeRoutes = require('./routes/colleges');
const notificationRoutes = require('./routes/notifications');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Connect to database
connectDB();

// Create HTTP server
const server = http.createServer(app);

// Set up Socket.io with proper CORS
const io = socketio(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true // Fixed typo here
  }
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Make io accessible in routes
app.set('io', io);

// CORS configuration (only once)
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Create uploads directories if they don't exist
const uploadsDir = path.join(__dirname, 'uploads');
const profilePhotosDir = path.join(uploadsDir, 'profile_photos');
const staffPhotosDir = path.join(uploadsDir, 'staff-photos');

[uploadsDir, profilePhotosDir, staffPhotosDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  let status = 500;
  let message = 'Internal server error';

  if (err.name === 'ValidationError') {
    status = 400;
    message = err.message;
  } else if (err.name === 'UnauthorizedError') {
    status = 401;
    message = 'Unauthorized';
  } else if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expired';
  }

  res.status(status).json({
    success: false,
    message: message,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {  // Changed from app.listen() to server.listen()
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.io listening on port ${PORT}`);
});