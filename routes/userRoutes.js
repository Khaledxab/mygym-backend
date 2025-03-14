const express = require('express');
const { check } = require('express-validator');
const userController = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');
const { canManageUser } = require('../middleware/roleCheck');
const { ROLES } = require('../config/roles');

const router = express.Router();

// Protect all routes
router.use(protect);

// User update validation
const userUpdateValidation = [
  check('name', 'Name must not be empty if provided').optional().not().isEmpty(),
  check('email', 'Please include a valid email').optional().isEmail()
];

// Routes
router.get(
  '/',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  userController.getAllUsers
);

router.get(
  '/gym/:gymId',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GYM),
  userController.getUsersByGym
);

router.get(
  '/:id',
  userController.getUserById
);

router.put(
  '/:id',
  userUpdateValidation,
  canManageUser,
  userController.updateUser
);

router.delete(
  '/:id',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  canManageUser,
  userController.deleteUser
);

// Points management
router.get(
  '/:id/points',
  userController.getUserPoints
);

router.post(
  '/:id/points',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  check('points', 'Points must be a positive number').isInt({ min: 1 }),
  userController.addPoints
);

module.exports = router;
