const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  userId: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  password: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female'], required: true },
  college:{type:String, required: true},
  department: { type: String, required: true },

  // OTP Management
  resetPasswordOTP: String,
  resetPasswordOTPExpires: Date,
  emailVerificationOTP: String,
  emailVerificationExpires: Date,

  //SprofilePhoto: { type: Buffer }, // Store image buffer
  profilePhoto: {type: String}, //Store content type
  blockNumber: { type: String, required: true }, 
  dormNumber: { type: String, required: true },   
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Add these to your User schema
//userSchema.index({ resetPasswordOTPExpires: 1 }, { expireAfterSeconds: 0 });
//userSchema.index({ emailVerificationExpires: 1 }, { expireAfterSeconds: 0 });


// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('users', userSchema);
module.exports = User;