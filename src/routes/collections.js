/**
 * Collection files API - Read from Redis
 * GET /api/collections/:locale/:type/:file
 */

const express = require('express');
const { createClient } = require('redis');
const allowedOrigins = require('../config/allowedOrigins');
const router = express.Router();

let redis = null;

// Initialize Redis connection
async function initRedis() {
  try {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) return false;

    redis = createClient({ url: redisUrl });
    await redis.connect();
    return true;
  } catch (err) {
    console.error('[COLLECTIONS] Redis init failed:', err.message);
    return false;
  }
}

initRedis();

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

// GET /api/collections/* - Read any collection file
router.get('/*', async (req, res) => {
  try {
    const filePath = req.params[0]; // e.g., 'ar-AE/data/contentLabels.json'
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path required' });
    }

    if (!redis) {
      return res.status(503).json({ error: 'Redis not connected' });
    }

    const key = `cms:file:${filePath}`;
    const content = await redis.get(key);

    if (!content) {
      console.warn('[COLLECTIONS] File not found:', filePath);
      return res.status(404).json({ 
        error: 'File not found',
        path: filePath
      });
    }

    // Parse JSON if it's a JSON file
    if (filePath.endsWith('.json')) {
      try {
        const jsonContent = JSON.parse(content);
        return res.json(jsonContent);
      } catch (parseErr) {
        console.error('[COLLECTIONS] JSON parse error:', parseErr);
        return res.status(500).json({ error: 'Invalid JSON' });
      }
    }

    // Return raw content for non-JSON files
    res.type('text/plain');
    res.send(content);

  } catch (error) {
    console.error('[COLLECTIONS] Error reading file:', error);
    res.status(500).json({ 
      error: error.message
    });
  }
});

module.exports = router;
