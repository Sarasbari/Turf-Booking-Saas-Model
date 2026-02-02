import { useState, useMemo } from 'react';
import { Turf, FilterState, SortOption } from '../../types/turf';
import { mockTurfs, cities } from '../../data/mockTurfs';
import { TurfCard } from '../../components/TurfCard/TurfCard';
import { BookingModal } from '../../components/BookingModal/BookingModal';
import styles from './TurfListings.module.css';

export function TurfListings() {
    const [filters, setFilters] = useState<FilterState>({
        location: 'All Cities',
        date: '',
        priceRange: 'all',
        turfSize: 'all'
    });
    const [sortBy, setSortBy] = useState<SortOption>('rating');
    const [selectedTurf, setSelectedTurf] = useState<Turf | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleFilterChange = (key: keyof FilterState, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            location: 'All Cities',
            date: '',
            priceRange: 'all',
            turfSize: 'all'
        });
    };

    const handleBookNow = (turf: Turf) => {
        setSelectedTurf(turf);
        setIsModalOpen(true);
    };

    const filteredAndSortedTurfs = useMemo(() => {
        let result = [...mockTurfs];

        // Apply filters
        if (filters.location !== 'All Cities') {
            result = result.filter(turf => turf.city === filters.location);
        }

        if (filters.priceRange !== 'all') {
            result = result.filter(turf => {
                switch (filters.priceRange) {
                    case 'under-500':
                        return turf.pricePerHour < 500;
                    case '500-1000':
                        return turf.pricePerHour >= 500 && turf.pricePerHour <= 1000;
                    case 'over-1000':
                        return turf.pricePerHour > 1000;
                    default:
                        return true;
                }
            });
        }

        if (filters.turfSize !== 'all') {
            result = result.filter(turf => turf.size === filters.turfSize);
        }

        // Apply sorting
        switch (sortBy) {
            case 'price-low':
                result.sort((a, b) => a.pricePerHour - b.pricePerHour);
                break;
            case 'price-high':
                result.sort((a, b) => b.pricePerHour - a.pricePerHour);
                break;
            case 'rating':
                result.sort((a, b) => b.rating - a.rating);
                break;
            case 'newest':
                // Keep original order for newest
                break;
        }

        return result;
    }, [filters, sortBy]);

    const today = new Date().toISOString().split('T')[0];

    return (
        <div className={styles.page}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.logo}>
                        <h1 className={styles.logoText}>TurfBookaro</h1>
                    </div>
                    <div className={styles.breadcrumb}>Browse & Book Turfs</div>
                </div>
            </header>

            {/* Main Content */}
            <main className={styles.main}>
                <div className={styles.container}>
                    {/* Search & Filter Bar */}
                    <div className={styles.filterSection}>
                        <div className={styles.filterGrid}>
                            {/* Location Filter */}
                            <div className={styles.filterItem}>
                                <label htmlFor="location-filter" className={styles.filterLabel}>
                                    <svg className={styles.filterIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Location
                                </label>
                                <select
                                    id="location-filter"
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
                                <label htmlFor="date-filter" className={styles.filterLabel}>
                                    <svg className={styles.filterIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={2} />
                                        <line x1="16" y1="2" x2="16" y2="6" strokeWidth={2} />
                                        <line x1="8" y1="2" x2="8" y2="6" strokeWidth={2} />
                                        <line x1="3" y1="10" x2="21" y2="10" strokeWidth={2} />
                                    </svg>
                                    Date
                                </label>
                                <input
                                    id="date-filter"
                                    type="date"
                                    className={styles.filterInput}
                                    value={filters.date}
                                    min={today}
                                    onChange={(e) => handleFilterChange('date', e.target.value)}
                                />
                            </div>

                            {/* Price Range Filter */}
                            <div className={styles.filterItem}>
                                <label htmlFor="price-filter" className={styles.filterLabel}>
                                    <svg className={styles.filterIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <line x1="12" y1="1" x2="12" y2="23" strokeWidth={2} />
                                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeWidth={2} />
                                    </svg>
                                    Price Range
                                </label>
                                <select
                                    id="price-filter"
                                    className={styles.filterSelect}
                                    value={filters.priceRange}
                                    onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                                >
                                    <option value="all">All Prices</option>
                                    <option value="under-500">Under ₹500</option>
                                    <option value="500-1000">₹500 - ₹1000</option>
                                    <option value="over-1000">Over ₹1000</option>
                                </select>
                            </div>

                            {/* Turf Size Filter */}
                            <div className={styles.filterItem}>
                                <label htmlFor="size-filter" className={styles.filterLabel}>
                                    <svg className={styles.filterIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
                                    </svg>
                                    Turf Size
                                </label>
                                <select
                                    id="size-filter"
                                    className={styles.filterSelect}
                                    value={filters.turfSize}
                                    onChange={(e) => handleFilterChange('turfSize', e.target.value)}
                                >
                                    <option value="all">All Sizes</option>
                                    <option value="5-a-side">5-a-side</option>
                                    <option value="7-a-side">7-a-side</option>
                                    <option value="11-a-side">11-a-side</option>
                                </select>
                            </div>
                        </div>

                        <button className={styles.clearButton} onClick={clearFilters}>
                            Clear Filters
                        </button>
                    </div>

                    {/* Results Count + Sort Bar */}
                    <div className={styles.resultsBar}>
                        <div className={styles.resultsCount}>
                            Showing <strong>{filteredAndSortedTurfs.length}</strong> turf{filteredAndSortedTurfs.length !== 1 ? 's' : ''}
                        </div>

                        <div className={styles.sortContainer}>
                            <label htmlFor="sort-select" className={styles.sortLabel}>Sort by:</label>
                            <select
                                id="sort-select"
                                className={styles.sortSelect}
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                            >
                                <option value="rating">Rating: Best First</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="newest">Newest</option>
                            </select>
                        </div>
                    </div>

                    {/* Turf Listings Grid */}
                    {filteredAndSortedTurfs.length > 0 ? (
                        <div className={styles.grid}>
                            {filteredAndSortedTurfs.map(turf => (
                                <TurfCard key={turf.id} turf={turf} onBookNow={handleBookNow} />
                            ))}
                        </div>
                    ) : (
                        <div className={styles.noResults}>
                            <svg className={styles.noResultsIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="11" cy="11" r="8" strokeWidth={2} />
                                <path d="m21 21-4.35-4.35" strokeWidth={2} />
                            </svg>
                            <h2 className={styles.noResultsTitle}>No turfs found</h2>
                            <p className={styles.noResultsText}>Try adjusting your filters to see more results.</p>
                            <button className={styles.noResultsButton} onClick={clearFilters}>
                                Clear All Filters
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* Booking Modal */}
            <BookingModal
                turf={selectedTurf}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}
