import { useState, useEffect } from 'react';
import styles from './LocationModal.module.css';

interface LocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedCity: string;
    onCitySelect: (city: string) => void;
}

export function LocationModal({ isOpen, onClose, selectedCity, onCitySelect }: LocationModalProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const popularCities = [
        { name: 'Virar', icon: '🏙️' },
        { name: 'Nallasopara', icon: '🏙️' },
        { name: 'Vasai', icon: '🏙️' },
        { name: 'Naigaon', icon: '🏙️' },
        { name: 'Bhayander', icon: '🏙️' },
        { name: 'Mira Road', icon: '🏙️' },
        { name: 'Dahisar', icon: '🏙️' },
        { name: 'Borivali', icon: '🏙️' },
        { name: 'Kandivali', icon: '🏙️' },
        { name: 'Malad', icon: '🏙️' },
    ];

    const allCities = [
        ...popularCities,
        { name: 'Mumbai', icon: '🏙️' },
        { name: 'Delhi', icon: '🏙️' },
        { name: 'Bangalore', icon: '🏙️' },
        { name: 'Pune', icon: '🏙️' },
        { name: 'Hyderabad', icon: '🏙️' },
        { name: 'Chennai', icon: '🏙️' },
        { name: 'Kolkata', icon: '🏙️' },
        { name: 'Ahmedabad', icon: '🏙️' },
    ];

    const filteredCities = searchQuery
        ? allCities.filter(city =>
            city.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : popularCities;

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    const handleCityClick = (cityName: string) => {
        onCitySelect(cityName);
        setSearchQuery('');
        onClose();
    };

    const handleDetectLocation = () => {
        // Placeholder for geolocation functionality
        alert('Geolocation feature coming soon!');
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Search Bar */}
                <div className={styles.searchContainer}>
                    <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="11" cy="11" r="8" strokeWidth={2} />
                        <path d="m21 21-4.35-4.35" strokeWidth={2} strokeLinecap="round" />
                    </svg>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search for your city"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                </div>

                {/* Detect My Location */}
                <button className={styles.detectLocation} onClick={handleDetectLocation}>
                    <svg className={styles.locationIcon} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    <span>Detect my location</span>
                </button>

                {/* Popular Cities Label */}
                <h3 className={styles.sectionLabel}>
                    {searchQuery ? 'Search Results' : 'Popular Cities'}
                </h3>

                {/* Cities Grid */}
                <div className={styles.citiesGrid}>
                    {filteredCities.map((city) => (
                        <button
                            key={city.name}
                            className={`${styles.cityCard} ${selectedCity === city.name ? styles.cityCardActive : ''}`}
                            onClick={() => handleCityClick(city.name)}
                        >
                            <div className={styles.cityIcon}>{city.icon}</div>
                            <div className={styles.cityName}>{city.name}</div>
                        </button>
                    ))}
                </div>

                {/* View All Cities */}
                {!searchQuery && (
                    <button className={styles.viewAllButton} onClick={() => setSearchQuery('')}>
                        View All Cities
                    </button>
                )}
            </div>
        </div>
    );
}
