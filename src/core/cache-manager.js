/**
 * Smart Cache Manager
 * - Path-specific caching
 * - Configurable TTL per file
 * - File watcher integration
 * - Cache invalidation on file changes
 */

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

class CacheManager {
  constructor(options = {}) {
    this.cache = new Map();
    this.ttlMap = new Map(); // Store TTL per file
    this.timers = new Map(); // Store timeout IDs for cleanup
    this.defaultTTL = options.defaultTTL || 3600000; // 1 hour default
    this.watchers = new Map();
    this.onInvalidate = options.onInvalidate || (() => {});
    this.publicPath = options.publicPath || path.join(__dirname, 'public');
  }

  /**
   * Get item from cache
   */
  get(key) {
    if (this.cache.has(key)) {
      console.log(`[CACHE HIT] ${key}`);
      return this.cache.get(key);
    }
    console.log(`[CACHE MISS] ${key}`);
    return null;
  }

  /**
   * Set item in cache with TTL
   */
  set(key, value, ttl = null) {
    const actualTTL = ttl || this.defaultTTL;

    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Store in cache
    this.cache.set(key, value);
    this.ttlMap.set(key, {
      ttl: actualTTL,
      createdAt: Date.now(),
      expiresAt: Date.now() + actualTTL
    });

    // Set auto-expiration
    const timer = setTimeout(() => {
      this.invalidate(key);
      console.log(`[CACHE EXPIRED] ${key}`);
    }, actualTTL);

    this.timers.set(key, timer);
    console.log(`[CACHE SET] ${key} (TTL: ${actualTTL}ms)`);
  }

  /**
   * Invalidate specific cache key
   */
  invalidate(key) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.ttlMap.delete(key);
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
        this.timers.delete(key);
      }
      console.log(`[CACHE INVALIDATED] ${key}`);
      this.onInvalidate({ type: 'single', key });
      return true;
    }
    return false;
  }

  /**
   * Invalidate by pattern (e.g., /en/config/*)
   */
  invalidatePattern(pattern) {
    const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}`);
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.invalidate(key);
        count++;
      }
    }

    console.log(`[CACHE PATTERN INVALIDATED] ${pattern} (${count} items)`);
    this.onInvalidate({ type: 'pattern', pattern, count });
    return count;
  }

  /**
   * Clear all cache
   */
  clear() {
    const count = this.cache.size;
    this.cache.clear();
    this.ttlMap.clear();
    
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();

    console.log(`[CACHE CLEARED] (${count} items)`);
    this.onInvalidate({ type: 'all', count });
  }

  /**
   * Update TTL for existing key
   */
  updateTTL(key, ttl) {
    if (this.cache.has(key)) {
      this.set(key, this.cache.get(key), ttl);
      console.log(`[CACHE TTL UPDATED] ${key} to ${ttl}ms`);
      return true;
    }
    return false;
  }

  /**
   * Get cache stats
   */
  getStats() {
    const stats = {
      totalItems: this.cache.size,
      items: [],
      memory: 0
    };

    for (const [key, value] of this.cache.entries()) {
      const ttlInfo = this.ttlMap.get(key);
      const size = JSON.stringify(value).length;
      const timeLeft = Math.max(0, ttlInfo.expiresAt - Date.now());

      stats.items.push({
        key,
        size,
        ttl: ttlInfo.ttl,
        createdAt: new Date(ttlInfo.createdAt),
        expiresAt: new Date(ttlInfo.expiresAt),
        timeLeft,
        percentLeft: Math.round((timeLeft / ttlInfo.ttl) * 100)
      });

      stats.memory += size;
    }

    return stats;
  }

  /**
   * Watch folder for changes and invalidate cache
   */
  watchFolder(folderPath, pattern = '**/*') {
    const fullPath = path.join(this.publicPath, folderPath);

    if (this.watchers.has(folderPath)) {
      console.log(`[WATCH] Already watching ${folderPath}`);
      return;
    }

    const watcher = chokidar.watch(path.join(fullPath, pattern), {
      ignored: /(^|[\/\\])\.|node_modules/,
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100
      }
    });

    watcher
      .on('change', (filePath) => {
        const relativePath = path.relative(this.publicPath, filePath);
        console.log(`[FILE CHANGED] ${relativePath}`);
        
        // Invalidate exact path and parent patterns
        const parts = relativePath.split(path.sep);
        const pathPattern = parts.slice(0, -1).join('/') + '/*';
        
        this.invalidate(`file:${relativePath}`);
        this.invalidatePattern(`collections:${pathPattern}`);
      })
      .on('add', (filePath) => {
        const relativePath = path.relative(this.publicPath, filePath);
        console.log(`[FILE ADDED] ${relativePath}`);
        this.invalidatePattern(`collections:${path.dirname(relativePath).replace(/\\/g, '/')}/*`);
      })
      .on('unlink', (filePath) => {
        const relativePath = path.relative(this.publicPath, filePath);
        console.log(`[FILE DELETED] ${relativePath}`);
        this.invalidate(`file:${relativePath}`);
        this.invalidatePattern(`collections:${path.dirname(relativePath).replace(/\\/g, '/')}/*`);
      });

    this.watchers.set(folderPath, watcher);
    console.log(`[WATCH STARTED] ${folderPath}`);
  }

  /**
   * Stop watching folder
   */
  unwatch(folderPath) {
    if (this.watchers.has(folderPath)) {
      this.watchers.get(folderPath).close();
      this.watchers.delete(folderPath);
      console.log(`[WATCH STOPPED] ${folderPath}`);
    }
  }

  /**
   * Stop all watchers
   */
  close() {
    for (const watcher of this.watchers.values()) {
      watcher.close();
    }
    this.watchers.clear();
    this.clear();
    console.log('[CACHE MANAGER] Closed');
  }
}

module.exports = CacheManager;
