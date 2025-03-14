const { validationResult } = require('express-validator');
const User = require('../models/User');
const { ROLES } = require('../config/roles');

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private (Admin, Super Admin)
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Filter parameters
    const filter = {};
    
    if (req.query.role) {
      filter.role = req.query.role;
    }
    
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex }
      ];
    }
    
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    
    // Count total documents with filter
    const total = await User.countDocuments(filter);
    
    // Get users with pagination and filter
    const users = await User.find(filter)
      .select('-password')
      .populate('assignedGyms', 'name location')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    
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
        users
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private (User for self, Admin for any)
 */
exports.getUserById = async (req, res, next) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId)
      .select('-password')
      .populate('assignedGyms', 'name location');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Regular users can only access their own profile
    if (
      req.user.role === ROLES.USER &&
      req.user._id.toString() !== userId
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to access this user'
      });
    }
    
    // Gym users can only access users in their gym
    if (req.user.role === ROLES.GYM) {
      // TODO: Check if user belongs to gym's users
      // This would require additional query to check user's transactions or gym visits
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private (User for self, Admin for any)
 */
exports.updateUser = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }
    
    const userId = req.params.id;
    
    // Regular users can only update their own profile
    if (
      req.user.role === ROLES.USER &&
      req.user._id.toString() !== userId
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this user'
      });
    }
    
    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Update fields
    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    
    // Only admin can update role and points
    if (
      (req.user.role === ROLES.SUPER_ADMIN || req.user.role === ROLES.ADMIN) &&
      req.body.role
    ) {
      // Super admin can set any role, admin cannot set super admin role
      if (
        req.user.role === ROLES.SUPER_ADMIN ||
        (req.user.role === ROLES.ADMIN && req.body.role !== ROLES.SUPER_ADMIN)
      ) {
        user.role = req.body.role;
      }
    }
    
    if (
      (req.user.role === ROLES.SUPER_ADMIN || req.user.role === ROLES.ADMIN) &&
      req.body.points !== undefined
    ) {
      user.points = req.body.points;
    }
    
    // Update additional fields
    if (req.body.phone) user.phone = req.body.phone;
    if (req.body.address) user.address = req.body.address;
    if (req.body.profilePicture) user.profilePicture = req.body.profilePicture;
    
    // Only admin can update active status
    if (
      (req.user.role === ROLES.SUPER_ADMIN || req.user.role === ROLES.ADMIN) &&
      req.body.isActive !== undefined
    ) {
      user.isActive = req.body.isActive;
    }
    
    await user.save();
    
    // Remove password from response
    user.password = undefined;
    
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private (Admin, Super Admin)
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    
    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Cannot delete super admin
    if (user.role === ROLES.SUPER_ADMIN && req.user.role !== ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this user'
      });
    }
    
    // Delete user
    await user.deleteOne();
    
    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user points
 * @route   GET /api/users/:id/points
 * @access  Private (User for self, Admin for any)
 */
exports.getUserPoints = async (req, res, next) => {
  try {
    const userId = req.params.id;
    
    // Regular users can only access their own points
    if (
      req.user.role === ROLES.USER &&
      req.user._id.toString() !== userId
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to access this user\'s points'
      });
    }
    
    const user = await User.findById(userId).select('points');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        points: user.points
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add points to user
 * @route   POST /api/users/:id/points
 * @access  Private (Admin, Super Admin)
 */
exports.addPoints = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { points, reason } = req.body;
    
    if (!points || points <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Points must be a positive number'
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Add points to user
    user.points += points;
    await user.save();
    
    // Create transaction record
    const Transaction = require('../models/Transaction');
    await Transaction.createTransaction({
      userId: user._id,
      gymId: req.body.gymId || null, // Optional gym ID
      points,
      type: 'EARN',
      description: reason || `Admin added ${points} points`,
      createdBy: req.user._id,
      metadata: {
        manual: true,
        ipAddress: req.ip
      }
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          points: user.points
        },
        pointsAdded: points
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get users by gym
 * @route   GET /api/users/gym/:gymId
 * @access  Private (Admin, Gym)
 */
exports.getUsersByGym = async (req, res, next) => {
  try {
    const gymId = req.params.gymId;
    
    // Check if user has permission to access gym
    if (
      req.user.role === ROLES.GYM &&
      !req.user.assignedGyms.includes(gymId)
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to access users from this gym'
      });
    }
    
    // Find users with transactions at this gym
    const Transaction = require('../models/Transaction');
    const transactions = await Transaction.find({ gymId })
      .distinct('userId');
    
    // Pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Count total users
    const total = transactions.length;
    
    // Get users with pagination
    const users = await User.find({ _id: { $in: transactions } })
      .select('name email points lastLogin')
      .skip(startIndex)
      .limit(limit);
    
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
        users
      }
    });
  } catch (error) {
    next(error);
  }
};
