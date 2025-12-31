/**
 * Files/Storage API - Read from Redis
 * GET /api/storage-files/*
 */

const express = require('express');
const { createClient } = require('redis');
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

    // Decode from base64 (files stored as base64 in Redis)
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
      'zip': 'application/zip',
      'json': 'application/json'
    };
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    // For JSON, decode and parse
    if (ext === 'json') {
      const decodedStr = buffer.toString('utf8');
      return res.json(JSON.parse(decodedStr));
    }
    
    return res.type(contentType).send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
