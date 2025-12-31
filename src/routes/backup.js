/**
 * Backup & Export API Routes
 * GET  /api/backup/export - Export collections as ZIP
 * POST /api/backup/import - Import collections from ZIP
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { Storage } = require('buffer');

// Export collections as ZIP
router.get('/export', (req, res) => {
  try {
    const collectionsPath = path.join(__dirname, '../../public/collections');
    
    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    // Create timestamp for filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `collections-backup-${timestamp}.zip`;

    // Set response headers
    res.attachment(filename);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe archive data to response
    archive.pipe(res);

    // Add collections directory to archive
    archive.directory(collectionsPath, 'collections');

    // Handle errors
    archive.on('error', (err) => {
      console.error('Archive error:', err);
      if (!res.headersSent) {
        res.status(500).json({ 
          status: 'error', 
          error: 'Failed to create backup' 
        });
      }
    });

    res.on('error', (err) => {
      console.error('Response error:', err);
      archive.destroy();
    });

    // Finalize the archive
    archive.finalize();

  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ 
        status: 'error', 
        error: error.message 
      });
    }
  }
});

// Export specific locale as ZIP
router.get('/export/:locale', (req, res) => {
  try {
    const { locale } = req.params;
    const localePath = path.join(__dirname, '../../public/collections', locale);

    // Validate path
    if (!fs.existsSync(localePath)) {
      return res.status(404).json({ 
        status: 'error', 
        error: 'Locale not found' 
      });
    }

    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `${locale}-backup-${timestamp}.zip`;

    res.attachment(filename);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    archive.pipe(res);
    archive.directory(localePath, locale);

    archive.on('error', (err) => {
      console.error('Archive error:', err);
      if (!res.headersSent) {
        res.status(500).json({ 
          status: 'error', 
          error: 'Failed to create backup' 
        });
      }
    });

    archive.finalize();

  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ 
        status: 'error', 
        error: error.message 
      });
    }
  }
});

// Get backup status and metadata
router.get('/status', (req, res) => {
  try {
    const collectionsPath = path.join(__dirname, '../../public/collections');
    
    let totalSize = 0;
    let fileCount = 0;

    function getSize(dir) {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          getSize(filePath);
        } else {
          totalSize += stat.size;
          fileCount++;
        }
      });
    }

    getSize(collectionsPath);

    res.json({
      status: 'success',
      data: {
        backupAvailable: true,
        totalSize: totalSize,
        totalSizeKB: (totalSize / 1024).toFixed(2),
        fileCount: fileCount,
        lastBackupDate: new Date().toISOString(),
        collectionsPath: collectionsPath
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
