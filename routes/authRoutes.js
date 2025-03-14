const express = require('express');
const { check } = require('express-validator');
const authController = require('../controllers/authController');
const { protect, restrictTo } = require('../middleware/auth');
const { ROLES } = require('../config/roles');

const router = express.Router();

// Registration validation
const registerValidation = [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
];

// Admin registration validation (includes role)
const adminRegisterValidation = [
  ...registerValidation,
  check('role', 'Role is required').isIn(Object.values(ROLES))
];

// Route for public registration (only USER role)
router.post('/register', registerValidation, authController.registerUser);

// Route for admin registration (restricted by role)
router.post(
  '/register-admin', 
  protect, 
  restrictTo(ROLES.SUPER_ADMIN), 
  adminRegisterValidation, 
  authController.registerAdmin
);

// Login validation
const loginValidation = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
];

// Change password validation
const changePasswordValidation = [
  check('currentPassword', 'Current password is required').exists(),
  check('newPassword', 'New password must be at least 6 characters').isLength({ min: 6 })
];

// Routes
router.post('/login', loginValidation, authController.login);
router.get('/me', protect, authController.getCurrentUser);
router.post('/refresh-token', protect, authController.refreshToken);
router.put('/change-password', protect, changePasswordValidation, authController.changePassword);

module.exports = router;