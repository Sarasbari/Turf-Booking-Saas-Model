import React from 'react';
import './PromoBanner.css';

/**
 * PromoBanner - Right column of hero section
 * Shows promotional banner if discount active, otherwise shows quick stats
 */
const PromoBanner = ({
    isDiscountActive = false,
    discountPercent = 0,
    discountDescription = '',
    totalBookings = 0,
    bookingsLast30Days = 0,
    openTime = '',
    closeTime = '',
    city = '',
}) => {
    if (isDiscountActive) {
        return (
            <div className="promo-banner discount-banner">
                <div className="promo-content">
                    <div className="promo-label">SPECIAL OFFER</div>
                    <div className="promo-title">{discountDescription}</div>
                    <div className="promo-code-section">
                        <div className="promo-code-label">USE CODE</div>
                        <div className="promo-code">TURF{discountPercent}</div>
                    </div>
                    <div className="promo-discount">
                        GET {discountPercent}% DISCOUNT
                    </div>
                </div>
            </div>
        );
    }

    // Quick Stats Card
    return (
        <div className="promo-banner stats-card">
            <div className="stats-grid">
                <div className="stat-item">
                    <div className="stat-icon">📅</div>
                    <div className="stat-value">{totalBookings.toLocaleString()}</div>
                    <div className="stat-label">Total Bookings</div>
                </div>

                <div className="stat-item">
                    <div className="stat-icon">📊</div>
                    <div className="stat-value">{bookingsLast30Days}</div>
                    <div className="stat-label">This Month</div>
                </div>

                <div className="stat-item">
                    <div className="stat-icon">⏰</div>
                    <div className="stat-value">{openTime} - {closeTime}</div>
                    <div className="stat-label">Operating Hours</div>
                </div>

                <div className="stat-item">
                    <div className="stat-icon">📍</div>
                    <div className="stat-value">{city}</div>
                    <div className="stat-label">Location</div>
                </div>
            </div>
        </div>
    );
};

export default PromoBanner;
