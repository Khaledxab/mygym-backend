const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique QR code for a gym
 * @param {Object} gym - Gym object
 * @returns {Object} QR data with code, imageUrl and expiry
 */
const generateGymQRCode = async (gym) => {
  try {
    // Generate a unique code
    const qrId = uuidv4();
    
    // Create payload with gym data
    const payload = {
      id: qrId,
      gymId: gym._id.toString(),
      name: gym.name,
      pointsRequired: gym.pointsRequired,
      timestamp: new Date().toISOString()
    };
    
    // Convert payload to string
    const payloadString = JSON.stringify(payload);
    
    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(payloadString, {
      errorCorrectionLevel: 'H',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    // Set expiry date (from env variable, default 24h)
    const expiryHours = parseInt(process.env.QR_CODE_EXPIRY) || 24;
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + expiryHours);
    
    return {
      code: qrId,
      data: payloadString,
      imageUrl: qrCodeDataURL,
      expiresAt: expiryDate
    };
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

/**
 * Verify a QR code payload
 * @param {Object} payload - QR code payload
 * @param {Object} gym - Gym object to verify against
 * @returns {Boolean} True if valid, false otherwise
 */
const verifyQRCode = (payload, gym) => {
  try {
    // Check if payload contains required fields
    if (!payload || !payload.id || !payload.gymId) {
      return false;
    }
    
    // Verify gym ID matches
    if (payload.gymId !== gym._id.toString()) {
      return false;
    }
    
    // Check if QR code has expired in the gym record
    if (gym.qrCode && gym.isQRCodeExpired()) {
      return false;
    }
    
    // Verify QR code ID matches the one stored in gym
    if (gym.qrCode && payload.id !== gym.qrCode.code) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error verifying QR code:', error);
    return false;
  }
};

module.exports = {
  generateGymQRCode,
  verifyQRCode
};
