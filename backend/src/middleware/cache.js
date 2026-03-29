/**
 * Redis Cache Middleware
 *
 * Transparent caching layer for Express routes.
 * - On cache HIT → responds directly from Redis (skips handler)
 * - On cache MISS → wraps res.json() to store the response in Redis
 * - On cache ERROR → request proceeds normally (cache never breaks the app)
 *
 * Security (api-security-best-practices):
 * - Cache keys are sanitized to prevent injection
 * - Error messages never expose Redis internals
 * - Hit/miss counters use atomic INCR for accuracy
 */

import { redis } from '../config/redis.js';

// ── Key sanitization ──────────────────────────────────────────────────────
// Strip characters that could cause key injection or bloat
function sanitizeKey(raw) {
  return raw
    .replace(/[^a-zA-Z0-9:/_\-.,=]/g, '') // allow only safe URL / key chars
    .slice(0, 256);                         // cap key length
}

/**
 * Express middleware that caches JSON responses in Redis.
 *
 * @param {number} ttlSeconds  Time-to-live for the cached entry (default 300 = 5 min)
 * @returns {Function} Express middleware
 */
export function cacheMiddleware(ttlSeconds = 300) {
  return async (req, res, next) => {
    // If Redis isn't available, skip caching entirely
    if (!redis) return next();

    const key = sanitizeKey(`cache:${req.method}:${req.originalUrl}`);

    try {
      const cached = await redis.get(key);
      if (cached !== null && cached !== undefined) {
        // Atomic hit counter
        await redis.incr('cache:stats:hits').catch(() => {});
        console.log(`Cache HIT: ${key}`);
        return res.json(cached);
      }
      // Atomic miss counter
      await redis.incr('cache:stats:misses').catch(() => {});
      console.log(`Cache MISS: ${key}`);
    } catch (err) {
      // Cache read failure — proceed without cache
      console.error('Cache read error:', err.message);
    }

    // Wrap res.json to intercept the response and cache it
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      // Fire-and-forget cache write (don't await — don't slow down the response)
      if (redis) {
        redis.set(key, data, { ex: ttlSeconds }).catch((err) => {
          console.error('Cache write error:', err.message);
        });
      }
      return originalJson(data);
    };

    next();
  };
}

/**
 * Invalidate cached entries matching a pattern.
 * Call after write operations (booking confirmed, booking cancelled).
 *
 * @param {string} pattern  Redis key glob, e.g. "cache:GET:/api/turfs/abc123/slots/*"
 */
export async function invalidateCache(pattern) {
  if (!redis) return;

  try {
    const sanitized = sanitizeKey(pattern);
    // SCAN-based key lookup (Upstash supports `keys` via REST)
    const keys = await redis.keys(sanitized);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`Cache invalidated: ${keys.length} key(s) matching "${sanitized}"`);
    }
  } catch (err) {
    // Non-fatal — cache will expire naturally via TTL
    console.error('Cache invalidation error:', err.message);
  }
}

/**
 * Get cache statistics.
 * Returns hit/miss counters and total cached key count.
 *
 * @returns {Promise<Object>} { hits, misses, hitRate, cachedKeys }
 */
export async function getCacheStats() {
  if (!redis) {
    return { hits: 0, misses: 0, hitRate: '0%', cachedKeys: 0, status: 'disabled' };
  }

  try {
    const [hits, misses, keys] = await Promise.all([
      redis.get('cache:stats:hits'),
      redis.get('cache:stats:misses'),
      redis.keys('cache:GET:*'),
    ]);

    const h = parseInt(hits) || 0;
    const m = parseInt(misses) || 0;
    const total = h + m;
    const hitRate = total > 0 ? ((h / total) * 100).toFixed(1) + '%' : '0%';

    return {
      hits: h,
      misses: m,
      hitRate,
      cachedKeys: keys.length,
      status: 'active',
    };
  } catch (err) {
    console.error('Cache stats error:', err.message);
    return { hits: 0, misses: 0, hitRate: '0%', cachedKeys: 0, status: 'error' };
  }
}
