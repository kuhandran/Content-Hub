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

    // Save to filesystem only in development (Vercel has read-only filesystem)
    const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production';
    if (!isProduction) {
      try {
        const manifestPath = path.join(__dirname, '../../public/manifest.json');
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log('[AUTO-SYNC] ✅ Manifest saved to filesystem (dev only)');
      } catch (fsError) {
        console.warn('[AUTO-SYNC] ⚠️  Could not write to filesystem (expected in production):', fsError.message);
      }
    }

    return manifest;
  } catch (error) {
    console.error('[AUTO-SYNC] ❌ Failed to generate manifest:', error.message);
    throw error;
  }
}

/**
 * Rebuild manifest from Redis keys
 */
async function rebuildManifestFromRedis() {
  if (!redis) {
    throw new Error('Redis not connected');
  }

  console.log('[AUTO-SYNC] 🔍 Scanning Redis for cms:file:* keys...');
  
  // Scan all file keys in Redis
  const keys = [];
  let cursor = 0;
  
  do {
    const result = await redis.scan(cursor, {
      MATCH: 'cms:file:*',
      COUNT: 100
    });
    cursor = result.cursor;
    keys.push(...result.keys);
  } while (cursor !== 0);

  console.log(`[AUTO-SYNC] Found ${keys.length} files in Redis`);

  // Organize files by folder
  const filesMap = {
    collections: [],
    config: [],
    data: [],
    files: [],
    image: [],
    resume: []
  };

  for (const key of keys) {
    const filePath = key.replace('cms:file:', '');
    const parts = filePath.split('/');
    const folder = parts[0];
    const filename = parts[parts.length - 1];
    
    if (filesMap.hasOwnProperty(folder)) {
      // Get file content to calculate size
      const content = await redis.get(key);
      const size = Buffer.byteLength(content || '', 'utf8');
      
      const fileObj = {
        name: filename,
        path: filePath,
        size: size,
        ext: path.extname(filename)
      };

      // Add locale for collections
      if (folder === 'collections' && parts.length >= 3) {
        fileObj.locale = parts[1];
        fileObj.type = parts[2];
      }

      filesMap[folder].push(fileObj);
    }
  }

  // Generate manifest
  const manifest = {
    generated: new Date().toISOString(),
    folders: Object.keys(filesMap).filter(f => filesMap[f].length > 0),
    totalFiles: keys.length,
    files: filesMap
  };

  // Save manifest to Redis
  await redis.set('cms:manifest', JSON.stringify(manifest, null, 2));
  console.log('[AUTO-SYNC] ✅ Manifest rebuilt and saved to Redis');

  return { manifest, filesCount: keys.length };
}

/**
 * POST /api/auto-sync - Rebuild manifest from Redis
 * Works in production by reading from Redis instead of filesystem
 */
