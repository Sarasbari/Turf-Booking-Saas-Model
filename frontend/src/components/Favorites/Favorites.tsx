import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../lib/firebase';
import { getFavoriteTurfs } from '../../utils/favoritesUtils';
import { TurfCard } from '../TurfCard/TurfCard';
import { ToastContainer } from '../ToastContainer/ToastContainer';
import { useToast } from '../../hooks/useToast';
import type { Turf } from '../../data/mockTurfs';
import styles from './Favorites.module.css';

export function Favorites() {
    const navigate = useNavigate();
    const [favorites, setFavorites] = useState<Turf[]>([]);
    const [loading, setLoading] = useState(true);
    const { toasts, showToast, removeToast } = useToast();

    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        try {
            setLoading(true);
            const user = auth.currentUser;
            if (user) {
                const favoriteTurfs = await getFavoriteTurfs(user.uid);
                setFavorites(favoriteTurfs);
            }
        } catch (error) {
            console.error('Error loading favorites:', error);
            showToast('Failed to load favorites', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFavoriteChange = () => {
        // Reload favorites when a turf is removed
        loadFavorites();
    };

    const handleBook = (turf: Turf) => {
        // Navigate to booking or show booking modal
        console.log('Book turf:', turf);
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading your favorites...</p>
                </div>
            </div>
        );
    }

    if (favorites.length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}>❤️</div>
                    <h3 className={styles.emptyHeading}>No Favorites Yet</h3>
                    <p className={styles.emptyMessage}>
                        Start adding turfs to your wishlist to see them here
                    </p>
                    <button
                        className={styles.browseButton}
                        onClick={() => navigate('/listings')}
                    >
                        Browse Turfs
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>My Wishlist</h2>
                <p className={styles.count}>{favorites.length} {favorites.length === 1 ? 'turf' : 'turfs'}</p>
            </div>

            <div className={styles.grid}>
                {favorites.map((turf, index) => (
                    <TurfCard
                        key={turf.id}
                        turf={turf}
                        onBook={handleBook}
                        index={index}
                        onFavoriteChange={handleFavoriteChange}
                        onShowToast={showToast}
                    />
                ))}
            </div>

            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </div>
    );
}
