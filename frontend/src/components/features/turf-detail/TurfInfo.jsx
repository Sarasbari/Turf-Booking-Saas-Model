import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TurfInfo.css';

/**
 * TurfInfo - Center column of hero section
 * Displays turf name, tags, pills, rating, and CTA buttons
 */
const TurfInfo = ({
    name,
    sports = [],
    groundSize,
    totalGrounds,
    status,
    rating,
    totalReviews,
    totalBookings,
    isUnderMaintenance = false,
    maintenanceNote = '',
    onBookNowClick,
}) => {
    const navigate = useNavigate();

    const getStatusConfig = () => {
        if (isUnderMaintenance) {
            return { color: '#f39c12', text: 'Under Maintenance' };
        }
        switch (status) {
            case 'active':
                return { color: '#27ae60', text: 'Open Now' };
            case 'closed':
                return { color: '#e74c3c', text: 'Closed' };
            default:
                return { color: '#999999', text: 'Unavailable' };
        }
    };

    const statusConfig = getStatusConfig();
    const isBookingDisabled = isUnderMaintenance || status !== 'active';

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: name,
                text: `Check out ${name} on aLiveHub!`,
                url: window.location.href,
            }).catch(() => { });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    return (
        <div className="turf-info">
            {/* Turf Name */}
            <h1 className="turf-name">{name}</h1>

            {/* Important Information Box */}
            {(isUnderMaintenance && maintenanceNote) && (
                <div className="important-info-box">
                    <div className="info-icon">💡</div>
                    <div className="info-content">
                        <div className="info-title">Important Information</div>
                        <div className="info-subtitle">{maintenanceNote}</div>
                    </div>
                    <div className="info-arrow">›</div>
                </div>
            )}

            {/* Sport Tags */}
            <div className="sport-tags">
                {sports.join(', ')}
            </div>

            {/* Pills Row */}
            <div className="pills-row">
                {groundSize && (
                    <span className="pill">{groundSize}</span>
                )}
                {totalGrounds && (
                    <span className="pill">{totalGrounds} {totalGrounds === 1 ? 'Ground' : 'Grounds'}</span>
                )}
                <span className="pill status-pill" style={{ background: statusConfig.color }}>
                    {statusConfig.text}
                </span>
            </div>

            {/* Rating Row */}
            <div className="rating-row">
                <span className="star-icon">⭐</span>
                <span className="rating-number">{rating?.toFixed(1) || 'N/A'}</span>
                <span className="rating-reviews">({totalReviews || 0} ratings)</span>
                <span className="rating-separator">•</span>
                <span className="total-bookings">{totalBookings || 0} bookings</span>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
                <button
                    className="book-now-btn"
                    onClick={onBookNowClick}
                    disabled={isBookingDisabled}
                >
                    {isUnderMaintenance
                        ? 'Not Available'
                        : status === 'closed'
                            ? 'Currently Closed'
                            : 'Book Now'}
                </button>

                <button className="share-btn" onClick={handleShare}>
                    <span className="share-icon">↗</span>
                    Share
                </button>
            </div>
        </div>
    );
};

export default TurfInfo;
