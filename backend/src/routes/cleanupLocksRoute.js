/**
 * Cleanup Locks Route — Cron Job Endpoint
 *
 * POST /api/cron/cleanup-locks
 *
 * Called by Vercel Cron (or any scheduler) to remove expired slotLock documents.
 * Protected by CRON_SECRET to prevent public access.
 */

import { Router } from 'express';
import { cleanExpiredLocks } from '../scripts/cleanExpiredLocks.js';

const router = Router();

router.post('/cleanup-locks', async (req, res) => {
  // ── Auth: Verify it's called by authorized scheduler ──────────────
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  } else if (process.env.NODE_ENV === 'production') {
    // In production, CRON_SECRET must be set
    console.warn('⚠️  CRON_SECRET not set — rejecting cron request');
    return res.status(401).json({ error: 'CRON_SECRET not configured' });
  }

  try {
    const result = await cleanExpiredLocks();
    return res.status(200).json({
      success: true,
      cleaned: result.cleaned,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Cleanup cron failed:', error);
    return res.status(500).json({
      error: 'Cleanup failed',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default router;
