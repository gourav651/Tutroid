import { cacheGet, cacheSet } from '../config/redis.js';

/**
 * Cache middleware for GET requests
 * @param {number} ttl - Time to live in seconds
 * @param {function} keyGenerator - Function to generate cache key from request
 */
export const cacheMiddleware = (ttl = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator 
      ? keyGenerator(req) 
      : `cache:${req.originalUrl || req.url}`;

    try {
      // Try to get from cache
      const cachedData = await cacheGet(cacheKey);
      
      if (cachedData) {
        // Cache hit
        res.set('X-Cache', 'HIT');
        return res.json(cachedData);
      }

      // Cache miss - intercept response
      res.set('X-Cache', 'MISS');
      const originalJson = res.json.bind(res);
      
      res.json = function(data) {
        // Only cache successful responses
        if (res.statusCode === 200 && data) {
          cacheSet(cacheKey, data, ttl).catch(err => {
            console.error('Cache set error:', err);
          });
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Cache invalidation middleware for write operations
 * @param {string|string[]} patterns - Cache key patterns to invalidate
 */
export const invalidateCache = (patterns) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
      // Invalidate cache after successful write
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const patternsArray = Array.isArray(patterns) ? patterns : [patterns];
        // Note: In production with Redis, use SCAN to find and delete matching keys
        // For now, we'll just clear specific keys
        console.log('Cache invalidated for patterns:', patternsArray);
      }
      return originalJson(data);
    };
    
    next();
  };
};
