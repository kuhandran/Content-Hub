// Vercel KV Storage Adapter
// Replaces filesystem storage with Redis-backed Vercel KV

const { kv } = require('@vercel/kv');

class VercelKVStorage {
  constructor() {
    this.prefix = 'cms:';
  }

  // Store collections data
  async setCollections(locale, category, files) {
    const key = `${this.prefix}collections:${locale}:${category}`;
    return await kv.set(key, JSON.stringify(files), { ex: 86400 * 30 }); // 30 day expiry
  }

  // Get collections data
  async getCollections(locale, category) {
    const key = `${this.prefix}collections:${locale}:${category}`;
    const data = await kv.get(key);
    return data ? JSON.parse(data) : null;
  }

  // Store file content
  async setFile(path, content) {
    const key = `${this.prefix}file:${path}`;
    return await kv.set(key, JSON.stringify({ 
      content, 
      updatedAt: new Date().toISOString(),
      size: JSON.stringify(content).length 
    }), { ex: 86400 * 90 }); // 90 day expiry
  }

  // Get file content
  async getFile(path) {
    const key = `${this.prefix}file:${path}`;
    const data = await kv.get(key);
    return data ? JSON.parse(data) : null;
  }

  // List all files
  async listFiles() {
    const pattern = `${this.prefix}file:*`;
    const keys = await kv.keys(pattern);
    const files = [];
    
    for (const key of keys) {
      const path = key.replace(`${this.prefix}file:`, '');
      const data = await kv.get(key);
      if (data) {
        files.push({ path, ...JSON.parse(data) });
      }
    }
    
    return files;
  }

  // Delete file
  async deleteFile(path) {
    const key = `${this.prefix}file:${path}`;
    return await kv.del(key);
  }

  // Store authentication token
  async setToken(token, userId, expiresIn = 86400) {
    const key = `${this.prefix}token:${token}`;
    return await kv.set(key, JSON.stringify({ userId, createdAt: new Date().toISOString() }), { ex: expiresIn });
  }

  // Verify token
  async getToken(token) {
    const key = `${this.prefix}token:${token}`;
    const data = await kv.get(key);
    return data ? JSON.parse(data) : null;
  }

  // Clear all data (use with caution)
  async clear() {
    const pattern = `${this.prefix}*`;
    const keys = await kv.keys(pattern);
    if (keys.length > 0) {
      return await kv.del(...keys);
    }
  }

  // Get statistics
  async getStats() {
    const files = await this.listFiles();
    return {
      totalFiles: files.length,
      totalSize: files.reduce((sum, f) => sum + (f.size || 0), 0),
      lastUpdated: new Date().toISOString()
    };
  }
}

module.exports = VercelKVStorage;
