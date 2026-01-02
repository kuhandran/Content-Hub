/**
 * File Management Admin Endpoint
 * POST /api/admin/seed-files - Seed KV with file listings
 * Works with Vercel KV or fallback to in-memory storage
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Add CORS headers for admin routes
router.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Try to use Vercel KV first, then fallback to in-memory
let kv = null;
let memoryStore = {};

// Try to load Vercel KV
try {
  kv = require('@vercel/kv');
  console.log('[ADMIN-SEED] Using Vercel KV storage');
} catch (err) {
  console.log('[ADMIN-SEED] Vercel KV not available, using in-memory fallback');
}

/**
 * Write to KV or memory
 */
async function kvSet(key, value) {
  const data = typeof value === 'string' ? value : JSON.stringify(value);
  
  if (kv) {
    try {
      await kv.set(key, data);
      return true;
    } catch (err) {
      console.error('[ADMIN-SEED] KV set error:', err.message);
      // Fallback to memory
      memoryStore[key] = data;
      return true;
    }
  } else {
    memoryStore[key] = data;
    return true;
  }
}

/**
 * Read from KV or memory
 */
async function kvGet(key) {
  if (kv) {
    try {
      return await kv.get(key);
    } catch (err) {
      console.error('[ADMIN-SEED] KV get error:', err.message);
      return memoryStore[key] || null;
    }
  } else {
    return memoryStore[key] || null;
  }
}

/**
 * Generate manifest dynamically
 */
function generateManifest() {
  const manifest = {
    generated: new Date().toISOString(),
    files: {
      config: [],
      data: [],
      files: [],
      collections: []
    }
  };

  const publicDir = path.join(__dirname, '../../public');

  // Scan config directory
  const configDir = path.join(publicDir, 'config');
  if (fs.existsSync(configDir)) {
    fs.readdirSync(configDir).forEach(file => {
      if (!file.startsWith('.')) {
        const filePath = path.join(configDir, file);
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
          manifest.files.config.push({
            name: file,
            path: `/public/config/${file}`,
            size: stat.size,
            ext: path.extname(file)
          });
        }
      }
    });
  }

  // Scan data directory
  const dataDir = path.join(publicDir, 'data');
  if (fs.existsSync(dataDir)) {
    fs.readdirSync(dataDir).forEach(file => {
      if (!file.startsWith('.')) {
        const filePath = path.join(dataDir, file);
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
          manifest.files.data.push({
            name: file,
            path: `/public/data/${file}`,
            size: stat.size,
            ext: path.extname(file)
          });
        }
      }
    });
  }

  // Scan files directory
  const filesDir = path.join(publicDir, 'files');
  if (fs.existsSync(filesDir)) {
    fs.readdirSync(filesDir).forEach(file => {
      if (!file.startsWith('.')) {
        const filePath = path.join(filesDir, file);
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
          manifest.files.files.push({
            name: file,
            path: `/public/files/${file}`,
            size: stat.size,
            ext: path.extname(file)
          });
        }
      }
    });
  }

  // Scan collections directory recursively
  const collectionsDir = path.join(publicDir, 'collections');
  if (fs.existsSync(collectionsDir)) {
    function scanCollections(dir, prefix = '') {
      fs.readdirSync(dir).forEach(file => {
        if (!file.startsWith('.')) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat.isFile()) {
            manifest.files.collections.push({
              name: file,
              path: `/public/collections${prefix}/${file}`,
              size: stat.size,
              ext: path.extname(file)
            });
          } else if (stat.isDirectory()) {
            scanCollections(filePath, `${prefix}/${file}`);
          }
        }
      });
    }
    scanCollections(collectionsDir);
  }

  return manifest;
}

/**
 * POST /api/admin/seed-files - Seed file listings into KV
 */
router.post('/seed-files', async (req, res) => {
  try {
    console.log('[ADMIN] Starting file seeding process...');
    
    // Generate manifest dynamically
    const manifest = generateManifest();
    console.log('[ADMIN] Generated manifest with', Object.values(manifest.files).flat().length, 'files');
    
    let seedCount = 0;
    const results = {
      config: 0,
      data: 0,
      files: 0,
      collections: 0
    };

    // Seed config files
    if (manifest.files.config) {
      const configData = {
        path: 'config',
        count: manifest.files.config.length,
        items: manifest.files.config,
        timestamp: new Date().toISOString()
      };
      await kvSet('cms:list:config', configData);
      results.config = manifest.files.config.length;
      seedCount += manifest.files.config.length;
    }

    // Seed data files
    if (manifest.files.data) {
      const dataData = {
        path: 'data',
        count: manifest.files.data.length,
        items: manifest.files.data,
        timestamp: new Date().toISOString()
      };
      await kvSet('cms:list:data', dataData);
      results.data = manifest.files.data.length;
      seedCount += manifest.files.data.length;
    }

    // Seed static files
    if (manifest.files.files) {
      const filesData = {
        path: 'files',
        count: manifest.files.files.length,
        items: manifest.files.files,
        timestamp: new Date().toISOString()
      };
      await kvSet('cms:list:files', filesData);
      results.files = manifest.files.files.length;
      seedCount += manifest.files.files.length;
    }

    // Seed collections
    if (manifest.files.collections) {
      const collectionsData = {
        path: 'collections',
        count: manifest.files.collections.length,
        items: manifest.files.collections,
        timestamp: new Date().toISOString()
      };
      await kvSet('cms:list:collections', collectionsData);
      results.collections = manifest.files.collections.length;
      seedCount += manifest.files.collections.length;
    }

    // Seed full manifest
    await kvSet('cms:manifest', manifest);

    console.log('[ADMIN] Seeding complete:', results);
    
    const storageName = kv ? 'Vercel KV' : 'In-Memory';
    
    res.json({
      success: true,
      message: `Successfully seeded ${seedCount} files into ${storageName}`,
      results,
      total: seedCount,
      storage: storageName,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[ADMIN] Seeding error:', err);
    res.status(500).json({
      success: false,
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/admin/seed-status - Check seeding status
 */
router.get('/seed-status', async (req, res) => {
  try {
    const configData = await kvGet('cms:list:config');
    const dataData = await kvGet('cms:list:data');
    const filesData = await kvGet('cms:list:files');
    const collectionsData = await kvGet('cms:list:collections');
    const manifestData = await kvGet('cms:manifest');

    const storageName = kv ? 'Vercel KV' : 'In-Memory';
    
    const status = {
      storage: storageName,
      seeded: {
        config: configData ? JSON.parse(configData).count : 0,
        data: dataData ? JSON.parse(dataData).count : 0,
        files: filesData ? JSON.parse(filesData).count : 0,
        collections: collectionsData ? JSON.parse(collectionsData).count : 0,
        manifest: manifestData ? 'yes' : 'no'
      },
      totalFiles: 
        (configData ? JSON.parse(configData).count : 0) +
        (dataData ? JSON.parse(dataData).count : 0) +
        (filesData ? JSON.parse(filesData).count : 0) +
        (collectionsData ? JSON.parse(collectionsData).count : 0),
      timestamp: new Date().toISOString()
    };

    res.json(status);
  } catch (err) {
    console.error('[ADMIN] Status error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = { router, kvGet, kvSet };
