/**
 * Admin Routes
 *
 * Protected endpoints that require Firebase `admin: true` custom claim.
 * Used for operational monitoring and cache management.
 */

import { Router } from 'express';
import { adminAuth_middleware } from '../middleware/adminAuth.js';
import { getCacheStats } from '../middleware/cache.js';
import { redis } from '../config/redis.js';
import { emailQueue, notificationQueue, analyticsQueue } from '../queues/index.js';

const router = Router();

// ───────────────────────────────────────────────────────────────────────────
// GET /api/admin/cache/stats
// Returns cache hit/miss statistics
// ───────────────────────────────────────────────────────────────────────────

router.get('/cache/stats', adminAuth_middleware, async (req, res) => {
  try {
    const stats = await getCacheStats();
    return res.json({ success: true, ...stats });
  } catch (error) {
    console.error('❌ Error fetching cache stats:', error.message);
    return res.status(500).json({ error: 'Failed to fetch cache statistics' });
  }
});

// ───────────────────────────────────────────────────────────────────────────
// POST /api/admin/cache/flush
// Clears all cache entries (admin-only emergency reset)
// ───────────────────────────────────────────────────────────────────────────

router.post('/cache/flush', adminAuth_middleware, async (req, res) => {
  if (!redis) {
    return res.status(503).json({ error: 'Redis not configured' });
  }

  try {
    const keys = await redis.keys('cache:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    // Reset stats counters too
    await redis.del('cache:stats:hits', 'cache:stats:misses');

    console.log(`🗑️  Cache flushed by admin (UID: ${req.firebaseUser.uid}) — ${keys.length} keys removed`);

    return res.json({
      success: true,
      message: `Flushed ${keys.length} cached entries`,
    });
  } catch (error) {
    console.error('❌ Error flushing cache:', error.message);
    return res.status(500).json({ error: 'Failed to flush cache' });
  }
});

// ───────────────────────────────────────────────────────────────────────────
// GET /api/admin/queue/stats
// Returns job counts for all BullMQ queues
// ───────────────────────────────────────────────────────────────────────────

router.get('/queue/stats', adminAuth_middleware, async (req, res) => {
  try {
    const getQueueStats = async (queue, name) => {
      if (!queue) return { name, status: 'disabled' };
      const counts = await queue.getJobCounts(
        'waiting', 'active', 'completed', 'failed', 'delayed',
      );
      return { name, status: 'active', ...counts };
    };

    const [emails, notifications, analytics] = await Promise.all([
      getQueueStats(emailQueue, 'emails'),
      getQueueStats(notificationQueue, 'notifications'),
      getQueueStats(analyticsQueue, 'analytics'),
    ]);

    return res.json({ success: true, queues: { emails, notifications, analytics } });
  } catch (error) {
    console.error('❌ Error fetching queue stats:', error.message);
    return res.status(500).json({ error: 'Failed to fetch queue statistics' });
  }
});

export default router;
