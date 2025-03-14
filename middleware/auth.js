const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ROLE_HIERARCHY } = require('../config/roles');

/**
 * Middleware to verify JWT token
 * Attaches user to request object if valid token found
 */
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Get token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized to access this resource'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user with the id in the token
    const user = await User.findById(decoded.id);
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found or token is invalid'
      });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        status: 'error',
        message: 'User account is disabled'
      });
    }
    
    // Update last login if needed
    if (!user.lastLogin || new Date() - user.lastLogin > 24 * 60 * 60 * 1000) {
      user.lastLogin = new Date();
      await user.save();
    }
    
    // Add user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expired'
      });
    }
    
    return res.status(500).json({
      status: 'error',
      message: 'Authentication error'
    });
  }
};

/**
 * Middleware to restrict access based on user roles
 * @param {string[]} roles - Array of allowed roles
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
    }
    
    // Check if user's role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action'
      });
    }
    
    next();
  };
};

/**
 * Middleware to check if user has the required permissions
 * based on role hierarchy
 * @param {string} requiredRole - Minimum role required
 */
exports.hasRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
    }
    
    const userRole = req.user.role;
    const allowedRoles = ROLE_HIERARCHY[userRole] || [];
    
    if (!allowedRoles.includes(requiredRole)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action'
      });
    }
    
    next();
  };
};

/**
 * Middleware to check if user is assigned to a gym or is an admin
 * @param {string} gymIdParam - Parameter name containing the gym ID
 */
exports.isAssignedToGym = (gymIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'User not authenticated'
        });
      }
      
      const gymId = req.params[gymIdParam];
      
      // Super admins and admins can access all gyms
      if (req.user.role === 'super_admin' || req.user.role === 'admin') {
        return next();
      }
      
      // Check if gym user is assigned to this gym
      if (req.user.role === 'gym' && !req.user.assignedGyms.includes(gymId)) {
        return res.status(403).json({
          status: 'error',
          message: 'You are not assigned to this gym'
        });
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};
