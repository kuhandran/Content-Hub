const express = require('express');
const { createClient } = require('redis');
const authMiddleware = require('../middleware/authMiddleware');
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
    console.error('[FILES] Redis init failed:', err.message);
    return false;
  }
}

initRedis();

// All routes require auth
router.use(authMiddleware);

// GET /api/files/list/config - List config files from Redis
router.get('/list/config', async (req, res) => {
  try {
    const items = [];
    let count = 0;

    if (redis) {
      const keys = await redis.keys('cms:config:*');
      for (const key of keys) {
        const filename = key.replace('cms:config:', '');
        items.push({
          name: filename,
          path: `config/${filename}`,
          type: 'file'
        });
        count++;
      }
    }

    res.json({
      success: true,
      path: 'config',
      items,
      count,
      message: count > 0 ? `Found ${count} config files` : 'No config files'
    });
  } catch (err) {
    console.error('[FILES] Error listing config:', err);
    res.status(200).json({
      success: true,
      path: 'config',
      items: [],
      count: 0,
      message: 'Directory not found or empty'
    });
  }
});

// GET /api/files/list/image - List images from Redis
router.get('/list/image', async (req, res) => {
  try {
    const items = [];
    let count = 0;

    if (redis) {
      const keys = await redis.keys('cms:image:*');
      for (const key of keys) {
        const filename = key.replace('cms:image:', '');
        items.push({
          name: filename,
          path: `image/${filename}`,
          type: 'file'
        });
        count++;
      }
    }

    res.json({
      success: true,
      path: 'image',
      items,
      count,
      message: count > 0 ? `Found ${count} images` : 'No images'
    });
  } catch (err) {
    console.error('[FILES] Error listing images:', err);
    res.status(200).json({
      success: true,
      path: 'image',
      items: [],
      count: 0,
      message: 'Directory not found or empty'
    });
  }
});

// GET /api/files/list/resume - List resume files from Redis
router.get('/list/resume', async (req, res) => {
  try {
    const items = [];
    let count = 0;

    if (redis) {
      const keys = await redis.keys('cms:resume:*');
      for (const key of keys) {
        const filename = key.replace('cms:resume:', '');
        items.push({
          name: filename,
          path: `resume/${filename}`,
          type: 'file'
        });
        count++;
      }
    }

    res.json({
      success: true,
      path: 'resume',
      items,
      count,
      message: count > 0 ? `Found ${count} resume files` : 'No resume files'
    });
  } catch (err) {
    console.error('[FILES] Error listing resume:', err);
    res.status(200).json({
      success: true,
      path: 'resume',
      items: [],
      count: 0,
      message: 'Directory not found or empty'
    });
  }
});

// GET /api/files/list/files - List files from Redis
router.get('/list/files', async (req, res) => {
  try {
    const items = [];
    let count = 0;

    if (redis) {
      const keys = await redis.keys('cms:files:*');
      for (const key of keys) {
        const filename = key.replace('cms:files:', '');
        items.push({
          name: filename,
          path: `files/${filename}`,
          type: 'file'
        });
        count++;
      }
    }

    res.json({
      success: true,
      path: 'files',
      items,
      count,
      message: count > 0 ? `Found ${count} files` : 'No files'
    });
  } catch (err) {
    console.error('[FILES] Error listing files:', err);
    res.status(200).json({
      success: true,
      path: 'files',
      items: [],
      count: 0,
      message: 'Directory not found or empty'
    });
  }
});

module.exports = router;
