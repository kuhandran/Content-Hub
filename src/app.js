const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const jwt = require('jsonwebtoken');
const allowedOrigins = require('./config/allowedOrigins');
const securityMiddleware = require('./middleware/securityMiddleware');

const app = express();

// Security headers middleware (first!)
app.use(securityMiddleware);

// CORS middleware - Allow requests from localhost and production
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '3600');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Middleware
app.use(fileUpload());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Debug middleware - log all POST requests
app.use((req, res, next) => {
  if (req.method === 'POST') {
    console.log(`\n[DEBUG] POST ${req.path}`);
    console.log(`[DEBUG] Content-Type: ${req.headers['content-type']}`);
    console.log(`[DEBUG] Content-Length: ${req.headers['content-length']}`);
    console.log(`[DEBUG] req.body:`, JSON.stringify(req.body));
    console.log(`[DEBUG] req.query:`, JSON.stringify(req.query));
  }
  next();
});

app.use(express.static(path.join(__dirname, '../public')));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Import cache manager
const CacheManager = require('./core/cache-manager');
const cache = new CacheManager();

// Import routes
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const configRoutes = require('./routes/config');
const collectionsRoutes = require('./routes/collections');
const backupRoutes = require('./routes/backup');
const scannerRoutes = require('./routes/scanner');
const adminRoutes = require('./routes/admin');
const { router: adminSeedRoutes } = require('./routes/admin-seed');
const autoSyncRoutes = require('./routes/auto-sync');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/config', configRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/scanner', scannerRoutes);
app.use('/api/admin', adminSeedRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auto-sync', autoSyncRoutes);

// Login page (without auth, but redirect if already authenticated)
app.get('/login', (req, res) => {
  const token = req.cookies?.auth_token;
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  
  if (token) {
    try {
      jwt.verify(token, JWT_SECRET);
      // Token is valid, redirect to dashboard
      return res.redirect('/dashboard');
    } catch (err) {
      // Token is invalid, continue to login page
    }
  }
  
  res.render('login', { error: null });
});

// Login form submission (web-based)
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const AUTH_USER = process.env.AUTH_USER || 'admin';
  const AUTH_PASS = process.env.AUTH_PASS || 'password';
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

  console.log(`\n[LOGIN_FORM] 🔐 LOGIN REQUEST RECEIVED`);
  console.log(`[LOGIN_FORM] ├─ Full req.body:`, JSON.stringify(req.body));
  console.log(`[LOGIN_FORM] ├─ Username: ${username}`);
  console.log(`[LOGIN_FORM] ├─ Username type: ${typeof username}`);
  console.log(`[LOGIN_FORM] ├─ Password submitted: ${password ? 'YES' : 'NO'}`);
  console.log(`[LOGIN_FORM] ├─ Password length: ${password ? password.length : 0}`);
  console.log(`[LOGIN_FORM] ├─ Password bytes (hex): ${password ? Buffer.from(password).toString('hex') : 'N/A'}`);
  
  // Verify credentials
  if (!username || username !== AUTH_USER) {
    console.log(`[LOGIN_FORM] ❌ INVALID USERNAME`);
    console.log(`[LOGIN_FORM] ├─ Expected: "${AUTH_USER}"`);
    console.log(`[LOGIN_FORM] ├─ Got: "${username}"`);
    console.log(`[LOGIN_FORM] └─ Type: ${typeof username}\n`);
    return res.render('login', { error: 'Invalid username or password' });
  }

  // Detailed password comparison
  console.log(`[LOGIN_FORM] 🔍 PASSWORD COMPARISON`);
  console.log(`[LOGIN_FORM] ├─ Submitted: "${password}"`);
  console.log(`[LOGIN_FORM] ├─ Submitted type: ${typeof password}`);
  console.log(`[LOGIN_FORM] ├─ Submitted length: ${password ? password.length : 0}`);
  console.log(`[LOGIN_FORM] ├─ Submitted hex: ${password ? Buffer.from(password).toString('hex') : 'N/A'}`);
  console.log(`[LOGIN_FORM] ├─ Expected: "${AUTH_PASS}"`);
  console.log(`[LOGIN_FORM] ├─ Expected length: ${AUTH_PASS ? AUTH_PASS.length : 0}`);
  console.log(`[LOGIN_FORM] ├─ Expected hex: ${AUTH_PASS ? Buffer.from(AUTH_PASS).toString('hex') : 'N/A'}`);
  console.log(`[LOGIN_FORM] ├─ Exact match: ${password === AUTH_PASS ? '✅ YES' : '❌ NO'}`);
  
  if (password && AUTH_PASS) {
    const trimmed = password.trim() === AUTH_PASS.trim();
    const caseInsensitive = password.toLowerCase() === AUTH_PASS.toLowerCase();
    console.log(`[LOGIN_FORM] ├─ After trim: ${trimmed ? '✅ YES' : '❌ NO'}`);
    console.log(`[LOGIN_FORM] ├─ Case insensitive: ${caseInsensitive ? '✅ YES' : '❌ NO'}`);
    console.log(`[LOGIN_FORM] └─ Character analysis:`);
    const maxLen = Math.max(password.length, AUTH_PASS.length);
    for (let i = 0; i < maxLen; i++) {
      const submitted = password[i] || '';
      const expected = AUTH_PASS[i] || '';
      const match = submitted === expected ? '✅' : '❌';
      const submittedCode = submitted.charCodeAt(0) || 'N/A';
      const expectedCode = expected.charCodeAt(0) || 'N/A';
      console.log(`[LOGIN_FORM]    [${i}] '${submitted}' (${submittedCode}) vs '${expected}' (${expectedCode}) ${match}`);
    }
  }

  if (!password || password !== AUTH_PASS) {
    console.log(`[LOGIN_FORM] ❌ PASSWORD MISMATCH\n`);
    return res.render('login', { error: 'Invalid username or password' });
  }

  console.log(`[LOGIN_FORM] ✅ CREDENTIALS VERIFIED - Creating token...\n`);

  // Create JWT token
  const jwt = require('jsonwebtoken');
  const token = jwt.sign(
    { username, loginTime: new Date() },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Set cookie and redirect
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });

  res.redirect('/dashboard');
});

// Logout route
app.get('/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.redirect('/login');
});

// Dashboard page (requires auth)
app.get('/dashboard', require('./middleware/authMiddleware'), (req, res) => {
  res.render('dashboard', { user: req.user });
});

// Home redirect
app.get('/', (req, res) => {
  const token = req.cookies?.auth_token || req.headers.authorization?.split(' ')[1];
  if (token) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/login');
  }
});

// Sync Manager page (in modal)
app.get('/sync-manager', require('./middleware/authMiddleware'), (req, res) => {
  res.sendFile(__dirname + '/views/sync-manager.html');
});

// Sync Manager full page (with navbar and sidebar)
app.get('/syncmanager', require('./middleware/authMiddleware'), (req, res) => {
  res.render('syncmanager-page', { user: req.user });
});

// API health check
app.get('/api/health', require('./middleware/authMiddleware'), (req, res) => {
  res.json({ status: 'online', user: req.user, timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

module.exports = app;
