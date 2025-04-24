const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

const defaultAdmin = {
  id: 'A001',
  name: 'System Administrator',
  email: 'admin@system.com',
  phone: '0988747881',
  password: 'Admin@123', // This will be hashed by the pre-save hook
};

async function initAdmin() {
  try {
    // Connect to MongoDB with more robust connection string
    const mongoURI = 'mongodb://127.0.0.1:27017/myDatabase';
    console.log('Attempting to connect to MongoDB at:', mongoURI);
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    
    console.log('Connected to MongoDB successfully');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ id: defaultAdmin.id });
    
    if (!existingAdmin) {
      // Create new admin
      const admin = new Admin(defaultAdmin);
      await admin.save();
      console.log('Default admin user created successfully');
      console.log('Admin credentials:');
      console.log('Email:', defaultAdmin.email);
      console.log('Password:', defaultAdmin.password);
    } else {
      console.log('Default admin user already exists');
      console.log('Admin credentials:');
      console.log('Email:', existingAdmin.email);
      console.log('Password: (use the one you set during creation)');
    }

    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error initializing admin:', error);
    if (error.name === 'MongooseServerSelectionError') {
      console.error('\nMongoDB connection failed. Please ensure:');
      console.error('1. MongoDB is installed on your system');
      console.error('2. MongoDB service is running');
      console.error('3. You can start MongoDB service with: net start MongoDB');
    }
    process.exit(1);
  }
}

// Run the initialization
initAdmin(); 