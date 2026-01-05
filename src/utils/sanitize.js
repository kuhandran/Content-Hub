/**
 * Input Sanitization Utility
 * Prevents XSS attacks by sanitizing user input
 */

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Sanitize object by escaping all string values
 * @param {Object} obj - Object to sanitize
 * @returns {Object} - Sanitized object
 */
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const sanitized = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === 'string') {
        sanitized[key] = escapeHtml(obj[key]);
      } else if (typeof obj[key] === 'object') {
        sanitized[key] = sanitizeObject(obj[key]);
      } else {
        sanitized[key] = obj[key];
      }
    }
  }

  return sanitized;
}

/**
 * Validate and sanitize filename
 * @param {string} filename - Filename to validate
 * @returns {string|null} - Sanitized filename or null if invalid
 */
function sanitizeFilename(filename) {
  if (typeof filename !== 'string') return null;
  
  // Remove any path traversal attempts
  filename = filename.replace(/\.\./g, '');
  
  // Allow only alphanumeric, dash, underscore, dot
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '');
  
  return sanitized || null;
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize URL
 * @param {string} url - URL to sanitize
 * @returns {string|null} - Sanitized URL or null if invalid
 */
function sanitizeUrl(url) {
  if (typeof url !== 'string') return null;
  
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

module.exports = {
  escapeHtml,
  sanitizeObject,
  sanitizeFilename,
  isValidEmail,
  sanitizeUrl
};
