import { useState, useEffect, useMemo } from 'react';
import { FilterState, SortOption } from '../../types/turf';
// ✅ REMOVED: import { mockTurfs, cities, turfTypes, type Turf } from '../../data/mockTurfs';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { TurfCard } from '../../components/TurfCard/TurfCard';
import { BookingModal } from '../../components/BookingModal/BookingModal';
import { Header } from '../../components/Header/Header';
import { SignInRequiredModal } from '../../components/SignInRequiredModal/SignInRequiredModal';
import { isLoggedIn } from '../../utils/auth';
import styles from './TurfListings.module.css';

// ✅ Same normalizer as Home.tsx
const normalizeForCard = (id: string, data: any) => ({
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

// ✅ Keep filter constants (no longer imported from mockTurfs)
const cities = ['All Cities', 'Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai', 'Thane', 'Navi Mumbai'];
const turfTypes = ['all', '5-a-side', '7-a-side', '11-a-side'];

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

    // ✅ NEW: Firebase state
    const [allTurfs, setAllTurfs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // ✅ NEW: Fetch from Firebase
    useEffect(() => {
        const fetchTurfs = async () => {
            try {
                setLoading(true);
                const turfsRef = collection(db, 'turf');
                const q = query(
                    turfsRef,
                    where('status', '==', 'active'),
                    orderBy('createdAt', 'desc')
                );
                const snapshot = await getDocs(q);
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

    // ✅ Filter from Firebase data instead of mockTurfs
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

    // ... rest of your JSX render stays the same,
    // just replace any reference to `mockTurfs` with `filteredAndSortedTurfs`
    // and add a loading state similar to Home.tsx

    return (
        <div className={styles.page}>
            <Header />
            <main className={styles.main}>
                {/* Your existing filter UI using cities/turfTypes constants */}
                {/* ... */}

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
                        Loading turfs...
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
            </main>

            {selectedTurf && (
                <BookingModal
                    turf={selectedTurf}
                    isOpen={isModalOpen}
                    onClose={() => { setIsModalOpen(false); setSelectedTurf(null); }}
                />
            )}

            {isSignInModalOpen && (
                <SignInRequiredModal
                    isOpen={isSignInModalOpen}
                    onClose={() => setIsSignInModalOpen(false)}
                />
            )}
        </div>
    );
}