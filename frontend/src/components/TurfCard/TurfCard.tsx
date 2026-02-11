import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { isLoggedIn, getUserData } from '../../utils/auth';
import { addToFavorites, removeFromFavorites, isTurfFavorited } from '../../utils/favoritesUtils';
import { SignInRequiredModal } from '../SignInRequiredModal/SignInRequiredModal';
import { ConfirmationModal } from '../ConfirmationModal/ConfirmationModal';
import type { Turf } from '../../data/mockTurfs';
import styles from './TurfCard.module.css';

interface TurfCardProps {
    turf: Turf;
    onBook: (turf: Turf) => void;
    index?: number;
    onFavoriteChange?: () => void; // Callback to refresh favorites list
    onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function TurfCard({ turf, onBook, index = 0, onFavoriteChange, onShowToast }: TurfCardProps) {
    const navigate = useNavigate();
    const [isFavorite, setIsFavorite] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [showSignInModal, setShowSignInModal] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [animating, setAnimating] = useState(false);
    const [loading, setLoading] = useState(false);

    // Check favorite status on mount
    useEffect(() => {
        const checkFavoriteStatus = async () => {
            if (isLoggedIn()) {
                const user = getUserData();
                if (user?.id) {
                    const favorited = await isTurfFavorited(user.id, turf.id);
                    setIsFavorite(favorited);
                }
            }
        };
        checkFavoriteStatus();
    }, [turf.id]);

    const handleFavoriteClick = async (e: React.MouseEvent) => {
        e.stopPropagation();

        // Check if user is logged in
        if (!isLoggedIn()) {
            setShowSignInModal(true);
            return;
        }

        if (loading) return;

        const user = getUserData();
        if (!user?.id) return;

        if (isFavorite) {
            // Show confirmation modal before removing
            setShowRemoveModal(true);
        } else {
            // Add to favorites
            try {
                setLoading(true);
                setAnimating(true);
                await addToFavorites(user.id, turf.id);
                setIsFavorite(true);
                onShowToast?.('Added to wishlist', 'success');
                onFavoriteChange?.();
                setTimeout(() => setAnimating(false), 600);
            } catch (error) {
                console.error('Error adding to favorites:', error);
                onShowToast?.('Failed to add to wishlist', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleConfirmRemove = async () => {
        const user = getUserData();
        if (!user?.id) return;

        try {
            setLoading(true);
            await removeFromFavorites(user.id, turf.id);
            setIsFavorite(false);
            setShowRemoveModal(false);
            onShowToast?.('Removed from wishlist', 'success');
            onFavoriteChange?.();
        } catch (error) {
            console.error('Error removing from favorites:', error);
            onShowToast?.('Failed to remove from wishlist', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleBookClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onBook(turf);
    };

    const handleCardClick = () => {
        // Navigate to turf details page
        navigate(`/turf/${turf.id}`);
    };

    return (
        <>
            <motion.div
                className={styles.card}
                onClick={handleCardClick}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.4,
                    delay: index * 0.05,
                    ease: [0.4, 0, 0.2, 1],
                }}
                whileHover={{
                    y: -4,
                    transition: { duration: 0.3 },
                }}
            >
                {/* Image Section */}
                <div className={styles.imageSection}>
                    {!imageLoaded && <div className={styles.imagePlaceholder} />}
                    <img
                        src={turf.images[0]}
                        alt={turf.name}
                        className={styles.image}
                        loading="lazy"
                        onLoad={() => setImageLoaded(true)}
                    />

                    {/* Gradient Overlay */}
                    <div className={styles.gradientOverlay} />

                    {/* Promoted Badge */}
                    {turf.isPromoted && (
                        <div className={styles.promotedBadge}>PROMOTED</div>
                    )}

                    {/* Rating Badge */}
                    <div className={styles.ratingBadge}>
                        <span className={styles.star}>★</span>
                        {turf.rating.toFixed(1)}
                    </div>

                    {/* Favorite Heart */}
                    <motion.button
                        className={`${styles.favoriteButton} ${isFavorite ? styles.favoriteActive : ''} ${animating ? styles.animating : ''}`}
                        onClick={handleFavoriteClick}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        disabled={loading}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            fill={isFavorite ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                    </motion.button>
                </div>

                {/* Info Section */}
                <div className={styles.infoSection}>
                    {/* Turf Name */}
                    <h3 className={styles.turfName}>{turf.name}</h3>

                    {/* Location */}
                    <div className={styles.location}>
                        <svg className={styles.locationIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {turf.location}
                    </div>

                    {/* Amenities Tags */}
                    <div className={styles.amenities}>
                        {turf.amenities.slice(0, 3).map((amenity) => (
                            <span key={amenity} className={styles.amenityTag}>
                                {amenity}
                            </span>
                        ))}
                    </div>

                    {/* Divider */}
                    <div className={styles.divider} />

                    {/* Price & CTA */}
                    <div className={styles.footer}>
                        <div className={styles.price}>
                            ₹{turf.pricePerHour}
                            <span className={styles.priceUnit}>/hr</span>
                        </div>
                        <motion.button
                            className={styles.bookButton}
                            onClick={handleBookClick}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Book
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* Modals */}
            {showSignInModal && (
                <SignInRequiredModal
                    isOpen={showSignInModal}
                    onClose={() => setShowSignInModal(false)}
                />
            )}

            {showRemoveModal && (
                <ConfirmationModal
                    icon="💔"
                    heading="Remove from Wishlist?"
                    message={`Are you sure you want to remove ${turf.name} from your favorites?`}
                    confirmText="Remove"
                    cancelText="Cancel"
                    confirmVariant="danger"
                    onConfirm={handleConfirmRemove}
                    onCancel={() => setShowRemoveModal(false)}
                />
            )}
        </>
    );
}
