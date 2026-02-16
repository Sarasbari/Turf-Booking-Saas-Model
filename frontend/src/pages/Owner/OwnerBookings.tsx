import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { OwnerData, BookingType } from '../../types/owner';
import { BookingCard } from '../../components/Owner/BookingCard';
import styles from '../../styles/Owner/OwnerBookings.module.css';

type FilterType = 'all' | 'today' | 'upcoming' | 'pending' | 'confirmed' | 'cancelled';

export function OwnerBookings() {
    const [ownerData, setOwnerData] = useState<OwnerData | null>(null);
    const [bookings, setBookings] = useState<BookingType[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<BookingType[]>([]);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBookings();
    }, []);

    useEffect(() => {
        filterBookings();
    }, [bookings, activeFilter, searchQuery]);

    const fetchBookings = async () => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            setLoading(true);

            // Fetch owner data
            const ownerDocRef = doc(db, 'owners', user.uid);
            const ownerDoc = await getDoc(ownerDocRef);
            
            if (!ownerDoc.exists()) return;
            
            const owner = ownerDoc.data() as OwnerData;
            setOwnerData(owner);

            // Fetch bookings
            const bookingsQuery = query(
                collection(db, 'bookings'),
                where('turfId', '==', owner.turfId)
            );
            const bookingsSnapshot = await getDocs(bookingsQuery);
            const bookingsData = bookingsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as BookingType[];

            // Sort by date and time (most recent first)
            bookingsData.sort((a, b) => {
                const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
                if (dateCompare !== 0) return dateCompare;
                return b.startTime.localeCompare(a.startTime);
            });

            setBookings(bookingsData);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterBookings = () => {
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
    };

    const handleConfirmBooking = async (bookingId: string) => {
        if (!confirm('Confirm this booking?')) return;

        try {
            const bookingRef = doc(db, 'bookings', bookingId);
            await updateDoc(bookingRef, {
                status: 'confirmed'
            });

            // Update local state
            setBookings(prev =>
                prev.map(b =>
                    b.id === bookingId ? { ...b, status: 'confirmed' as const } : b
                )
            );
        } catch (error) {
            console.error('Error confirming booking:', error);
            alert('Failed to confirm booking. Please try again.');
        }
    };

    const handleCancelBooking = async (bookingId: string) => {
        if (!confirm('Are you sure you want to cancel this booking?')) return;

        try {
            const bookingRef = doc(db, 'bookings', bookingId);
            await updateDoc(bookingRef, {
                status: 'cancelled'
            });

            // Update local state
            setBookings(prev =>
                prev.map(b =>
                    b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
                )
            );
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
                            onConfirm={booking.status === 'pending' ? () => handleConfirmBooking(booking.id) : undefined}
                            onCancel={
                                booking.status === 'pending' || booking.status === 'confirmed'
                                    ? () => handleCancelBooking(booking.id)
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
