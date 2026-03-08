import React from 'react';
import './SportsDetails.css';

/**
 * SportsDetails - Sports available and ground specifications
 */
const SportsDetails = ({
    sports = [],
    groundSize = '',
    totalGrounds = 1,
    surfaceType = ''
}) => {
    const getSportColor = (sport) => {
        const colors = {
            'Football': '#27ae60',
            'Cricket': '#3498db',
            'Basketball': '#e67e22',
            'Badminton': '#9b59b6',
            'Tennis': '#f39c12',
            'Volleyball': '#e74c3c',
        };
        return colors[sport] || '#95a5a6';
    };

    return (
        <section className="sports-details-section">
            <div className="section-header">
                <h2>Sports & Ground Details</h2>
            </div>

            <div className="sports-details-grid">
                {/* Left: Sports Available */}
                <div className="sports-column">
                    <h3 className="column-title">Sports Available</h3>
                    <div className="sports-tags">
                        {sports.map((sport, index) => (
                            <span
                                key={index}
                                className="sport-tag"
                                style={{ backgroundColor: getSportColor(sport) }}
                            >
                                {sport}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Right: Ground Specifications */}
                <div className="ground-specs-column">
                    <h3 className="column-title">Ground Specifications</h3>
                    <div className="specs-list">
                        {groundSize && (
                            <div className="spec-item">
                                <span className="spec-label">Ground Size:</span>
                                <span className="spec-value">{groundSize}</span>
                            </div>
                        )}
                        <div className="spec-item">
                            <span className="spec-label">Total Grounds:</span>
                            <span className="spec-value">{totalGrounds} {totalGrounds === 1 ? 'ground' : 'grounds'} available</span>
                        </div>
                        {surfaceType && (
                            <div className="spec-item">
                                <span className="spec-label">Surface Type:</span>
                                <span className="spec-value">{surfaceType}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SportsDetails;
