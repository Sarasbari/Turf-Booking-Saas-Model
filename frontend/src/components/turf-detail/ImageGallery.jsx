import React, { useState } from 'react';
import './ImageGallery.css';

/**
 * ImageGallery - Portrait-style image display with thumbnails
 * Shows discount badge and maintenance overlay when applicable
 */
const ImageGallery = ({
    images = [],
    coverImage,
    isDiscountActive = false,
    discountPercent = 0,
    discountDescription = '',
    isUnderMaintenance = false,
    maintenanceNote = '',
    turfName = ''
}) => {
    const [activeImage, setActiveImage] = useState(coverImage || images[0] || '');

    // Use first 4 images for thumbnails
    const thumbnails = images.slice(0, 4);

    return (
        <div className="image-gallery">
            {/* Main Image */}
            <div className="main-image-container">
                <img
                    src={activeImage}
                    alt={turfName}
                    className="main-image"
                />

                {/* Discount Badge Overlay */}
                {isDiscountActive && !isUnderMaintenance && (
                    <div className="discount-badge">
                        <div className="discount-percent">{discountPercent}% OFF</div>
                        <div className="discount-desc">{discountDescription}</div>
                    </div>
                )}

                {/* Maintenance Overlay */}
                {isUnderMaintenance && (
                    <div className="maintenance-overlay">
                        <div className="maintenance-content">
                            <div className="maintenance-icon">🚧</div>
                            <div className="maintenance-title">Under Maintenance</div>
                            {maintenanceNote && (
                                <div className="maintenance-note">{maintenanceNote}</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Thumbnail Row */}
            {thumbnails.length > 1 && (
                <div className="thumbnail-row">
                    {thumbnails.map((image, index) => (
                        <div
                            key={index}
                            className={`thumbnail ${activeImage === image ? 'active' : ''}`}
                            onClick={() => setActiveImage(image)}
                        >
                            <img src={image} alt={`${turfName} ${index + 1}`} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ImageGallery;
