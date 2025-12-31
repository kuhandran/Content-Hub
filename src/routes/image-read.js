/**
 * Image files API - Read from Redis
 * GET /api/image/*
 */

const express = require('express');
const { createClient } = require('redis');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

let redis = null;

async function initRedis() {
  try {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) return false;
    redis = createClient({ url: redisUrl });
    await redis.connect();
    return true;
  } catch (err) {
    console.error('[IMAGE] Redis init failed:', err.message);
    return false;
  }
}

initRedis();

router.use(authMiddleware);

router.get('/*', async (req, res) => {
  try {
    const filePath = req.params[0];
    if (!filePath || !redis) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const key = `cms:image:${filePath}`;
    const content = await redis.get(key);

    if (!content) {
      return res.status(404).json({ error: 'File not found', path: filePath });
    }

    // Return base64 decoded binary content
    const buffer = Buffer.from(content, 'base64');
    
    // Determine content type based on extension
    const ext = filePath.toLowerCase().split('.').pop();
    const contentTypes = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'webp': 'image/webp',
      'gif': 'image/gif',
      'svg': 'image/svg+xml'
    };
    
    const contentType = contentTypes[ext] || 'application/octet-stream';
    res.type(contentType).send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
