/**
 * Config files API - Read from Redis
 * GET /api/config/*
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
    console.error('[CONFIG] Redis init failed:', err.message);
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

    const key = `cms:config:${filePath}`;
    const content = await redis.get(key);

    if (!content) {
      return res.status(404).json({ error: 'File not found', path: filePath });
    }

    // Decode from base64 (files are stored as base64 in Redis)
    const decodedContent = Buffer.from(content, 'base64').toString('utf8');

    if (filePath.endsWith('.json')) {
      return res.json(JSON.parse(decodedContent));
    }

    res.type('text/plain').send(decodedContent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
