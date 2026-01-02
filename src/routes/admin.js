/**
 * Admin API to seed Redis database from uploaded files or filesystem
 * Only available in development or with admin token
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { createClient } = require('redis');
const router = express.Router();

let redis = null;

// Initialize Redis
async function initRedis() {
  try {
    if (!redis) {
      const redisUrl = process.env.REDIS_URL;
      if (!redisUrl) return false;
      redis = createClient({ url: redisUrl });
      await redis.connect();
    }
    return true;
  } catch (err) {
    console.error('[ADMIN] Redis init failed:', err.message);
    return false;
  }
}

// Middleware to protect the seed endpoint
const adminAuth = (req, res, next) => {
  const adminToken = req.headers['x-admin-token'];
  const expectedToken = process.env.ADMIN_TOKEN || 'dev-seed-only';
  
  if (adminToken !== expectedToken && process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
};

// Seed endpoint - accepts JSON file uploads or seeds from filesystem
router.post('/seed-collections', adminAuth, async (req, res) => {
  try {
    const connected = await initRedis();
    if (!connected || !redis) {
      return res.status(500).json({ error: 'Redis not available' });
    }

    // Check if files are being uploaded
    if (!req.files || !req.files.file) {
      return res.status(400).json({ 
        error: 'No files uploaded',
        usage: 'POST /api/admin/seed-collections with form-data file[] or raw JSON body'
      });
    }

    const files = Array.isArray(req.files.file) ? req.files.file : [req.files.file];
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Upload each file
    for (const uploadedFile of files) {
      try {
        const content = uploadedFile.data.toString('base64');
        const key = `cms:file:${uploadedFile.name}`;
        
        await redis.setEx(key, 7776000, content);
        successCount++;
      } catch (err) {
        errorCount++;
        errors.push(`${uploadedFile.name}: ${err.message}`);
      }
    }

    res.json({
      status: 'upload_complete',
      totalFiles: files.length,
      successCount,
      errorCount,
      errors: errors.slice(0, 5),
      message: `Uploaded ${successCount}/${files.length} files`
    });

  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ 
      error: error.message
    });
  }
});

// Status endpoint
router.get('/seed-status', adminAuth, async (req, res) => {
  res.json({
    status: 'ready',
    message: 'POST /api/admin/seed-collections with X-Admin-Token header to seed data'
  });
});

// Admin file management page
router.get('/files', (req, res) => {
  res.sendFile(path.join(__dirname, '../../views/admin-files.html'));
});

module.exports = router;
