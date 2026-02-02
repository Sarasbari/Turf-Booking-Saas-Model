import { Turf } from '../../types/turf';
import styles from './TurfCard.module.css';

interface TurfCardProps {
    turf: Turf;
    onBookNow: (turf: Turf) => void;
}

export function TurfCard({ turf, onBookNow }: TurfCardProps) {
    const renderStars = (rating: number) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        for (let i = 0; i < fullStars; i++) {
            stars.push(
                <span key={`full-${i}`} className={styles.starFull}>
                    ★
                </span>
            );
        }

        if (hasHalfStar) {
            stars.push(
                <span key="half" className={styles.starHalf}>
                    ★
                </span>
            );
        }

        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(
                <span key={`empty-${i}`} className={styles.starEmpty}>
                    ★
                </span>
            );
        }

        return stars;
    };

    return (
        <div className={styles.card}>
            <div className={styles.imageContainer}>
                <img src={turf.image} alt={turf.name} className={styles.image} />
            </div>

            <div className={styles.content}>
                <h3 className={styles.name}>{turf.name}</h3>

                <div className={styles.location}>
                    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {turf.location}, {turf.city}
                </div>

                <div className={styles.details}>
                    <div className={styles.size}>
                        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
                        </svg>
                        {turf.size}
                    </div>

                    <div className={styles.rating}>
                        {renderStars(turf.rating)}
                        <span className={styles.ratingValue}>{turf.rating}</span>
                    </div>
                </div>

                <div className={styles.amenities}>
                    {turf.amenities.slice(0, 3).map((amenity) => (
                        <span key={amenity} className={styles.amenity}>
                            {amenity}
                        </span>
                    ))}
                </div>

                <div className={styles.footer}>
                    <div className={styles.price}>
                        <span className={styles.priceAmount}>₹{turf.pricePerHour}</span>
                        <span className={styles.priceUnit}> / hr</span>
                    </div>

                    <button
                        className={styles.bookButton}
                        onClick={() => onBookNow(turf)}
                    >
                        Book Now
                    </button>
                </div>
            </div>
        </div>
    );
}
