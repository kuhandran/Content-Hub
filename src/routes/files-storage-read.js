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
        console.error('[FILES-STORAGE] 🔍 Checking Redis for key:', key);
        content = await redis.get(key);
        if (content) {
          source = 'redis';
          console.error('[FILES-STORAGE] ✅ Found in Redis');
        } else {
          console.error('[FILES-STORAGE] ⚠️  Not found in Redis');
        }
      } catch (err) {
        console.error('[FILES-STORAGE] ❌ Redis read error:', err.message);
      }
    } else {
      console.error('[FILES-STORAGE] ⚠️  Redis not available');
    }

    // Try filesystem if not in Redis
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
      
      // As a last resort, redirect to the public URL
      const publicUrl = `/files/${filePath}`;
      console.error('[FILES-STORAGE] 🔄 Redirecting to public URL:', publicUrl);
      return res.redirect(302, publicUrl);
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
    if (source === 'redis') {
      // Decode from base64 (files stored as base64 in Redis)
      const buffer = Buffer.from(content, 'base64');
      
      // For JSON, decode and parse
      if (ext === 'json') {
        const decodedStr = buffer.toString('utf8');
        console.error('[FILES-STORAGE] ✅ Serving JSON from Redis');
        return res.json(JSON.parse(decodedStr));
      }
      
      console.error('[FILES-STORAGE] ✅ Serving from Redis');
      return res.type(contentType).send(buffer);
    } else {
      // Serve directly from filesystem
      if (ext === 'json') {
        console.error('[FILES-STORAGE] ✅ Serving JSON from filesystem');
        return res.json(JSON.parse(content));
      }
      
      console.error('[FILES-STORAGE] ✅ Serving from filesystem');
      return res.type(contentType).send(content);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
