import React from 'react';
import './AmenitiesGrid.css';

/**
 * AmenitiesGrid - Display amenities in a grid layout
 */
const AmenitiesGrid = ({ amenities = [] }) => {
    const amenityIcons = {
        'Parking': '🚗',
        'Changing Room': '👕',
        'Washrooms': '🚿',
        'Drinking Water': '💧',
        'First Aid': '🏥',
        'First Aid Kit': '🏥',
        'Floodlights': '💡',
        'Seating Area': '🪑',
        'Seating': '🪑',
        'Equipment Rental': '⚽',
        'AC': '❄️',
        'Cafeteria': '☕',
        'Water': '💧',
        'Scoreboard': '📊',
    };

    const getIcon = (amenity) => {
        return amenityIcons[amenity] || '✓';
    };

    if (!amenities || amenities.length === 0) {
        return null;
    }

    return (
        <section className="amenities-section">
            <div className="section-header">
                <h2>Amenities & Features</h2>
            </div>

            <div className="amenities-grid">
                {amenities.map((amenity, index) => (
                    <div key={index} className="amenity-card">
                        <div className="amenity-icon">{getIcon(amenity)}</div>
                        <div className="amenity-name">{amenity}</div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default AmenitiesGrid;
