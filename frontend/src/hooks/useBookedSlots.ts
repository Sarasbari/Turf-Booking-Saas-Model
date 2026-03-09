/**
 * useBookedSlots — Real-time Firestore listener for booked time slots.
 *
 * Subscribes to the `bookings` collection filtered by turfId + date,
 * and returns a Set of booked time-slot strings (e.g. "06:00", "07:00").
 * Automatically cleans up the listener on unmount or input change.
 */

import { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot,
    type QuerySnapshot,
    type DocumentData,
} from 'firebase/firestore';
import { db } from '../services/firebase';

interface BookingDoc {
    turfId: string;
    userId: string;
    date: string;
    timeSlots: string[];
    status: string;
}

interface UseBookedSlotsReturn {
    bookedSlots: Set<string>;
    loading: boolean;
    error: string | null;
}

export function useBookedSlots(
    turfId: string,
    selectedDate: string
): UseBookedSlotsReturn {
    const [bookedSlots, setBookedSlots] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Guard: don't subscribe if inputs are empty
        if (!turfId || !selectedDate) {
            setBookedSlots(new Set());
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const bookingsRef = collection(db, 'bookings');
        const q = query(
            bookingsRef,
            where('turfId', '==', turfId),
            where('date', '==', selectedDate),
            where('status', '==', 'confirmed')
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot: QuerySnapshot<DocumentData>) => {
                const slots = new Set<string>();

                snapshot.forEach((doc) => {
                    const data = doc.data() as BookingDoc;
                    if (Array.isArray(data.timeSlots)) {
                        data.timeSlots.forEach((slot) => slots.add(slot));
                    }
                });

                setBookedSlots(slots);
                setLoading(false);
            },
            (err) => {
                console.error('❌ useBookedSlots listener error:', err);
                setError(err.message || 'Failed to fetch booked slots');
                setLoading(false);
            }
        );

        // Cleanup listener on unmount or when turfId/date changes
        return () => unsubscribe();
    }, [turfId, selectedDate]);

    return { bookedSlots, loading, error };
}
