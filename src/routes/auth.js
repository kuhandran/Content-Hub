const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ALLOWED_IPS = (process.env.ALLOWED_IPS || '').split(',').map(ip => ip.trim()).filter(ip => ip);
const AUTH_USER = process.env.AUTH_USER;
const AUTH_PASS = process.env.AUTH_PASS;
const SKIP_IP_CHECK = process.env.SKIP_IP_CHECK === 'true'; // For Vercel/serverless deployments

function getClientIp(req) {
  const xForwardedFor = req.headers['x-forwarded-for']?.split(',')[0];
  const remoteAddress = req.connection?.remoteAddress || req.socket?.remoteAddress || req.ip;
  const clientIp = xForwardedFor || remoteAddress;
  
  console.log(`[IP_DEBUG] x-forwarded-for: ${xForwardedFor}`);
  console.log(`[IP_DEBUG] remoteAddress: ${remoteAddress}`);
  console.log(`[IP_DEBUG] req.ip: ${req.ip}`);
  console.log(`[IP_DEBUG] Final clientIp: ${clientIp}`);
  console.log(`[IP_DEBUG] All headers:`, req.headers);
  
  return clientIp;
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

  console.log(`[AUTH] 🔐 LOGIN REQUEST RECEIVED`);
  console.log(`[AUTH] ├─ Username: ${username}`);
  console.log(`[AUTH] ├─ Password: ${password ? '***' : 'MISSING'}`);
  console.log(`[AUTH] ├─ Client IP: ${clientIp}`);
  console.log(`[AUTH] ├─ IP Check Enabled: ${!SKIP_IP_CHECK}`);
  console.log(`[AUTH] └─ Allowed IPs: [${ALLOWED_IPS.join(', ')}]`);

  // Verify IP (can be skipped for serverless deployments)
  if (!SKIP_IP_CHECK && !isIpAllowed(clientIp)) {
    console.log(`[AUTH] ❌ IP REJECTED - ${clientIp} not in allowed list`);
    return res.status(403).json({ error: 'IP not allowed' });
  }

  if (!SKIP_IP_CHECK) {
    console.log(`[AUTH] ✅ IP Verified: ${clientIp}`);
  } else {
    console.log(`[AUTH] ⚠️  IP Check Skipped (SKIP_IP_CHECK=true)`);
  }

  // Verify credentials
  if (username !== AUTH_USER) {
    console.log(`[AUTH] ❌ INVALID USERNAME - Expected: ${AUTH_USER}, Got: ${username}`);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Detailed password comparison logging
  console.log(`[AUTH] 🔍 PASSWORD VERIFICATION`);
  console.log(`[AUTH] ├─ Submitted password: "${password}"`);
  console.log(`[AUTH] ├─ Submitted password length: ${password ? password.length : 0}`);
  console.log(`[AUTH] ├─ Submitted password bytes: ${password ? Buffer.from(password).toString('hex') : 'N/A'}`);
  console.log(`[AUTH] ├─ Expected password: "${AUTH_PASS}"`);
  console.log(`[AUTH] ├─ Expected password length: ${AUTH_PASS ? AUTH_PASS.length : 0}`);
  console.log(`[AUTH] ├─ Expected password bytes: ${AUTH_PASS ? Buffer.from(AUTH_PASS).toString('hex') : 'N/A'}`);
  console.log(`[AUTH] ├─ Match result: ${password === AUTH_PASS ? '✅ MATCH' : '❌ NO MATCH'}`);
  
  // Check for common issues
  if (password && AUTH_PASS) {
    const submittedTrimmed = password.trim();
    const expectedTrimmed = AUTH_PASS.trim();
    const trimMatch = submittedTrimmed === expectedTrimmed;
    console.log(`[AUTH] ├─ After trim: ${trimMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
    console.log(`[AUTH] ├─ Has leading/trailing spaces: ${password !== submittedTrimmed}`);
    console.log(`[AUTH] ├─ Case match: ${password === AUTH_PASS}`);
    console.log(`[AUTH] └─ Case insensitive match: ${password.toLowerCase() === AUTH_PASS.toLowerCase()}`);
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
