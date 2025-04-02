const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const { Proctor, Supervisor, Dean } = require('./models/Staff');
const Admin = require('./models/Admin');
const bcrypt = require('bcrypt');

dotenv.config();

async function createTestUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    // Create test student
    const student = new User({
      fullName: 'Test Student',
      email: 'student@test.com',
      userId: 'S001',
      phoneNumber: '1234567890',
      password: 'password123',
      gender: 'male',
      college: 'Test College',
      department: 'Test Department',
      blockNumber: 'A',
      dormNumber: '101'
    });
    await student.save();
    console.log('Test student created');

    // Create test proctor
    const proctor = new Proctor({
      staffId: 'P001',
      name: 'Test Proctor',
      email: 'proctor@test.com',
      phone: '1234567890',
      password: await bcrypt.hash('password123', 10),
      role: 'proctor'
    });
    await proctor.save();
    console.log('Test proctor created');

    // Create test supervisor
    const supervisor = new Supervisor({
      staffId: 'V001',
      name: 'Test Supervisor',
      email: 'supervisor@test.com',
      phone: '1234567890',
      password: await bcrypt.hash('password123', 10),
      role: 'supervisor'
    });
    await supervisor.save();
    console.log('Test supervisor created');

    // Create test dean
    const dean = new Dean({
      staffId: 'D001',
      name: 'Test Dean',
      email: 'dean@test.com',
      phone: '1234567890',
      password: await bcrypt.hash('password123', 10),
      role: 'dean'
    });
    await dean.save();
    console.log('Test dean created');

    // Create test admin
    const admin = new Admin({
      id: 'A001',
      name: 'Test Admin',
      email: 'admin@test.com',
      phone: '1234567890',
      password: await bcrypt.hash('password123', 10)
    });
    await admin.save();
    console.log('Test admin created');

    console.log('\nTest Users Created:');
    console.log('Student: S001 / password123');
    console.log('Proctor: P001 / password123');
    console.log('Supervisor: V001 / password123');
    console.log('Dean: D001 / password123');
    console.log('Admin: A001 / password123');

    await mongoose.disconnect();
    console.log('\nMongoDB disconnected');
  } catch (error) {
    console.error('Error:', error);
  }
}

createTestUsers(); 