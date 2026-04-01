/**
 * useBookedSlots — Fetch booked time slots via the backend API.
 *
 * Calls the `GET /api/turfs/:id/slots/:date` endpoint to retrieve slots securely
 * without violating Firestore security rules, since client apps cannot read all bookings.
 */

import { useState, useEffect } from 'react';

interface UseBookedSlotsReturn {
    bookedSlots: Set<string>;
    loading: boolean;
    error: string | null;
}

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

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

        let isMounted = true;
        setLoading(true);
        setError(null);

        const fetchSlots = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/turfs/${turfId}/slots/${selectedDate}`);
                
                if (!res.ok) {
                    throw new Error('Failed to fetch slot availability');
                }
                
                const data = await res.json();
                
                if (data.success && isMounted) {
                    setBookedSlots(new Set(data.bookedSlots || []));
                } else if (!data.success) {
                    throw new Error(data.error || 'Failed to fetch slots');
                }
            } catch (err) {
                if (isMounted) {
                    console.error('❌ useBookedSlots fetch error:', err);
                    setError(err instanceof Error ? err.message : 'Unknown error');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchSlots();

        // Optional polling to keep slots updated while user has picker open
        const intervalId = setInterval(fetchSlots, 30000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [turfId, selectedDate]);

    return { bookedSlots, loading, error };
}
