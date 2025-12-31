/**
 * Cache management API routes
 * GET /api/cache/stats
 * POST /api/cache/invalidate
 * POST /api/cache/clear
 * POST /api/cache/ttl
 */

const express = require('express');
const router = express.Router();

module.exports = (cache) => {
  // Get cache statistics
  router.get('/stats', (req, res) => {
    res.json(cache.getStats());
  });

  // Invalidate specific cache keys
  router.post('/invalidate', (req, res) => {
    const { keys, patterns } = req.body;
    let count = 0;
    
    if (keys && Array.isArray(keys)) {
      keys.forEach(key => {
        if (cache.invalidate(key)) count++;
      });
    }
    
    if (patterns && Array.isArray(patterns)) {
      patterns.forEach(pattern => {
        count += cache.invalidatePattern(pattern);
      });
    }

    res.json({ 
      message: 'Cache invalidated', 
      count, 
      timestamp: new Date() 
    });
  });

  // Clear all cache
  router.post('/clear', (req, res) => {
    cache.clear();
    res.json({ 
      message: 'All cache cleared', 
      timestamp: new Date() 
    });
  });

  // Update TTL settings
  router.post('/ttl', (req, res) => {
    const { defaultTTL, jsonTTL, imageTTL, otherTTL } = req.body;
    
    global.ttlSettings = {
      defaultTTL: defaultTTL || 3600000,
      jsonTTL: jsonTTL || 1800000,
      imageTTL: imageTTL || 7200000,
      otherTTL: otherTTL || 3600000
    };

    res.json({ 
      message: 'TTL settings updated', 
      settings: global.ttlSettings, 
      timestamp: new Date() 
    });
  });

  return router;
};
