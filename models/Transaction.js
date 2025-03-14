const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gym',
    required: [true, 'Gym ID is required']
  },
  points: {
    type: Number,
    required: [true, 'Points amount is required'],
    min: 1
  },
  type: {
    type: String,
    enum: ['EARN', 'SPEND'],
    required: [true, 'Transaction type is required']
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'],
    default: 'COMPLETED'
  },
  metadata: {
    qrCodeId: String,
    deviceInfo: String,
    ipAddress: String,
    location: {
      latitude: Number,
      longitude: Number
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for efficient querying
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ gymId: 1, createdAt: -1 });
TransactionSchema.index({ type: 1, createdAt: -1 });

// Static method to create a new transaction and update user points
TransactionSchema.statics.createTransaction = async function(transactionData) {
  const { userId, gymId, points, type, description, metadata, createdBy } = transactionData;
  
  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Find user
    const User = mongoose.model('User');
    const user = await User.findById(userId).session(session);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Create transaction record
    const transaction = await this.create([{
      userId,
      gymId,
      points,
      type,
      description,
      metadata,
      createdBy,
      status: 'PENDING'
    }], { session });
    
    // Update user points based on transaction type
    if (type === 'EARN') {
      user.points += points;
    } else if (type === 'SPEND') {
      if (user.points < points) {
        throw new Error('Insufficient points');
      }
      user.points -= points;
    }
    
    await user.save({ session });
    
    // Update transaction status
    transaction[0].status = 'COMPLETED';
    await transaction[0].save({ session });
    
    // Commit the transaction
    await session.commitTransaction();
    session.endSession();
    
    return transaction[0];
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = Transaction;
