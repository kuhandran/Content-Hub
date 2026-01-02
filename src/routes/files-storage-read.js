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
    if (!filePath) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    let content = null;
    let source = 'unknown';

    // Try Redis first
    if (redis) {
      try {
        const key = `cms:files:${filePath}`;
        content = await redis.get(key);
        if (content) source = 'redis';
      } catch (err) {
        console.error('[FILES] Redis read error:', err.message);
      }
    }

    // Try filesystem if not in Redis
    if (!content) {
      const diskPath = path.join(__dirname, '../../public/files', filePath);
      
      // Security check - ensure path is within public/files
      const realPath = path.resolve(diskPath);
      const basePath = path.resolve(path.join(__dirname, '../../public/files'));
      
      if (realPath.startsWith(basePath) && fs.existsSync(realPath)) {
        try {
          content = fs.readFileSync(realPath, 'utf8');
          source = 'filesystem';
        } catch (err) {
          console.error('[FILES] Filesystem read error:', err.message);
        }
      }
    }

    if (!content) {
      return res.status(404).json({ error: 'File not found', path: filePath, source });
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
        return res.json(JSON.parse(decodedStr));
      }
      
      return res.type(contentType).send(buffer);
    } else {
      // Serve directly from filesystem
      if (ext === 'json') {
        return res.json(JSON.parse(content));
      }
      
      return res.type(contentType).send(content);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
