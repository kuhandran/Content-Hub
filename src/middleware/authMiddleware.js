const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

module.exports = (req, res, next) => {
  let token = null;
  let tokenSource = null;

  console.log(`\n[AUTH] 🔍 Middleware - Checking authentication for ${req.method} ${req.path}`);

  // Check for token in multiple places
  if (req.cookies?.auth_token) {
    token = req.cookies.auth_token;
    tokenSource = 'cookie';
    console.log(`[AUTH] ├─ Token found in: cookie`);
  } else if (req.headers.authorization) {
    const authHeader = req.headers.authorization;
    console.log(`[AUTH] ├─ Authorization header: ${authHeader.substring(0, 20)}...`);
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      tokenSource = 'Authorization header (Bearer)';
      console.log(`[AUTH] ├─ Token extracted from Bearer header`);
    } else {
      token = authHeader;
      tokenSource = 'Authorization header (raw)';
      console.log(`[AUTH] ├─ Token extracted from Authorization header`);
    }
  } else {
    console.log(`[AUTH] ├─ Cookies:`, Object.keys(req.cookies || {}));
    console.log(`[AUTH] ├─ Auth header present: ${!!req.headers.authorization}`);
  }

  if (!token) {
    console.log(`[AUTH] ❌ NO TOKEN PROVIDED\n`);
    // Redirect browser requests to /login, return JSON for API requests
    if (req.accepts('html')) {
      return res.redirect('/login');
    }
    return res.status(401).json({ error: 'Unauthorized - No token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log(`[AUTH] ✅ Token verified from ${tokenSource}`);
    console.log(`[AUTH] ├─ User: ${decoded.username}`);
    console.log(`[AUTH] ├─ IP: ${decoded.ip}`);
    console.log(`[AUTH] └─ Login time: ${decoded.loginTime}\n`);
    req.user = decoded;
    next();
  } catch (error) {
    console.log(`[AUTH] ❌ Token verification failed: ${error.message}\n`);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
