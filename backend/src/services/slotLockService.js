/**
 * Slot Lock Service — 3-Layer Atomic Locking (Layer 2 & 3)
 *
 * Prevents double-booking by atomically acquiring locks in Firestore
 * BEFORE creating a Razorpay order. Uses Firestore transactions to
 * guarantee that only one user can hold a slot at a time.
 *
 * Collection: slotLocks
 * Document ID format: {turfId}_{date}_{slot}
 * Example: "sportzNation_2026-03-15_18:00"
 *
 * Lock Lifecycle:
 *   1. acquireSlotLocks()  → status: 'locked'    (pre-payment)
 *   2. confirmSlotLocks()  → status: 'confirmed'  (post-payment)
 *   3. releaseSlotLocks()  → deleted              (payment failed / cancelled)
 *
 * Admin SDK bypasses Firestore security rules — clients cannot write to slotLocks.
 */

import { adminDb } from '../config/firebaseAdmin.js';
import { Timestamp } from 'firebase-admin/firestore';

/** How long a pre-payment lock lasts (milliseconds). */
const LOCK_DURATION_MS = 10 * 60 * 1000; // 10 minutes

// ---------------------------------------------------------------------------
// acquireSlotLocks — Layer 2 (Pre-Payment Hard Lock)
// ---------------------------------------------------------------------------

/**
 * Atomically check and acquire locks for all requested slots.
 * Runs inside a Firestore transaction — if ANY slot is unavailable,
 * the entire transaction aborts (no partial locks).
 *
 * @param {Object} params
 * @param {string} params.turfId
 * @param {string} params.date          - 'YYYY-MM-DD'
 * @param {string[]} params.slots       - ['18:00', '19:00']
 * @param {string} params.userId
 * @param {string} params.razorpayOrderId
 * @returns {Promise<{success: boolean, expiresAt?: Date, error?: string, slot?: string, message?: string}>}
 */
export async function acquireSlotLocks({
  turfId,
  date,
  slots,
  userId,
  razorpayOrderId,
}) {
  // Build document refs for all requested slots
  const lockRefs = slots.map((slot) =>
    adminDb.collection('slotLocks').doc(`${turfId}_${date}_${slot}`)
  );

  const now = Timestamp.now();
  const expiresAt = Timestamp.fromMillis(Date.now() + LOCK_DURATION_MS);

  try {
    await adminDb.runTransaction(async (transaction) => {
      // ── READ phase (all reads must come before writes in Firestore txn) ──

      // 1. Read all slot lock documents
      const lockDocs = await Promise.all(
        lockRefs.map((ref) => transaction.get(ref))
      );

      // 2. Read bookings for each slot (array-contains query per slot)
      //    We check bookings as an additional safety net.
      const bookingChecks = await Promise.all(
        slots.map((slot) =>
          transaction.get(
            adminDb
              .collection('bookings')
              .where('turfId', '==', turfId)
              .where('bookedDate', '==', date)
              .where('timeSlots', 'array-contains', slot)
              .where('status', '==', 'confirmed')
              .limit(1)
          )
        )
      );

      // ── CHECK phase ──

      for (let i = 0; i < slots.length; i++) {
        const lockDoc = lockDocs[i];
        const slot = slots[i];
        const bookingSnap = bookingChecks[i];

        // Check 1: Is there an existing lock on this slot?
        if (lockDoc.exists) {
          const data = lockDoc.data();
          const isExpired = data.expiresAt.toMillis() < Date.now();
          const isConfirmed = data.status === 'confirmed';
          const isHeldByOther = !isExpired && data.lockedBy !== userId;

          if (isConfirmed) {
            throw new Error(
              `SLOT_CONFIRMED:${slot}:This slot has already been booked`
            );
          }

          if (isHeldByOther) {
            throw new Error(
              `SLOT_LOCKED:${slot}:This slot is temporarily held by another user. Try again in a few minutes.`
            );
          }
          // If expired or held by same user → we'll overwrite it below
        }

        // Check 2: Is there a confirmed booking for this slot?
        if (!bookingSnap.empty) {
          throw new Error(
            `SLOT_CONFIRMED:${slot}:This slot has already been booked`
          );
        }
      }

      // ── WRITE phase — all slots available, acquire locks atomically ──

      for (let i = 0; i < lockRefs.length; i++) {
        transaction.set(lockRefs[i], {
          turfId,
          date,
          slot: slots[i],
          lockedBy: userId,
          lockedAt: now,
          expiresAt,
          status: 'locked',
          razorpayOrderId,
          bookingId: null,
        });
      }

      console.log(
        `✅ Slot locks acquired for ${slots.length} slots:`,
        slots,
        'by user:',
        userId
      );
    });

    return { success: true, expiresAt: expiresAt.toDate() };
  } catch (error) {
    // Parse structured error types for the client
    if (
      error.message.startsWith('SLOT_CONFIRMED:') ||
      error.message.startsWith('SLOT_LOCKED:')
    ) {
      const [type, slot, ...messageParts] = error.message.split(':');
      return {
        success: false,
        error: type,
        slot,
        message: messageParts.join(':'), // rejoin in case message had colons
      };
    }
    // Re-throw unexpected errors (DB issues, etc.)
    throw error;
  }
}

// ---------------------------------------------------------------------------
// releaseSlotLocks — Called on payment failure / cancellation
// ---------------------------------------------------------------------------

/**
 * Delete lock documents for the given slots.
 * Uses a batch write (not a transaction — no read needed).
 *
 * @param {Object} params
 * @param {string} params.turfId
 * @param {string} params.date
 * @param {string[]} params.slots
 */
export async function releaseSlotLocks({ turfId, date, slots }) {
  if (!slots || slots.length === 0) return;

  const batch = adminDb.batch();

  slots.forEach((slot) => {
    const ref = adminDb
      .collection('slotLocks')
      .doc(`${turfId}_${date}_${slot}`);
    batch.delete(ref);
  });

  await batch.commit();
  console.log('🔓 Slot locks released:', slots);
}

// ---------------------------------------------------------------------------
// confirmSlotLocks — Called after successful payment verification
// ---------------------------------------------------------------------------

/**
 * Update lock status from 'locked' to 'confirmed' and attach the bookingId.
 * Uses a batch write for performance.
 *
 * @param {Object} params
 * @param {string} params.turfId
 * @param {string} params.date
 * @param {string[]} params.slots
 * @param {string} params.bookingId
 */
export async function confirmSlotLocks({ turfId, date, slots, bookingId }) {
  const batch = adminDb.batch();

  slots.forEach((slot) => {
    const ref = adminDb
      .collection('slotLocks')
      .doc(`${turfId}_${date}_${slot}`);
    batch.update(ref, {
      status: 'confirmed',
      bookingId,
      confirmedAt: Timestamp.now(),
    });
  });

  await batch.commit();
  console.log('🔒 Slot locks confirmed for booking:', bookingId);
}
