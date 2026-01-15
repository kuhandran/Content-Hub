/**
 * utils/auth.js
 * 
 * Client-side JWT Authentication Helper
 * - Store JWT in localStorage
 * - Retrieve JWT from localStorage
 * - Add JWT to API request headers
 * - Check if user is authenticated
 * - Logout and clear token with detailed logging
 */

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const LOGOUT_LOG_KEY = 'logout_logs';

/**
 * Log logout events with detailed information
 * @param {string} reason - Why logout happened
 * @param {Object} details - Additional context
 */
export function logLogoutEvent(reason, details = {}) {
  if (typeof window === 'undefined') return;
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    reason,
    details,
    url: window.location.href,
    userAgent: navigator.userAgent,
    tokenExists: !!getAuthToken(),
    userExists: !!getUserInfo()
  };

  try {
    // Get existing logs
    const existingLogs = localStorage.getItem(LOGOUT_LOG_KEY);
    const logs = existingLogs ? JSON.parse(existingLogs) : [];
    
    // Add new log
    logs.push(logEntry);
    
    // Keep only last 50 logout events
    if (logs.length > 50) {
      logs.shift();
    }
    
    localStorage.setItem(LOGOUT_LOG_KEY, JSON.stringify(logs));
  } catch (err) {
    console.error('[AUTH] Failed to save logout log:', err);
  }

  // Log to console with color coding
  console.group(`%c🔴 FORCED LOGOUT: ${reason}`, 'color: #ff4444; font-weight: bold; font-size: 12px;');
  console.log('%cTimestamp:', 'font-weight: bold;', logEntry.timestamp);
  console.log('%cURL:', 'font-weight: bold;', logEntry.url);
  console.log('%cDetails:', 'font-weight: bold;', details);
  console.log('%cToken Status:', 'font-weight: bold;', logEntry.tokenExists ? '✓ Exists' : '✗ Missing');
  console.log('%cUser Status:', 'font-weight: bold;', logEntry.userExists ? '✓ Exists' : '✗ Missing');
  console.groupEnd();
}

/**
 * Get all logout logs
 * @returns {Array} Array of logout events
 */
export function getLogoutLogs() {
  if (typeof window === 'undefined') return [];
  try {
    const logs = localStorage.getItem(LOGOUT_LOG_KEY);
    return logs ? JSON.parse(logs) : [];
  } catch (err) {
    console.error('[AUTH] Failed to retrieve logout logs:', err);
    return [];
  }
}

/**
 * Clear logout logs
 */
export function clearLogoutLogs() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LOGOUT_LOG_KEY);
    console.log('[AUTH] Logout logs cleared');
  }
}

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
 * Clear authentication data with detailed logging
 * @param {string} reason - Why authentication is being cleared
 * @param {Object} details - Additional context about the logout
 */
export function clearAuth(reason = 'Manual logout', details = {}) {
  if (typeof window !== 'undefined') {
    const userInfo = getUserInfo();
    const token = getAuthToken();
    
    // Log the event before clearing
    logLogoutEvent(reason, {
      ...details,
      userEmail: userInfo?.email,
      userId: userInfo?.id,
      tokenLength: token ? token.length : 0
    });
    
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    
    console.log(`[AUTH] ✓ Authentication cleared - Reason: ${reason}`);
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
 * Make authenticated API call with detailed error logging
 * @param {string} url - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise} API response
 */
export async function authenticatedFetch(url, options = {}) {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers
  };

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers
    });

    // If unauthorized, clear auth and redirect to login
    if (response.status === 401) {
      let errorDetails = {};
      try {
        const data = await response.json();
        errorDetails.serverError = data.error || 'Unauthorized';
      } catch {
        errorDetails.serverError = 'Could not parse error response';
      }

      console.error('[AUTH] 401 Unauthorized - API Response:', errorDetails);
      
      clearAuth('Session Expired (401)', {
        endpoint: url,
        method: options.method || 'GET',
        serverMessage: errorDetails.serverError,
        tokenExpired: isTokenExpired(getAuthToken())
      });

      if (typeof window !== 'undefined') {
        // Use replace to prevent going back to protected page
        window.location.replace('/login?reason=session_expired');
      }
      // Throw error to prevent further processing
      throw new Error('Unauthorized - Session expired');
    }

    // Log failed responses (4xx, 5xx)
    if (!response.ok && response.status !== 401) {
      console.warn(`[AUTH] API Error - ${response.status} ${response.statusText}`, {
        url,
        method: options.method || 'GET',
        status: response.status
      });
    }

  } catch (error) {
    // Network errors or other fetch issues
    console.error('[AUTH] Fetch Error:', {
      url,
      error: error.message,
      type: error.name
    });
    throw error;
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
