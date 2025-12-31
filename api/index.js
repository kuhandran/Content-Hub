// Vercel serverless function entry point
// This wraps the Express app for Vercel's serverless runtime

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const jwt = require('jsonwebtoken');
const logger = require('../src/utils/logger');
const loggingMiddleware = require('../src/middleware/loggingMiddleware');

const app = express();

// Logging middleware - log all requests/responses
app.use(loggingMiddleware);

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
const fileRoutes = require('../src/routes/files');
const configRoutes = require('../src/routes/config');
const scannerRoutes = require('../src/routes/scanner');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/config', configRoutes);
app.use('/api/scanner', scannerRoutes);

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
  res.status(500).json({ error: err.message });
});

module.exports = app;
