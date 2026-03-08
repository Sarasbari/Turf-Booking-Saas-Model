import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { generateSlots, getSlotStatus, calculatePrice } from '../../utils/slotUtils';
import { getTodayDate, getDateAfterDays, formatDateForFirebase } from '../../utils/dateUtils';
import './BookingCard.css';

/**
 * BookingCard - Sticky booking widget with date picker, time slots, and booking summary
 */
const BookingCard = ({
    turfId,
    turfName,
    pricePerHour,
    openTime,
    closeTime,
    isDiscountActive = false,
    discountPercent = 0,
    isUnderMaintenance = false,
    status,
    onBookClick,
}) => {
    const [selectedDate, setSelectedDate] = useState(getTodayDate());
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [bookedSlots, setBookedSlots] = useState([]);
    const [blockedSlots, setBlockedSlots] = useState([]);
    const [loading, setLoading] = useState(false);

    // Generate available slots
    const allSlots = generateSlots(openTime, closeTime, 2);

    // Fetch bookings and blocked slots for selected date
    useEffect(() => {
        if (!turfId || !selectedDate) return;

        setLoading(true);

        // Fetch bookings
        const bookingsRef = collection(db, 'bookings');
        const bookingsQuery = query(
            bookingsRef,
            where('turfId', '==', turfId),
            where('date', '==', selectedDate),
            where('status', '==', 'confirmed')
        );

        const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
            const booked = snapshot.docs.map((doc) => ({
                startTime: doc.data().startTime,
                endTime: doc.data().endTime,
            }));
            setBookedSlots(booked);
            setLoading(false);
        });

        // Fetch blocked slots
        const blockedRef = collection(db, 'blockedSlots');
        const blockedQuery = query(
            blockedRef,
            where('turfId', '==', turfId),
            where('date', '==', selectedDate)
        );

        const unsubscribeBlocked = onSnapshot(blockedQuery, (snapshot) => {
            const blocked = snapshot.docs.map((doc) => ({
                startTime: doc.data().startTime,
                endTime: doc.data().endTime,
            }));
            setBlockedSlots(blocked);
        });

        return () => {
            unsubscribeBookings();
            unsubscribeBlocked();
        };
    }, [turfId, selectedDate]);

    // Calculate price
    const pricing = selectedSlot
        ? calculatePrice(selectedSlot, pricePerHour, isDiscountActive ? discountPercent : 0)
        : null;

    const handleSlotClick = (slot) => {
        const slotStatus = getSlotStatus(slot, bookedSlots, blockedSlots);
        if (slotStatus === 'available') {
            setSelectedSlot(slot);
        }
    };

    const handleBookNow = () => {
        if (!selectedSlot || !selectedDate) return;

        const bookingData = {
            turfId,
            turfName,
            date: selectedDate,
            slot: selectedSlot,
            pricing,
        };

        onBookClick(bookingData);
    };

    const isBookingDisabled = !selectedDate || !selectedSlot || isUnderMaintenance || status !== 'active';

    return (
        <div className="booking-card">
            {/* Price Display */}
            <div className="price-section">
                <div className="price-main">
                    {isDiscountActive && (
                        <div className="price-original">₹{pricePerHour}</div>
                    )}
                    <div className="price-current">
                        ₹{isDiscountActive ? Math.round(pricePerHour * (1 - discountPercent / 100)) : pricePerHour}
                    </div>
                    <div className="price-unit">/hour</div>
                </div>
                {isDiscountActive && (
                    <div className="discount-pill">{discountPercent}% OFF</div>
                )}
            </div>

            {/* Date Picker */}
            <div className="date-picker-section">
                <label className="input-label">Select Date</label>
                <input
                    type="date"
                    className="date-input"
                    value={selectedDate}
                    onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedSlot(null); // Reset slot when date changes
                    }}
                    min={getTodayDate()}
                    max={getDateAfterDays(30)}
                />
            </div>

            {/* Time Slots */}
            <div className="slots-section">
                <div className="slots-header">
                    <span className="slots-label">Available Slots</span>
                    <span className="slots-duration">(2 hr sessions)</span>
                </div>

                {loading ? (
                    <div className="slots-loading">Loading slots...</div>
                ) : (
                    <div className="slots-grid">
                        {allSlots.map((slot, index) => {
                            const slotStatus = getSlotStatus(slot, bookedSlots, blockedSlots);
                            const isSelected = selectedSlot?.startTime === slot.startTime;

                            return (
                                <button
                                    key={index}
                                    className={`slot-btn ${slotStatus} ${isSelected ? 'selected' : ''}`}
                                    onClick={() => handleSlotClick(slot)}
                                    disabled={slotStatus !== 'available'}
                                >
                                    {slot.label}
                                    {slotStatus === 'booked' && <span className="slot-status-icon">✓</span>}
                                    {slotStatus === 'blocked' && <span className="slot-status-icon">🚫</span>}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Booking Summary */}
            {selectedSlot && pricing && (
                <div className="booking-summary">
                    <div className="summary-row">
                        <span>Date:</span>
                        <span>{new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="summary-row">
                        <span>Time:</span>
                        <span>{selectedSlot.label}</span>
                    </div>
                    <div className="summary-row">
                        <span>Duration:</span>
                        <span>{selectedSlot.duration} hours</span>
                    </div>
                    <div className="summary-row">
                        <span>Price:</span>
                        <span>₹{pricing.baseAmount}</span>
                    </div>
                    {pricing.discountAmount > 0 && (
                        <div className="summary-row discount">
                            <span>Discount:</span>
                            <span>-₹{pricing.discountAmount}</span>
                        </div>
                    )}
                    <div className="summary-row total">
                        <span>Total:</span>
                        <span>₹{pricing.finalAmount}</span>
                    </div>
                </div>
            )}

            {/* Book Now Button */}
            <button
                className="book-now-btn"
                onClick={handleBookNow}
                disabled={isBookingDisabled}
            >
                {!selectedDate
                    ? 'Select a date first'
                    : !selectedSlot
                        ? 'Select a time slot'
                        : isUnderMaintenance
                            ? 'Not Available'
                            : 'Proceed to Book'}
            </button>

            {/* Bottom Note */}
            <div className="booking-note">
                💰 Pay on arrival · Free cancellation 24hrs before
            </div>
        </div>
    );
};

export default BookingCard;
