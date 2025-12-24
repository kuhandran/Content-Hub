// BACKUP - Simple working version
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const publicPath = path.join(__dirname, '../public');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes - must come BEFORE static files
app.get('/api', (req, res) => {
  res.json({ message: 'API is working', time: new Date().toISOString() });
});

app.get('/data/:file', (req, res) => {
  const { file } = req.params;
  if (!file.endsWith('.json')) {
    return res.status(400).json({ error: 'Only JSON files allowed' });
  }
  
  try {
    const filePath = path.join(publicPath, 'data', file);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Static files - must come AFTER API routes
app.use(express.static(publicPath, {
  setHeaders: (res, filepath) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (filepath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filepath.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    } else if (filepath.endsWith('.jpg') || filepath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filepath.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    }
  }
}));

// 404 handler - must come LAST
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

module.exports = app;
