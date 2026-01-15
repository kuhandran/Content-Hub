/**
 * utils/auth.js
 * 
 * Client-side JWT Authentication Helper
 * - Store JWT in localStorage
 * - Retrieve JWT from localStorage
 * - Add JWT to API request headers
 * - Check if user is authenticated
 * - Logout and clear token
 */

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

/**
 * Store JWT token in localStorage
 * @param {string} token - JWT token
 */
export function setAuthToken(token) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
    console.log('[AUTH] Token stored in localStorage');
  }
}

/**
 * Get JWT token from localStorage
 * @returns {string|null} JWT token or null if not found
 */
export function getAuthToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

/**
 * Store user info in localStorage
 * @param {Object} user - User object
 */
export function setUserInfo(user) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    console.log('[AUTH] User info stored in localStorage');
  }
}

/**
 * Get user info from localStorage
 * @returns {Object|null} User object or null if not found
 */
export function getUserInfo() {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  }
  return null;
}

/**
 * Check if user is authenticated
 * @returns {boolean} true if token exists
 */
export function isAuthenticated() {
  return !!getAuthToken();
}

/**
 * Clear authentication data
 */
export function clearAuth() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    console.log('[AUTH] Authentication cleared');
  }
}

/**
 * Get authorization header for API requests
 * @returns {Object} Headers object with Authorization
 */
export function getAuthHeaders() {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
}

/**
 * Make authenticated API call
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise} API response
 */
export async function authenticatedFetch(url, options = {}) {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  // If unauthorized, clear auth and redirect to login
  if (response.status === 401) {
    console.warn('[AUTH] Unauthorized - clearing auth and redirecting to login');
    clearAuth();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  return response;
}

/**
 * Decode JWT token to extract payload (for client-side debugging)
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded payload
 */
export function decodeToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (err) {
    console.error('[AUTH] Failed to decode token:', err);
    return null;
  }
}

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} true if token is expired
 */
export function isTokenExpired(token) {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
}

/**
 * Get time until token expires (in seconds)
 * @returns {number} Seconds until expiry
 */
export function getTokenExpiryTime() {
  const token = getAuthToken();
  if (!token) return 0;

  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return 0;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  return Math.max(0, decoded.exp - currentTime);
}
