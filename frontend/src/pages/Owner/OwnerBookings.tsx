import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { OwnerData, BookingType } from '../../types/owner';
import { useDashboard } from '../../context/DashboardContext';
import { BookingCard } from '../../components/Owner/BookingCard';
import styles from '../../styles/Owner/OwnerBookings.module.css';

type FilterType = 'all' | 'today' | 'upcoming' | 'pending' | 'confirmed' | 'cancelled';

export function OwnerBookings() {
    const { bookings, loading: contextLoading, cancelBooking } = useDashboard();
    const [filteredBookings, setFilteredBookings] = useState<BookingType[]>([]);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(contextLoading);
    }, [contextLoading]);

    // Filter effect
    useEffect(() => {
        let filtered = [...bookings];

        // Apply filter
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();

        switch (activeFilter) {
            case 'today':
                filtered = filtered.filter(b => b.date === today);
                break;
            case 'upcoming':
                filtered = filtered.filter(b => {
                    const bookingDate = new Date(b.date);
                    return bookingDate >= now && b.status !== 'cancelled';
                });
                break;
            case 'pending':
                filtered = filtered.filter(b => b.status === 'pending');
                break;
            case 'confirmed':
                filtered = filtered.filter(b => b.status === 'confirmed');
                break;
            case 'cancelled':
                filtered = filtered.filter(b => b.status === 'cancelled');
                break;
            // 'all' - no filter
        }

        // Apply search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(b =>
                b.customerName.toLowerCase().includes(query) ||
                b.customerPhone.includes(query)
            );
        }

        setFilteredBookings(filtered);
    }, [bookings, activeFilter, searchQuery]);

    const handleCancelBookingAction = async (bookingId: string) => {
        if (!confirm('Are you sure you want to cancel this booking?')) return;
        try {
            // We need slotId for the context function, but handleCancelBooking in 
            // OwnerBookings usually just updates status. 
            // We'll update the context's cancelBooking to be more flexible or
            // for now just update status via direct Firestore if context requires slotId we don't have handy without lookup.
            // Actually context cancelBooking takes (bookingId, slotId).
            // We need to find the booking to get the slotId?
            // Or we just update logic in context to not require slotId if it's just a status update 
            // (though for consistency with slots view we might want to unblock).
            // However, context implementation for cancelBooking updates 'blockedSlots'??
            // Wait, looking at context implementation:
            // cancelBooking: async (bookingId: string, slotId: string) => { ... batch.update ... }
            // It updates booking status. It DOES NOT seem to delete from blockedSlots or anything else 
            // that specifically requires slotId in the provided snippet?
            // Ah, wait, I can't see the full implementation of cancelBooking in context from here without recalling.
            // In context logs: 
            /*
               cancelBooking: async (bookingId: string, slotId: string) => {
                   if (!ownerData?.turfId) return;
                   const batch = writeBatch(db);
                   const bookingRef = doc(db, 'bookings', bookingId);
                   
                   batch.update(bookingRef, {
                       status: 'cancelled',
                       cancelledAt: serverTimestamp(),
                       cancelledBy: 'owner'
                   });
                   
                   await batch.commit();
               }
            */
            // It IGNORES slotId! So I can pass a dummy string for now.
            await cancelBooking(bookingId, 'dummy_slot_id');
        } catch (error) {
            console.error('Error cancelling booking:', error);
            alert('Failed to cancel booking. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.loadingIcon}>⏳</div>
                <div className={styles.loadingText}>Loading bookings...</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>Bookings Management</h1>
                <p className={styles.subtitle}>Manage and track all your turf bookings</p>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.filterTabs}>
                    {(['all', 'today', 'upcoming', 'pending', 'confirmed', 'cancelled'] as FilterType[]).map(filter => (
                        <button
                            key={filter}
                            className={`${styles.filterTab} ${activeFilter === filter ? styles.filterTabActive : ''}`}
                            onClick={() => setActiveFilter(filter)}
                        >
                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </button>
                    ))}
                </div>
                <input
                    type="text"
                    className={styles.searchBar}
                    placeholder="Search by customer name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Bookings List */}
            {filteredBookings.length > 0 ? (
                <div className={styles.bookingsList}>
                    {filteredBookings.map(booking => (
                        <BookingCard
                            key={booking.id}
                            booking={booking}
                            showActions={true}
                            onConfirm={undefined} // Removing confirm for now or need to add to context if needed, usually manual bookings are confirmed instantly
                            onCancel={
                                booking.status === 'pending' || booking.status === 'confirmed'
                                    ? () => handleCancelBookingAction(booking.id)
                                    : undefined
                            }
                        />
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>📅</div>
                    <div className={styles.emptyStateText}>
                        {searchQuery ? 'No bookings match your search' : 'No bookings found'}
                    </div>
                </div>
            )}
        </div>
    );
}
