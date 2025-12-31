/**
 * File Scanner API
 * Recursively scans collections folder and returns all JSON files
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/authMiddleware');
const storage = require('../utils/storage');
const logger = require('../utils/logger');

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
router.get('/files', authMiddleware, async (req, res) => {
  const startTime = Date.now();
  const userId = req.user?.username || 'unknown';
  
  try {
    logger.info('SCANNER', `[${userId}] GET /api/scanner/files - Request started`);

    // List collection files with timing
    const filesStartTime = Date.now();
    const files = await storage.listCollectionFiles();
    const filesDuration = Date.now() - filesStartTime;
    
    logger.debug('SCANNER', `File listing completed`, {
      userId,
      duration: filesDuration,
      filesCount: files?.length || 0,
      storage: storage.useFilesystem ? 'filesystem' : 'KV'
    });

    if (!files || files.length === 0) {
      logger.warn('SCANNER', `[${userId}] No collection files found`, {
        duration: Date.now() - startTime
      });
      
      return res.status(200).json({ 
        success: true,
        files: [],
        count: 0,
        grouped: {},
        statistics: {
          totalFiles: 0,
          totalLocales: 0,
          completeness: 0,
          filesByType: {}
        },
        message: 'No collection files found'
      });
    }

    logger.debug('SCANNER', `Found ${files.length} files`, { count: files.length });

    // Group files by locale
    const grouped = {};
    files.forEach(file => {
      try {
        if (!grouped[file.locale]) {
          grouped[file.locale] = [];
        }
        grouped[file.locale].push(file);
      } catch (groupError) {
        logger.error('SCANNER', `Error grouping file ${file.path}`, groupError, { file });
      }
    });

    const locales = Object.keys(grouped);
    
    // Calculate statistics
    const filesByType = {};
    let completedLocales = 0;
    locales.forEach(locale => {
      const localeFiles = grouped[locale] || [];
      const expectedFiles = 8; // Expected number of files per locale
      if (localeFiles.length >= expectedFiles) {
        completedLocales++;
      }
      localeFiles.forEach(file => {
        const ext = file.path?.split('.')?.pop() || 'unknown';
        filesByType[ext] = (filesByType[ext] || 0) + 1;
      });
    });
    
    const completeness = locales.length > 0 ? Math.round((completedLocales / locales.length) * 100) : 0;
    
    logger.success('SCANNER', `[${userId}] Successfully loaded ${files.length} files from ${locales.length} locales`, {
      locales,
      duration: Date.now() - startTime
    });

    res.json({
      success: true,
      total: files.length,
      locales: locales.length,
      localesList: locales,
      grouped,
      files: files.sort((a, b) => a.path.localeCompare(b.path)),
      statistics: {
        totalFiles: files.length,
        totalLocales: locales.length,
        completedLocales,
        completeness,
        filesByType
      },
      metadata: {
        duration: Date.now() - startTime,
        storage: storage.useFilesystem ? 'filesystem' : 'KV',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('SCANNER', `[${userId}] Error scanning files`, error, {
      duration: Date.now() - startTime,
      stack: error.stack
    });

    res.status(500).json({ 
      success: false,
      error: error.message,
      errorType: error.constructor.name,
      timestamp: new Date().toISOString()
    });
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
