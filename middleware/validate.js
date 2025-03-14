const { validationResult } = require('express-validator');

/**
 * Middleware to validate request body against schema
 * Uses express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      errors: errors.array()
    });
  }
  next();
};

module.exports = validate;
