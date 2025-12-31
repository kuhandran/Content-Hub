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

// Seed endpoint
router.post('/seed-collections', adminAuth, async (req, res) => {
  try {
    console.log('🌱 Starting collection seed...');
    
    // Only use KV if available
    let kv;
    try {
      kv = require('@vercel/kv').kv;
    } catch (e) {
      console.error('KV not available');
      return res.status(500).json({ error: 'KV storage not configured' });
    }

    const collectionsPath = path.join(__dirname, '../../public/collections');
    
    if (!fs.existsSync(collectionsPath)) {
      return res.status(404).json({ error: 'Collections folder not found' });
    }

    let totalFiles = 0;
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Collect all files
    function walkDir(dir, prefix = '') {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        const relativePath = prefix ? `${prefix}/${file}` : file;

        if (stat.isDirectory()) {
          walkDir(fullPath, relativePath);
        } else if (file.endsWith('.json')) {
          totalFiles++;
          
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            const key = `cms:file:${relativePath}`;
            
            // Synchronous KV call not available, so we queue them
            kv.set(key, content, { ex: 7776000 })
              .then(() => {
                successCount++;
              })
              .catch(err => {
                errorCount++;
                errors.push(`${relativePath}: ${err.message}`);
              });
          } catch (err) {
            errorCount++;
            errors.push(`${relativePath}: ${err.message}`);
          }
        }
      }
    }

    walkDir(collectionsPath);

    // Wait for uploads to complete
    await new Promise(resolve => setTimeout(resolve, 10000));

    res.json({
      status: 'seeding_initiated',
      totalFiles,
      successCount,
      errorCount,
      errors: errors.slice(0, 10), // Show first 10 errors
      message: 'Seed started. Check logs for progress.'
    });

  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
