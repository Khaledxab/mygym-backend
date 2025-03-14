const mongoose = require('mongoose');

const GymSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Gym name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  location: {
    address: {
      type: String,
      required: [true, 'Address is required']
    },
    city: {
      type: String,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    zipCode: {
      type: String,
      required: [true, 'Zip code is required']
    },
    country: {
      type: String,
      required: [true, 'Country is required']
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  pointsRequired: {
    type: Number,
    required: [true, 'Points required for entry is required'],
    min: 0,
    default: 10
  },
  pointsEarned: {
    type: Number,
    min: 0,
    default: 0
  },
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  qrCode: {
    code: {
      type: String,
      unique: true
    },
    expiresAt: {
      type: Date
    }
  },
  contactInfo: {
    phone: String,
    email: String,
    website: String
  },
  openingHours: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    open: String,
    close: String,
    isClosed: {
      type: Boolean,
      default: false
    }
  }],
  amenities: [String],
  photos: [String],
  rating: {
    average: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for gym's transactions
GymSchema.virtual('transactions', {
  ref: 'Transaction',
  localField: '_id',
  foreignField: 'gymId'
});

// Get formatted address
GymSchema.methods.getFormattedAddress = function() {
  const { address, city, state, zipCode, country } = this.location;
  return `${address}, ${city}, ${state} ${zipCode}, ${country}`;
};

// Update QR code expiry
GymSchema.methods.updateQRCodeExpiry = async function() {
  // Set expiry to current time + QR_CODE_EXPIRY from env (default 24h)
  const expiryHours = parseInt(process.env.QR_CODE_EXPIRY) || 24;
  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + expiryHours);
  
  this.qrCode.expiresAt = expiryDate;
  await this.save();
  return this;
};

// Check if QR code is expired
GymSchema.methods.isQRCodeExpired = function() {
  if (!this.qrCode || !this.qrCode.expiresAt) return true;
  return new Date() > this.qrCode.expiresAt;
};

const Gym = mongoose.model('Gym', GymSchema);

module.exports = Gym;
