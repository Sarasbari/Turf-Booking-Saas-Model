import styles from './SectionHeader.module.css';

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    icon?: string;
    accentWord?: string;
    showSeeAll?: boolean;
    onSeeAllClick?: () => void;
}

export function SectionHeader({
    title,
    subtitle,
    icon,
    accentWord,
    showSeeAll = false,
    onSeeAllClick
}: SectionHeaderProps) {
    // Render title with accent word highlighted
    const renderTitle = () => {
        if (!accentWord || !title.includes(accentWord)) {
            return title;
        }
        const parts = title.split(accentWord);
        return (
            <>
                {parts[0]}
                <span className={styles.accent}>{accentWord}</span>
                {parts[1]}
            </>
        );
    };

    return (
        <div className={styles.header}>
            <div className={styles.textContent}>
                <div className={styles.titleRow}>
                    {icon && <span className={styles.icon}>{icon}</span>}
                    <h2 className={styles.title}>{renderTitle()}</h2>
                </div>
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
