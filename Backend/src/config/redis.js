import Redis from 'ioredis';

// Redis configuration for caching
let redis = null;

// Only use Redis if REDIS_URL is provided
if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    // Connect to Redis
    redis.connect().catch(err => {
      console.error('Failed to connect to Redis:', err);
      redis = null;
    });
  } catch (error) {
    console.error('Redis initialization error:', error);
    redis = null;
  }
} else {
  console.log('⚠️  Redis not configured - using in-memory cache fallback');
}

// In-memory cache fallback
const memoryCache = new Map();
const MEMORY_CACHE_MAX_SIZE = 100;

// Cache helper functions
export const cacheGet = async (key) => {
  if (redis) {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return memoryCache.get(key) || null;
    }
  }
  return memoryCache.get(key) || null;
};

export const cacheSet = async (key, value, ttlSeconds = 300) => {
  if (redis) {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('Redis set error:', error);
      // Fallback to memory cache
      memoryCache.set(key, value);
      if (memoryCache.size > MEMORY_CACHE_MAX_SIZE) {
        const firstKey = memoryCache.keys().next().value;
        memoryCache.delete(firstKey);
      }
    }
  } else {
    memoryCache.set(key, value);
    if (memoryCache.size > MEMORY_CACHE_MAX_SIZE) {
      const firstKey = memoryCache.keys().next().value;
      memoryCache.delete(firstKey);
    }
    // Auto-expire from memory cache
    setTimeout(() => memoryCache.delete(key), ttlSeconds * 1000);
  }
};

export const cacheDel = async (key) => {
  if (redis) {
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Redis del error:', error);
    }
  }
  memoryCache.delete(key);
};

export const cacheFlush = async () => {
  if (redis) {
    try {
      await redis.flushdb();
    } catch (error) {
      console.error('Redis flush error:', error);
    }
  }
  memoryCache.clear();
};

export default redis;
