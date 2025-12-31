/**
 * Files/Storage API - Read from Redis
 * GET /api/storage-files/*
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
    console.error('[FILES] Redis init failed:', err.message);
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

    const key = `cms:files:${filePath}`;
    const content = await redis.get(key);

    if (!content) {
      return res.status(404).json({ error: 'File not found', path: filePath });
    }

    // Check if it's binary (base64 encoded)
    const isBinary = content.match(/^[A-Za-z0-9+/=]+$/);
    
    if (isBinary && content.length > 100) {
      // Likely base64, decode to binary
      try {
        const buffer = Buffer.from(content, 'base64');
        const ext = filePath.toLowerCase().split('.').pop();
        
        // Determine MIME type based on extension
        const mimeTypes = {
          'pdf': 'application/pdf',
          'doc': 'application/msword',
          'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'xls': 'application/vnd.ms-excel',
          'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'txt': 'text/plain',
          'zip': 'application/zip'
        };
        
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        return res.type(contentType).send(buffer);
      } catch (e) {
        // Fall through to text handling
      }
    }

    // Handle as text/JSON
    if (filePath.endsWith('.json')) {
      try {
        return res.json(JSON.parse(content));
      } catch (e) {
        return res.type('text/plain').send(content);
      }
    }

    res.type('text/plain').send(content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
