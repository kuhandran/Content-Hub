// Vercel serverless function entry point
// This wraps the Express app for Vercel's serverless runtime

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const jwt = require('jsonwebtoken');
const logger = require('../src/utils/logger');
const loggingMiddleware = require('../src/middleware/loggingMiddleware');
const allowedOrigins = require('../src/config/allowedOrigins');

const app = express();

// Logging middleware - log all requests/responses
app.use(loggingMiddleware);

// CORS middleware - Allow requests from localhost and production
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Always set CORS headers if origin is in allowed list
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin) {
    // If origin exists but not in allowed list, still set it for the production domain
    // This handles cases where Vercel headers might not apply
    res.setHeader('Access-Control-Allow-Origin', 'https://www.kuhandranchatbot.info');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Vary', 'Origin');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Content-Length', '0');
    return res.status(204).send();
  }
  
  next();
});

// Middleware
app.use(fileUpload({ limits: { fileSize: 50 * 1024 * 1024 } }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Import routes
const authRoutes = require('../src/routes/auth');
const fileRoutes = require('../src/routes/files-redis');
const configRoutes = require('../src/routes/config');
const scannerRoutes = require('../src/routes/scanner');
const collectionsRoutes = require('../src/routes/collections');
const configReadRoutes = require('../src/routes/config-read');
const imageReadRoutes = require('../src/routes/image-read');
const resumeReadRoutes = require('../src/routes/resume-read');
const filesStorageReadRoutes = require('../src/routes/files-storage-read');
const adminRoutes = require('../src/routes/admin');
const { router: adminSeedRoutes } = require('../src/routes/admin-seed');
const autoSyncRoutes = require('../src/routes/auto-sync');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/config', configRoutes);
app.use('/api/config-file', configReadRoutes);  // Read individual config files
app.use('/api/image', imageReadRoutes);  // Read images
app.use('/api/resume', resumeReadRoutes);  // Read resumes
app.use('/api/storage-files', filesStorageReadRoutes);  // Read storage files
app.use('/api/scanner', scannerRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/auto-sync', autoSyncRoutes);  // Auto-sync endpoint
app.use('/api/admin', adminSeedRoutes);  // Seed files endpoint (must be before admin)
app.use('/api/admin', adminRoutes);

// Import middleware
const authMiddleware = require('../src/middleware/authMiddleware');

// Dashboard route
app.get('/dashboard', authMiddleware, (req, res) => {
  res.render('dashboard', { user: req.user });
});

// Login page
app.get('/login', (req, res) => {
  res.render('login');
});

// Health check
app.get('/health', (req, res) => {
  logger.info('HEALTH', 'Health check endpoint called');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn('NOT_FOUND', `404 for ${req.method} ${req.path}`, { 
    method: req.method, 
    path: req.path 
  });
  res.status(404).json({ 
    error: 'Not found',
    path: req.path,
    method: req.method
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('APP_ERROR', `Unhandled error: ${req.method} ${req.path}`, err, {
    method: req.method,
    path: req.path,
    body: req.body
  });

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    status: err.status || 500,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

logger.info('APP', 'Express app configured successfully');

module.exports = app;
