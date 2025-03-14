const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../config/roles');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false // Don't return password in queries by default
  },
  role: {
    type: String,
    enum: Object.values(ROLES),
    default: ROLES.USER
  },
  points: {
    type: Number,
    default: process.env.DEFAULT_POINTS_FOR_NEW_USER || 100,
    min: 0
  },
  assignedGyms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym'
  }],
  profilePicture: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, {
  timestamps: true
});

// Pre-save hook to hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash the password if it's modified or new
  if (!this.isModified('password')) return next();
  
  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    // Hash password
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Virtual for user's full transactions (with populate)
UserSchema.virtual('transactions', {
  ref: 'Transaction',
  localField: '_id',
  foreignField: 'userId'
});

// Method to check if user has enough points
UserSchema.methods.hasEnoughPoints = function(requiredPoints) {
  return this.points >= requiredPoints;
};

// Method to add points to user
UserSchema.methods.addPoints = async function(pointsToAdd) {
  this.points += pointsToAdd;
  await this.save();
  return this;
};

// Method to deduct points from user
UserSchema.methods.deductPoints = async function(pointsToDeduct) {
  if (!this.hasEnoughPoints(pointsToDeduct)) {
    throw new Error('Not enough points');
  }
  this.points -= pointsToDeduct;
  await this.save();
  return this;
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
