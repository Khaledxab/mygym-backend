const express = require('express');
const { check } = require('express-validator');
const gymController = require('../controllers/gymController');
const { protect, restrictTo } = require('../middleware/auth');
const { hasPermission, canManageGym } = require('../middleware/roleCheck');
const { ROLES } = require('../config/roles');

const router = express.Router();

// Protect all routes
router.use(protect);

// Gym creation validation
const gymValidation = [
  check('name', 'Name is required').not().isEmpty(),
  check('location.address', 'Address is required').not().isEmpty(),
  check('location.city', 'City is required').not().isEmpty(),
  check('location.state', 'State is required').not().isEmpty(),
  check('location.zipCode', 'Zip code is required').not().isEmpty(),
  check('location.country', 'Country is required').not().isEmpty(),
  check('pointsRequired', 'Points required must be a positive number').optional().isInt({ min: 0 })
];

// Routes
router.post(
  '/',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  hasPermission('CREATE_GYM'),
  gymValidation,
  gymController.createGym
);

router.get('/', gymController.getAllGyms);

router.get('/:id', gymController.getGymById);

router.put(
  '/:id',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  hasPermission('UPDATE_GYM'),
  canManageGym,
  gymController.updateGym
);

router.delete(
  '/:id',
  restrictTo(ROLES.SUPER_ADMIN),
  hasPermission('DELETE_GYM'),
  gymController.deleteGym
);

// Admin management routes
router.post(
  '/:id/admins',
  restrictTo(ROLES.SUPER_ADMIN),
  hasPermission('MANAGE_ADMINS'),
  gymController.assignAdmin
);

router.delete(
  '/:id/admins/:userId',
  restrictTo(ROLES.SUPER_ADMIN),
  hasPermission('MANAGE_ADMINS'),
  gymController.removeAdmin
);

module.exports = router;
