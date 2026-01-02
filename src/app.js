const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const jwt = require('jsonwebtoken');
const allowedOrigins = require('./config/allowedOrigins');

const app = express();

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
app.use(express.static(path.join(__dirname, '../public')));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

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

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/config', configRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/scanner', scannerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminSeedRoutes);

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
  
  res.render('login');
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