router.post('/', async (req, res) => {
  console.log('[AUTO-SYNC] 🔄 Sync triggered - rebuilding from Redis');
  
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

    // Check if in production (Vercel) or local
    const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      // In production: Rebuild manifest from Redis
      const result = await rebuildManifestFromRedis();
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        filesScanned: result.filesCount,
        filesSeeded: 0,
        filesFailed: 0,
        folders: result.manifest.folders,
        manifest: result.manifest,
        source: 'redis',
        message: 'Manifest rebuilt from Redis keys'
      });
    } else {
      // In local: Scan filesystem and seed to Redis
      const filesMap = scanPublicFolders();
      const seedResults = await seedFilesToRedis(filesMap);
      const manifest = await generateManifest(filesMap);

      console.log('[AUTO-SYNC] ✅ Local sync completed');
      console.log(`[AUTO-SYNC] Seeded: ${seedResults.seeded}, Failed: ${seedResults.failed}`);

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        filesScanned: manifest.totalFiles,
        filesSeeded: seedResults.seeded,
        filesFailed: seedResults.failed,
        folders: manifest.folders,
        manifest: manifest,
        source: 'filesystem',
        errors: seedResults.errors.length > 0 ? seedResults.errors : undefined
      });
    }

  } catch (error) {
    console.error('[AUTO-SYNC] ❌ Sync failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/auto-sync/status - Check sync status with detailed collections info
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

    // Scan for collection details
    const publicDir = path.join(__dirname, '../../public/collections');
    const collectionDetails = {};
    let totalCollections = 0;
    let totalConfigFiles = 0;
    let totalDataFiles = 0;
    let totalImageFiles = 0;
    let totalJsFiles = 0;

    if (fs.existsSync(publicDir)) {
      const locales = fs.readdirSync(publicDir, { withFileTypes: true });
      
      for (const locale of locales) {
        if (locale.isDirectory()) {
          const localeCode = locale.name;
          const configDir = path.join(publicDir, localeCode, 'config');
          const dataDir = path.join(publicDir, localeCode, 'data');
          
          let configCount = 0;
          let dataCount = 0;

          if (fs.existsSync(configDir)) {
            configCount = fs.readdirSync(configDir).filter(f => !fs.statSync(path.join(configDir, f)).isDirectory()).length;
            totalConfigFiles += configCount;
          }

          if (fs.existsSync(dataDir)) {
            dataCount = fs.readdirSync(dataDir).filter(f => !fs.statSync(path.join(dataDir, f)).isDirectory()).length;
            totalDataFiles += dataCount;
          }

          collectionDetails[localeCode] = {
            locale: localeCode,
            configFiles: configCount,
            dataFiles: dataCount,
            totalFiles: configCount + dataCount,
            syncStatus: 'ready'
          };
          totalCollections++;
        }
      }
    }

    // Count image and JS files
    const imageDir = path.join(__dirname, '../../public/image');
    const jsDir = path.join(__dirname, '../../public/js');

    if (fs.existsSync(imageDir)) {
      const images = fs.readdirSync(imageDir).filter(f => !fs.statSync(path.join(imageDir, f)).isDirectory());
      totalImageFiles = images.length;
    }

    if (fs.existsSync(jsDir)) {
      const scripts = fs.readdirSync(jsDir).filter(f => !fs.statSync(path.join(jsDir, f)).isDirectory());
      totalJsFiles = scripts.length;
    }

    // Count files in config and data folders
    const mainConfigDir = path.join(__dirname, '../../public/config');
    const mainDataDir = path.join(__dirname, '../../public/data');

    if (fs.existsSync(mainConfigDir)) {
      const configs = fs.readdirSync(mainConfigDir).filter(f => !fs.statSync(path.join(mainConfigDir, f)).isDirectory());
      totalConfigFiles += configs.length;
    }

    if (fs.existsSync(mainDataDir)) {
      const data = fs.readdirSync(mainDataDir).filter(f => !fs.statSync(path.join(mainDataDir, f)).isDirectory());
      totalDataFiles += data.length;
    }

    res.json({
      success: true,
      redisConnected,
      lastSync: manifest?.generated || 'Never',
      timestamp: new Date().toISOString(),
      summary: {
        totalCollections,
        totalConfigFiles,
        totalDataFiles,
        totalImageFiles,
        totalJsFiles,
        totalFiles: manifest?.totalFiles || 0
      },
      collections: collectionDetails,
      folders: manifest?.folders || [],
      manifest: manifest
    });

  } catch (error) {
    console.error('[AUTO-SYNC] Error getting sync status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Upload file endpoint
 */
router.post('/upload', async (req, res) => {
  try {
    const { folder, filename, content, path: filePath } = req.body;

    if (!folder || !filename || !content || !filePath) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: folder, filename, content, path'
      });
    }

    // Validate folder
    const allowedFolders = ['collections', 'config', 'data', 'files', 'image', 'resume'];
    if (!allowedFolders.includes(folder)) {
      return res.status(400).json({
        success: false,
        error: `Invalid folder. Allowed: ${allowedFolders.join(', ')}`
      });
    }

    if (!redis) {
      return res.status(500).json({
        success: false,
        error: 'Redis not connected'
      });
    }

    // Store file in Redis
    const key = `cms:file:${filePath}`;
    await redis.set(key, content);

    console.log(`[AUTO-SYNC] ✅ Uploaded file: ${filePath}`);

    res.json({
      success: true,
      message: `File uploaded successfully to ${filePath}`,
      key: key,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[AUTO-SYNC] ❌ Upload failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
