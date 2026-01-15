/**
 * lib/jwt-manager.js
 * 
 * JWT Token Management
 * - Generate JWT tokens with user data
 * - Validate JWT tokens
 * - Decode JWT tokens
 * - Handle token expiration
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY = '24h'; // Token expires in 24 hours

/**
 * Generate a JWT token
 * @param {Object} payload - Data to encode in token
 * @returns {string} JWT token
 */
function generateToken(payload) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  const tokenPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000), // issued at
  };

  return jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
    algorithm: 'HS256'
  });
}

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
function verifyToken(token) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256']
    });
    return decoded;
  } catch (err) {
    console.error('[JWT_ERROR]', err.message);
    return null;
  }
}

/**
 * Decode a JWT token without verification (for debugging)
 * @param {string} token - JWT token to decode
 * @returns {Object|null} Decoded token payload or null if invalid
 */
function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch (err) {
    return null;
  }
}

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} true if token is expired
 */
function isTokenExpired(token) {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
}

/**
 * Get token expiry time in seconds
 * @param {string} token - JWT token
 * @returns {number} Seconds until expiry
 */
function getTokenExpiryTime(token) {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return 0;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  return Math.max(0, decoded.exp - currentTime);
}

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  isTokenExpired,
  getTokenExpiryTime
};
