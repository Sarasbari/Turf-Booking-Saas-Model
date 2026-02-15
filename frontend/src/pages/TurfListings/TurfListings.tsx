import { useState, useEffect, useMemo } from 'react';
import { FilterState, SortOption } from '../../types/turf';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { TurfCard } from '../../components/TurfCard/TurfCard';
import { BookingModal } from '../../components/BookingModal/BookingModal';
import { Header } from '../../components/Header/Header';
import { SignInRequiredModal } from '../../components/SignInRequiredModal/SignInRequiredModal';
import { isLoggedIn } from '../../utils/auth';
import styles from './TurfListings.module.css';

// ✅ Normalize Firebase document → TurfCard shape (same as Home.tsx)
const normalizeForCard = (id: string, data: any) => ({
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
    availableToday: true,
    sport: data.sport || data.sports?.[0] || 'Football',
});

// Filter constants
const cities = ['All Cities', 'Virar', 'Nallasopara', 'Vasai', 'Naigaon', 'Bhayandar', 'Mira Road', 'Dahisar', 'Borivali','Kandivali','Malad'];
const turfTypes = ['all', 'cricket', 'football', 'badminton','tennis','volleyball'];

export function TurfListings() {
    const [filters, setFilters] = useState<FilterState>({
        location: 'All Cities',
        date: '',
        priceRange: 'all',
        turfType: 'all'
    });
    const [sortBy, setSortBy] = useState<SortOption>('rating');
    const [selectedTurf, setSelectedTurf] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

    // Firebase state
    const [allTurfs, setAllTurfs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // ✅ FIXED: Fetch ALL turfs without status/createdAt filters
    useEffect(() => {
        const fetchTurfs = async () => {
            try {
                setLoading(true);
                const turfsRef = collection(db, 'turf');
                const snapshot = await getDocs(turfsRef);
                console.log(`✅ Listings: Fetched ${snapshot.size} turfs`);

                const turfs: any[] = [];
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

    const handleFilterChange = (key: keyof FilterState, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({ location: 'All Cities', date: '', priceRange: 'all', turfType: 'all' });
    };

    const handleBookNow = (turf: any) => {
        if (!isLoggedIn()) {
            setIsSignInModalOpen(true);
            return;
        }
        setSelectedTurf(turf);
        setIsModalOpen(true);
    };

    // Filter & sort from Firebase data
    const filteredAndSortedTurfs = useMemo(() => {
        let result = [...allTurfs];

        if (filters.location !== 'All Cities') {
            result = result.filter(turf => turf.city === filters.location);
        }
        if (filters.priceRange !== 'all') {
            result = result.filter(turf => {
                switch (filters.priceRange) {
                    case 'under-500': return turf.pricePerHour < 500;
                    case '500-1000': return turf.pricePerHour >= 500 && turf.pricePerHour <= 1000;
                    case 'over-1000': return turf.pricePerHour > 1000;
                    default: return true;
                }
            });
        }
        if (filters.turfType !== 'all') {
            result = result.filter(turf => turf.size === filters.turfType);
        }

        switch (sortBy) {
            case 'price-low': result.sort((a, b) => a.pricePerHour - b.pricePerHour); break;
            case 'price-high': result.sort((a, b) => b.pricePerHour - a.pricePerHour); break;
            case 'rating': result.sort((a, b) => b.rating - a.rating); break;
        }
        return result;
    }, [filters, sortBy, allTurfs]);

    const today = new Date().toISOString().split('T')[0];

    const hasActiveFilters = filters.location !== 'All Cities' ||
        filters.priceRange !== 'all' ||
        filters.turfType !== 'all' ||
        filters.date !== '';

    return (
        <div className={styles.page}>
            <Header />

            <main className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.layoutGrid}>

                        {/* ✅ Left Panel — Filter Sidebar */}
                        <div className={styles.filterPanel}>
                            <div className={styles.filterPanelHeader}>
                                <h3 className={styles.filterPanelTitle}>
                                    <svg className={styles.filterPanelIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                    </svg>
                                    Filters
                                </h3>
                                {hasActiveFilters && (
                                    <button className={styles.clearButton} onClick={clearFilters}>
                                        Clear All
                                    </button>
                                )}
                            </div>

                            <div className={styles.filterGroup}>
                                {/* City Filter */}
                                <div className={styles.filterItem}>
                                    <label className={styles.filterLabel}>
                                        <svg className={styles.filterIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        City
                                    </label>
                                    <select
                                        className={styles.filterSelect}
                                        value={filters.location}
                                        onChange={(e) => handleFilterChange('location', e.target.value)}
                                    >
                                        {cities.map(city => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Date Filter */}
                                <div className={styles.filterItem}>
                                    <label className={styles.filterLabel}>
                                        <svg className={styles.filterIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        className={styles.filterInput}
                                        value={filters.date}
                                        min={today}
                                        onChange={(e) => handleFilterChange('date', e.target.value)}
                                    />
                                </div>

                                {/* Price Filter */}
                                <div className={styles.filterItem}>
                                    <label className={styles.filterLabel}>
                                        <svg className={styles.filterIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Price Range
                                    </label>
                                    <select
                                        className={styles.filterSelect}
                                        value={filters.priceRange}
                                        onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                                    >
                                        <option value="all">All Prices</option>
                                        <option value="under-500">Under ₹500</option>
                                        <option value="500-1000">₹500 - ₹1000</option>
                                        <option value="over-1000">₹1000+</option>
                                    </select>
                                </div>

                                {/* Turf Size Filter */}
                                <div className={styles.filterItem}>
                                    <label className={styles.filterLabel}>
                                        <svg className={styles.filterIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                        </svg>
                                        Turf Type
                                    </label>
                                    <select
                                        className={styles.filterSelect}
                                        value={filters.turfType}
                                        onChange={(e) => handleFilterChange('turfType', e.target.value)}
                                    >
                                        {turfTypes.map(type => (
                                            <option key={type} value={type}>
                                                {type === 'all' ? 'All Types' : type}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Active Filters Summary */}
                                <div className={styles.activeFilters}>
                                    <div className={styles.activeFiltersTitle}>Active Filters</div>
                                    <div className={styles.activeFiltersList}>
                                        {hasActiveFilters ? (
                                            <>
                                                {filters.location !== 'All Cities' && (
                                                    <span className={styles.activeFilterTag}>📍 {filters.location}</span>
                                                )}
                                                {filters.priceRange !== 'all' && (
                                                    <span className={styles.activeFilterTag}>💰 {filters.priceRange}</span>
                                                )}
                                                {filters.turfType !== 'all' && (
                                                    <span className={styles.activeFilterTag}>⚽ {filters.turfType}</span>
                                                )}
                                                {filters.date && (
                                                    <span className={styles.activeFilterTag}>📅 {filters.date}</span>
                                                )}
                                            </>
                                        ) : (
                                            <span className={styles.noActiveFilters}>No filters applied</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ✅ Right Panel — Results */}
                        <div className={styles.resultsPanel}>
                            {/* Results Header */}
                            <div className={styles.resultsHeader}>
                                <div className={styles.resultsCount}>
                                    Showing <strong>{filteredAndSortedTurfs.length}</strong> turf{filteredAndSortedTurfs.length !== 1 ? 's' : ''}
                                </div>
                                <div className={styles.sortContainer}>
                                    <span className={styles.sortLabel}>Sort by:</span>
                                    <select
                                        className={styles.sortSelect}
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                                    >
                                        <option value="rating">Top Rated</option>
                                        <option value="price-low">Price: Low to High</option>
                                        <option value="price-high">Price: High to Low</option>
                                        <option value="newest">Newest</option>
                                    </select>
                                </div>
                            </div>

                            {/* Content */}
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: '80px 20px', color: '#666' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚽</div>
                                    <div style={{ fontSize: '18px' }}>Loading turfs from database...</div>
                                </div>
                            ) : filteredAndSortedTurfs.length === 0 ? (
                                <div className={styles.noResults}>
                                    <svg className={styles.noResultsIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <h3 className={styles.noResultsTitle}>No turfs found</h3>
                                    <p className={styles.noResultsText}>
                                        Try adjusting your filters to find available turfs
                                    </p>
                                    {hasActiveFilters && (
                                        <button className={styles.noResultsButton} onClick={clearFilters}>
                                            Clear All Filters
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className={styles.grid}>
                                    {filteredAndSortedTurfs.map((turf, index) => (
                                        <TurfCard
                                            key={turf.id}
                                            turf={turf as any}
                                            onBook={handleBookNow}
                                            index={index}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </main>

            {/* Booking Modal */}
            {selectedTurf && (
                <BookingModal
                    turf={selectedTurf}
                    isOpen={isModalOpen}
                    onClose={() => { setIsModalOpen(false); setSelectedTurf(null); }}
                />
            )}

            {/* Sign In Modal */}
            {isSignInModalOpen && (
                <SignInRequiredModal
                    isOpen={isSignInModalOpen}
                    onClose={() => setIsSignInModalOpen(false)}
                />
            )}
        </div>
    );
}