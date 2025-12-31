/**
 * Storage abstraction layer using Redis
 * Works on Vercel and locally with REDIS_URL
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('redis');

let redis = null;
let redisConnected = false;

async function initRedis() {
  try {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      console.log('[STORAGE] REDIS_URL not configured');
      return false;
    }

    redis = createClient({ url: redisUrl });
    
    redis.on('error', (err) => {
      console.error('[STORAGE] Redis connection error:', err.message);
      redisConnected = false;
    });

    await redis.connect();
    redisConnected = true;
    console.log('[STORAGE] Connected to Redis');
    return true;
  } catch (err) {
    console.error('[STORAGE] Redis init failed:', err.message);
    return false;
  }
}

// Initialize Redis on startup
initRedis().catch(err => console.error('[STORAGE] Redis init error:', err));

/**
 * List all collection files from Redis
 */
async function listCollectionFiles() {
  if (!redisConnected || !redis) {
    // Filesystem fallback
    return listFilesystemCollections();
  }

  try {
    const keys = await redis.keys('cms:file:*');
    const files = [];

    for (const key of keys) {
      const relativePath = key.replace('cms:file:', '');
      const parts = relativePath.split('/');
      
      files.push({
        name: parts[parts.length - 1],
        path: relativePath,
        size: 0,
        type: 'json',
        locale: parts[0] || 'root',
        category: parts[1] || 'unknown'
      });
    }

    console.log(`[STORAGE] Found ${files.length} files in Redis`);
    return files;
  } catch (error) {
    console.error('[STORAGE] Redis listFiles error:', error);
    return listFilesystemCollections();
  }
}

function listFilesystemCollections() {
  const collectionsPath = path.join(__dirname, '../../public/collections');
  const files = [];

  if (!fs.existsSync(collectionsPath)) {
    return [];
  }

  function scanDir(dir, baseDir = '') {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      if (item.startsWith('.')) return;
      const fullPath = path.join(dir, item);
      const relativePath = path.join(baseDir, item).replace(/\\/g, '/');
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanDir(fullPath, relativePath);
      } else if (item.endsWith('.json')) {
        files.push({
          name: item,
          path: relativePath,
          fullPath,
          size: stat.size,
          type: 'json',
          locale: baseDir.split('/')[0] || 'root',
          category: baseDir.split('/')[1] || 'unknown'
        });
      }
    });
  }

  scanDir(collectionsPath);
  return files;
}

/**
 * Read a file
 */
async function readFile(filePath) {
  if (redisConnected && redis) {
    try {
      const content = await redis.get(`cms:file:${filePath}`);
      if (!content) {
        throw new Error('File not found');
      }
      return typeof content === 'string' ? JSON.parse(content) : content;
    } catch (error) {
      console.error(`[STORAGE] Redis readFile error for ${filePath}:`, error);
      throw error;
    }
  }

  // Filesystem fallback
  const collectionsPath = path.join(__dirname, '../../public/collections', filePath);
  
  if (!fs.existsSync(collectionsPath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = fs.readFileSync(collectionsPath, 'utf8');
  return JSON.parse(content);
}

/**
 * Write a file
 */
async function writeFile(filePath, content) {
  if (redisConnected && redis) {
    try {
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      await redis.setEx(`cms:file:${filePath}`, 7776000, contentStr);
      return true;
    } catch (error) {
      console.error(`[STORAGE] Redis writeFile error for ${filePath}:`, error);
      throw error;
    }
  }

  // Filesystem fallback
  const collectionsPath = path.join(__dirname, '../../public/collections', filePath);
  const dir = path.dirname(collectionsPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const contentStr = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
  fs.writeFileSync(collectionsPath, contentStr, 'utf8');
  return true;
}

/**
 * Get statistics about stored files
 */
async function getStats() {
  const files = await listCollectionFiles();
  
  const locales = new Set();
  const categories = new Set();
  const types = {};

  files.forEach(file => {
    locales.add(file.locale);
    categories.add(file.category);
    types[file.type] = (types[file.type] || 0) + 1;
  });

  const completedLocales = locales.size;
  const totalLocales = 11; // en, es, fr, de, hi, id, my, si, ta, th, ar-AE, en-AU, en-CA, en-GB, en-MY, en-NZ, en-US
  const completeness = totalLocales > 0 ? Math.round((completedLocales / totalLocales) * 100) : 0;

  return {
    totalFiles: files.length,
    totalLocales: locales.size,
    completeness,
    filesByType: types,
    locales: Array.from(locales).sort(),
    storage: redisConnected ? 'redis' : 'filesystem'
  };
}

module.exports = {
  listCollectionFiles,
  readFile,
  writeFile,
  getStats,
  initRedis
};
