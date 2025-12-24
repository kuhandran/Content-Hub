const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Image serving with proper cache headers and MIME types
app.use('/image', (req, res, next) => {
  // Detect MIME type from file extension
  const filePath = req.path.toLowerCase();
  let mimeType = 'application/octet-stream';
  
  if (filePath.endsWith('.png')) {
    mimeType = 'image/png';
  } else if (filePath.endsWith('.webp')) {
    mimeType = 'image/webp';
  } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
    mimeType = 'image/jpeg';
  } else if (filePath.endsWith('.gif')) {
    mimeType = 'image/gif';
  }
  
  // Set cache headers for images
  res.set({
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Content-Type': mimeType
  });
  next();
});

// Cache management - prevents stale data
const dataCache = new Map();
const CACHE_TTL = 0; // No caching - always read fresh

/**
 * Dynamically read JSON files without caching
 * This ensures updated JSON files are reflected without server restart
 */
function readJsonFile(filePath) {
  try {
    const fullPath = path.join(__dirname, 'public', filePath);
    
    // Security check - prevent directory traversal
    const realPath = path.resolve(fullPath);
    const allowedPath = path.resolve(path.join(__dirname, 'public'));
    
    if (!realPath.startsWith(allowedPath)) {
      throw new Error('Invalid path');
    }

    // Always read fresh from disk
    const data = fs.readFileSync(realPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }
}

// Dynamic API routes for data files
app.get('/data/:file', (req, res) => {
  const { file } = req.params;
  
  // Validate file extension
  if (!file.endsWith('.json')) {
    return res.status(400).json({ error: 'Only JSON files allowed' });
  }

  const data = readJsonFile(`/data/${file}`);
  
  if (data === null) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Set cache headers to allow browser caching but require revalidation
  res.set({
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=0, must-revalidate',
    'ETag': `"${Buffer.from(JSON.stringify(data)).toString('base64').slice(0, 16)}"`
  });

  res.json(data);
});

// Dynamic API routes for config files
app.get('/config/:file', (req, res) => {
  const { file } = req.params;
  
  if (!file.endsWith('.json')) {
    return res.status(400).json({ error: 'Only JSON files allowed' });
  }

  const data = readJsonFile(`/config/${file}`);
  
  if (data === null) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.set({
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=0, must-revalidate',
    'ETag': `"${Buffer.from(JSON.stringify(data)).toString('base64').slice(0, 16)}"`
  });

  res.json(data);
});

// Image serving with proper cache headers - served via express.static
// Cache control headers are set in vercel.json for /image/* routes
// No need for additional route handler since express.static handles it

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// List available endpoints
app.get('/api', (req, res) => {
  const endpoints = {
    data: [
      '/data/achievements.json',
      '/data/education.json',
      '/data/experience.json',
      '/data/projects.json',
      '/data/skills.json',
      '/data/contentLabels.json',
      '/data/chatConfig.json'
    ],
    config: [
      '/config/apiConfig.json',
      '/config/pageLayout.json'
    ],
    images: [
      '/image/profile.webp',
      '/image/profile.png',
      '/image/fwd-logo.webp',
      '/image/fwd-logo.png',
      '/image/maybank-logo.webp',
      '/image/maybank-logo.png',
      '/image/Project1.webp',
      '/image/Project2.webp',
      '/image/Project3.webp',
      '/image/Project4.webp',
      '/image/Project5.webp',
      '/image/Project6.webp'
    ],
    health: '/health',
    documentation: '/'
  };

  res.json(endpoints);
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║     📊 Portfolio Data API Server                           ║
║     Running on http://localhost:${PORT}                      ║
║     ✨ Dynamic JSON loading (no server restart needed)     ║
║     📡 API Endpoints: http://localhost:${PORT}/api         ║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
