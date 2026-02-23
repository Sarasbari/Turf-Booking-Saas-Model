import { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from '../../components/Header/Header';
import { SubNavigation } from '../../components/SubNavigation/SubNavigation';
import { HeroCarousel } from '../../components/HeroCarousel/HeroCarousel';
import { FilterChip } from '../../components/FilterChip/FilterChip';
import { SectionHeader } from '../../components/SectionHeader/SectionHeader';
import { TurfCard } from '../../components/TurfCard/TurfCard';
import { Footer } from '../../components/Footer/Footer';
import { LocationPrompt } from '../../components/LocationPrompt/LocationPrompt';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import styles from './Home.module.css';

// ✅ Unified Turf type that works with both Firebase data and TurfCard component
interface FirebaseTurf {
    id: string;
    name: string;
    location: string;
    city: string;
    images: string[];
    pricePerHour: number;
    rating: number;
    size: string;
    amenities: string[];
    isPromoted: boolean;
    availableToday: boolean;
    sport: string;
    lat?: number;
    lng?: number;
}

// ✅ FIXED: Normalize YOUR actual Firebase fields → TurfCard shape
const normalizeForCard = (id: string, data: any): FirebaseTurf => ({
    id,
    name: data.name || 'Unnamed Turf',
    location: data.location?.address
        ? `${data.location.address}, ${data.location.city || ''}`
        : (data.address
            ? `${data.address}, ${data.city || ''}`
            : (typeof data.location === 'string' ? data.location : '')),
    city: data.location?.city || data.city || '',
    images: data.images && data.images.length > 0
        ? data.images
        : (data.coverImage ? [data.coverImage] : ['https://via.placeholder.com/800x1200?text=No+Image']),
    pricePerHour: data.pricing?.basePrice || data.pricePerHour || 0,
    rating: data.rating || 0,
    size: data.turfSize || data.groundSize || data.size || '5-a-side',
    amenities: data.amenities || [],
    isPromoted: data.isFeatured || data.isPromoted || false,
    availableToday: true,  // ✅ No 'status' field in your data, so default to true
    sport: data.sport || data.sports?.[0] || 'Football',
    // Extract geoPoint for distance calculations
    lat: data.geoPoint?.latitude ?? data.geoPoint?._lat ?? data.latitude ?? undefined,
    lng: data.geoPoint?.longitude ?? data.geoPoint?._long ?? data.longitude ?? undefined,
});

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

export function Home() {
    const [activeFilters, setActiveFilters] = useState<string[]>(['All Sizes']);
    const [selectedTurf, setSelectedTurf] = useState<FirebaseTurf | null>(null);
    const [activeSport, setActiveSport] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Firebase state
    const [allTurfs, setAllTurfs] = useState<FirebaseTurf[]>([]);
    const [loading, setLoading] = useState(true);

    // Location state
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [showLocationPrompt, setShowLocationPrompt] = useState(false);

    // Debounce timer ref
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ✅ Fetch turfs from Firebase on mount
    useEffect(() => {
        const fetchTurfs = async () => {
            try {
                setLoading(true);
                const turfsRef = collection(db, 'turf');
                const snapshot = await getDocs(turfsRef);
                console.log(`✅ Fetched ${snapshot.size} turfs from Firebase`);

                const turfs: FirebaseTurf[] = [];
                snapshot.forEach((doc) => {
                    turfs.push(normalizeForCard(doc.id, doc.data()));
                });

                setAllTurfs(turfs);
            } catch (error) {
                console.error('Error fetching turfs:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTurfs();
    }, []);

    // ✅ Check for saved location or show prompt
    useEffect(() => {
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

    const handleBookTurf = (turf: any) => {
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
            t.location.toLowerCase().includes(debouncedSearch) ||
            t.city.toLowerCase().includes(debouncedSearch) ||
            t.sport.toLowerCase().includes(debouncedSearch)
        )
        : [];

    // ✅ Filter by sport
    const filteredTurfs = activeSport === 'all'
        ? allTurfs
        : allTurfs.filter(t => t.sport.toLowerCase() === activeSport);

    const recommendedTurfs = allTurfs
        .filter(t => t.isPromoted || t.rating >= 4.7)
        .filter(t => activeSport === 'all' || t.sport.toLowerCase() === activeSport)
        .slice(0, 10);

    // ✅ Near You — sorted by distance if location is available
    const nearbyTurfs = (() => {
        let turfs = allTurfs.filter(t => activeSport === 'all' || t.sport.toLowerCase() === activeSport);

        if (userLocation) {
            // Sort by distance, turfs with coordinates first
            turfs = [...turfs].sort((a, b) => {
                const distA = (a.lat && a.lng)
                    ? haversineDistance(userLocation.lat, userLocation.lng, a.lat, a.lng)
                    : Infinity;
                const distB = (b.lat && b.lng)
                    ? haversineDistance(userLocation.lat, userLocation.lng, b.lat, b.lng)
                    : Infinity;
                return distA - distB;
            });
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

            {/* ✅ Show loading state */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚽</div>
                    <div style={{ fontSize: '18px' }}>Loading turfs from database...</div>
                </div>
            ) : allTurfs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏟️</div>
                    <div style={{ fontSize: '18px' }}>No turfs found. Seed your database first.</div>
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
                                        turf={turf as any}
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
                                subtitle="Top rated venues loved by players"
                                accentWord="Turfs"
                            />
                            <div className={styles.grid}>
                                {recommendedTurfs.map((turf, index) => (
                                    <TurfCard
                                        key={turf.id}
                                        turf={turf as any}
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
                                subtitle={userLocation
                                    ? "Sorted by distance from your location"
                                    : "Book the best turf in your area, instantly"
                                }
                                accentWord="Turfs"
                            />
                            <div className={styles.grid}>
                                {nearbyTurfs.map((turf, index) => (
                                    <TurfCard
                                        key={turf.id}
                                        turf={turf as any}
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
                                        turf={turf as any}
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