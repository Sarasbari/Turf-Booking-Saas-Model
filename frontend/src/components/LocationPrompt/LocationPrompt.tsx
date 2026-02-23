import styles from './LocationPrompt.module.css';

interface LocationPromptProps {
    onAllow: () => void;
    onSkip: () => void;
}

export function LocationPrompt({ onAllow, onSkip }: LocationPromptProps) {
    return (
        <div className={styles.banner}>
            <div className={styles.bannerInner}>
                <div className={styles.bannerText}>
                    <span className={styles.bannerIcon}>📍</span>
                    <p className={styles.bannerMessage}>
                        Allow location access to see turfs near you
                    </p>
                </div>
                <div className={styles.bannerActions}>
                    <button className={styles.allowBtn} onClick={onAllow}>
                        Allow
                    </button>
                    <button className={styles.skipBtn} onClick={onSkip}>
                        Skip
                    </button>
                </div>
            </div>
        </div>
    );
}
