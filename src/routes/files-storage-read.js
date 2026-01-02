/**
 * Files/Storage API - Read from Redis or Filesystem
 * GET /api/storage-files/*
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const { createClient } = require('redis');
const router = express.Router();

let redis = null;

async function initRedis() {
  try {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      console.log('[FILES-STORAGE] No REDIS_URL environment variable');
      return false;
    }
    redis = createClient({ url: redisUrl });
    redis.on('error', (err) => {
      console.error('[FILES-STORAGE] Redis connection error:', err.message);
    });
    await redis.connect();
    console.log('[FILES-STORAGE] ✅ Redis connected successfully');
    return true;
  } catch (err) {
    console.error('[FILES-STORAGE] ❌ Redis init failed:', err.message);
    return false;
  }
}

initRedis();

/**
 * Attempt to seed a file to Redis when it's not found
 */
async function ensureFileSeededed(filePath) {
  try {
    console.info('[FILES-STORAGE] 🔄 Attempting to seed file:', filePath);
    
    const fileName = path.basename(filePath);
    let content = null;
    let source = 'unknown';
    
    // Try to read from embedded static files first
    let embeddedFiles = {};
    try {
      embeddedFiles = require('../data/embedded-static-files');
      console.info('[FILES-STORAGE] 📦 Embedded files loaded:', Object.keys(embeddedFiles).length, 'files');
    } catch (err) {
      console.warn('[FILES-STORAGE] ⚠️  Could not load embedded files module:', err.message);
    }
    
    // Try embedded files
    if (embeddedFiles && embeddedFiles[fileName]) {
      content = embeddedFiles[fileName];
      source = 'embedded';
      console.warn('[FILES-STORAGE] ✅ Got from embedded files:', fileName);
    } else {
      console.info('[FILES-STORAGE] 🔍 File not in embedded module:', fileName, '| Available:', Object.keys(embeddedFiles).slice(0, 5));
    }
    
    // Try filesystem as fallback
    if (!content) {
      const diskPath = path.join(__dirname, '../../public/files', fileName);
      console.info('[FILES-STORAGE] 🔍 Checking filesystem:', diskPath);
      if (fs.existsSync(diskPath)) {
        try {
          content = fs.readFileSync(diskPath, 'utf8');
          source = 'filesystem';
          console.warn('[FILES-STORAGE] ✅ Got from filesystem:', fileName);
        } catch (err) {
          console.error('[FILES-STORAGE] ❌ Error reading file:', err.message);
        }
      } else {
        console.info('[FILES-STORAGE] 📂 File does not exist on filesystem:', diskPath);
      }
    }
    
    // Provide fallback content for critical files if nothing else works
    if (!content) {
      console.info('[FILES-STORAGE] 📋 Checking fallback data for:', fileName);
      const fallbackData = {
        'manifest.json': JSON.stringify({
          name: "Kuhandran's Portfolio",
          short_name: "Portfolio",
          start_url: "/",
          display: "standalone",
          background_color: "#ffffff",
          theme_color: "#007bff",
          icons: [
            {
              src: "/image/apple-touch-icon.svg",
              sizes: "192x192",
              type: "image/svg+xml"
            }
          ]
        }, null, 2),
        'logo.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#007bff"/></svg>',
        'browserconfig.xml': '<?xml version="1.0" encoding="utf-8"?><browserconfig></browserconfig>',
        'robots.txt': 'User-agent: *\nAllow: /\nSitemap: /sitemap.xml',
        'sitemap.xml': '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>'
      };
      
      if (fallbackData[fileName]) {
        content = fallbackData[fileName];
        source = 'fallback-embedded';
        console.warn('[FILES-STORAGE] ✅ Using fallback data for:', fileName);
      } else {
        console.info('[FILES-STORAGE] ❌ No fallback data for:', fileName);
      }
    }
    
    // If we got content, seed it to Redis
    if (content && redis) {
      try {
        const key = `cms:files:${fileName}`;
        await redis.set(key, content);
        console.warn('[FILES-STORAGE] ✅ Seeded to Redis:', fileName, `(${source})`);
        return content;
      } catch (err) {
        console.error('[FILES-STORAGE] ❌ Error seeding to Redis:', err.message);
        // Even if seeding fails, we can still use the content
        return content;
      }
    } else if (content) {
      console.warn('[FILES-STORAGE] ⚠️  Got content but Redis not available, returning unsaved:', fileName);
      return content;
    }
    
    return null;
  } catch (err) {
    console.error('[FILES-STORAGE] ❌ Error ensuring file seeded:', err.message);
    return null;
  }
}

