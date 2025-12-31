/**
 * Admin API to seed KV database from deployed code
 * This endpoint reads from /public/collections and uploads to KV
 * Only available in development or with admin token
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Middleware to protect the seed endpoint
const adminAuth = (req, res, next) => {
  const adminToken = req.headers['x-admin-token'];
  const expectedToken = process.env.ADMIN_TOKEN || 'dev-seed-only';
  
  if (adminToken !== expectedToken && process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
};

// Seed endpoint - accepts JSON file uploads
router.post('/seed-collections', adminAuth, async (req, res) => {
  try {
    // Check if files are being uploaded
    if (!req.files || !req.files.file) {
      return res.status(400).json({ 
        error: 'No files uploaded',
        usage: 'POST /api/admin/seed-collections with form-data file[] or raw JSON body'
      });
    }

    let kv;
    try {
      kv = require('@vercel/kv').kv;
    } catch (e) {
      return res.status(500).json({ error: 'KV storage not configured' });
    }

    const files = Array.isArray(req.files.file) ? req.files.file : [req.files.file];
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Upload each file
    for (const uploadedFile of files) {
      try {
        const content = uploadedFile.data.toString('utf8');
        const key = `cms:file:${uploadedFile.name}`;
        
        await kv.set(key, content, { ex: 7776000 });
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

module.exports = router;
