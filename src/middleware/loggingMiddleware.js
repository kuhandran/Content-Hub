/**
 * Request/Response Logging Middleware
 * Logs all incoming requests and responses with timing
 */

const logger = require('../utils/logger');

/**
 * Middleware to log all requests and responses
 */
function requestLoggingMiddleware(req, res, next) {
  const startTime = Date.now();
  
  // Log incoming request
  logger.request(req.method, req.path, 'INCOMING', 0, {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    contentType: req.headers['content-type']
  });

  // Override res.send to log response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    const responseSize = data ? data.length : 0;

    logger.response(req.method, req.path, res.statusCode, responseSize, duration);

    // Log response body in development
    if (process.env.NODE_ENV !== 'production' && res.statusCode >= 400) {
      logger.debug('RESPONSE_BODY', `Error response: ${req.method} ${req.path}`, {
        status: res.statusCode,
        body: typeof data === 'string' ? data.substring(0, 500) : data
      });
    }

    return originalSend.call(this, data);
  };

  // Override res.json to log JSON responses
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    const responseSize = JSON.stringify(data).length;

    logger.response(req.method, req.path, res.statusCode, responseSize, duration);

    // Log errors
    if (res.statusCode >= 400) {
      logger.debug('RESPONSE_JSON', `Error response: ${req.method} ${req.path}`, {
        status: res.statusCode,
        error: data?.error || data?.message
      });
    }

    return originalJson.call(this, data);
  };

  next();
}

module.exports = requestLoggingMiddleware;
