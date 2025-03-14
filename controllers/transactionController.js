const { validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Gym = require('../models/Gym');

/**
 * @desc    Get all transactions
 * @route   GET /api/transactions
 * @access  Private (Admin, Super Admin)
 */
exports.getAllTransactions = async (req, res, next) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Filter parameters
    const filter = {};
    
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.gymId) filter.gymId = req.query.gymId;
    if (req.query.type) filter.type = req.query.type.toUpperCase();
    if (req.query.status) filter.status = req.query.status.toUpperCase();
    
    // Date range filter
    if (req.query.startDate && req.query.endDate) {
      filter.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // Count total documents with filter
    const total = await Transaction.countDocuments(filter);
    
    // Get transactions with pagination and filter
    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .populate('userId', 'name email')
      .populate('gymId', 'name location')
      .populate('createdBy', 'name role');
    
    // Pagination result
    const pagination = {
      total,
      pages: Math.ceil(total / limit),
      page,
      limit
    };
    
    res.status(200).json({
      status: 'success',
      pagination,
      data: {
        transactions
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user transactions
 * @route   GET /api/transactions/user/:userId
 * @access  Private (User for self, Admin for any)
 */
exports.getUserTransactions = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    
    // Check if user is requesting their own transactions or has permission
    if (
      req.user.role !== 'super_admin' &&
      req.user.role !== 'admin' &&
      req.user._id.toString() !== userId
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to access these transactions'
      });
    }
    
    // Pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Filter
    const filter = { userId };
    
    if (req.query.type) filter.type = req.query.type.toUpperCase();
    if (req.query.gymId) filter.gymId = req.query.gymId;
    
    // Date range filter
    if (req.query.startDate && req.query.endDate) {
      filter.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // Count total documents with filter
    const total = await Transaction.countDocuments(filter);
    
    // Get transactions
    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .populate('gymId', 'name location');
    
    // Pagination result
    const pagination = {
      total,
      pages: Math.ceil(total / limit),
      page,
      limit
    };
    
    res.status(200).json({
      status: 'success',
      pagination,
      data: {
        transactions
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get gym transactions
 * @route   GET /api/transactions/gym/:gymId
 * @access  Private (Admin, Gym)
 */
exports.getGymTransactions = async (req, res, next) => {
  try {
    const gymId = req.params.gymId;
    
    // Check if gym exists
    const gym = await Gym.findById(gymId);
    if (!gym) {
      return res.status(404).json({
        status: 'error',
        message: 'Gym not found'
      });
    }
    
    // Check if user is assigned to gym or is admin
    if (
      req.user.role !== 'super_admin' &&
      req.user.role !== 'admin' &&
      (req.user.role === 'gym' && !req.user.assignedGyms.includes(gymId))
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to access these transactions'
      });
    }
    
    // Pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Filter
    const filter = { gymId };
    
    if (req.query.type) filter.type = req.query.type.toUpperCase();
    
    // Date range filter
    if (req.query.startDate && req.query.endDate) {
      filter.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // Count total documents with filter
    const total = await Transaction.countDocuments(filter);
    
    // Get transactions
    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .populate('userId', 'name email');
    
    // Pagination result
    const pagination = {
      total,
      pages: Math.ceil(total / limit),
      page,
      limit
    };
    
    res.status(200).json({
      status: 'success',
      pagination,
      data: {
        transactions
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create manual transaction
 * @route   POST /api/transactions
 * @access  Private (Admin, Gym)
 */
exports.createTransaction = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }
    
    const { userId, gymId, points, type, description } = req.body;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Check if gym exists
    const gym = await Gym.findById(gymId);
    if (!gym) {
      return res.status(404).json({
        status: 'error',
        message: 'Gym not found'
      });
    }
    
    // Check if gym admin has permission
    if (
      req.user.role === 'gym' &&
      !req.user.assignedGyms.includes(gymId)
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to create transactions for this gym'
      });
    }
    
    // Check if user has enough points for SPEND transaction
    if (type === 'SPEND' && user.points < points) {
      return res.status(400).json({
        status: 'error',
        message: `User does not have enough points. Required: ${points}, Available: ${user.points}`
      });
    }
    
    // Create transaction
    const transactionData = {
      userId,
      gymId,
      points,
      type,
      description: description || `${type === 'EARN' ? 'Earned' : 'Spent'} ${points} points at ${gym.name}`,
      createdBy: req.user._id,
      metadata: {
        ipAddress: req.ip,
        manual: true
      }
    };
    
    const transaction = await Transaction.createTransaction(transactionData);
    
    res.status(201).json({
      status: 'success',
      data: {
        transaction
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get transaction by ID
 * @route   GET /api/transactions/:id
 * @access  Private (Admin, User for own transactions)
 */
exports.getTransactionById = async (req, res, next) => {
  try {
    const transactionId = req.params.id;
    
    const transaction = await Transaction.findById(transactionId)
      .populate('userId', 'name email')
      .populate('gymId', 'name location')
      .populate('createdBy', 'name role');
    
    if (!transaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found'
      });
    }
    
    // Check if user has permission to view this transaction
    if (
      req.user.role !== 'super_admin' &&
      req.user.role !== 'admin' &&
      req.user._id.toString() !== transaction.userId.toString() &&
      (req.user.role === 'gym' && !req.user.assignedGyms.includes(transaction.gymId))
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view this transaction'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        transaction
      }
    });
  } catch (error) {
    next(error);
  }
};
