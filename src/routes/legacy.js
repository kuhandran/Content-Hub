/**
 * Legacy API routes (backward compatibility)
 * GET /data/:file
 * GET /config/:file
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const allowedOrigins = require('../config/allowedOrigins');

module.exports = (cache) => {
  // Add CORS headers to all responses
  router.use((req, res, next) => {
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '3600');
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    
    next();
  });

  function readFile(filePath) {
    try {
      const fullPath = path.join(__dirname, '../../public', filePath);
      const realPath = path.resolve(fullPath);
      const allowedPath = path.resolve(path.join(__dirname, '../../public'));
      
      if (!realPath.startsWith(allowedPath)) {
        throw new Error('Invalid path');
      }

      if (!fs.existsSync(fullPath)) return null;
      const data = fs.readFileSync(fullPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error.message);
      return null;
    }
  }

  // Get data file
  router.get('/data/:file', (req, res) => {
    const { file } = req.params;
    try {
      if (!file.endsWith('.json')) {
        return res.status(400).json({ error: 'Only JSON files allowed' });
      }

      const cacheKey = `legacy:data:${file}`;
      const cached = cache.get(cacheKey);
      if (cached) return res.json(cached);

      const data = readFile(`data/${file}`);
      if (!data) return res.status(404).json({ error: 'File not found' });

      cache.set(cacheKey, data);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get config file
  router.get('/config/:file', (req, res) => {
    const { file } = req.params;
    try {
      if (!file.endsWith('.json')) {
        return res.status(400).json({ error: 'Only JSON files allowed' });
      }

      const cacheKey = `legacy:config:${file}`;
      const cached = cache.get(cacheKey);
      if (cached) return res.json(cached);

      const data = readFile(`config/${file}`);
      if (!data) return res.status(404).json({ error: 'File not found' });

      cache.set(cacheKey, data);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
