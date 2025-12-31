/**
 * Centralized Logging System
 * Tracks all requests, responses, errors with timestamps
 */

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log file paths
const logFiles = {
  request: path.join(logsDir, 'requests.log'),
  error: path.join(logsDir, 'errors.log'),
  kv: path.join(logsDir, 'kv-operations.log'),
  auth: path.join(logsDir, 'auth.log')
};

/**
 * Format timestamp
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Format log message
 */
function formatLog(level, category, message, data = {}) {
  return JSON.stringify({
    timestamp: getTimestamp(),
    level,
    category,
    message,
    data,
    pid: process.pid,
    env: process.env.NODE_ENV || 'development'
  });
}

/**
 * Write to file
 */
function writeLog(logType, level, category, message, data) {
  try {
    const logFile = logFiles[logType] || logFiles.request;
    const logLine = formatLog(level, category, message, data) + '\n';
    
    fs.appendFileSync(logFile, logLine, { flag: 'a' });
    
    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
      const color = {
        ERROR: '\x1b[31m',
        WARN: '\x1b[33m',
        INFO: '\x1b[36m',
        DEBUG: '\x1b[90m',
        SUCCESS: '\x1b[32m'
      }[level] || '\x1b[0m';
      const reset = '\x1b[0m';
      
      console.log(`${color}[${level}] ${category}: ${message}${reset}`, 
        Object.keys(data).length > 0 ? data : '');
    }
  } catch (error) {
    console.error('LOGGER ERROR:', error.message);
  }
}

const logger = {
  // REQUEST LOGGING
  request: (method, path, statusCode, duration, details = {}) => {
    writeLog('request', statusCode >= 400 ? 'WARN' : 'INFO', 'REQUEST', 
      `${method} ${path} - ${statusCode}ms`, 
      { method, path, statusCode, duration, ...details });
  },

  // RESPONSE LOGGING
  response: (method, path, statusCode, responseSize, duration) => {
    writeLog('request', statusCode >= 400 ? 'WARN' : 'INFO', 'RESPONSE',
      `${method} ${path} returned ${statusCode}`,
      { method, path, statusCode, responseSize, duration });
  },

  // ERROR LOGGING
  error: (category, message, error, context = {}) => {
    writeLog('error', 'ERROR', category, message,
      {
        error: error?.message || error,
        stack: error?.stack,
        ...context
      });
  },

  // KV OPERATIONS LOGGING
  kv: (operation, key, success, duration, error = null) => {
    writeLog('kv', success ? 'INFO' : 'ERROR', 'KV_OPERATION',
      `${operation} ${key} - ${success ? 'SUCCESS' : 'FAILED'}`,
      { operation, key, success, duration, error });
  },

  // AUTH LOGGING
  auth: (event, username, success, details = {}) => {
    writeLog('auth', success ? 'SUCCESS' : 'WARN', 'AUTH', 
      `${event} for ${username} - ${success ? 'SUCCESS' : 'FAILED'}`,
      { event, username, success, ...details });
  },

  // DEBUG LOGGING
  debug: (category, message, data = {}) => {
    writeLog('request', 'DEBUG', category, message, data);
  },

  // INFO LOGGING
  info: (category, message, data = {}) => {
    writeLog('request', 'INFO', category, message, data);
  },

  // WARNING LOGGING
  warn: (category, message, data = {}) => {
    writeLog('request', 'WARN', category, message, data);
  },

  // SUCCESS LOGGING
  success: (category, message, data = {}) => {
    writeLog('request', 'SUCCESS', category, message, data);
  }
};

module.exports = logger;
