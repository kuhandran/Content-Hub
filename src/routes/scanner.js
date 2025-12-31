/**
 * File Scanner API
 * Recursively scans collections folder and returns all JSON files
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Recursively scan directory and get all JSON files with their paths
 */
function scanCollectionsFolder(dir, baseDir = '') {
  const files = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      if (item.startsWith('.')) return; // Skip hidden files
      
      const fullPath = path.join(dir, item);
      const relativePath = path.join(baseDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Recursively scan subdirectories
        const subFiles = scanCollectionsFolder(fullPath, relativePath);
        files.push(...subFiles);
      } else if (item.endsWith('.json')) {
        // Add JSON files
        files.push({
          name: item,
          path: relativePath.replace(/\\/g, '/'),
          fullPath: fullPath,
          size: stat.size,
          type: 'json',
          locale: baseDir.split('/')[0] || 'root',
          category: baseDir.split('/')[1] || 'unknown'
        });
      }
    });
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error);
  }
  
  return files;
}

/**
 * GET /api/scanner/files
 * Returns all JSON files from collections folder with their paths
 */
router.get('/files', authMiddleware, (req, res) => {
  console.log('[SCANNER] GET /api/scanner/files - Request received');
  try {
    const collectionsPath = path.join(__dirname, '../../public/collections');
    console.log('[SCANNER] Collections path:', collectionsPath);
    
    if (!fs.existsSync(collectionsPath)) {
      console.log('[SCANNER] Collections path does not exist');
      return res.status(404).json({ error: 'Collections folder not found' });
    }
    
    console.log('[SCANNER] Scanning collections folder...');
    const files = scanCollectionsFolder(collectionsPath);
    console.log('[SCANNER] Found total files:', files.length);
    
    // Group files by locale
    const grouped = {};
    files.forEach(file => {
      if (!grouped[file.locale]) {
        grouped[file.locale] = [];
      }
      grouped[file.locale].push(file);
    });
    
    console.log('[SCANNER] Grouped by locales:', Object.keys(grouped));
    
    res.json({
      success: true,
      total: files.length,
      locales: Object.keys(grouped).length,
      grouped,
      files: files.sort((a, b) => a.path.localeCompare(b.path))
    });
  } catch (error) {
    console.error('[SCANNER] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/scanner/tree
 * Returns files organized in a tree structure
 */
router.get('/tree', authMiddleware, (req, res) => {
  try {
    const collectionsPath = path.join(__dirname, '../../public/collections');
    
    if (!fs.existsSync(collectionsPath)) {
      return res.status(404).json({ error: 'Collections folder not found' });
    }
    
    const files = scanCollectionsFolder(collectionsPath);
    
    // Build tree structure
    const tree = {};
    
    files.forEach(file => {
      const parts = file.path.split('/');
      let current = tree;
      
      // Navigate/create tree path
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1) {
          // Last part is the file
          if (!current.files) current.files = [];
          current.files.push({
            name: part,
            path: file.path,
            size: file.size,
            type: file.type
          });
        } else {
          // Intermediate directory
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }
      }
    });
    
    res.json({
      success: true,
      total: files.length,
      tree
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/scanner/search?q=query
 * Search for files by name, path, or content
 */
router.get('/search', authMiddleware, (req, res) => {
  try {
    const query = (req.query.q || '').toLowerCase();
    
    if (!query) {
      return res.status(400).json({ error: 'Search query required' });
    }
    
    const collectionsPath = path.join(__dirname, '../../public/collections');
    const files = scanCollectionsFolder(collectionsPath);
    
    const results = files.filter(file => 
      file.name.toLowerCase().includes(query) ||
      file.path.toLowerCase().includes(query) ||
      file.locale.toLowerCase().includes(query) ||
      file.category.toLowerCase().includes(query)
    );
    
    res.json({
      success: true,
      query,
      total: results.length,
      results: results.sort((a, b) => a.path.localeCompare(b.path))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/scanner/stats
 * Returns statistics about collections
 */
router.get('/stats', authMiddleware, (req, res) => {
  try {
    const collectionsPath = path.join(__dirname, '../../public/collections');
    const files = scanCollectionsFolder(collectionsPath);
    
    // Calculate statistics
    const stats = {
      totalFiles: files.length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0),
      averageSize: files.length > 0 ? Math.round(files.reduce((sum, f) => sum + f.size, 0) / files.length) : 0,
      locales: [...new Set(files.map(f => f.locale))].length,
      categories: [...new Set(files.map(f => f.category))].length,
      byLocale: {},
      byCategory: {}
    };
    
    // Group by locale and category
    files.forEach(file => {
      // By locale
      if (!stats.byLocale[file.locale]) {
        stats.byLocale[file.locale] = { count: 0, size: 0 };
      }
      stats.byLocale[file.locale].count++;
      stats.byLocale[file.locale].size += file.size;
      
      // By category
      if (!stats.byCategory[file.category]) {
        stats.byCategory[file.category] = { count: 0, size: 0 };
      }
      stats.byCategory[file.category].count++;
      stats.byCategory[file.category].size += file.size;
    });
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
