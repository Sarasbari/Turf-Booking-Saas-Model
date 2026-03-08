import { useState, useEffect } from 'react';
import { Booking } from '../../../types/profile';
import { getUserBookings, cancelBooking } from '../../../utils/firestoreUtils';
import './MyBookings.css';

interface MyBookingsProps {
    userId: string;
}

export function MyBookings({ userId }: MyBookingsProps) {
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
    const [pastBookings, setPastBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        loadBookings();
    }, [userId]);

    const loadBookings = async () => {
        try {
            setLoading(true);
            setError(null);
            const [upcoming, past] = await Promise.all([
                getUserBookings(userId, 'upcoming'),
                getUserBookings(userId, 'completed'),
            ]);
            setUpcomingBookings(upcoming);
            setPastBookings(past);
        } catch (err) {
            setError('Unable to load bookings. Please refresh the page.');
            console.error('Error loading bookings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelClick = (booking: Booking) => {
        setSelectedBooking(booking);
        setCancelModalOpen(true);
    };

    const handleConfirmCancel = async () => {
        if (!selectedBooking) return;

        try {
            setCancelling(true);
            await cancelBooking(selectedBooking.id);

            // Update local state
            setUpcomingBookings(prev => prev.filter(b => b.id !== selectedBooking.id));

            // Show success message
            showToast('Booking cancelled successfully', 'success');
            setCancelModalOpen(false);
            setSelectedBooking(null);
        } catch (err) {
            showToast('Failed to cancel booking. Please try again.', 'error');
            console.error('Error cancelling booking:', err);
        } finally {
            setCancelling(false);
        }
    };

    const getCountdown = (dateStr: string, timeStr: string): string => {
        const [startTime] = timeStr.split(' - ');
        const bookingDate = new Date(`${dateStr} ${startTime}`);
        const now = new Date();
        const diff = bookingDate.getTime() - now.getTime();

        if (diff < 0) return '';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        const isToday = bookingDate.toDateString() === now.toDateString();
        const isTomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString() === bookingDate.toDateString();

        if (isToday) return `Today at ${startTime}`;
        if (isTomorrow) return `Tomorrow at ${startTime}`;
        if (days < 7) return `In ${days} day${days > 1 ? 's' : ''} ${hours} hour${hours > 1 ? 's' : ''}`;

        return '';
    };

    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        // Simple toast implementation - you can enhance this
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    const currentBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

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
                        <button onClick={loadBookings} className="retry-button">Retry</button>
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
                            <div key={booking.id} className="booking-card">
                                <div className="booking-left">
                                    <h3 className="turf-name">{booking.turfName}</h3>
                                    <p className="turf-location">
                                        <span className="location-icon">📍</span>
                                        {booking.turfLocation}
                                    </p>
                                    <p className="booking-datetime">
                                        {formatDate(booking.date)} • {booking.time}
                                    </p>
                                    <p className="booking-details">
                                        {booking.duration} hour{booking.duration > 1 ? 's' : ''} • ₹{booking.price}
                                    </p>
                                </div>
                                <div className="booking-right">
                                    <span className={`status-badge status-${booking.status}`}>
                                        {booking.status === 'upcoming' ? 'Confirmed' : 'Completed'}
                                    </span>
                                    {activeTab === 'upcoming' && getCountdown(booking.date, booking.time) && (
                                        <p className="countdown">{getCountdown(booking.date, booking.time)}</p>
                                    )}
                                    <div className="booking-actions">
                                        {activeTab === 'upcoming' ? (
                                            <>
                                                <button className="action-button primary">Get Directions</button>
                                                <button
                                                    className="action-button danger-text"
                                                    onClick={() => handleCancelClick(booking)}
                                                >
                                                    Cancel Booking
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    className="action-button primary"
                                                    onClick={() => (window.location.href = '/listings')}
                                                >
                                                    Book Again
                                                </button>
                                                <button className="action-button secondary disabled" disabled>
                                                    Leave Review
                                                    <span className="coming-soon-badge">Coming Soon</span>
                                                </button>
                                            </>
                                        )}
                                    </div>
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
                        <p>
                            Are you sure you want to cancel this booking? This action cannot be undone.
                        </p>
                        <div className="booking-confirm-info">
                            <p><strong>{selectedBooking.turfName}</strong></p>
                            <p>{formatDate(selectedBooking.date)} • {selectedBooking.time}</p>
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
