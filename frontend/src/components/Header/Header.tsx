import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { isLoggedIn, getUserData, UserData } from '../../utils/auth';
import { NavigationDrawer } from '../NavigationDrawer/NavigationDrawer';
import styles from './Header.module.css';

interface HeaderProps {
    onSearchChange?: (query: string) => void;
}

export function Header({ onSearchChange }: HeaderProps) {
    const navigate = useNavigate();
    const [user, setUser] = useState<UserData | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const [selectedCity, setSelectedCity] = useState('Mumbai');
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const locationRef = useRef<HTMLDivElement>(null);

    const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai'];

    useEffect(() => {
        if (isLoggedIn()) {
            const userData = getUserData();
            setUser(userData);
        }
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
                setShowLocationDropdown(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        onSearchChange?.(query);
    };

    const handleCitySelect = (city: string) => {
        setSelectedCity(city);
        setShowLocationDropdown(false);
    };



    return (
        <header className={styles.header}>
            <div className={styles.container}>
                {/* Logo */}
                <div className={styles.logo} onClick={() => navigate('/')}>
                    TurfBook
                </div>

                {/* Search Bar (Desktop) */}
                <div className={styles.searchContainer}>
                    <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="11" cy="11" r="8" strokeWidth={2} />
                        <path d="m21 21-4.35-4.35" strokeWidth={2} strokeLinecap="round" />
                    </svg>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search for turfs, locations, or sports"
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                </div>

                {/* Right Section */}
                <div className={styles.rightSection}>
                    {/* Location Selector */}
                    <div className={styles.locationSelector} ref={locationRef}>
                        <button
                            className={styles.locationButton}
                            onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                        >
                            {selectedCity}
                            <svg className={styles.dropdownIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showLocationDropdown && (
                            <div className={styles.locationDropdown}>
                                {cities.map((city) => (
                                    <button
                                        key={city}
                                        className={`${styles.cityOption} ${city === selectedCity ? styles.cityOptionActive : ''}`}
                                        onClick={() => handleCitySelect(city)}
                                    >
                                        {city}
                                        {city === selectedCity && (
                                            <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <polyline points="20 6 9 17 4 12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sign In / Profile */}
                    {!user ? (
                        <button className={styles.signInButton} onClick={() => setIsDrawerOpen(true)}>
                            Sign In
                        </button>
                    ) : (
                        <button
                            className={styles.avatarButton}
                            onClick={() => setIsDrawerOpen(true)}
                            aria-label="User menu"
                        >
                            <img src={user.picture} alt={user.name} className={styles.avatar} />
                        </button>
                    )}

                    {/* Mobile Menu Button */}
                    <button
                        className={styles.mobileMenuButton}
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        aria-label="Toggle menu"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <line x1="3" y1="12" x2="21" y2="12" strokeWidth={2} strokeLinecap="round" />
                            <line x1="3" y1="6" x2="21" y2="6" strokeWidth={2} strokeLinecap="round" />
                            <line x1="3" y1="18" x2="21" y2="18" strokeWidth={2} strokeLinecap="round" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {showMobileMenu && (
                <div className={styles.mobileMenuOverlay} onClick={() => setShowMobileMenu(false)}>
                    <div className={styles.mobileMenu} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.mobileMenuHeader}>
                            <h3>Menu</h3>
                            <button onClick={() => setShowMobileMenu(false)}>✕</button>
                        </div>
                        <div className={styles.mobileMenuContent}>
                            <input
                                type="text"
                                className={styles.mobileSearchInput}
                                placeholder="Search turfs..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                            />
                            <div className={styles.mobileMenuLinks}>
                                <a href="/" onClick={() => setShowMobileMenu(false)}>Home</a>
                                <a href="/listings" onClick={() => setShowMobileMenu(false)}>Browse Turfs</a>
                                {user ? (
                                    <>
                                        <a href="/profile" onClick={() => setShowMobileMenu(false)}>My Profile</a>
                                        <button onClick={() => { setShowMobileMenu(false); setIsDrawerOpen(true); }}>Menu</button>
                                    </>
                                ) : (
                                    <a href="/signin" onClick={() => setShowMobileMenu(false)}>Sign In</a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Drawer */}
            <NavigationDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                user={user}
            />
        </header>
    );
}
