/**
 * Turf Routes
 *
 * Public read endpoints for turf data, backed by Redis caching.
 * Static-prefix routes (like /city/:city) are registered BEFORE
 * dynamic /:id to prevent accidental matches.
 *
 * ┌──────────────────────────────────┬─────────┬────────────────────────────┐
 * │ Route                            │ TTL     │ Description                │
 * ├──────────────────────────────────┼─────────┼────────────────────────────┤
 * │ GET /api/turfs                   │ 5 min   │ All active turfs           │
 * │ GET /api/turfs/city/:city        │ 5 min   │ Turfs filtered by city     │
 * │ GET /api/turfs/:id               │ 10 min  │ Single turf detail         │
 * │ GET /api/turfs/:id/slots/:date   │ 30 sec  │ Slot availability          │
 * └──────────────────────────────────┴─────────┴────────────────────────────┘
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { cacheMiddleware } from '../middleware/cache.js';
import {
  getAllTurfs,
  getTurfsByCity,
  getTurfById,
  getSlotAvailability,
} from '../controllers/turfController.js';

const router = Router();

// ── Rate limiter for slot checks (prevent scraping) ───────────────────────
const slotRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 60,                  // 60 requests per minute per IP
  message: {
    error: 'Too many slot availability requests, please slow down',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

// ── Routes (static prefixes first, then dynamic params) ───────────────────

// All active turfs — 5 minute cache
router.get('/', cacheMiddleware(300), getAllTurfs);

// Turfs by city — 5 minute cache
router.get('/city/:city', cacheMiddleware(300), getTurfsByCity);

// Single turf detail — 10 minute cache
router.get('/:id', cacheMiddleware(600), getTurfById);

// Slot availability — 30 second cache + rate limiting
router.get('/:id/slots/:date', slotRateLimiter, cacheMiddleware(30), getSlotAvailability);

export default router;
