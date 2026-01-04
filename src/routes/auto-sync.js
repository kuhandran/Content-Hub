/**
 * Auto-Sync Endpoint
 * POST /api/auto-sync - Automatically detect and sync files from public folders to Redis
 * Scans: collections, config, data, files, image, resume
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

let redis = null;

// Initialize Redis connection
async function initRedis() {
  try {
    const { createClient } = require('redis');
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      console.error('[AUTO-SYNC] ⚠️  No REDIS_URL configured');
      return false;
    }

    redis = createClient({ url: redisUrl });
    await redis.connect();
    console.log('[AUTO-SYNC] ✅ Redis connected');
    return true;
  } catch (err) {
    console.error('[AUTO-SYNC] ❌ Redis init failed:', err.message);
    return false;
  }
}

initRedis();

/**
 * Recursively scan directory and return all files
 */
function scanDirectory(dirPath, baseDir = dirPath) {
  const files = [];
  
  try {
    if (!fs.existsSync(dirPath)) {
      return files;
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        files.push(...scanDirectory(fullPath, baseDir));
      } else if (entry.isFile()) {
        // Get relative path from base directory
        const relativePath = path.relative(baseDir, fullPath);
        files.push({
          name: entry.name,
          path: relativePath.replace(/\\/g, '/'), // Normalize to forward slashes
          fullPath: fullPath,
          size: fs.statSync(fullPath).size,
          ext: path.extname(entry.name),
          modified: fs.statSync(fullPath).mtime
        });
      }
    }
  } catch (error) {
    console.error(`[AUTO-SYNC] Error scanning ${dirPath}:`, error.message);
  }

  return files;
}

/**
 * Scan specific folders in public directory
 */
function scanPublicFolders() {
  const publicDir = path.join(__dirname, '../../public');
  const foldersToScan = ['collections', 'config', 'data', 'files', 'image', 'resume'];
  
  const allFiles = {};
  let totalFiles = 0;

  console.log('[AUTO-SYNC] 📂 Scanning public folders...');

  for (const folder of foldersToScan) {
    const folderPath = path.join(publicDir, folder);
    const files = scanDirectory(folderPath, publicDir);
    
    allFiles[folder] = files;
    totalFiles += files.length;
    
    console.log(`[AUTO-SYNC] Found ${files.length} files in ${folder}/`);
  }

  console.log(`[AUTO-SYNC] Total files found: ${totalFiles}`);
  return allFiles;
}

/**
 * Seed files to Redis
 */
async function seedFilesToRedis(filesMap) {
  if (!redis) {
    throw new Error('Redis not connected');
  }

  const results = {
    seeded: 0,
    failed: 0,
    errors: []
  };

  for (const [folder, files] of Object.entries(filesMap)) {
    for (const file of files) {
      try {
        const content = fs.readFileSync(file.fullPath, 'utf8');
        const key = `cms:file:${file.path}`;
        
        await redis.set(key, content);
        results.seeded++;
        
        console.log(`[AUTO-SYNC] ✅ Seeded: ${file.path}`);
      } catch (error) {
        results.failed++;
        results.errors.push({
          file: file.path,
          error: error.message
        });
        console.error(`[AUTO-SYNC] ❌ Failed to seed ${file.path}:`, error.message);
      }
    }
  }

  return results;
}

/**
 * Generate and save manifest
 */
async function generateManifest(filesMap) {
  try {
    const manifest = {
      generated: new Date().toISOString(),
      folders: Object.keys(filesMap),
      totalFiles: Object.values(filesMap).reduce((sum, files) => sum + files.length, 0),
      files: {}
    };

    // Organize files by folder with detailed metadata
    for (const [folder, files] of Object.entries(filesMap)) {
      manifest.files[folder] = files.map(f => ({
        name: f.name,
        path: f.path,
        size: f.size,
        ext: f.ext,
        modified: f.modified,
        folder: folder
      }));
    }

    // Save to Redis
    if (redis) {
      await redis.set('cms:manifest', JSON.stringify(manifest, null, 2));
      console.log('[AUTO-SYNC] ✅ Manifest saved to Redis');
    }

    // Save to filesystem (for fallback)
    const manifestPath = path.join(__dirname, '../../public/manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('[AUTO-SYNC] ✅ Manifest saved to filesystem');

    return manifest;
  } catch (error) {
    console.error('[AUTO-SYNC] ❌ Failed to generate manifest:', error.message);
    throw error;
  }
}

/**
 * POST /api/auto-sync - Trigger auto-sync
 * Can be called by Vercel Cron or manually
 */
router.post('/', async (req, res) => {
  console.log('[AUTO-SYNC] 🔄 Auto-sync triggered');
  
  // Verify Vercel Cron secret or allow manual trigger with auth
  const cronSecret = req.headers['authorization'];
  const vercelCronSecret = process.env.CRON_SECRET;
  
  // Log cron request info
  const isVercelCron = req.headers['user-agent']?.includes('vercel-cron');
  console.log(`[AUTO-SYNC] Request from: ${isVercelCron ? 'Vercel Cron' : 'Manual trigger'}`);
  
  // Optional: Uncomment to require authentication
  // if (vercelCronSecret && cronSecret !== `Bearer ${vercelCronSecret}`) {
  //   console.error('[AUTO-SYNC] ❌ Unauthorized: Invalid cron secret');
  //   return res.status(401).json({ error: 'Unauthorized' });
  // }
  
  try {
    // Check Redis connection
    if (!redis) {
      const connected = await initRedis();
      if (!connected) {
        return res.status(503).json({
          success: false,
          error: 'Redis not available',
          message: 'Cannot sync without Redis connection'
        });
      }
    }

    // Scan public folders
    const filesMap = scanPublicFolders();

    // Seed files to Redis
    const seedResults = await seedFilesToRedis(filesMap);

    // Generate manifest
    const manifest = await generateManifest(filesMap);

    console.log('[AUTO-SYNC] ✅ Auto-sync completed');
    console.log(`[AUTO-SYNC] Seeded: ${seedResults.seeded}, Failed: ${seedResults.failed}`);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      filesScanned: manifest.totalFiles,
      filesSeeded: seedResults.seeded,
      filesFailed: seedResults.failed,
      folders: manifest.folders,
      manifest: manifest,
      errors: seedResults.errors.length > 0 ? seedResults.errors : undefined
    });

  } catch (error) {
    console.error('[AUTO-SYNC] ❌ Auto-sync failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/auto-sync/status - Check sync status
 */
router.get('/status', async (req, res) => {
  try {
    let manifest = null;
    let redisConnected = false;

    // Try to get manifest from Redis
    if (redis) {
      try {
        const manifestStr = await redis.get('cms:manifest');
        if (manifestStr) {
          manifest = JSON.parse(manifestStr);
        }
        redisConnected = true;
      } catch (err) {
        console.error('[AUTO-SYNC] Failed to get manifest from Redis:', err.message);
      }
    }

    // Fallback to filesystem
    if (!manifest) {
      const manifestPath = path.join(__dirname, '../../public/manifest.json');
      if (fs.existsSync(manifestPath)) {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      }
    }

    res.json({
      redisConnected,
      lastSync: manifest?.generated || 'Never',
      totalFiles: manifest?.totalFiles || 0,
      folders: manifest?.folders || [],
      manifest: manifest
    });

  } catch (error) {
    console.error('[AUTO-SYNC] Error getting sync status:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

module.exports = router;
