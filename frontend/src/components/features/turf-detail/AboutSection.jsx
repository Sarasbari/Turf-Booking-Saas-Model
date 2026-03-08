import React, { useState } from 'react';
import './AboutSection.css';

/**
 * AboutSection - Turf description with read more toggle
 */
const AboutSection = ({ about = '' }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const shouldShowReadMore = about.length > 300;
    const displayText = isExpanded || !shouldShowReadMore
        ? about
        : about.substring(0, 300) + '...';

    return (
        <section className="about-section">
            <div className="section-header">
                <h2>About This Turf</h2>
            </div>
            <div className="about-content">
                <p className="about-text">{displayText}</p>
                {shouldShowReadMore && (
                    <button
                        className="read-more-btn"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? 'Read Less' : 'Read More'}
                    </button>
                )}
            </div>
        </section>
    );
};

export default AboutSection;
