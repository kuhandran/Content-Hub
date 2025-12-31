const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ALLOWED_IPS = (process.env.ALLOWED_IPS || '').split(',').map(ip => ip.trim()).filter(ip => ip);
const AUTH_USER = process.env.AUTH_USER;
const AUTH_PASS = process.env.AUTH_PASS;

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         req.ip;
}

function isIpAllowed(clientIp) {
  // Normalize localhost
  const normalizedIp = clientIp === 'localhost' || clientIp === '::1' || clientIp === '127.0.0.1' ? '::1' : clientIp;
  
  return ALLOWED_IPS.some(allowedIp => {
    const normalizedAllowed = allowedIp === 'localhost' ? '::1' : allowedIp;
    return normalizedIp === normalizedAllowed;
  });
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const clientIp = getClientIp(req);

  console.log(`\n[AUTH] 🔐 LOGIN REQUEST RECEIVED`);
  console.log(`[AUTH] ├─ Username: ${username}`);
  console.log(`[AUTH] ├─ Password: ${password ? '***' : 'MISSING'}`);
  console.log(`[AUTH] ├─ Client IP: ${clientIp}`);
  console.log(`[AUTH] └─ Allowed IPs: [${ALLOWED_IPS.join(', ')}]`);

  // Verify IP
  if (!isIpAllowed(clientIp)) {
    console.log(`[AUTH] ❌ IP REJECTED - ${clientIp} not in allowed list`);
    return res.status(403).json({ error: 'IP not allowed' });
  }

  console.log(`[AUTH] ✅ IP Verified: ${clientIp}`);

  // Verify credentials
  if (username !== AUTH_USER) {
    console.log(`[AUTH] ❌ INVALID USERNAME - Expected: ${AUTH_USER}, Got: ${username}`);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (password !== AUTH_PASS) {
    console.log(`[AUTH] ❌ INVALID PASSWORD for user ${username}`);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  console.log(`[AUTH] ✅ Credentials Verified for ${username}`);

  // Create JWT token
  const token = jwt.sign(
    { 
      username, 
      ip: clientIp, 
      loginTime: new Date(),
      id: Math.random().toString(36).substr(2, 9)
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  console.log(`[AUTH] ✅ JWT Token Created`);
  console.log(`[AUTH] ├─ Token length: ${token.length} chars`);
  console.log(`[AUTH] ├─ User: ${username}`);
  console.log(`[AUTH] ├─ IP: ${clientIp}`);
  console.log(`[AUTH] └─ Expiry: 24 hours`);

  // Set token as cookie and in response
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });

  console.log(`[AUTH] ✅ Cookie set - auth_token (24h expiry)`);
  console.log(`[AUTH] ✅ Sending response with token to client\n`);

  res.json({
    success: true,
    token,
    user: { username },
    message: 'Login successful'
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ 
    success: true, 
    message: 'Logout successful' 
  });
});

// GET /api/auth/verify
router.get('/verify', (req, res) => {
  let token = null;

  // Check for token in multiple places
  if (req.cookies?.auth_token) {
    token = req.cookies.auth_token;
  } else if (req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      token = authHeader;
    }
  }

  if (!token) {
    return res.status(401).json({ valid: false });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ valid: false });
  }
});

module.exports = router;
