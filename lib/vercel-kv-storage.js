// Vercel KV Storage Adapter
// Replaces filesystem storage with Redis-backed Vercel KV

const { kv } = require('@vercel/kv');
const logger = require('../src/utils/logger');

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
    const startTime = Date.now();
    const key = `${this.prefix}file:${path}`;
    
    try {
      const contentSize = JSON.stringify(content).length;
      await kv.set(key, JSON.stringify({ 
        content, 
        updatedAt: new Date().toISOString(),
        size: contentSize
      }), { ex: 86400 * 90 }); // 90 day expiry

      const duration = Date.now() - startTime;
      logger.kv('SET_FILE', path, true, duration);
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.kv('SET_FILE', path, false, duration, error.message);
      logger.error('KV_STORAGE', `Failed to write file ${path}`, error, { path, key });
      throw error;
    }
  }

  // Get file content
  async getFile(path) {
    const startTime = Date.now();
    const key = `${this.prefix}file:${path}`;
    
    try {
      const data = await kv.get(key);
      const duration = Date.now() - startTime;
      
      if (!data) {
        logger.kv('GET_FILE', path, false, duration, 'Not found');
        return null;
      }

      logger.kv('GET_FILE', path, true, duration);
      const parsed = JSON.parse(data);
      return parsed;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.kv('GET_FILE', path, false, duration, error.message);
      logger.error('KV_STORAGE', `Failed to read file ${path}`, error, { path, key });
      throw error;
    }
  }

  // List all files
  async listFiles() {
    const startTime = Date.now();
    const pattern = `${this.prefix}file:*`;
    
    try {
      const keys = await kv.keys(pattern);
      logger.debug('KV_STORAGE', `Found ${keys.length} file keys matching pattern`, { pattern });
      
      const files = [];
      for (const key of keys) {
        try {
          const path = key.replace(`${this.prefix}file:`, '');
          const data = await kv.get(key);
          if (data) {
            files.push({ path, ...JSON.parse(data) });
          }
        } catch (itemError) {
          logger.error('KV_STORAGE', `Error processing file key ${key}`, itemError);
        }
      }

      const duration = Date.now() - startTime;
      logger.kv('LIST_FILES', `loaded ${files.length} files`, true, duration);
      return files;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.kv('LIST_FILES', 'error', false, duration, error.message);
      logger.error('KV_STORAGE', 'Failed to list files', error);
      throw error;
    }
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
