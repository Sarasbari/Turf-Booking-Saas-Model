import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../../services/firebase';
import './MyBookings.css';

// ── Types ────────────────────────────────────────────────────────────────────
// Reflects what the backend writes to Firestore bookings collection
interface FirestoreBooking {
    id: string;
    userId: string;
    turfId: string;
    turfName: string;
    turfAddress: string;
    turfImage?: string;
    ownerContact?: string;
    bookedDate: string;       // 'YYYY-MM-DD'
    timeSlots: string[];      // ['06:00', '07:00']
    totalPrice: number;
    status: string;
    paymentId: string;
    razorpayOrderId: string;
    emailSent: boolean;
    createdAt: { toDate?: () => Date } | null;
    // Legacy fields from old client-side writes (kept for backward compatibility)
    date?: string;
    time?: string;
    turfLocation?: string;
    price?: number;
}

interface MyBookingsProps {
    userId: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

/**
 * Determine if a booking is upcoming or past.
 * Compares bookedDate (or legacy date) against today.
 */
const isUpcoming = (booking: FirestoreBooking): boolean => {
    const dateStr = booking.bookedDate || booking.date || '';
    if (!dateStr) return false;
    const bookingDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookingDate >= today;
};

/**
 * Format a timeSlots array ['06:00', '07:00', '08:00'] into a human-readable range.
 * Falls back to legacy `time` field if present.
 */
const formatTimeRange = (booking: FirestoreBooking): string => {
    if (booking.time) return booking.time; // legacy field
    if (!booking.timeSlots || booking.timeSlots.length === 0) return '';
    const fmt = (hour: number) => {
        const normalizedHour = ((hour % 24) + 24) % 24;
        const period = normalizedHour >= 12 ? 'PM' : 'AM';
        const hr = normalizedHour % 12 || 12;
        return `${hr}:00 ${period}`;
    };

    const parseHour = (slot: string): number => {
        const [hourPart] = slot.split(':');
        const parsed = Number.parseInt(hourPart, 10);
        return Number.isNaN(parsed) ? 0 : parsed;
    };

    const firstHour = parseHour(booking.timeSlots[0]);
    const lastHour = parseHour(booking.timeSlots[booking.timeSlots.length - 1]) + 1;
    const first = fmt(firstHour);
    const last = fmt(lastHour);
    return `${first} – ${last}`;
};

const showToast = (message: string, type: 'success' | 'error') => {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// ── Component ────────────────────────────────────────────────────────────────

export function MyBookings({ userId }: MyBookingsProps) {
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [upcomingBookings, setUpcomingBookings] = useState<FirestoreBooking[]>([]);
    const [pastBookings, setPastBookings] = useState<FirestoreBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<FirestoreBooking | null>(null);
    const [cancelling, setCancelling] = useState(false);

    // ── Real-time Firestore listener ─────────────────────────────────────────
    // Waits for a valid userId, then subscribes to the user's bookings.
    // Automatically unsubscribes when the component unmounts or userId changes.
    // Booking history persists across logins because it's stored in Firestore —
    // every login re-runs this query and fetches the full history.
    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const q = query(
            collection(db, 'bookings'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const all = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                } as FirestoreBooking));

                // Split into upcoming and past based on bookedDate vs today
                const upcoming: FirestoreBooking[] = [];
                const past: FirestoreBooking[] = [];

                all.forEach((b) => {
                    // Skip cancelled bookings in upcoming; show in past
                    if (b.status === 'cancelled') {
                        past.push(b);
                    } else if (isUpcoming(b)) {
                        upcoming.push(b);
                    } else {
                        past.push(b);
                    }
                });

                setUpcomingBookings(upcoming);
                setPastBookings(past);
                setLoading(false);
            },
            (err) => {
                console.error('Bookings listener error:', err);
                // If error mentions "index", the composite index needs to be created in Firebase Console
                if (err.message?.includes('index')) {
                    console.info('💡 Firestore index required — check the browser console for a link to auto-create it.');
                }
                setError('Unable to load bookings. Please refresh the page.');
                setLoading(false);
            }
        );

        // Cleanup: unsubscribe when userId changes or component unmounts
        return () => unsubscribe();
    }, [userId]);

    // ── Cancel booking ───────────────────────────────────────────────────────
    const handleCancelClick = (booking: FirestoreBooking) => {
        setSelectedBooking(booking);
        setCancelModalOpen(true);
    };

    const handleConfirmCancel = async () => {
        if (!selectedBooking) return;
        try {
            setCancelling(true);
            // Call backend to cancel (avoids direct client write to bookings)
            const user = auth.currentUser;
            if (!user) throw new Error('Not authenticated');
            const token = await user.getIdToken();
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/payment/cancel`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ bookingId: selectedBooking.id }),
                }
            );
            if (!res.ok) throw new Error('Cancel failed');
            showToast('Booking cancelled successfully', 'success');
            setCancelModalOpen(false);
            setSelectedBooking(null);
            // onSnapshot listener will automatically update the UI
        } catch (err) {
            showToast('Failed to cancel booking. Please try again.', 'error');
            console.error('Error cancelling booking:', err);
        } finally {
            setCancelling(false);
        }
    };

    const currentBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="my-bookings">
            {/* Header */}
            <div className="bookings-header">
                <div className="header-text">
                    <h2>My Bookings</h2>
                    <p>View and manage your turf bookings</p>
                </div>
                <div className="header-tabs">
                    <button
                        className={`tab-button ${activeTab === 'upcoming' ? 'active' : ''}`}
                        onClick={() => setActiveTab('upcoming')}
                    >
                        Upcoming
                        {upcomingBookings.length > 0 && (
                            <span className="tab-count">{upcomingBookings.length}</span>
                        )}
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'past' ? 'active' : ''}`}
                        onClick={() => setActiveTab('past')}
                    >
                        Past
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="bookings-content">
                {loading ? (
                    <div className="bookings-loading">
                        <div className="spinner"></div>
                        <p>Loading bookings...</p>
                    </div>
                ) : error ? (
                    <div className="bookings-error">
                        <p>{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="retry-button"
                        >
                            Retry
                        </button>
                    </div>
                ) : currentBookings.length === 0 ? (
                    <div className="bookings-empty">
                        <div className="empty-icon">
                            {activeTab === 'upcoming' ? '📅' : '🕐'}
                        </div>
                        <h3>{activeTab === 'upcoming' ? 'No Upcoming Bookings' : 'No Past Bookings'}</h3>
                        <p>
                            {activeTab === 'upcoming'
                                ? 'Book a turf to see your upcoming reservations here'
                                : 'Your booking history will appear here'}
                        </p>
                        {activeTab === 'upcoming' && (
                            <button
                                className="browse-button"
                                onClick={() => (window.location.href = '/listings')}
                            >
                                Browse Turfs
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="bookings-list">
                        {currentBookings.map((booking) => (
                            <div
                                key={booking.id}
                                className={`booking-card ${activeTab === 'upcoming' ? 'active-booking-card' : ''}`}
                            >
                                <div className="booking-card-inner">
                                    <div className="booking-image">
                                        <img
                                            src={
                                                booking.turfImage ||
                                                'https://images.unsplash.com/photo-1529900965900-58ab5b5f25bf'
                                            }
                                            alt={booking.turfName}
                                        />
                                    </div>
                                    <div className="booking-main-details">
                                        <div className="booking-card-header">
                                            <h3 className="turf-name">{booking.turfName}</h3>
                                            <span className={`status-badge status-${booking.status}`}>
                                                {booking.status === 'confirmed'
                                                    ? 'Confirmed'
                                                    : booking.status === 'cancelled'
                                                        ? 'Cancelled'
                                                        : 'Completed'}
                                            </span>
                                        </div>
                                        <p className="turf-location">
                                            <span className="location-svg">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" /></svg>
                                            </span>
                                            {booking.turfAddress || booking.turfLocation || ''}
                                        </p>
                                        <div className="booking-datetime-pill">
                                            {formatDate(booking.bookedDate || booking.date || '').split(',')[1] ||
                                                formatDate(booking.bookedDate || booking.date || '')}
                                            {' · '}
                                            {formatTimeRange(booking)}
                                        </div>
                                        {booking.totalPrice > 0 && (
                                            <div className="booking-price">
                                                ₹{booking.totalPrice.toLocaleString('en-IN')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="booking-right">
                                    {activeTab === 'upcoming' && booking.status !== 'cancelled' && (
                                        <div className="booking-actions-menu">
                                            <button
                                                className="menu-dots-btn"
                                                onClick={() => handleCancelClick(booking)}
                                                title="Cancel booking"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Cancel Modal */}
            {cancelModalOpen && selectedBooking && (
                <div className="modal-overlay" onClick={() => !cancelling && setCancelModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-icon warning">⚠️</div>
                        <h3>Cancel Booking?</h3>
                        <p>Are you sure you want to cancel this booking? This action cannot be undone.</p>
                        <div className="booking-confirm-info">
                            <p><strong>{selectedBooking.turfName}</strong></p>
                            <p>
                                {formatDate(selectedBooking.bookedDate || selectedBooking.date || '')}
                                {' • '}
                                {formatTimeRange(selectedBooking)}
                            </p>
                        </div>
                        <div className="modal-actions">
                            <button
                                className="modal-button secondary"
                                onClick={() => setCancelModalOpen(false)}
                                disabled={cancelling}
                            >
                                Keep Booking
                            </button>
                            <button
                                className="modal-button danger"
                                onClick={handleConfirmCancel}
                                disabled={cancelling}
                            >
                                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
