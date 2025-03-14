/**
 * Standardized API response handler
 */

/**
 * Success response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {Object} data - Response data
 */
exports.success = (res, statusCode = 200, message = 'Success', data = {}) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data
  });
};

/**
 * Error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Array} errors - Validation errors
 */
exports.error = (res, statusCode = 500, message = 'Error', errors = []) => {
  return res.status(statusCode).json({
    status: 'error',
    message,
    errors: errors.length > 0 ? errors : undefined
  });
};

/**
 * Not found response
 * @param {Object} res - Express response object
 * @param {string} message - Not found message
 */
exports.notFound = (res, message = 'Resource not found') => {
  return res.status(404).json({
    status: 'error',
    message
  });
};

/**
 * Unauthorized response
 * @param {Object} res - Express response object
 * @param {string} message - Unauthorized message
 */
exports.unauthorized = (res, message = 'Not authorized to access this resource') => {
  return res.status(401).json({
    status: 'error',
    message
  });
};

/**
 * Forbidden response
 * @param {Object} res - Express response object
 * @param {string} message - Forbidden message
 */
exports.forbidden = (res, message = 'You do not have permission to perform this action') => {
  return res.status(403).json({
    status: 'error',
    message
  });
};

/**
 * Bad request response
 * @param {Object} res - Express response object
 * @param {string} message - Bad request message
 * @param {Array} errors - Validation errors
 */
exports.badRequest = (res, message = 'Bad request', errors = []) => {
  return res.status(400).json({
    status: 'error',
    message,
    errors: errors.length > 0 ? errors : undefined
  });
};
