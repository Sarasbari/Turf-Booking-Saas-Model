/**
 * Clean Expired Slot Locks
 *
 * Removes expired slotLock documents that are still in 'locked' status.
 * Confirmed locks (status: 'confirmed') are NOT deleted — they serve
 * as a permanent record that the slot was booked.
 *
 * Schedule: Run every 5 minutes via Vercel Cron Job or similar scheduler.
 *
 * Firestore batch write limit: 500 operations per batch.
 * If more than 500 expired locks exist, multiple batches are used.
 */

import { adminDb } from '../config/firebaseAdmin.js';
import { Timestamp } from 'firebase-admin/firestore';

const BATCH_LIMIT = 500;

export async function cleanExpiredLocks() {
  const now = Timestamp.now();

  const expired = await adminDb
    .collection('slotLocks')
    .where('status', '==', 'locked')       // only remove unconfirmed locks
    .where('expiresAt', '<', now)           // that have expired
    .get();

  if (expired.empty) {
    console.log('🧹 No expired locks to clean');
    return { cleaned: 0 };
  }

  // Process in batches of 500 (Firestore limit)
  let totalCleaned = 0;
  let batch = adminDb.batch();
  let batchCount = 0;

  for (const doc of expired.docs) {
    batch.delete(doc.ref);
    batchCount++;
    totalCleaned++;

    if (batchCount >= BATCH_LIMIT) {
      await batch.commit();
      batch = adminDb.batch();
      batchCount = 0;
    }
  }

  // Commit remaining
  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`🧹 Cleaned ${totalCleaned} expired slot locks`);
  return { cleaned: totalCleaned };
}
