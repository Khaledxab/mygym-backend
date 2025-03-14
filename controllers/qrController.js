const Gym = require('../models/Gym');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { generateGymQRCode, verifyQRCode } = require('../utils/qrGenerator');

/**
 * @desc    Generate QR code for gym
 * @route   GET /api/qr/generate/:gymId
 * @access  Private (Admin, Gym)
 */
exports.generateQRCode = async (req, res, next) => {
  try {
    const gymId = req.params.gymId;
    
    // Find gym
    const gym = await Gym.findById(gymId);
    if (!gym) {
      return res.status(404).json({
        status: 'error',
        message: 'Gym not found'
      });
    }
    
    // Generate QR code
    const qrData = await generateGymQRCode(gym);
    
    // Update gym with QR code data
    gym.qrCode = {
      code: qrData.code,
      expiresAt: qrData.expiresAt
    };
    
    await gym.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        qrCode: qrData.imageUrl,
        expiresAt: qrData.expiresAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Process QR code scan for gym access
 * @route   POST /api/qr/scan
 * @access  Private (User)
 */
exports.scanQRCode = async (req, res, next) => {
  try {
    const { qrData, deviceInfo, location } = req.body;
    const userId = req.user._id;
    
    // Parse QR data
    let payload;
    try {
      payload = JSON.parse(qrData);
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid QR code data'
      });
    }
    
    // Find gym
    const gym = await Gym.findById(payload.gymId);
    if (!gym) {
      return res.status(404).json({
        status: 'error',
        message: 'Gym not found'
      });
    }
    
    // Verify QR code
    const isValid = verifyQRCode(payload, gym);
    if (!isValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired QR code'
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
    
    // Check if user has enough points
    const pointsRequired = gym.pointsRequired;
    if (user.points < pointsRequired) {
      return res.status(400).json({
        status: 'error',
        message: `Not enough points. Required: ${pointsRequired}, Available: ${user.points}`
      });
    }
    
    // Create transaction
    const transactionData = {
      userId: user._id,
      gymId: gym._id,
      points: pointsRequired,
      type: 'SPEND',
      description: `Gym access: ${gym.name}`,
      metadata: {
        qrCodeId: payload.id,
        deviceInfo,
        location
      }
    };
    
    const transaction = await Transaction.createTransaction(transactionData);
    
    res.status(200).json({
      status: 'success',
      message: 'Access granted',
      data: {
        transaction,
        user: {
          points: user.points - pointsRequired // Show updated points
        },
        gym: {
          name: gym.name,
          pointsRequired
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Check current QR code status
 * @route   GET /api/qr/status/:gymId
 * @access  Private (Admin, Gym)
 */
exports.getQRStatus = async (req, res, next) => {
  try {
    const gymId = req.params.gymId;
    
    // Find gym
    const gym = await Gym.findById(gymId);
    if (!gym) {
      return res.status(404).json({
        status: 'error',
        message: 'Gym not found'
      });
    }
    
    // Check if QR code exists
    if (!gym.qrCode || !gym.qrCode.code) {
      return res.status(200).json({
        status: 'success',
        data: {
          hasQRCode: false,
          message: 'No QR code generated for this gym'
        }
      });
    }
    
    // Check if QR code is expired
    const isExpired = gym.isQRCodeExpired();
    
    res.status(200).json({
      status: 'success',
      data: {
        hasQRCode: true,
        isExpired,
        expiresAt: gym.qrCode.expiresAt,
        message: isExpired ? 'QR code has expired' : 'QR code is valid'
      }
    });
  } catch (error) {
    next(error);
  }
};
