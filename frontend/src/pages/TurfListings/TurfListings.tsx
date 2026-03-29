import { useState, useMemo } from 'react';
import { FilterState, SortOption } from '../../types/turf';
import { TurfCard } from '../../components/features/TurfCard/TurfCard';
import { TurfCardSkeleton } from '../../components/features/TurfCard/TurfCardSkeleton';
import { BookingModal } from '../../components/features/BookingModal/BookingModal';
import { Header } from '../../components/layout/Header/Header';
import { SignInRequiredModal } from '../../components/features/SignInRequiredModal/SignInRequiredModal';
import { AIRecommendationChip } from '../../components/AIRecommendationChip';
import { isLoggedIn } from '../../utils/auth';
import { useTurfs } from '../../hooks/useTurfs';
import { Turf } from '../../types';
import styles from './TurfListings.module.css';

// Filter constants
const cities = ['All Cities', 'Virar', 'Nallasopara', 'Vasai', 'Naigaon', 'Bhayandar', 'Mira Road', 'Dahisar', 'Borivali', 'Kandivali', 'Malad'];
const turfTypes = ['all', 'cricket', 'football', 'badminton', 'tennis', 'volleyball'];

export function TurfListings() {
    const [filters, setFilters] = useState<FilterState>({
        location: 'All Cities',
        date: '',
        priceRange: 'all',
        turfType: 'all'
    });
    const [sortBy, setSortBy] = useState<SortOption>('rating');
    const [selectedTurf, setSelectedTurf] = useState<Turf | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

    // Fetch data using hook
    const { turfs: allTurfs, loading } = useTurfs();

    // Mobile filter drawer
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    const handleFilterChange = (key: keyof FilterState, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({ location: 'All Cities', date: '', priceRange: 'all', turfType: 'all' });
    };

    const handleBookNow = (turf: Turf) => {
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

    const activeFilterCount = [
        filters.location !== 'All Cities',
        filters.priceRange !== 'all',
        filters.turfType !== 'all',
        filters.date !== ''
    ].filter(Boolean).length;

    return (
        <div className={styles.page}>
            <Header />

            <main className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.layoutGrid}>

                        {/* Mobile Filter Button — visible <lg only */}
                        <button
                            className="lg:hidden flex items-center justify-center gap-2 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl mb-4 text-sm font-semibold text-gray-900 transition-colors hover:border-orange-600 hover:text-orange-600"
                            onClick={() => setIsMobileFilterOpen(true)}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            Filters
                            {activeFilterCount > 0 && (
                                <span className={styles.filterBadge}>{activeFilterCount}</span>
                            )}
                        </button>

                        {/* Mobile Filter Drawer — slide up bottom sheet */}
                        {isMobileFilterOpen && (
                            <div className="fixed inset-0 bg-black/50 z-[2000] animate-[fadeInOverlay_0.2s_ease]" onClick={() => setIsMobileFilterOpen(false)}>
                                <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 pb-8 max-h-[85vh] overflow-y-auto z-[2001] animate-[slideUp_0.3s_cubic-bezier(0.4,0,0.2,1)] flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
                                    <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-1" />
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-bold text-gray-900 m-0">Filters</h3>
                                        <button className="bg-transparent border-none text-xl text-gray-500 cursor-pointer p-1" onClick={() => setIsMobileFilterOpen(false)}>✕</button>
                                    </div>

                                    {/* City Filter */}
                                    <div className="flex flex-col gap-2">
                                        <label className={styles.filterLabel}>City</label>
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
                                    <div className="flex flex-col gap-2">
                                        <label className={styles.filterLabel}>Date</label>
                                        <input
                                            type="date"
                                            className={styles.filterInput}
                                            value={filters.date}
                                            min={today}
                                            onChange={(e) => handleFilterChange('date', e.target.value)}
                                        />
                                    </div>

                                    {/* Price Filter */}
                                    <div className="flex flex-col gap-2">
                                        <label className={styles.filterLabel}>Price Range</label>
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

                                    {/* Turf Type Filter */}
                                    <div className="flex flex-col gap-2">
                                        <label className={styles.filterLabel}>Turf Type</label>
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

                                    <div className="flex gap-3 pt-2 mt-2 border-t border-gray-200">
                                        {hasActiveFilters && (
                                            <button className={styles.clearButton + " flex-1 !w-auto !text-center"} onClick={() => { clearFilters(); setIsMobileFilterOpen(false); }}>
                                                Clear All
                                            </button>
                                        )}
                                        <button className={styles.applyButton} onClick={() => setIsMobileFilterOpen(false)}>
                                            Show {filteredAndSortedTurfs.length} Results
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Left Panel — Filter Sidebar (desktop only) */}
                        <div className={`${styles.filterPanel} hidden lg:block`}>
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
                                    <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide lg:flex-col lg:overflow-visible">
                                        {hasActiveFilters ? (
                                            <>
                                                {filters.location !== 'All Cities' && (
                                                    <span className={`${styles.activeFilterTag} flex-shrink-0`}>📍 {filters.location}</span>
                                                )}
                                                {filters.priceRange !== 'all' && (
                                                    <span className={`${styles.activeFilterTag} flex-shrink-0`}>💰 {filters.priceRange}</span>
                                                )}
                                                {filters.turfType !== 'all' && (
                                                    <span className={`${styles.activeFilterTag} flex-shrink-0`}>⚽ {filters.turfType}</span>
                                                )}
                                                {filters.date && (
                                                    <span className={`${styles.activeFilterTag} flex-shrink-0`}>📅 {filters.date}</span>
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
                                <div className={styles.grid}>
                                    <TurfCardSkeleton count={6} />
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
                                            turf={turf}
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

            {/* AI Slot Recommendation Chip */}
            <AIRecommendationChip />
        </div>
    );
}