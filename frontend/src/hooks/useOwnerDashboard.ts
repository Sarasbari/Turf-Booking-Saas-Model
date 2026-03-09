/**
 * useOwnerDashboard hook
 *
 * Fetches all turfs owned by the current user and sets up a real-time
 * listener for all bookings related to those turfs.
 */

import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, onSnapshot, DocumentData, QuerySnapshot } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { Turf, Booking } from '../types';

interface OwnerStats {
    totalEarnings: number;
    totalBookings: number;
    todayBookings: number;
    occupancyRate: number; // mock calculation for now, or based on slots
}

export function useOwnerDashboard() {
    const [turfs, setTurfs] = useState<Turf[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let unsubscribeBookings: (() => void) | undefined;

        const fetchData = async () => {
            const user = auth.currentUser;
            if (!user) {
                setLoading(false);
                setError('User not authenticated');
                return;
            }

            try {
                setLoading(true);
                // 1. Fetch turfs owned by the user
                const turfsRef = collection(db, 'turf');
                const turfsQuery = query(turfsRef, where('ownerId', '==', user.uid));
                const turfsSnapshot = await getDocs(turfsQuery);

                const fetchedTurfs = turfsSnapshot.docs.map(doc => ({
                    ...doc.data(),
                    id: doc.id
                })) as Turf[];

                setTurfs(fetchedTurfs);

                // 2. If no turfs, don't fetch bookings
                if (fetchedTurfs.length === 0) {
                    setBookings([]);
                    setLoading(false);
                    return;
                }

                const turfIds = fetchedTurfs.map(t => t.id);

                // 3. Listen to bookings where turfId is in the owner's turfIds
                const bookingsRef = collection(db, 'bookings');

                // Note: Firestore 'in' queries are limited to 10 items.
                // For production with >10 turfs per owner, we'd need distinct queries.
                // Assuming <10 turfs for now.
                const chunkedTurfIds = turfIds.slice(0, 10);

                const bookingsQuery = query(
                    bookingsRef,
                    where('turfId', 'in', chunkedTurfIds)
                );

                unsubscribeBookings = onSnapshot(
                    bookingsQuery,
                    (snapshot: QuerySnapshot<DocumentData>) => {
                        const fetchedBookings = snapshot.docs.map(doc => ({
                            ...doc.data(),
                            id: doc.id
                        })) as Booking[];

                        // Sort by createdAt descending
                        fetchedBookings.sort((a, b) => {
                            const tA = (a.createdAt as any)?.toMillis?.() || 0;
                            const tB = (b.createdAt as any)?.toMillis?.() || 0;
                            return tB - tA;
                        });

                        setBookings(fetchedBookings);
                        setLoading(false);
                    },
                    (err) => {
                        console.error('❌ Error listening to owner bookings:', err);
                        setError('Failed to load bookings');
                        setLoading(false);
                    }
                );
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                const err = error as Error;
                setError(err.message || 'Failed to load dashboard data');
                setLoading(false);
            }
        };

        fetchData();

        return () => {
            if (unsubscribeBookings) {
                unsubscribeBookings();
            }
        };
    }, []);

    const stats: OwnerStats = useMemo(() => {
        let totalEarnings = 0;
        let totalBookings = bookings.length;
        let todayBookings = 0;

        const todayStr = new Date().toISOString().split('T')[0];

        bookings.forEach(b => {
            if (b.status === 'confirmed' || b.status === 'pending') { // include both or just confirmed
                totalEarnings += Number(b.totalPrice || 0);
            }
            if (b.date === todayStr) {
                todayBookings++;
            }
        });

        // Mock occupancy calculation: (todayBookings / (turfs.length * 17 slots)) * 100
        const totalPossibleSlotsToday = turfs.length * 17;
        const occupancyRate = totalPossibleSlotsToday > 0
            ? Math.min(Math.round((todayBookings / totalPossibleSlotsToday) * 100), 100)
            : 0;

        return {
            totalEarnings,
            totalBookings,
            todayBookings,
            occupancyRate
        };
    }, [bookings, turfs]);

    return {
        turfs,
        bookings,
        stats,
        loading,
        error,
    };
}
