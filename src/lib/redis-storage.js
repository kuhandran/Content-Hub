/**
 * Redis storage using just REDIS_URL
 * Simple connection using @vercel/kv
 */

const { kv } = require('@vercel/kv');

async function setFile(path, content) {
  try {
    // Store file with 90-day TTL
    await kv.set(`cms:file:${path}`, content, { ex: 7776000 });
    return true;
  } catch (err) {
    console.error(`Error setting file ${path}:`, err.message);
    return false;
  }
}

async function getFile(path) {
  try {
    const content = await kv.get(`cms:file:${path}`);
    return content || null;
  } catch (err) {
    console.error(`Error getting file ${path}:`, err.message);
    return null;
  }
}

async function listFiles() {
  try {
    const keys = await kv.keys('cms:file:*');
    const files = [];
    
    for (const key of keys) {
      const content = await kv.get(key);
      const path = key.replace('cms:file:', '');
      files.push({ path, content });
    }
    
    return files;
  } catch (err) {
    console.error('Error listing files:', err.message);
    return [];
  }
}

async function deleteFile(path) {
  try {
    await kv.del(`cms:file:${path}`);
    return true;
  } catch (err) {
    console.error(`Error deleting file ${path}:`, err.message);
    return false;
  }
}

module.exports = {
  setFile,
  getFile,
  listFiles,
  deleteFile
};
