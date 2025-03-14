const { PERMISSIONS } = require('../config/roles');

/**
 * Middleware to check if user has the required permission
 * @param {string} permission - Permission to check
 */
const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
    }
    
    const userRole = req.user.role;
    const allowedRoles = PERMISSIONS[permission] || [];
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action'
      });
    }
    
    next();
  };
};

/**
 * Middleware to check if user can manage a specific gym
 * Admins can only manage gyms they are assigned to
 * Super admins can manage any gym
 */
const canManageGym = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
    }
    
    const gymId = req.params.id || req.body.gymId;
    
    if (!gymId) {
      return res.status(400).json({
        status: 'error',
        message: 'Gym ID is required'
      });
    }
    
    // Super admins can manage any gym
    if (req.user.role === 'super_admin') {
      return next();
    }
    
    // Admins can only manage assigned gyms
    if (req.user.role === 'admin') {
      const isAssigned = req.user.assignedGyms.some(
        gym => gym.toString() === gymId.toString()
      );
      
      if (!isAssigned) {
        return res.status(403).json({
          status: 'error',
          message: 'You are not assigned to this gym'
        });
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user can manage a specific user
 * Admins can only manage users assigned to their gyms
 * Super admins can manage any user
 */
const canManageUser = async (req, res, next) => {
  try {
    const User = require('../models/User');
    
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
    }
    
    const targetUserId = req.params.id;
    
    if (!targetUserId) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID is required'
      });
    }
    
    // Users can only manage themselves
    if (req.user.role === 'user') {
      if (req.user._id.toString() !== targetUserId) {
        return res.status(403).json({
          status: 'error',
          message: 'You can only manage your own account'
        });
      }
      return next();
    }
    
    // Super admins can manage any user
    if (req.user.role === 'super_admin') {
      return next();
    }
    
    // Get target user
    const targetUser = await User.findById(targetUserId);
    
    if (!targetUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Cannot manage users with higher roles
    if (
      (req.user.role === 'admin' && ['super_admin', 'admin'].includes(targetUser.role)) ||
      (req.user.role === 'gym' && ['super_admin', 'admin', 'gym'].includes(targetUser.role))
    ) {
      return res.status(403).json({
        status: 'error',
        message: 'You cannot manage users with equal or higher roles'
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  hasPermission,
  canManageGym,
  canManageUser
};
