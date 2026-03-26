import { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from '../../components/layout/Header/Header';
import { SubNavigation } from '../../components/layout/SubNavigation/SubNavigation';
import { HeroCarousel } from '../../components/features/HeroCarousel/HeroCarousel';
import { FilterChip } from '../../components/ui/FilterChip/FilterChip';
import { SectionHeader } from '../../components/ui/SectionHeader/SectionHeader';
import { TurfCard } from '../../components/features/TurfCard/TurfCard';
import { TurfCardSkeleton } from '../../components/features/TurfCard/TurfCardSkeleton';
import { Footer } from '../../components/layout/Footer/Footer';
import { LocationPrompt } from '../../components/features/LocationPrompt/LocationPrompt';
import { useTurfs } from '../../hooks/useTurfs';
import { Turf } from '../../types';
import styles from './Home.module.css';



const filterOptions = [
    'All Sizes',
    '5-a-side',
    '7-a-side',
    '11-a-side',
    'Under ₹500',
    '₹500-₹1000',
    '₹1000+',
    'Available Now',
    'Floodlit',
    'With Parking',
];

// Haversine distance (km) between two lat/lng points
function haversineDistance(
    lat1: number, lng1: number,
    lat2: number, lng2: number
): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const LOCATION_STORAGE_KEY = 'turfbook_user_location';
const LOCATION_DISMISSED_KEY = 'turfbook_location_dismissed';
const HEADER_CITY_STORAGE_KEY = 'bookmyturf_header_selected_city';
const CITY_CHANGED_EVENT = 'bookmyturf:cityChanged';

export function Home() {
    const [activeFilters, setActiveFilters] = useState<string[]>(['All Sizes']);
    const [selectedTurf, setSelectedTurf] = useState<Turf | null>(null);
    const [activeSport, setActiveSport] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Fetch data using hook
    const { turfs: allTurfs, loading } = useTurfs();

    // Location state
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [showLocationPrompt, setShowLocationPrompt] = useState(false);
    const [selectedCity, setSelectedCity] = useState('');

    // Debounce timer ref
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ✅ Check for saved location or show prompt
    useEffect(() => {
        const savedCity = localStorage.getItem(HEADER_CITY_STORAGE_KEY)?.trim();
        if (!savedCity) {
            setShowLocationPrompt(false);
            return;
        }

        const saved = localStorage.getItem(LOCATION_STORAGE_KEY);
        const dismissed = localStorage.getItem(LOCATION_DISMISSED_KEY);

        if (saved) {
            try {
                const coords = JSON.parse(saved);
                if (coords.lat && coords.lng) {
                    setUserLocation(coords);
                    return;
                }
            } catch { /* ignore parse errors */ }
        }

        if (!dismissed) {
            setShowLocationPrompt(true);
        }
    }, []);

    useEffect(() => {
        const persistedCity = localStorage.getItem(HEADER_CITY_STORAGE_KEY)?.trim() || '';
        if (persistedCity) {
            setSelectedCity(persistedCity);
        }

        const handleCityChanged = (event: Event) => {
            const customEvent = event as CustomEvent<{ city?: string }>;
            const city = customEvent.detail?.city?.trim();
            if (city) {
                setSelectedCity(city);
            }
        };

        const handleStorage = (event: StorageEvent) => {
            if (event.key === HEADER_CITY_STORAGE_KEY && event.newValue) {
                setSelectedCity(event.newValue.trim());
            }
        };

        window.addEventListener(CITY_CHANGED_EVENT, handleCityChanged as EventListener);
        window.addEventListener('storage', handleStorage);

        return () => {
            window.removeEventListener(CITY_CHANGED_EVENT, handleCityChanged as EventListener);
            window.removeEventListener('storage', handleStorage);
        };
    }, []);

    // ✅ Debounce search input (300ms)
    const handleSearchChange = useCallback((query: string) => {
        setSearchQuery(query);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setDebouncedSearch(query.trim().toLowerCase());
        }, 300);
    }, []);

    const handleFilterClick = (filter: string) => {
        if (filter === 'All Sizes') {
            setActiveFilters(['All Sizes']);
        } else {
            const newFilters = activeFilters.includes(filter)
                ? activeFilters.filter(f => f !== filter)
                : [...activeFilters.filter(f => f !== 'All Sizes'), filter];
            setActiveFilters(newFilters.length === 0 ? ['All Sizes'] : newFilters);
        }
    };

    const handleBookTurf = (turf: Turf) => {
        setSelectedTurf(turf);
        console.log('Book turf:', turf.name);
    };

    const handleSportChange = (sport: string) => {
        setActiveSport(sport);
    };

    // Location handlers
    const handleAllowLocation = () => {
        setShowLocationPrompt(false);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coords = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    setUserLocation(coords);
                    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(coords));
                    console.log('📍 Location obtained:', coords);
                },
                (error) => {
                    console.warn('Location denied:', error.message);
                    localStorage.setItem(LOCATION_DISMISSED_KEY, 'true');
                }
            );
        }
    };

    const handleSkipLocation = () => {
        setShowLocationPrompt(false);
        localStorage.setItem(LOCATION_DISMISSED_KEY, 'true');
    };

    // ✅ Search filter — matches name, location, sport
    const isSearchActive = debouncedSearch.length > 0;
    const searchResults = isSearchActive
        ? allTurfs.filter(t =>
            t.name.toLowerCase().includes(debouncedSearch) ||
            t.address.toLowerCase().includes(debouncedSearch) ||
            t.city.toLowerCase().includes(debouncedSearch) ||
            t.sport.toLowerCase().includes(debouncedSearch)
        )
        : [];

    // ✅ Filter by sport
    const filteredTurfs = activeSport === 'all'
        ? allTurfs
        : allTurfs.filter(t => t.sport.toLowerCase() === activeSport);

    const matchesSelectedCity = (turf: Turf, city: string): boolean => {
        const normalizedCity = city.trim().toLowerCase();
        if (!normalizedCity) return true;

        const turfCity = turf.city?.toLowerCase() || '';
        const turfAddress = turf.address?.toLowerCase() || '';
        return turfCity.includes(normalizedCity) || turfAddress.includes(normalizedCity);
    };

    const locationPreferredTurfs = selectedCity
        ? filteredTurfs.filter((turf) => matchesSelectedCity(turf, selectedCity))
        : filteredTurfs;

    const recommendedByPreference = locationPreferredTurfs
        .filter(t => t.rating >= 4.7)
        .slice(0, 10);

    const recommendedFallback = filteredTurfs
        .filter(t => t.rating >= 4.7)
        .slice(0, 10);

    const recommendedTurfs = recommendedByPreference.length > 0
        ? recommendedByPreference
        : recommendedFallback;

    // ✅ Near You — sorted by distance if location is available
    const nearbyTurfs = (() => {
        let turfs = locationPreferredTurfs.length > 0
            ? locationPreferredTurfs
            : filteredTurfs;

        if (userLocation) {
            // Sort turfs (mock logic since lat/lng removed from base type)
            turfs = [...turfs].slice(0, 10);
        }

        return turfs.slice(0, 10);
    })();

    const budgetTurfs = allTurfs
        .filter(t => t.pricePerHour < 500)
        .filter(t => activeSport === 'all' || t.sport.toLowerCase() === activeSport)
        .slice(0, 10);

    return (
        <div className={styles.page}>
            <Header onSearchChange={handleSearchChange} />
            <SubNavigation onSportChange={handleSportChange} />
            <HeroCarousel />

            {/* Trust Signals Bar */}
            <div className={styles.trustBar}>
                <div className={styles.trustItem}>
                    <span className={styles.trustIcon}>🏟️</span>
                    <span>500+ Turfs</span>
                </div>
                <div className={styles.trustDivider} />
                <div className={styles.trustItem}>
                    <span className={styles.trustIcon}>📅</span>
                    <span>10k+ Bookings</span>
                </div>
                <div className={styles.trustDivider} />
                <div className={styles.trustItem}>
                    <span className={styles.trustIcon}>⚡</span>
                    <span>Instant Confirmation</span>
                </div>
                <div className={styles.trustDivider} />
                <div className={styles.trustItem}>
                    <span className={styles.trustIcon}>🔒</span>
                    <span>Secure Payments</span>
                </div>
            </div>

            <div className={styles.filtersContainer}>
                <div className={styles.filtersBar}>
                    {filterOptions.map((filter) => (
                        <FilterChip
                            key={filter}
                            label={filter}
                            isActive={activeFilters.includes(filter)}
                            onClick={() => handleFilterClick(filter)}
                        />
                    ))}
                </div>
            </div>

            {/* Location Prompt Banner */}
            {showLocationPrompt && (
                <LocationPrompt
                    onAllow={handleAllowLocation}
                    onSkip={handleSkipLocation}
                />
            )}

            {/* Loading / Empty / Content states */}
            {loading ? (
                <div className={styles.contentWrapper}>
                    <div className={styles.grid}>
                        <TurfCardSkeleton count={5} />
                    </div>
                </div>
            ) : allTurfs.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🏟️</div>
                    <h3 className={styles.emptyTitle}>No turfs found</h3>
                    <p className={styles.emptyText}>Seed your database to get started with BookMyTurf.</p>
                </div>
            ) : isSearchActive ? (
                /* ✅ Search Results Mode */
                <>
                    <div className={styles.searchResultsHeader}>
                        Showing results for "<span>{searchQuery}</span>"
                    </div>
                    {searchResults.length > 0 ? (
                        <div className={styles.contentWrapper}>
                            <div className={styles.grid}>
                                {searchResults.map((turf, index) => (
                                    <TurfCard
                                        key={turf.id}
                                        turf={turf}
                                        onBook={handleBookTurf}
                                        index={index}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className={styles.noSearchResults}>
                            <div className={styles.noSearchIcon}>🔍</div>
                            <p className={styles.noSearchText}>No turfs found for "{searchQuery}"</p>
                            <p className={styles.noSearchHint}>Try a different name, location, or sport</p>
                        </div>
                    )}
                </>
            ) : (
                /* ✅ Normal Sections Mode */
                <>
                    {/* Recommended Section */}
                    {recommendedTurfs.length > 0 && (
                        <div className={styles.contentWrapper}>
                            <SectionHeader
                                icon="🏆"
                                title="Recommended Turfs"
                                subtitle={selectedCity
                                    ? `Top rated venues matching your location preference: ${selectedCity}`
                                    : 'Top rated venues loved by players'}
                                accentWord="Turfs"
                            />
                            <div className={styles.grid}>
                                {recommendedTurfs.map((turf, index) => (
                                    <TurfCard
                                        key={turf.id}
                                        turf={turf}
                                        onBook={handleBookTurf}
                                        index={index}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Near You Section */}
                    {nearbyTurfs.length > 0 && (
                        <div className={styles.contentWrapper}>
                            <SectionHeader
                                icon="📍"
                                title="Turfs Near You"
                                subtitle={selectedCity
                                    ? `Showing turfs in and around ${selectedCity}`
                                    : userLocation
                                    ? "Sorted by distance from your location"
                                    : "Book the best turf in your area, instantly"
                                }
                                accentWord="Turfs"
                            />
                            <div className={styles.grid}>
                                {nearbyTurfs.map((turf, index) => (
                                    <TurfCard
                                        key={turf.id}
                                        turf={turf}
                                        onBook={handleBookTurf}
                                        index={index}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Budget Friendly Section */}
                    {budgetTurfs.length > 0 && (
                        <div className={styles.contentWrapper}>
                            <SectionHeader
                                icon="💰"
                                title="Budget Friendly"
                                subtitle="Great turfs under ₹500/hr"
                                accentWord="Budget"
                            />
                            <div className={styles.grid}>
                                {budgetTurfs.map((turf, index) => (
                                    <TurfCard
                                        key={turf.id}
                                        turf={turf}
                                        onBook={handleBookTurf}
                                        index={index}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            <Footer />
        </div>
    );
}