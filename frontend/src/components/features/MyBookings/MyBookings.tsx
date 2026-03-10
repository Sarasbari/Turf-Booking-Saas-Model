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
                            <div key={booking.id} className={`booking-card ${activeTab === 'upcoming' ? 'active-booking-card' : ''}`}>
                                <div className="booking-card-inner">
                                    <div className="booking-image">
                                        <img src="https://images.unsplash.com/photo-1529900965900-58ab5b5f25bf" alt={booking.turfName} />
                                    </div>
                                    <div className="booking-main-details">
                                        <div className="booking-card-header">
                                            <h3 className="turf-name">{booking.turfName}</h3>
                                            <span className="sport-badge">FOOTBALL</span>
                                        </div>
                                        <p className="turf-location">
                                            <span className="location-svg">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" /></svg>
                                            </span>
                                            {booking.turfLocation}
                                        </p>
                                        <div className="booking-datetime-pill">
                                            {formatDate(booking.date).split(',')[1] || formatDate(booking.date)}, {booking.time.split(' - ')[0]}
                                        </div>
                                    </div>
                                </div>
                                <div className="booking-right">
                                    <div className="booking-status-row">
                                        <span className={`status-badge status-${activeTab === 'upcoming' ? 'confirmed' : 'completed'}`}>
                                            {activeTab === 'upcoming' ? 'Confirmed' : 'Completed'}
                                        </span>
                                    </div>
                                    <div className="booking-actions-menu">
                                        <button className="menu-dots-btn" onClick={() => handleCancelClick(booking)}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                                        </button>
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
