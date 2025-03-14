const express = require('express');
const { check } = require('express-validator');
const transactionController = require('../controllers/transactionController');
const { protect, restrictTo } = require('../middleware/auth');
const { hasPermission } = require('../middleware/roleCheck');
const { ROLES } = require('../config/roles');

const router = express.Router();

// Protect all routes
router.use(protect);

// Transaction creation validation
const createTransactionValidation = [
  check('userId', 'User ID is required').not().isEmpty(),
  check('gymId', 'Gym ID is required').not().isEmpty(),
  check('points', 'Points must be a positive number').isInt({ min: 1 }),
  check('type', 'Type must be either EARN or SPEND').isIn(['EARN', 'SPEND'])
];

// Routes
router.get(
  '/',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  hasPermission('VIEW_ALL_TRANSACTIONS'),
  transactionController.getAllTransactions
);

router.post(
  '/',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GYM),
  hasPermission('CREATE_TRANSACTION'),
  createTransactionValidation,
  transactionController.createTransaction
);

router.get(
  '/user/:userId',
  transactionController.getUserTransactions
);

router.get(
  '/gym/:gymId',
  transactionController.getGymTransactions
);

router.get(
  '/:id',
  transactionController.getTransactionById
);

module.exports = router;
