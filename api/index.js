const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const publicPath = path.join(__dirname, '../public');

// Environment variables for protection
const ALLOWED_IP = process.env.ALLOWED_IP || '2001:f40:95a:20d0:841b:9e16:c19f:55e4';
const AUTH_USER = process.env.AUTH_USER || 'Kuhandran';
const AUTH_PASS = process.env.AUTH_PASS || 'TDM2025';

// Basic Auth Middleware for index.html
const basicAuthMiddleware = (req, res, next) => {
  // Always require authentication (no IP bypass for security)
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Portfolio"');
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const credentials = Buffer.from(auth.slice(6), 'base64').toString();
  const [user, pass] = credentials.split(':');
  
  if (user === AUTH_USER && pass === AUTH_PASS) {
    return next();
  }
  
  res.setHeader('WWW-Authenticate', 'Basic realm="Portfolio"');
  res.status(401).json({ error: 'Invalid credentials' });
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === API ROUTES - MUST BE BEFORE STATIC FILES ===

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Portfolio Data API',
    endpoints: {
      health: '/health',
      data: '/data/:file',
      config: '/config/:file',
      images: '/image/:file'
    }
  });
});

// Data files endpoint
app.get('/data/:file', (req, res) => {
  const { file } = req.params;
  if (!file.endsWith('.json')) {
    return res.status(400).json({ error: 'Only JSON files allowed' });
  }
  
  try {
    const filePath = path.join(publicPath, 'data', file);
    const realPath = path.resolve(filePath);
    const allowedBase = path.resolve(path.join(publicPath, 'data'));
    
    if (!realPath.startsWith(allowedBase)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    if (!fs.existsSync(realPath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const data = JSON.parse(fs.readFileSync(realPath, 'utf8'));
    res.setHeader('Content-Type', 'application/json');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Config files endpoint  
app.get('/config/:file', (req, res) => {
  const { file } = req.params;
  if (!file.endsWith('.json')) {
    return res.status(400).json({ error: 'Only JSON files allowed' });
  }
  
  try {
    const filePath = path.join(publicPath, 'config', file);
    const realPath = path.resolve(filePath);
    const allowedBase = path.resolve(path.join(publicPath, 'config'));
    
    if (!realPath.startsWith(allowedBase)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    if (!fs.existsSync(realPath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const data = JSON.parse(fs.readFileSync(realPath, 'utf8'));
    res.setHeader('Content-Type', 'application/json');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// === STATIC FILES - AFTER API ROUTES ===

// Protect ALL static files with authentication (including index.html)
app.use(basicAuthMiddleware);

app.use(express.static(publicPath, {
  setHeaders: (res, filepath) => {
    // Ensure proper MIME types for images
    const ext = path.extname(filepath).toLowerCase();
    if (ext === '.png') {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (ext === '.webp') {
      res.setHeader('Content-Type', 'image/webp');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (ext === '.jpg' || ext === '.jpeg') {
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (ext === '.gif') {
      res.setHeader('Content-Type', 'image/gif');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    
    // CORS headers for all static files
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

// === 404 HANDLER - MUST BE LAST ===

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

module.exports = app;
