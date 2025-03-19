const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    gender: { type: String, enum: ['male', 'female'], required: true },
    department: { type: String, required: true },
    profilePhoto: { type: String }, // Store file path
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Profile', profileSchema);