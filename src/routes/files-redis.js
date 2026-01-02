const express = require('express');
const { createClient } = require('redis');
const authMiddleware = require('../middleware/authMiddleware');
const path = require('path');
const fs = require('fs');
const router = express.Router();

let redis = null;
let manifest = null;

// Load manifest
try {
  manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../../public/manifest.json'), 'utf8'));
} catch (err) {
  console.warn('[FILES] Manifest not found, will use filesystem only');
}

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

// Public listing endpoints (no auth required) - read from filesystem or manifest fallback
router.get('/list-public/config', async (req, res) => {
  try {
    let items = [];
    
    // Try filesystem first
    const configDir = path.join(__dirname, '../../public/config');
    if (fs.existsSync(configDir)) {
      const files = fs.readdirSync(configDir);
      for (const file of files) {
        const filePath = path.join(configDir, file);
        const stat = fs.statSync(filePath);
        items.push({
          name: file,
          path: `config/${file}`,
          type: 'file',
          size: stat.size,
          modified: stat.mtime.toISOString(),
          ext: path.extname(file)
        });
      }
    } else if (manifest?.files?.config) {
      // Fallback to manifest
      items = manifest.files.config;
    }

    res.json({
      success: true,
      path: 'config',
      items,
      count: items.length,
      message: items.length > 0 ? `Found ${items.length} config files` : 'No config files'
    });
  } catch (err) {
    console.error('[FILES] Error listing config:', err);
    res.json({
      success: true,
      path: 'config',
      items: [],
      count: 0,
      message: 'Directory not found or empty'
    });
  }
});

router.get('/list-public/data', async (req, res) => {
  try {
    let items = [];
    
    // Try filesystem first
    const dataDir = path.join(__dirname, '../../public/data');
    if (fs.existsSync(dataDir)) {
      const files = fs.readdirSync(dataDir);
      for (const file of files) {
        const filePath = path.join(dataDir, file);
        const stat = fs.statSync(filePath);
        items.push({
          name: file,
          path: `data/${file}`,
          type: 'file',
          size: stat.size,
          modified: stat.mtime.toISOString(),
          ext: path.extname(file)
        });
      }
    } else if (manifest?.files?.data) {
      // Fallback to manifest
      items = manifest.files.data;
    }

    res.json({
      success: true,
      path: 'data',
      items,
      count: items.length,
      message: items.length > 0 ? `Found ${items.length} data files` : 'No data files'
    });
  } catch (err) {
    console.error('[FILES] Error listing data:', err);
    res.json({
      success: true,
      path: 'data',
      items: [],
      count: 0,
      message: 'Directory not found or empty'
    });
  }
});

router.get('/list-public/files', async (req, res) => {
  try {
    let items = [];
    
    // Try filesystem first
    const filesDir = path.join(__dirname, '../../public/files');
    if (fs.existsSync(filesDir)) {
      const files = fs.readdirSync(filesDir);
      for (const file of files) {
        const filePath = path.join(filesDir, file);
        const stat = fs.statSync(filePath);
        if (!stat.isDirectory()) {
          items.push({
            name: file,
            path: `files/${file}`,
            type: 'file',
            size: stat.size,
            modified: stat.mtime.toISOString(),
            ext: path.extname(file)
          });
        }
      }
    } else if (manifest?.files?.files) {
      // Fallback to manifest
      items = manifest.files.files;
    }

    res.json({
      success: true,
      path: 'files',
      items,
      count: items.length,
      message: items.length > 0 ? `Found ${items.length} files` : 'No files'
    });
  } catch (err) {
    console.error('[FILES] Error listing files:', err);
    res.json({
      success: true,
      path: 'files',
      items: [],
      count: 0,
      message: 'Directory not found or empty'
    });
  }
});

// Public manifest endpoint (no auth required)
router.get('/manifest', (req, res) => {
  if (manifest) {
    res.json(manifest);
  } else {
    res.status(404).json({ error: 'Manifest not found' });
  }
});

// Protected routes require auth
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
        const content = await redis.get(key);
        const size = content ? Buffer.byteLength(content, 'utf8') : 0;
        
        items.push({
          name: filename,
          path: `config/${filename}`,
          type: 'file',
          size: size,
          modified: new Date().toISOString(),
          ext: `.${filename.split('.').pop()}`
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
        const content = await redis.get(key);
        const size = content ? Buffer.byteLength(content, 'utf8') : 0;
        
        items.push({
          name: filename,
          path: `image/${filename}`,
          type: 'file',
          size: size,
          modified: new Date().toISOString(),
          ext: `.${filename.split('.').pop()}`
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
        const content = await redis.get(key);
        const size = content ? Buffer.byteLength(content, 'utf8') : 0;
        
        items.push({
          name: filename,
          path: `resume/${filename}`,
          type: 'file',
          size: size,
          modified: new Date().toISOString(),
          ext: `.${filename.split('.').pop()}`
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
        const content = await redis.get(key);
        const size = content ? Buffer.byteLength(content, 'utf8') : 0;
        
        items.push({
          name: filename,
          path: `files/${filename}`,
          type: 'file',
          size: size,
          modified: new Date().toISOString(),
          ext: `.${filename.split('.').pop()}`
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
