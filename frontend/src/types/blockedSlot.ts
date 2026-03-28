/**
 * BlockedSlot — Firestore document representing a temporarily locked time slot.
 *
 * Document ID format: {turfId}_{date}_{slot}
 * Example: sportzNation_2026-03-15_18:00
 *
 * Used to show real-time "being viewed" indicators and prevent
 * double-booking frustration.
 */

import { Timestamp } from 'firebase/firestore';

export interface BlockedSlot {
    turfId: string;
    date: string;          // YYYY-MM-DD
    slot: string;          // HH:MM
    blockedBy: string;     // userId
    blockedAt: Timestamp;
    expiresAt: Timestamp;  // blockedAt + 5 minutes
    status: 'viewing' | 'booking';
}

/** How long a slot lock lasts (milliseconds). */
export const SLOT_LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/** Build the canonical Firestore document ID for a blocked slot. */
export function buildBlockedSlotId(
    turfId: string,
    date: string,
    slot: string
): string {
    return `${turfId}_${date}_${slot}`;
}
