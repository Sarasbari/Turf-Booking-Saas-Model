/**
 * BullMQ Queue Definitions
 *
 * Uses ioredis (TCP connection) for BullMQ — NOT @upstash/redis REST client.
 * Upstash supports ioredis via their TLS endpoint.
 *
 * Queues defined:
 * - emails          → booking confirmation, reminders, cancellation
 * - notifications   → push notifications, in-app alerts (future)
 * - analytics       → event tracking, usage metrics (future)
 *
 * ⚠️  IMPORTANT (Vercel serverless)
 * Queue producers (adding jobs) work fine in serverless functions.
 * Queue workers (consuming jobs) require a persistent process —
 * they must run via `npm run worker` locally or on a long-lived host
 * (Railway, Render, VPS, etc.), NOT inside a Vercel function.
 */

import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// ── Redis connection for BullMQ (ioredis, not @upstash/redis) ─────────────
let connection = null;

const redisUrl = process.env.REDIS_URL;

if (redisUrl) {
  connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null, // required by BullMQ
    enableReadyCheck: false,
    tls: redisUrl.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
  });

  connection.on('connect', () => console.log('✅ BullMQ ioredis connected'));
  connection.on('error', (err) => console.error('❌ BullMQ ioredis error:', err.message));
} else {
  console.warn('⚠️  REDIS_URL not set — BullMQ queues disabled (emails sent directly)');
}

// ── Queue factory (returns null if connection unavailable) ─────────────────
function createQueue(name) {
  if (!connection) return null;
  return new Queue(name, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 }, // 2s → 4s → 8s
      removeOnComplete: 100,  // keep last 100 completed
      removeOnFail: 500,      // keep last 500 failed
    },
  });
}

// ── Export queues ──────────────────────────────────────────────────────────
export const emailQueue        = createQueue('emails');
export const notificationQueue = createQueue('notifications');
export const analyticsQueue    = createQueue('analytics');

export { connection };
