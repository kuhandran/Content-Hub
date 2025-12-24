const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add unique deployment marker
app.use((req, res, next) => {
  res.setHeader('X-Deployment-Time', new Date().toISOString());
  next();
});

const publicPath = path.join(__dirname, '../public');

// Explicit route handlers for images - MUST be before express.static
// Using string pattern instead of regex
app.get('/image/:filename', (req, res, next) => {
  console.log(`[IMAGE ROUTE] Handling request for: /image/${req.params.filename}`);
  const filePath = `/image/${req.params.filename}`;
  const fullPath = path.join(publicPath, filePath);
  
  // Security check
  const realPath = path.resolve(fullPath);
  const allowedPath = path.resolve(publicPath);
  
  if (!realPath.startsWith(allowedPath)) {
    console.log(`[IMAGE ROUTE] Security check failed for: ${realPath}`);
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // Check if file exists
  console.log(`[IMAGE ROUTE] Checking if file exists: ${realPath}`);
  if (!fs.existsSync(realPath)) {
    console.log(`[IMAGE ROUTE] File NOT found: ${realPath}`);
    return res.status(404).json({ error: 'Image not found' });
  }
  
  console.log(`[IMAGE ROUTE] File FOUND, serving: ${realPath}`);
  // Set proper MIME type
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif'
  };
  
  if (mimeTypes[ext]) {
    res.setHeader('Content-Type', mimeTypes[ext]);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  // Serve the file
  res.sendFile(realPath);
});

// Serve other static files from public directory (but not images - handled above)
// Use a custom middleware to avoid serving files before routes are checked
app.use((req, res, next) => {
  // Skip if already handled by routes
  if (req.route) {
    return next();
  }
  
  const filePath = path.join(publicPath, req.path);
  const realPath = path.resolve(filePath);
  const allowedPath = path.resolve(publicPath);
  
  // Security check
  if (!realPath.startsWith(allowedPath)) {
    return next();
  }
  
  // Check if file exists and serve it
  if (fs.existsSync(realPath) && fs.statSync(realPath).isFile()) {
    // Set MIME type
    const ext = path.extname(realPath).toLowerCase();
    if (ext === '.html') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    } else if (ext === '.json') {
      res.setHeader('Content-Type', 'application/json');
    } else if (ext === '.css') {
      res.setHeader('Content-Type', 'text/css');
    } else if (ext === '.js') {
      res.setHeader('Content-Type', 'application/javascript');
    }
    
    return res.sendFile(realPath);
  }
  
  // If not a file, continue to next middleware/route
  next();
});

/**
 * Dynamically read JSON files without caching
 * This ensures updated JSON files are reflected without server restart
 */
function readJsonFile(filePath) {
  try {
    const fullPath = path.join(__dirname, '../public', filePath);
    
    // Security check - prevent directory traversal
    const realPath = path.resolve(fullPath);
    const allowedPath = path.resolve(path.join(__dirname, '../public'));
    
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to list files
app.get('/debug/files', (req, res) => {
  try {
    const publicPath = path.join(__dirname, '../public');
    const imagePath = path.join(publicPath, 'image');
    
    const files = fs.readdirSync(imagePath);
    const imageDir = fs.readdirSync(imagePath);
    
    res.json({
      publicPath,
      imagePath,
      imageExists: fs.existsSync(imagePath),
      imagesInFolder: imageDir.filter(f => !f.startsWith('.')),
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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

// Catch-all route - serve index.html for SPA routing (but NOT for missing files)
app.get('*', (req, res) => {
  // Don't serve HTML for image/data/config requests that don't exist
  if (req.path.startsWith('/image/') || req.path.startsWith('/data/') || req.path.startsWith('/config/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  // Serve index.html for other routes (SPA routing)
  const indexPath = path.join(publicPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});
