/**
 * Upstash Redis Configuration
 *
 * Serverless Redis client for caching. Uses HTTP-based REST API
 * (ideal for Vercel serverless functions — no persistent connections needed).
 *
 * If env vars are missing, exports a null redis instance.
 * All consumers must check `redis !== null` before use.
 */

import { Redis } from '@upstash/redis';

// ── Build client (or null if not configured) ──────────────────────────────
let redis = null;

const url   = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (url && token) {
  redis = new Redis({ url, token });
  console.log('✅ Upstash Redis client initialized');
} else {
  console.warn('⚠️  UPSTASH_REDIS_REST_URL or TOKEN not set — caching disabled');
}

export { redis };

/**
 * Verify Redis connectivity.
 * Safe to call even if redis is null (logs a warning and returns).
 */
export async function testRedis() {
  if (!redis) {
    console.warn('⚠️  Redis not configured — skipping connection test');
    return false;
  }

  try {
    await redis.set('ping', 'pong', { ex: 10 });
    const result = await redis.get('ping');
    const ok = result === 'pong';
    console.log(`Redis connection test: ${ok ? '✅ connected' : '❌ failed'}`);
    return ok;
  } catch (err) {
    console.error('❌ Redis connection test failed:', err.message);
    return false;
  }
}
