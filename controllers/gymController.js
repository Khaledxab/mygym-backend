const { validationResult } = require('express-validator');
const Gym = require('../models/Gym');
const User = require('../models/User');
const { ROLES } = require('../config/roles');

/**
 * @desc    Create new gym
 * @route   POST /api/gyms
 * @access  Private (Admin, Super Admin)
 */
exports.createGym = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }
    
    const gymData = {
      name: req.body.name,
      description: req.body.description,
      location: {
        address: req.body.location.address,
        city: req.body.location.city,
        state: req.body.location.state,
        zipCode: req.body.location.zipCode,
        country: req.body.location.country,
        coordinates: req.body.location.coordinates
      },
      pointsRequired: req.body.pointsRequired || 10,
      admins: [],
      contactInfo: req.body.contactInfo,
      openingHours: req.body.openingHours,
      amenities: req.body.amenities
    };
    
    // Add creator as admin if not super admin
    if (req.user.role === ROLES.ADMIN) {
      gymData.admins.push(req.user._id);
    }
    
    // Create gym
    const gym = await Gym.create(gymData);
    
    // If admin created, add to their assignedGyms
    if (req.user.role === ROLES.ADMIN) {
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { assignedGyms: gym._id }
      });
    }
    
    res.status(201).json({
      status: 'success',
      data: {
        gym
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all gyms
 * @route   GET /api/gyms
 * @access  Private (All authenticated users)
 */
exports.getAllGyms = async (req, res, next) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Filter parameters
    const filter = {};
    
    // Only active gyms for regular users
    if (req.user.role === ROLES.USER) {
      filter.isActive = true;
    }
    
    // Search by name
    if (req.query.name) {
      filter.name = { $regex: req.query.name, $options: 'i' };
    }
    
    // Filter by location
    if (req.query.city) {
      filter['location.city'] = { $regex: req.query.city, $options: 'i' };
    }
    
    if (req.query.state) {
      filter['location.state'] = { $regex: req.query.state, $options: 'i' };
    }
    
    // For gym users, only show assigned gyms
    if (req.user.role === ROLES.GYM) {
      filter._id = { $in: req.user.assignedGyms };
    }
    
    // Count total documents with filter
    const total = await Gym.countDocuments(filter);
    
    // Get gyms with pagination and filter
    let query = Gym.find(filter)
      .sort({ name: 1 })
      .skip(startIndex)
      .limit(limit);
    
    // Populate admin details for admin users
    if (req.user.role === ROLES.SUPER_ADMIN || req.user.role === ROLES.ADMIN) {
      query = query.populate('admins', 'name email');
    }
    
    const gyms = await query;
    
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
        gyms
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get gym by ID
 * @route   GET /api/gyms/:id
 * @access  Private (All authenticated users)
 */
exports.getGymById = async (req, res, next) => {
  try {
    const gymId = req.params.id;
    
    let query = Gym.findById(gymId);
    
    // Populate admin details for admin users
    if (req.user.role === ROLES.SUPER_ADMIN || req.user.role === ROLES.ADMIN) {
      query = query.populate('admins', 'name email');
    }
    
    const gym = await query;
    
    if (!gym) {
      return res.status(404).json({
        status: 'error',
        message: 'Gym not found'
      });
    }
    
    // Check if gym is active for regular users
    if (req.user.role === ROLES.USER && !gym.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'Gym not found or inactive'
      });
    }
    
    // For gym users, check if assigned
    if (req.user.role === ROLES.GYM && !req.user.assignedGyms.includes(gymId)) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view this gym'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        gym
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update gym
 * @route   PUT /api/gyms/:id
 * @access  Private (Admin, Super Admin)
 */
exports.updateGym = async (req, res, next) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }
    
    const gymId = req.params.id;
    
    // Find gym
    const gym = await Gym.findById(gymId);
    
    if (!gym) {
      return res.status(404).json({
        status: 'error',
        message: 'Gym not found'
      });
    }
    
    // Check permission - admin can only update assigned gyms
    if (
      req.user.role === ROLES.ADMIN &&
      !gym.admins.includes(req.user._id)
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this gym'
      });
    }
    
    // Update fields
    if (req.body.name) gym.name = req.body.name;
    if (req.body.description) gym.description = req.body.description;
    
    if (req.body.location) {
      if (req.body.location.address) gym.location.address = req.body.location.address;
      if (req.body.location.city) gym.location.city = req.body.location.city;
      if (req.body.location.state) gym.location.state = req.body.location.state;
      if (req.body.location.zipCode) gym.location.zipCode = req.body.location.zipCode;
      if (req.body.location.country) gym.location.country = req.body.location.country;
      if (req.body.location.coordinates) gym.location.coordinates = req.body.location.coordinates;
    }
    
    if (req.body.pointsRequired) gym.pointsRequired = req.body.pointsRequired;
    if (req.body.contactInfo) gym.contactInfo = req.body.contactInfo;
    if (req.body.openingHours) gym.openingHours = req.body.openingHours;
    if (req.body.amenities) gym.amenities = req.body.amenities;
    
    // Only super admin can change active status
    if (req.user.role === ROLES.SUPER_ADMIN && req.body.isActive !== undefined) {
      gym.isActive = req.body.isActive;
    }
    
    await gym.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        gym
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete gym
 * @route   DELETE /api/gyms/:id
 * @access  Private (Super Admin)
 */
exports.deleteGym = async (req, res, next) => {
  try {
    const gymId = req.params.id;
    
    // Find gym
    const gym = await Gym.findById(gymId);
    
    if (!gym) {
      return res.status(404).json({
        status: 'error',
        message: 'Gym not found'
      });
    }
    
    // Remove gym from assigned users
    await User.updateMany(
      { assignedGyms: gymId },
      { $pull: { assignedGyms: gymId } }
    );
    
    // Delete gym
    await gym.deleteOne();
    
    res.status(200).json({
      status: 'success',
      message: 'Gym deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign admin to gym
 * @route   POST /api/gyms/:id/admins
 * @access  Private (Super Admin)
 */
exports.assignAdmin = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const gymId = req.params.id;
    
    if (!userId) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID is required'
      });
    }
    
    // Find gym
    const gym = await Gym.findById(gymId);
    
    if (!gym) {
      return res.status(404).json({
        status: 'error',
        message: 'Gym not found'
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
    
    // Check if user is admin or gym user
    if (user.role !== ROLES.ADMIN && user.role !== ROLES.GYM) {
      return res.status(400).json({
        status: 'error',
        message: 'User must be an admin or gym user'
      });
    }
    
    // Add gym to user's assigned gyms
    if (!user.assignedGyms.includes(gymId)) {
      user.assignedGyms.push(gymId);
      await user.save();
    }
    
    // Add user to gym's admins
    if (!gym.admins.includes(userId)) {
      gym.admins.push(userId);
      await gym.save();
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Admin assigned to gym successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove admin from gym
 * @route   DELETE /api/gyms/:id/admins/:userId
 * @access  Private (Super Admin)
 */
exports.removeAdmin = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const gymId = req.params.id;
    
    // Find gym
    const gym = await Gym.findById(gymId);
    
    if (!gym) {
      return res.status(404).json({
        status: 'error',
        message: 'Gym not found'
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
    
    // Remove gym from user's assigned gyms
    user.assignedGyms = user.assignedGyms.filter(
      id => id.toString() !== gymId
    );
    await user.save();
    
    // Remove user from gym's admins
    gym.admins = gym.admins.filter(
      id => id.toString() !== userId
    );
    await gym.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Admin removed from gym successfully'
    });
  } catch (error) {
    next(error);
  }
};
