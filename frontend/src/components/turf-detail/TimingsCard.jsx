import React, { useEffect, useState } from 'react';
import { getTurfStatus } from '../../utils/dateUtils';
import './TimingsCard.css';

/**
 * TimingsCard - Operating hours with live status
 */
const TimingsCard = ({
    openTime = '',
    closeTime = '',
    weeklyOff = null
}) => {
    const [status, setStatus] = useState({ type: 'closed', message: '', detail: '' });

    useEffect(() => {
        // Update status immediately
        const updateStatus = () => {
            const currentStatus = getTurfStatus(openTime, closeTime, weeklyOff);
            setStatus(currentStatus);
        };

        updateStatus();

        // Update every minute
        const interval = setInterval(updateStatus, 60000);

        return () => clearInterval(interval);
    }, [openTime, closeTime, weeklyOff]);

    return (
        <section className="timings-section">
            <div className="section-header">
                <h2>Timings & Availability</h2>
            </div>

            <div className="timings-card">
                {/* Operating Hours */}
                <div className="timing-row">
                    <div className="timing-icon">🕐</div>
                    <div className="timing-content">
                        <div className="timing-label">Operating Hours</div>
                        <div className="timing-value">{openTime} - {closeTime}</div>
                    </div>
                    <div className={`status-badge ${status.type}`}>
                        {status.message}
                    </div>
                </div>

                {/* Weekly Off */}
                <div className="timing-row">
                    <div className="timing-icon">📅</div>
                    <div className="timing-content">
                        <div className="timing-label">Weekly Schedule</div>
                        <div className="timing-value">
                            {weeklyOff ? `Closed on ${weeklyOff}s` : 'Open all 7 days'}
                        </div>
                    </div>
                </div>

                {/* Today's Status */}
                {status.detail && (
                    <div className="status-detail">
                        <div className="status-icon">ℹ️</div>
                        <div className="status-text">{status.detail}</div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default TimingsCard;
