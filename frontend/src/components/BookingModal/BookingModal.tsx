import { useState, useEffect } from 'react';
import { Turf } from '../../types/turf';
import { generateTimeSlots } from '../../data/mockTurfs';
import styles from './BookingModal.module.css';

interface BookingModalProps {
    turf: Turf | null;
    isOpen: boolean;
    onClose: () => void;
}

export function BookingModal({ turf, isOpen, onClose }: BookingModalProps) {
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
    const [timeSlots, setTimeSlots] = useState<{ time: string; isBooked: boolean }[]>([]);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [bookingId, setBookingId] = useState('');

    const today = new Date().toISOString().split('T')[0];
    const duration = 2; // Fixed 2-hour duration

    useEffect(() => {
        if (!selectedDate) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setSelectedDate(tomorrow.toISOString().split('T')[0]);
        }
    }, []);

    useEffect(() => {
        if (selectedDate && turf) {
            setTimeSlots(generateTimeSlots(selectedDate, turf.id));
            setSelectedTimeSlot(''); // Reset time slot when date changes
        }
    }, [selectedDate, turf]);

    useEffect(() => {
        if (!isOpen) {
            // Reset state when modal closes
            setIsConfirmed(false);
            setSelectedTimeSlot('');
        }
    }, [isOpen]);

    if (!isOpen || !turf) return null;

    const totalPrice = turf.pricePerHour * duration;

    const handleConfirmBooking = () => {
        // Generate random booking ID
        const id = `TRF-2026-${Math.floor(10000 + Math.random() * 90000)}`;
        setBookingId(id);
        setIsConfirmed(true);
    };

    const handleBookAnother = () => {
        setIsConfirmed(false);
        setSelectedTimeSlot('');
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const renderStars = (rating: number) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        for (let i = 0; i < fullStars; i++) {
            stars.push(<span key={`full-${i}`} className={styles.starFull}>★</span>);
        }
        if (hasHalfStar) {
            stars.push(<span key="half" className={styles.starHalf}>★</span>);
        }
        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(<span key={`empty-${i}`} className={styles.starEmpty}>★</span>);
        }
        return stars;
    };

    return (
        <div className={styles.backdrop} onClick={handleBackdropClick}>
            <div className={`${styles.modal} ${isOpen ? styles.modalOpen : ''}`}>
                {!isConfirmed ? (
                    <>
                        {/* Header */}
                        <div className={styles.header}>
                            <div>
                                <h2 className={styles.title}>{turf.name}</h2>
                                <p className={styles.subtitle}>{turf.location}, {turf.city}</p>
                            </div>
                            <button className={styles.closeButton} onClick={onClose} aria-label="Close">
                                ✕
                            </button>
                        </div>

                        {/* Turf Summary */}
                        <div className={styles.summary}>
                            <img src={turf.image} alt={turf.name} className={styles.summaryImage} />
                            <div className={styles.summaryDetails}>
                                <div className={styles.summaryItem}>
                                    <span className={styles.summaryLabel}>Type:</span>
                                    <span className={styles.summaryValue}>{turf.type}</span>
                                </div>
                                <div className={styles.summaryItem}>
                                    <span className={styles.summaryLabel}>Price:</span>
                                    <span className={styles.summaryValue}>₹{turf.pricePerHour}/hr</span>
                                </div>
                                <div className={styles.summaryItem}>
                                    <span className={styles.summaryLabel}>Rating:</span>
                                    <span className={styles.summaryValue}>
                                        {renderStars(turf.rating)} {turf.rating}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Date Selector */}
                        <div className={styles.section}>
                            <label htmlFor="booking-date" className={styles.label}>
                                Select Date
                            </label>
                            <input
                                id="booking-date"
                                type="date"
                                className={styles.dateInput}
                                value={selectedDate}
                                min={today}
                                onChange={(e) => setSelectedDate(e.target.value)}
                            />
                        </div>

                        {/* Time Slot Selector */}
                        <div className={styles.section}>
                            <label className={styles.label}>Select Time Slot (2 hours)</label>
                            <div className={styles.timeSlotGrid}>
                                {timeSlots.map((slot) => (
                                    <button
                                        key={slot.time}
                                        className={`${styles.timeSlot} ${slot.isBooked ? styles.timeSlotBooked : ''
                                            } ${selectedTimeSlot === slot.time ? styles.timeSlotSelected : ''}`}
                                        onClick={() => !slot.isBooked && setSelectedTimeSlot(slot.time)}
                                        disabled={slot.isBooked}
                                    >
                                        {slot.time}
                                        {slot.isBooked && <span className={styles.bookedLabel}>Booked</span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Booking Summary */}
                        {selectedTimeSlot && (
                            <div className={styles.bookingSummary}>
                                <h3 className={styles.summaryTitle}>Booking Summary</h3>
                                <div className={styles.summaryRow}>
                                    <span>Turf:</span>
                                    <span>{turf.name}</span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span>Date:</span>
                                    <span>{new Date(selectedDate).toLocaleDateString('en-IN', {
                                        weekday: 'short',
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })}</span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span>Time:</span>
                                    <span>{selectedTimeSlot}</span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span>Duration:</span>
                                    <span>{duration} hours</span>
                                </div>
                                <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                                    <span>Total Price:</span>
                                    <span className={styles.totalPrice}>₹{totalPrice}</span>
                                </div>
                            </div>
                        )}

                        {/* Payment Option */}
                        <div className={styles.paymentInfo}>
                            <div className={styles.paymentOption}>
                                <input type="radio" id="pay-on-arrival" checked readOnly />
                                <label htmlFor="pay-on-arrival">Pay on Arrival</label>
                            </div>
                            <p className={styles.paymentNote}>
                                You will pay ₹{totalPrice} at the turf on the day of booking.
                            </p>
                        </div>

                        {/* Confirm Button */}
                        <button
                            className={styles.confirmButton}
                            onClick={handleConfirmBooking}
                            disabled={!selectedTimeSlot}
                        >
                            Confirm Booking
                        </button>
                    </>
                ) : (
                    /* Confirmation Screen */
                    <div className={styles.confirmation}>
                        <div className={styles.successIcon}>
                            <svg viewBox="0 0 52 52" className={styles.checkmark}>
                                <circle cx="26" cy="26" r="25" fill="none" className={styles.checkmarkCircle} />
                                <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" className={styles.checkmarkCheck} />
                            </svg>
                        </div>

                        <h2 className={styles.confirmTitle}>Booking Confirmed!</h2>

                        <div className={styles.confirmDetails}>
                            <div className={styles.confirmRow}>
                                <span className={styles.confirmLabel}>Turf:</span>
                                <span className={styles.confirmValue}>{turf.name}</span>
                            </div>
                            <div className={styles.confirmRow}>
                                <span className={styles.confirmLabel}>Date:</span>
                                <span className={styles.confirmValue}>
                                    {new Date(selectedDate).toLocaleDateString('en-IN', {
                                        weekday: 'short',
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                            <div className={styles.confirmRow}>
                                <span className={styles.confirmLabel}>Time:</span>
                                <span className={styles.confirmValue}>{selectedTimeSlot}</span>
                            </div>
                            <div className={styles.confirmRow}>
                                <span className={styles.confirmLabel}>Total Price:</span>
                                <span className={styles.confirmValue}>₹{totalPrice}</span>
                            </div>
                            <div className={styles.confirmRow}>
                                <span className={styles.confirmLabel}>Booking ID:</span>
                                <span className={`${styles.confirmValue} ${styles.bookingIdValue}`}>{bookingId}</span>
                            </div>
                        </div>

                        <p className={styles.confirmNote}>
                            Pay ₹{totalPrice} on arrival at the turf.
                        </p>

                        <div className={styles.confirmActions}>
                            <button className={styles.doneButton} onClick={onClose}>
                                Done
                            </button>
                            <button className={styles.bookAnotherButton} onClick={handleBookAnother}>
                                Book Another
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
