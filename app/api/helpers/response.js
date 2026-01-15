/**
 * app/api/helpers/response.js
 * 
 * Response Formatting Helper Functions
 * - Format success responses
 * - Format error responses
 * - Format validation errors
 * - Consistent response structure
 */

/**
 * Format success response
 * @param {any} data - Response data
 * @param {string} message - Optional message
 * @param {Object} meta - Optional metadata
 */
function successResponse(data, message = 'Success', meta = {}) {
  return {
    status: 'success',
    message,
    data,
    meta,
    timestamp: new Date().toISOString()
  };
}

/**
 * Format error response
 * @param {string} error - Error message
 * @param {string} errorType - Error type/code
 * @param {Object} details - Additional error details
 */
function errorResponse(error, errorType = 'unknown', details = {}) {
  return {
    status: 'error',
    error,
    errorType,
    details,
    timestamp: new Date().toISOString()
  };
}

/**
 * Format validation error response
 * @param {Array|Object} errors - Validation errors
 */
function validationErrorResponse(errors) {
  return {
    status: 'error',
    error: 'Validation failed',
    errorType: 'validation',
    errors: Array.isArray(errors) ? errors : [errors],
    timestamp: new Date().toISOString()
  };
}

/**
 * Format paginated response
 * @param {Array} data - Array of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 */
function paginatedResponse(data, page, limit, total) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    status: 'success',
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    },
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  successResponse,
  errorResponse,
  validationErrorResponse,
  paginatedResponse
};
