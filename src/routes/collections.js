/**
 * Multi-language collection API routes
 * GET /api/v1/:language/:type
 * GET /api/v1/:language/:type/:file
 * POST /api/v1/:language/:type/:file
 * PATCH /api/v1/:language/:type/:file
 * DELETE /api/v1/:language/:type/:file
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

module.exports = (cache) => {
  function validatePath(filePath) {
    const publicPath = path.resolve(path.join(__dirname, '../../public'));
    const fullPath = path.resolve(path.join(__dirname, '../../public', filePath));
    return fullPath.startsWith(publicPath);
  }

  function readFile(filePath) {
    if (!validatePath(filePath)) throw new Error('Invalid path');
    const fullPath = path.join(__dirname, '../../public', filePath);
    if (!fs.existsSync(fullPath)) return null;
    const ext = path.extname(fullPath).toLowerCase();
    const data = fs.readFileSync(fullPath, 'utf8');
    return ext === '.json' ? JSON.parse(data) : data;
  }

  function writeFile(filePath, data) {
    if (!validatePath(filePath)) throw new Error('Invalid path');
    const fullPath = path.join(__dirname, '../../public', filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    fs.writeFileSync(fullPath, content + (content.endsWith('\n') ? '' : '\n'), 'utf8');
    cache.invalidate(`file:${filePath}`);
    
    // Extract language and type from path (collections/language/type/file.json)
    const parts = filePath.split('/');
    if (parts.length >= 3) {
      const language = parts[1];
      const type = parts[2];
      cache.invalidatePattern(`collections:${language}/${type}/*`);
    }
  }

  function deleteFile(filePath) {
    if (!validatePath(filePath)) throw new Error('Invalid path');
    const fullPath = path.join(__dirname, '../../public', filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      cache.invalidate(`file:${filePath}`);
      
      // Extract language and type from path and invalidate cache
      const parts = filePath.split('/');
      if (parts.length >= 3) {
        const language = parts[1];
        const type = parts[2];
        cache.invalidatePattern(`collections:${language}/${type}/*`);
      }
    }
  }

  // List all files in type
  router.get('/:language/:type', (req, res) => {
    const { language, type } = req.params;
    const folderPath = `collections/${language}/${type}`;
    try {
      const fullPath = path.join(__dirname, '../../public', folderPath);
      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ error: `Folder not found: ${folderPath}` });
      }
      const files = fs.readdirSync(fullPath)
        .filter(f => !f.startsWith('.'))
        .map(f => ({
          name: f,
          path: `${folderPath}/${f}`,
          type: path.extname(f),
          size: fs.statSync(path.join(fullPath, f)).size,
          isFile: fs.statSync(path.join(fullPath, f)).isFile()
        }));
      res.json({ language, type, folder: folderPath, count: files.length, files });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single file (cached)
  router.get('/:language/:type/:file', (req, res) => {
    const { language, type, file } = req.params;
    const cacheKey = `collections:${language}/${type}/${file}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }
    try {
      const filePath = `collections/${language}/${type}/${file}`;
      const data = readFile(filePath);
      if (!data) return res.status(404).json({ error: 'File not found' });
      let ttl = 3600000;
      if (file.endsWith('.json')) ttl = 1800000;
      else if (file.match(/\.(jpg|jpeg|png|webp|gif)$/i)) ttl = 7200000;
      cache.set(cacheKey, data, ttl);
      res.set('X-Cache', 'MISS');
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create or update file
  router.post('/:language/:type/:file', (req, res) => {
    const { language, type, file } = req.params;
    try {
      const filePath = `collections/${language}/${type}/${file}`;
      writeFile(filePath, req.body);
      res.status(201).json({ 
        message: 'File saved', 
        path: filePath, 
        timestamp: new Date() 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Partial update (merge)
  router.patch('/:language/:type/:file', (req, res) => {
    const { language, type, file } = req.params;
    try {
      const filePath = `collections/${language}/${type}/${file}`;
      const existing = readFile(filePath);
      if (!existing) return res.status(404).json({ error: 'File not found' });
      const merged = { ...existing, ...req.body };
      writeFile(filePath, merged);
      res.json({ 
        message: 'File updated', 
        data: merged, 
        timestamp: new Date() 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete file
  router.delete('/:language/:type/:file', (req, res) => {
    const { language, type, file } = req.params;
    try {
      const filePath = `collections/${language}/${type}/${file}`;
      deleteFile(filePath);
      res.json({ 
        message: 'File deleted', 
        path: filePath, 
        timestamp: new Date() 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Upload file to collection
  router.post('/upload/:language/:type', (req, res) => {
    const { language, type } = req.params;
    const files = req.files || {};

    if (!files.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    try {
      const file = files.file;
      const fileName = file.name;
      const filePath = `collections/${language}/${type}/${fileName}`;

      if (!validatePath(filePath)) {
        return res.status(403).json({ error: 'Invalid path' });
      }

      const fullPath = path.join(__dirname, '../../public', filePath);
      const dir = path.dirname(fullPath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      file.mv(fullPath, (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        cache.invalidatePattern(`collections:${language}/${type}/*`);
        res.json({
          success: true,
          message: 'File uploaded successfully',
          file: fileName,
          path: filePath
        });
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};

