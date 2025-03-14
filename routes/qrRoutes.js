const express = require('express');
const { check } = require('express-validator');
const qrController = require('../controllers/qrController');
const { protect, restrictTo } = require('../middleware/auth');
const { hasPermission } = require('../middleware/roleCheck');
const { ROLES } = require('../config/roles');

const router = express.Router();

// Protect all routes
router.use(protect);

// QR code scan validation
const scanValidation = [
  check('qrData', 'QR code data is required').not().isEmpty(),
  check('deviceInfo', 'Device information is required').not().isEmpty()
];

// Routes
router.get(
  '/generate/:gymId',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GYM),
  hasPermission('GENERATE_QR'),
  qrController.generateQRCode
);

router.post(
  '/scan',
  restrictTo(ROLES.USER),
  scanValidation,
  qrController.scanQRCode
);

router.get(
  '/status/:gymId',
  restrictTo(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GYM),
  qrController.getQRStatus
);

module.exports = router;
