/**
 * app/api/helpers/auth.js
 * 
 * Authentication Helper Functions
 * - Verify JWT tokens
 * - Extract user from token
 * - Check authorization
 * - Format auth responses
 */

const jwtManager = require('../../../lib/jwt-manager');

/**
 * Verify JWT token from request
 * @param {Object} request - Next.js request object
 * @returns {Object} { ok, user, error }
 */
function verifyJWTToken(request) {
  try {
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
    if (!authHeader) {
      console.warn('[AUTH_HELPER] No Authorization header found');
      return { ok: false, error: 'No authorization header' };
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      console.warn('[AUTH_HELPER] Invalid Authorization header format');
      return { ok: false, error: 'Invalid authorization header' };
    }

    const token = parts[1];
    const decoded = jwtManager.verifyToken(token);
    
    if (!decoded) {
      console.warn('[AUTH_HELPER] JWT verification failed - token invalid or expired');
      return { ok: false, error: 'Invalid or expired token' };
    }

    console.log('[AUTH_HELPER] ✓ JWT verified for user:', decoded.uid);
    return { ok: true, user: decoded };
  } catch (error) {
    console.error('[AUTH_HELPER] JWT verification error:', error.message);
    return { ok: false, error: error.message };
  }
}

/**
 * Format unauthorized error response
 * @returns {Object} Error response object
 */
function unauthorizedError() {
  return {
    status: 'error',
    error: 'Unauthorized',
    timestamp: new Date().toISOString()
  };
}

/**
 * Format authentication error response
 * @param {string} message - Error message
 * @returns {Object} Error response object
 */
function authErrorResponse(message) {
  return {
    status: 'error',
    error: message || 'Authentication failed',
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  verifyJWTToken,
  unauthorizedError,
  authErrorResponse
};
