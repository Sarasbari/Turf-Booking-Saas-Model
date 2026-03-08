import React from 'react';
import './HeroSection.css';

/**
 * HeroSection - Dark background container for turf detail hero
 * BookMyShow-style layout with three columns
 */
const HeroSection = ({ children }) => {
    return (
        <section className="hero-section">
            <div className="hero-container">
                {children}
            </div>
        </section>
    );
};

export default HeroSection;
