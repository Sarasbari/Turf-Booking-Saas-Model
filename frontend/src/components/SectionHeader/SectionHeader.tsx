import styles from './SectionHeader.module.css';

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    showSeeAll?: boolean;
    onSeeAllClick?: () => void;
}

export function SectionHeader({
    title,
    subtitle,
    showSeeAll = false,
    onSeeAllClick
}: SectionHeaderProps) {
    return (
        <div className={styles.header}>
            <div className={styles.textContent}>
                <h2 className={styles.title}>{title}</h2>
                {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
            {showSeeAll && (
                <button
                    className={styles.seeAllLink}
                    onClick={onSeeAllClick}
                >
                    See All →
                </button>
            )}
        </div>
    );
}
