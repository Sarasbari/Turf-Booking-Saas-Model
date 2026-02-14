import { useState, useEffect } from 'react';
import { Header } from '../../components/Header/Header';
import { SubNavigation } from '../../components/SubNavigation/SubNavigation';
import { HeroCarousel } from '../../components/HeroCarousel/HeroCarousel';
import { FilterChip } from '../../components/FilterChip/FilterChip';
import { SectionHeader } from '../../components/SectionHeader/SectionHeader';
import { TurfCard } from '../../components/TurfCard/TurfCard';
import { Footer } from '../../components/Footer/Footer';
// ��� REMOVED: import { mockTurfs, getRecommendedTurfs, ... } from '../../data/mockTurfs';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
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
}

// ✅ Normalize Firebase document → shape that TurfCard expects
const normalizeForCard = (id: string, data: any): FirebaseTurf => ({
    id,
    name: data.name || 'Unnamed Turf',
    location: data.location?.address
        ? `${data.location.address}, ${data.location.city || ''}`
        : (typeof data.location === 'string' ? data.location : ''),
    city: data.location?.city || data.city || '',
    images: data.images || (data.coverImage ? [data.coverImage] : ['https://via.placeholder.com/800x1200?text=No+Image']),
    pricePerHour: data.pricing?.basePrice || data.pricePerHour || 0,
    rating: data.rating || 0,
    size: data.turfSize || data.size || '5-a-side',
    amenities: data.amenities || [],
    isPromoted: data.isFeatured || data.isPromoted || false,
    availableToday: data.status === 'active',
    sport: data.sport || 'Football',
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

export function Home() {
    const [activeFilters, setActiveFilters] = useState<string[]>(['All Sizes']);
    const [selectedTurf, setSelectedTurf] = useState<FirebaseTurf | null>(null);
    const [activeSport, setActiveSport] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // ✅ NEW: Firebase state
    const [allTurfs, setAllTurfs] = useState<FirebaseTurf[]>([]);
    const [loading, setLoading] = useState(true);

    // ✅ NEW: Fetch from Firebase on mount
    useEffect(() => {
        const fetchTurfs = async () => {
            try {
                setLoading(true);
                const turfsRef = collection(db, 'turfs');
                const q = query(
                    turfsRef,
                    where('status', '==', 'active'),
                    orderBy('createdAt', 'desc')
                );
                const snapshot = await getDocs(q);
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

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
    };

    // ✅ Filter from Firebase data instead of mockTurfs
    const filteredTurfs = activeSport === 'all'
        ? allTurfs
        : allTurfs.filter(t => t.sport.toLowerCase() === activeSport);

    const recommendedTurfs = allTurfs
        .filter(t => t.isPromoted || t.rating >= 4.7)
        .filter(t => activeSport === 'all' || t.sport.toLowerCase() === activeSport)
        .slice(0, 10);

    const nearbyTurfs = allTurfs
        .filter(t => activeSport === 'all' || t.sport.toLowerCase() === activeSport)
        .slice(0, 10);

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
            ) : (
                <>
                    {/* Recommended Section */}
                    {recommendedTurfs.length > 0 && (
                        <>
                            <SectionHeader title="Recommended Turfs" subtitle="Top rated venues" />
                            <div className={styles.turfGrid}>
                                {recommendedTurfs.map((turf, index) => (
                                    <TurfCard
                                        key={turf.id}
                                        turf={turf as any}
                                        onBook={handleBookTurf}
                                        index={index}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Near You Section */}
                    {nearbyTurfs.length > 0 && (
                        <>
                            <SectionHeader title="Near You" subtitle="Venues in your area" />
                            <div className={styles.turfGrid}>
                                {nearbyTurfs.map((turf, index) => (
                                    <TurfCard
                                        key={turf.id}
                                        turf={turf as any}
                                        onBook={handleBookTurf}
                                        index={index}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Budget Friendly Section */}
                    {budgetTurfs.length > 0 && (
                        <>
                            <SectionHeader title="Budget Friendly" subtitle="Under ₹500/hr" />
                            <div className={styles.turfGrid}>
                                {budgetTurfs.map((turf, index) => (
                                    <TurfCard
                                        key={turf.id}
                                        turf={turf as any}
                                        onBook={handleBookTurf}
                                        index={index}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </>
            )}

            <Footer />
        </div>
    );
}