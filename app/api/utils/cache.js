/**
 * app/api/utils/cache.js
 * 
 * Cache Management Utilities
 * - Connect to Redis
 * - Cache operations (get, set, delete, clear)
 * - Cache invalidation
 * - Cache statistics
 */

let redisClient = null;
let cacheState = {
  connected: false,
  lastError: null,
  operations: {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    clears: 0
  }
};

/**
 * Connect to Redis cache
 * @returns {Object} Redis client
 */
async function connectRedis() {
  try {
    if (redisClient && cacheState.connected) {
      console.log('[CACHE] ✓ Redis already connected');
      return redisClient;
    }

    console.log('[CACHE] 🔗 Connecting to Redis...');

    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL not configured');
    }

    const Redis = (await import('ioredis')).default;
    redisClient = new Redis(redisUrl, {
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: null
    });

    redisClient.on('connect', () => {
      cacheState.connected = true;
      cacheState.lastError = null;
      console.log('[CACHE] ✓ Redis connected successfully');
    });

    redisClient.on('error', (err) => {
      cacheState.connected = false;
      cacheState.lastError = err.message;
      console.error('[CACHE] ❌ Redis error:', err.message);
    });

    // Test connection
    await redisClient.ping();
    
    return redisClient;
  } catch (error) {
    cacheState.connected = false;
    cacheState.lastError = error.message;
    console.error('[CACHE] ❌ Redis connection failed:', error.message);
    throw error;
  }
}

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {any} Cached value or null
 */
async function getCached(key) {
  try {
    if (!redisClient) {
      await connectRedis();
    }

    const value = await redisClient.get(key);
    
    if (value) {
      cacheState.operations.hits++;
      console.log('[CACHE] ✓ Cache hit:', key);
      return JSON.parse(value);
    } else {
      cacheState.operations.misses++;
      console.log('[CACHE] ✗ Cache miss:', key);
      return null;
    }
  } catch (error) {
    console.error('[CACHE] ❌ Get error:', error.message);
    return null;
  }
}

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds (default: 3600)
 */
async function setCached(key, value, ttl = 3600) {
  try {
    if (!redisClient) {
      await connectRedis();
    }

    const serialized = JSON.stringify(value);
    
    if (ttl) {
      await redisClient.setex(key, ttl, serialized);
    } else {
      await redisClient.set(key, serialized);
    }

    cacheState.operations.sets++;
    console.log('[CACHE] ✓ Value cached:', { key, ttl });
  } catch (error) {
    console.error('[CACHE] ❌ Set error:', error.message);
  }
}

/**
 * Delete value from cache
 * @param {string|Array} keys - Single key or array of keys
 */
async function deleteCached(keys) {
  try {
    if (!redisClient) {
      await connectRedis();
    }

    const keyArray = Array.isArray(keys) ? keys : [keys];
    const result = await redisClient.del(...keyArray);
    
    cacheState.operations.deletes += result;
    console.log('[CACHE] ✓ Deleted from cache:', { keys: keyArray, count: result });
  } catch (error) {
    console.error('[CACHE] ❌ Delete error:', error.message);
  }
}

/**
 * Clear all cache
 */
async function clearAllCache() {
  try {
    if (!redisClient) {
      await connectRedis();
    }

    await redisClient.flushdb();
    cacheState.operations.clears++;
    console.log('[CACHE] ✓ Cache cleared');
  } catch (error) {
    console.error('[CACHE] ❌ Clear error:', error.message);
  }
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
function getCacheStats() {
  return {
    connected: cacheState.connected,
    lastError: cacheState.lastError,
    operations: cacheState.operations,
    timestamp: new Date().toISOString()
  };
}

/**
 * Close Redis connection
 */
async function closeRedis() {
  try {
    if (redisClient) {
      console.log('[CACHE] 🔌 Closing Redis connection...');
      await redisClient.quit();
      redisClient = null;
      cacheState.connected = false;
      console.log('[CACHE] ✓ Redis connection closed');
    }
  } catch (error) {
    console.error('[CACHE] ❌ Error closing Redis:', error.message);
  }
}

module.exports = {
  connectRedis,
  getCached,
  setCached,
  deleteCached,
  clearAllCache,
  getCacheStats,
  closeRedis
};
