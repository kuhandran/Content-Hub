const express = require('express');
const fs = require('fs');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

const PUBLIC_PATH = path.join(__dirname, '../../public');

function validatePath(filePath) {
  const realPath = path.resolve(filePath);
  const allowedPath = path.resolve(PUBLIC_PATH);
  return realPath.startsWith(allowedPath);
}

// Public listing endpoints (no auth required) - read from filesystem
router.get('/list-public/config', (req, res) => {
  try {
    const configDir = path.join(PUBLIC_PATH, 'config');
    const items = [];

    if (fs.existsSync(configDir)) {
      const files = fs.readdirSync(configDir);
      for (const file of files) {
        const filePath = path.join(configDir, file);
        const stat = fs.statSync(filePath);
        if (!stat.isDirectory()) {
          items.push({
            name: file,
            path: `config/${file}`,
            type: 'file',
            size: stat.size,
            modified: stat.mtime.toISOString(),
            ext: path.extname(file)
          });
        }
      }
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

router.get('/list-public/data', (req, res) => {
  try {
    const dataDir = path.join(PUBLIC_PATH, 'data');
    const items = [];

    if (fs.existsSync(dataDir)) {
      const files = fs.readdirSync(dataDir);
      for (const file of files) {
        const filePath = path.join(dataDir, file);
        const stat = fs.statSync(filePath);
        if (!stat.isDirectory()) {
          items.push({
            name: file,
            path: `data/${file}`,
            type: 'file',
            size: stat.size,
            modified: stat.mtime.toISOString(),
            ext: path.extname(file)
          });
        }
      }
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

// All routes below require auth
router.use(authMiddleware);

// GET /api/files/tree - Get folder structure
router.get('/tree', (req, res) => {
  try {
    const rootFolders = {
      collections: path.join(PUBLIC_PATH, 'collections'),
      config: path.join(PUBLIC_PATH, 'config'),
      image: path.join(PUBLIC_PATH, 'image'),
      resume: path.join(PUBLIC_PATH, 'resume'),
      files: path.join(PUBLIC_PATH, 'files')
    };

    const result = {};

    for (const [name, folderPath] of Object.entries(rootFolders)) {
      if (fs.existsSync(folderPath)) {
        const items = fs.readdirSync(folderPath, { withFileTypes: true });
        result[name] = {
          exists: true,
          count: items.length,
          subfolders: items
            .filter(i => i.isDirectory())
            .map(i => ({ name: i.name, type: 'folder' })),
          files: items
            .filter(i => !i.isDirectory())
            .map(i => ({
              name: i.name,
              ext: path.extname(i.name).toLowerCase(),
              type: 'file',
              path: `${name}/${i.name}`
            }))
        };
      } else {
        result[name] = { exists: false, count: 0, subfolders: [], files: [] };
      }
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/files/list/* - List folder contents
router.get('/list/*', (req, res) => {
  try {
    const requestPath = req.params[0] || '';
    const fullPath = path.join(PUBLIC_PATH, requestPath);

    if (!validatePath(fullPath)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Return empty array if path doesn't exist (instead of 404)
    if (!fs.existsSync(fullPath)) {
      return res.json({ 
        items: [], 
        count: 0, 
        path: requestPath,
        message: 'Directory not found or empty'
      });
    }

    const stats = fs.statSync(fullPath);

    if (!stats.isDirectory()) {
      return res.status(400).json({ error: 'Path is not a directory' });
    }

    const items = fs.readdirSync(fullPath, { withFileTypes: true })
      .filter(item => !item.name.startsWith('.'))
      .map(item => {
        const itemPath = path.join(requestPath, item.name);
        const fullItemPath = path.join(fullPath, item.name);
        const itemStats = fs.statSync(fullItemPath);

        return {
          name: item.name,
          path: itemPath,
          type: item.isDirectory() ? 'folder' : 'file',
          size: itemStats.size,
          modified: itemStats.mtime,
          ext: path.extname(item.name).toLowerCase(),
          isDirectory: item.isDirectory()
        };
      })
      .sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) {
          return b.isDirectory - a.isDirectory;
        }
        return a.name.localeCompare(b.name);
      });

    res.json({
      path: requestPath,
      count: items.length,
      items
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/files/read/* - Read file content
router.get('/read/*', (req, res) => {
  try {
    const filePath = req.params[0];
    const fullPath = path.join(PUBLIC_PATH, filePath);

    if (!validatePath(fullPath)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const stats = fs.statSync(fullPath);
    if (!stats.isFile()) {
      return res.status(400).json({ error: 'Not a file' });
    }

    const ext = path.extname(fullPath).toLowerCase();

    if (['.json', '.txt', '.md', '.csv'].includes(ext)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      res.json({ 
        path: filePath,
        content, 
        type: ext.slice(1),
        size: stats.size
      });
    } else if (['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext)) {
      const content = fs.readFileSync(fullPath);
      res.set('Content-Type', `image/${ext.slice(1)}`);
      res.send(content);
    } else {
      res.status(400).json({ error: 'File type not supported for preview' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/files/edit/* - Update file
router.put('/edit/*', (req, res) => {
  try {
    const filePath = req.params[0];
    const fullPath = path.join(PUBLIC_PATH, filePath);

    if (!validatePath(fullPath)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const { content } = req.body;
    fs.writeFileSync(fullPath, content, 'utf8');

    res.json({ 
      success: true, 
      message: 'File updated',
      path: filePath
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/files/delete/* - Delete file
router.delete('/delete/*', (req, res) => {
  try {
    const filePath = req.params[0];
    const fullPath = path.join(PUBLIC_PATH, filePath);

    if (!validatePath(fullPath)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      return res.status(400).json({ error: 'Cannot delete directory' });
    }

    fs.unlinkSync(fullPath);

    res.json({ 
      success: true, 
      message: 'File deleted',
      path: filePath
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/files/path/* - Get file path
router.get('/path/*', (req, res) => {
  const filePath = req.params[0];
  res.json({
    path: filePath,
    fullPath: `/public/${filePath}`,
    publicUrl: `/public/${filePath}`
  });
});

// POST /api/files/upload/:folder - Upload file to specific folder
router.post('/upload/:folder', (req, res) => {
  const { folder } = req.params;
  const allowedFolders = ['config', 'image', 'resume', 'files'];

  if (!allowedFolders.includes(folder)) {
    return res.status(403).json({ error: 'Folder not allowed' });
  }

  if (!req.files || !req.files.file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  try {
    const file = req.files.file;
    const fileName = file.name;
    const folderPath = path.join(PUBLIC_PATH, folder);
    const filePath = path.join(folderPath, fileName);

    // Ensure directory exists
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // Move file to destination
    file.mv(filePath, (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        success: true,
        message: 'File uploaded successfully',
        file: fileName,
        folder: folder,
        size: file.size
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



module.exports = router;
