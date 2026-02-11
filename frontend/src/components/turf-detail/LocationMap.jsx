import React from 'react';
import './LocationMap.css';

/**
 * LocationMap - Address and embedded Google Maps
 */
const LocationMap = ({
    address = '',
    city = '',
    state = '',
    pincode = '',
    geoPoint = null,
    name = ''
}) => {
    const fullAddress = `${address}, ${city}, ${state} ${pincode}`;

    // Generate Google Maps URLs
    const getDirectionsUrl = () => {
        if (geoPoint && geoPoint.latitude && geoPoint.longitude) {
            return `https://www.google.com/maps/dir/?api=1&destination=${geoPoint.latitude},${geoPoint.longitude}`;
        }
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
    };

    const getEmbedUrl = () => {
        if (geoPoint && geoPoint.latitude && geoPoint.longitude) {
            return `https://maps.google.com/maps?q=${geoPoint.latitude},${geoPoint.longitude}&output=embed`;
        }
        return `https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`;
    };

    return (
        <section className="location-section">
            <div className="section-header">
                <h2>Location & Directions</h2>
            </div>

            {/* Address Card */}
            <div className="address-card">
                <div className="address-icon">📍</div>
                <div className="address-content">
                    <div className="address-name">{name}</div>
                    <div className="address-text">{fullAddress}</div>
                </div>
                <a
                    href={getDirectionsUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="directions-btn"
                >
                    Get Directions
                </a>
            </div>

            {/* Embedded Map */}
            <div className="map-container">
                <iframe
                    src={getEmbedUrl()}
                    width="100%"
                    height="300"
                    style={{ border: 0, borderRadius: '12px' }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Map of ${name}`}
                />
            </div>
        </section>
    );
};

export default LocationMap;
