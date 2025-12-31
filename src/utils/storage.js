/**
 * Storage abstraction layer
 * Uses KV storage on Vercel, filesystem locally
 */

const fs = require('fs');
const path = require('path');

// Check if we're on Vercel
const isVercel = !!process.env.VERCEL;

let kvStorage = null;

// Initialize KV storage if on Vercel
if (isVercel && process.env.KV_URL) {
  try {
    const VercelKVStorage = require('../lib/vercel-kv-storage');
    kvStorage = new VercelKVStorage();
    console.log('[STORAGE] Using Vercel KV for file storage');
  } catch (error) {
    console.warn('[STORAGE] Failed to initialize KV storage:', error.message);
    console.log('[STORAGE] Falling back to filesystem (note: Vercel has read-only filesystem)');
  }
}

// Fallback to filesystem
const useFilesystem = !kvStorage;

if (useFilesystem) {
  console.log('[STORAGE] Using filesystem for file storage');
}

/**
 * List all collection files
 */
async function listCollectionFiles() {
  if (kvStorage) {
    try {
      const files = await kvStorage.listFiles();
      return files;
    } catch (error) {
      console.error('[STORAGE] KV listFiles error:', error);
      return [];
    }
  }

  // Filesystem fallback
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
  if (kvStorage) {
    try {
      const content = await kvStorage.getFile(filePath);
      if (content === null) {
        throw new Error('File not found');
      }
      return typeof content === 'string' ? JSON.parse(content) : content;
    } catch (error) {
      console.error(`[STORAGE] KV readFile error for ${filePath}:`, error);
      throw error;
    }
  }

  // Filesystem fallback
  const fullPath = path.join(__dirname, '../../public', filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error('File not found');
  }
  const content = fs.readFileSync(fullPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Write a file
 */
async function writeFile(filePath, content) {
  if (kvStorage) {
    try {
      await kvStorage.setFile(filePath, content);
      return true;
    } catch (error) {
      console.error(`[STORAGE] KV writeFile error for ${filePath}:`, error);
      throw error;
    }
  }

  // Filesystem fallback
  const fullPath = path.join(__dirname, '../../public', filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, JSON.stringify(content, null, 2));
  return true;
}

/**
 * Get storage statistics
 */
async function getStats() {
  if (kvStorage) {
    try {
      return await kvStorage.getStats();
    } catch (error) {
      console.error('[STORAGE] KV getStats error:', error);
      return { totalFiles: 0, totalSize: 0 };
    }
  }

  // Filesystem fallback
  const files = await listCollectionFiles();
  let totalSize = 0;
  files.forEach(f => totalSize += f.size || 0);
  return { totalFiles: files.length, totalSize };
}

module.exports = {
  listCollectionFiles,
  readFile,
  writeFile,
  getStats,
  isVercel,
  useFilesystem
};
