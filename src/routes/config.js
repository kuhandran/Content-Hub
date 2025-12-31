/**
 * Locale/Language Configuration API Routes
 * GET /api/config/languages - Get all languages and config
 * GET /api/config/locales - Get locale status and metadata
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Get language configuration
router.get('/languages', (req, res) => {
  try {
    const langPath = path.join(__dirname, '../../public/config/languages.json');
    const data = JSON.parse(fs.readFileSync(langPath, 'utf8'));
    res.json({
      status: 'success',
      data: data,
      timestamp: new Date(),
      cacheControl: 'public, max-age=3600'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      error: error.message 
    });
  }
});

// Get locale files status
router.get('/locales', (req, res) => {
  try {
    const collectionsPath = path.join(__dirname, '../../public/collections');
    
    // Return empty if collections doesn't exist
    if (!fs.existsSync(collectionsPath)) {
      return res.json({
        status: 'success',
        data: {
          totalLocales: 0,
          completeLocales: 0,
          locales: []
        },
        timestamp: new Date(),
        message: 'Collections directory not found'
      });
    }

    const locales = fs.readdirSync(collectionsPath)
      .filter(dir => {
        try {
          return fs.statSync(path.join(collectionsPath, dir)).isDirectory();
        } catch {
          return false;
        }
      })
      .map(locale => {
        const dataPath = path.join(collectionsPath, locale, 'data');
        const files = fs.existsSync(dataPath) 
          ? fs.readdirSync(dataPath).filter(f => !f.startsWith('.'))
          : [];
        return {
          code: locale,
          dataFiles: files.length,
          files: files,
          complete: files.length === 8
        };
      })
      .sort((a, b) => a.code.localeCompare(b.code));

    res.json({
      status: 'success',
      data: {
        totalLocales: locales.length,
        completeLocales: locales.filter(l => l.complete).length,
        locales: locales
      },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      error: error.message 
    });
  }
});

// Get single locale metadata
router.get('/locales/:code', (req, res) => {
  try {
    const { code } = req.params;
    const dataPath = path.join(__dirname, '../../public/collections', code, 'data');
    
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ 
        status: 'error', 
        error: `Locale ${code} not found` 
      });
    }

    const files = fs.readdirSync(dataPath)
      .filter(f => !f.startsWith('.'))
      .map(file => {
        const filePath = path.join(dataPath, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          lastModified: stats.mtime,
          type: path.extname(file)
        };
      });

    res.json({
      status: 'success',
      data: {
        code: code,
        fileCount: files.length,
        complete: files.length === 8,
        files: files
      },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      error: error.message 
    });
  }
});

// Get file types configuration
router.get('/file-types', (req, res) => {
  try {
    const fileTypes = [
      {
        name: "contentLabels.json",
        description: "UI strings, navigation, sections labels",
        required: true,
        size: "~400KB"
      },
      {
        name: "projects.json",
        description: "Portfolio projects (6 entries)",
        required: true,
        size: "~20KB"
      },
      {
        name: "experience.json",
        description: "Career positions (5 entries)",
        required: true,
        size: "~10KB"
      },
      {
        name: "skills.json",
        description: "Technical skills categories",
        required: true,
        size: "~5KB"
      },
      {
        name: "education.json",
        description: "Education entries (4 entries)",
        required: true,
        size: "~3KB"
      },
      {
        name: "achievements.json",
        description: "Awards and certifications",
        required: true,
        size: "~3KB"
      },
      {
        name: "chatConfig.json",
        description: "Chatbot configuration strings",
        required: true,
        size: "~1KB"
      },
      {
        name: "pageLayout.json",
        description: "Page structure configuration",
        required: false,
        size: "~1KB"
      }
    ];

    res.json({
      status: 'success',
      data: {
        totalTypes: fileTypes.length,
        requiredTypes: fileTypes.filter(f => f.required).length,
        fileTypes: fileTypes
      },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      error: error.message 
    });
  }
});

// Get system statistics
router.get('/statistics', (req, res) => {
  try {
    const collectionsPath = path.join(__dirname, '../../public/collections');
    
    // Return empty stats if collections doesn't exist
    if (!fs.existsSync(collectionsPath)) {
      return res.json({
        status: 'success',
        data: {
          totalFiles: 0,
          totalLocales: 0,
          completedLocales: 0,
          totalSize: 0,
          filesByType: {},
          localeStats: []
        },
        timestamp: new Date(),
        message: 'Collections directory not found'
      });
    }
    
    // Get all locales
    const locales = fs.readdirSync(collectionsPath)
      .filter(dir => {
        try {
          return fs.statSync(path.join(collectionsPath, dir)).isDirectory();
        } catch {
          return false;
        }
      });
    
    let totalFiles = 0;
    let completedLocales = 0;
    let totalSize = 0;
    let filesByType = {};
    
    locales.forEach(locale => {
      const dataPath = path.join(collectionsPath, locale, 'data');
      const configPath = path.join(collectionsPath, locale, 'config');
      
      // Count data files
      if (fs.existsSync(dataPath)) {
        const dataFiles = fs.readdirSync(dataPath).filter(f => !f.startsWith('.'));
        totalFiles += dataFiles.length;
        dataFiles.forEach(file => {
          const fileType = path.extname(file) || 'unknown';
          filesByType[fileType] = (filesByType[fileType] || 0) + 1;
        });
        
        if (dataFiles.length === 7) {
          completedLocales++;
        }
      }
      
      // Calculate size
      [dataPath, configPath].forEach(dir => {
        if (fs.existsSync(dir)) {
          fs.readdirSync(dir).forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            totalSize += stat.size;
          });
        }
      });
    });
    
    res.json({
      status: 'success',
      data: {
        totalLocales: locales.length,
        completedLocales: completedLocales,
        totalFiles: totalFiles,
        totalSize: totalSize,
        totalSizeKB: (totalSize / 1024).toFixed(2),
        averageFileSizeKB: totalFiles > 0 ? (totalSize / totalFiles / 1024).toFixed(2) : 0,
        filesByType: filesByType,
        localeList: locales,
        systemHealth: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          completeness: `${Math.round((completedLocales / locales.length) * 100)}%`
        }
      },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      error: error.message 
    });
  }
});

module.exports = router;
