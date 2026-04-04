/**
 * useSlotBlocking — Real-time Firestore listener for slot lock state.
 *
 * Subscribes to the `blockedSlots` collection filtered by turfId + date,
 * then exposes helpers to lock/unlock slots and check lock status.
 * Automatically unblocks all user-held locks on unmount or input change.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    setDoc,
    deleteDoc,
    Timestamp,
    type QuerySnapshot,
    type DocumentData,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuth } from './useAuth';
import {
    type BlockedSlot,
    SLOT_LOCK_DURATION_MS,
    buildBlockedSlotId,
} from '@/types/blockedSlot';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UseSlotBlockingReturn {
    /** Lock a slot for the current user (status = 'viewing'). */
    blockSlot: (slot: string) => Promise<void>;
    /** Remove the current user's lock on a slot. */
    unblockSlot: (slot: string) => Promise<void>;
    /** True if the slot is locked by *another* user AND the lock hasn't expired. */
    isSlotBlockedByOther: (slot: string) => boolean;
    /** Returns the expiry Date for a slot the current user holds, or null. */
    getBlockExpiry: (slot: string) => Date | null;
    /** All active (non-expired) blocked slots for this turf+date. */
    blockedSlots: Map<string, BlockedSlot>;
    /** Loading state of the Firestore listener. */
    loading: boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSlotBlocking(
    turfId: string,
    date: string
): UseSlotBlockingReturn {
    const { user } = useAuth();
    const [blockedSlots, setBlockedSlots] = useState<Map<string, BlockedSlot>>(
        new Map()
    );
    const [loading, setLoading] = useState(true);

    // Track which slots the current user has locked, so we can clean up
    // on unmount / input change without depending on stale state.
    const userLocksRef = useRef<Set<string>>(new Set());

    // ------------------------------------------------------------------
    // Cleanup helper — unblocks all slots the current user holds
    // ------------------------------------------------------------------
    const cleanupUserLocks = useCallback(
        async (lockedTurfId: string, lockedDate: string) => {
            const uid = user?.uid;
            if (!uid) return;

            const locks = Array.from(userLocksRef.current);
            userLocksRef.current.clear();

            await Promise.allSettled(
                locks.map((slot) => {
                    const docId = buildBlockedSlotId(lockedTurfId, lockedDate, slot);
                    return deleteDoc(doc(db, 'blockedSlots', docId));
                })
            );
        },
        [user?.uid]
    );

    // ------------------------------------------------------------------
    // Real-time listener
    // ------------------------------------------------------------------
    useEffect(() => {
        if (!turfId || !date) {
            setBlockedSlots(new Map());
            setLoading(false);
            return;
        }

        setLoading(true);

        const q = query(
            collection(db, 'blockedSlots'),
            where('turfId', '==', turfId),
            where('date', '==', date)
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot: QuerySnapshot<DocumentData>) => {
                const now = Date.now();
                const map = new Map<string, BlockedSlot>();

                snapshot.forEach((docSnap) => {
                    const data = docSnap.data() as BlockedSlot;

                    // Ignore expired locks
                    const expiresMs = data.expiresAt.toMillis();
                    if (expiresMs > now) {
                        map.set(data.slot, data);
                    }
                });

                setBlockedSlots(map);
                setLoading(false);
            },
            (err) => {
                console.error('❌ useSlotBlocking listener error:', err);
                setLoading(false);
            }
        );

        // On turfId/date change or unmount: unsub + clean up user locks
        return () => {
            unsubscribe();
            cleanupUserLocks(turfId, date);
        };
    }, [turfId, date, cleanupUserLocks]);

    // ------------------------------------------------------------------
    // blockSlot
    // ------------------------------------------------------------------
    const blockSlot = useCallback(
        async (slot: string) => {
            if (!user?.uid || !turfId || !date) return;

            const docId = buildBlockedSlotId(turfId, date, slot);
            const now = Timestamp.now();
            const expiresAt = Timestamp.fromMillis(
                now.toMillis() + SLOT_LOCK_DURATION_MS
            );

            const blocked: BlockedSlot = {
                turfId,
                date,
                slot,
                blockedBy: user.uid,
                blockedAt: now,
                expiresAt,
                status: 'viewing',
            };

            await setDoc(doc(db, 'blockedSlots', docId), blocked);
            userLocksRef.current.add(slot);
        },
        [user?.uid, turfId, date]
    );

    // ------------------------------------------------------------------
    // unblockSlot
    // ------------------------------------------------------------------
    const unblockSlot = useCallback(
        async (slot: string) => {
            if (!user?.uid || !turfId || !date) return;

            const docId = buildBlockedSlotId(turfId, date, slot);
            await deleteDoc(doc(db, 'blockedSlots', docId));
            userLocksRef.current.delete(slot);
        },
        [user?.uid, turfId, date]
    );

    // ------------------------------------------------------------------
    // isSlotBlockedByOther
    // ------------------------------------------------------------------
    const isSlotBlockedByOther = useCallback(
        (slot: string): boolean => {
            const entry = blockedSlots.get(slot);
            if (!entry) return false;

            // Expired?
            if (entry.expiresAt.toMillis() <= Date.now()) return false;

            // Blocked by the current user = not blocked for them
            if (entry.blockedBy === user?.uid) return false;

            return true;
        },
        [blockedSlots, user?.uid]
    );

    // ------------------------------------------------------------------
    // getBlockExpiry — for showing countdown on user's own locks
    // ------------------------------------------------------------------
    const getBlockExpiry = useCallback(
        (slot: string): Date | null => {
            const entry = blockedSlots.get(slot);
            if (!entry) return null;
            if (entry.blockedBy !== user?.uid) return null;

            return entry.expiresAt.toDate();
        },
        [blockedSlots, user?.uid]
    );

    return {
        blockSlot,
        unblockSlot,
        isSlotBlockedByOther,
        getBlockExpiry,
        blockedSlots,
        loading,
    };
}