router.get('/*', async (req, res) => {
  try {
    const filePath = req.params[0];
    console.error('[FILES-STORAGE] 🚀 Request for file:', filePath);
    
    if (!filePath) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    let content = null;
    let source = 'unknown';

    // Try Redis first
    if (redis) {
      try {
        const key = `cms:files:${filePath}`;
        console.info('[FILES-STORAGE] 🔍 Checking Redis for key:', key);
        content = await redis.get(key);
        if (content) {
          source = 'redis';
          console.warn('[FILES-STORAGE] ✅ Found in Redis');
        } else {
          console.warn('[FILES-STORAGE] ⚠️  Not found in Redis, attempting to seed...');
          // Try to seed from embedded/filesystem
          content = await ensureFileSeededed(filePath);
          if (content) {
            source = 'seeded-cache';
            console.warn('[FILES-STORAGE] ✅ File seeded successfully');
          }
        }
      } catch (err) {
        console.error('[FILES-STORAGE] ❌ Redis read error:', err.message);
      }
    } else {
      console.warn('[FILES-STORAGE] ⚠️  Redis not available, attempting to seed...');
      // Try to seed even without Redis
      content = await ensureFileSeededed(filePath);
      if (content) {
        source = 'seeded-memory';
      }
    }

    // Try filesystem if not seeded and no redis
    if (!content) {
      const diskPath = path.join(__dirname, '../../public/files', filePath);
      console.error('[FILES-STORAGE] 🔍 Checking filesystem at:', diskPath);
      
      // Security check - ensure path is within public/files
      const realPath = path.resolve(diskPath);
      const basePath = path.resolve(path.join(__dirname, '../../public/files'));
      console.error('[FILES-STORAGE] 🔍 Resolved path:', realPath);
      console.error('[FILES-STORAGE] 🔍 Base path:', basePath);
      console.error('[FILES-STORAGE] 🔍 Path starts with base:', realPath.startsWith(basePath));
      console.error('[FILES-STORAGE] 🔍 File exists:', fs.existsSync(realPath));
      
      if (realPath.startsWith(basePath) && fs.existsSync(realPath)) {
        try {
          content = fs.readFileSync(realPath, 'utf8');
          source = 'filesystem';
          console.error('[FILES-STORAGE] ✅ Found in filesystem, size:', content.length);
        } catch (err) {
          console.error('[FILES-STORAGE] ❌ Filesystem read error:', err.message);
        }
      } else {
        console.error('[FILES-STORAGE] ❌ Path security check failed or file not found');
      }
    }

    if (!content) {
      console.error('[FILES-STORAGE] ❌ File not found from any source');
      
      // Instead of redirect (which can loop), return 404 with instructions
      // In production, Vercel will serve the file from static hosting
      console.warn('[FILES-STORAGE] 💡 File should be available at /files/' + filePath + ' via Vercel static hosting');
      return res.status(404).json({ 
        error: 'File not found in cache, check if available via static hosting',
        path: filePath, 
        source,
        staticUrl: `/files/${filePath}`
      });
    }

    // Determine MIME type based on extension
    const ext = filePath.toLowerCase().split('.').pop();
    
    const mimeTypes = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'txt': 'text/plain',
      'zip': 'application/zip',
      'json': 'application/json',
      'svg': 'image/svg+xml',
      'xml': 'application/xml',
      'html': 'text/html'
    };
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    // Handle response based on source
    if (source === 'redis' || source === 'seeded-cache') {
      // Redis content is served as-is
      if (ext === 'json') {
        console.warn('[FILES-STORAGE] ✅ Serving JSON from Redis cache');
        return res.json(JSON.parse(content));
      }
      
      console.warn('[FILES-STORAGE] ✅ Serving from Redis cache');
      return res.type(contentType).send(content);
    } else {
      // Serve directly from filesystem
      if (ext === 'json') {
        console.warn('[FILES-STORAGE] ✅ Serving JSON from filesystem');
        return res.json(JSON.parse(content));
      }
      
      console.warn('[FILES-STORAGE] ✅ Serving from filesystem');
      return res.type(contentType).send(content);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
