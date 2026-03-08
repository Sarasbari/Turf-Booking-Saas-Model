import styles from './TurfCardSkeleton.module.css';

interface TurfCardSkeletonProps {
    count?: number;
}

function SingleSkeleton() {
    return (
        <div className={styles.skeleton}>
            {/* Image area */}
            <div className={`${styles.imageArea} ${styles.shimmer}`} />

            {/* Info area */}
            <div className={styles.infoArea}>
                <div className={`${styles.titleLine} ${styles.shimmer}`} />
                <div className={`${styles.locationLine} ${styles.shimmer}`} />

                <div className={styles.tagsRow}>
                    <div className={`${styles.tagPill} ${styles.shimmer}`} />
                    <div className={`${styles.tagPill} ${styles.shimmer}`} />
                    <div className={`${styles.tagPill} ${styles.shimmer}`} />
                </div>

                <div className={styles.dividerLine} />

                <div className={styles.footerRow}>
                    <div className={`${styles.priceLine} ${styles.shimmer}`} />
                    <div className={`${styles.buttonLine} ${styles.shimmer}`} />
                </div>
            </div>
        </div>
    );
}

export function TurfCardSkeleton({ count = 5 }: TurfCardSkeletonProps) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <SingleSkeleton key={i} />
            ))}
        </>
    );
}
