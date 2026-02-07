import { useState } from 'react';
import { Header } from '../../components/Header/Header';
import { SubNavigation } from '../../components/SubNavigation/SubNavigation';
import { HeroCarousel } from '../../components/HeroCarousel/HeroCarousel';
import { FilterChip } from '../../components/FilterChip/FilterChip';
import { SectionHeader } from '../../components/SectionHeader/SectionHeader';
import { TurfCard } from '../../components/TurfCard/TurfCard';
import { Footer } from '../../components/Footer/Footer';
import {
    mockTurfs,
    getRecommendedTurfs,
    getTurfsNearYou,
    getBudgetFriendlyTurfs,
    getTurfsBySport,
    type Turf
} from '../../data/mockTurfs';
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

export function Home() {
    const [activeFilters, setActiveFilters] = useState<string[]>(['All Sizes']);
    const [selectedTurf, setSelectedTurf] = useState<Turf | null>(null);
    const [activeSport, setActiveSport] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

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
        // TODO: Open booking modal
        console.log('Book turf:', turf.name);
    };

    const handleSportChange = (sport: string) => {
        setActiveSport(sport);
    };

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
    };

    // Get turfs based on active sport
    const filteredTurfs = activeSport === 'all'
        ? mockTurfs
        : getTurfsBySport(activeSport.charAt(0).toUpperCase() + activeSport.slice(1));

    const recommendedTurfs = getRecommendedTurfs().filter(turf =>
        activeSport === 'all' || turf.sport.toLowerCase() === activeSport
    );
    const nearbyTurfs = getTurfsNearYou().filter(turf =>
        activeSport === 'all' || turf.sport.toLowerCase() === activeSport
    );
    const budgetTurfs = getBudgetFriendlyTurfs().filter(turf =>
        activeSport === 'all' || turf.sport.toLowerCase() === activeSport
    );

    return (
        <div className={styles.page}>
            {/* Header */}
            <Header onSearchChange={handleSearchChange} />

            {/* Sub Navigation */}
            <SubNavigation onSportChange={handleSportChange} />

            {/* Hero Carousel */}
            <HeroCarousel />

            {/* Quick Filters Bar */}
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

            {/* Main Content */}
            <div className={styles.container}>
                {/* Recommended Turfs Section */}
                {recommendedTurfs.length > 0 && (
                    <section className={styles.section}>
                        <SectionHeader
                            title="Recommended Turfs"
                            subtitle="Popular turfs near you"
                            showSeeAll
                            onSeeAllClick={() => window.location.href = '/listings'}
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
                    </section>
                )}

                {/* Turfs Near You Section */}
                {nearbyTurfs.length > 0 && (
                    <section className={styles.section}>
                        <SectionHeader
                            title="Turfs Near You"
                            subtitle="Find turfs in Mumbai"
                            showSeeAll
                            onSeeAllClick={() => window.location.href = '/listings'}
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
                    </section>
                )}

                {/* Budget-Friendly Turfs Section */}
                {budgetTurfs.length > 0 && (
                    <section className={styles.section}>
                        <SectionHeader
                            title="Budget-Friendly Turfs"
                            subtitle="Quality turfs under ₹500"
                            showSeeAll
                            onSeeAllClick={() => window.location.href = '/listings'}
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
                    </section>
                )}

                {/* No Results Message */}
                {recommendedTurfs.length === 0 && nearbyTurfs.length === 0 && budgetTurfs.length === 0 && (
                    <div className={styles.noResults}>
                        <p>No turfs found for {activeSport}. Try selecting a different sport.</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <Footer />
        </div>
    );
}
