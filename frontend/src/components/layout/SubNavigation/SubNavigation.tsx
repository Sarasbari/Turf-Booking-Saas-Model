import { useState } from 'react';
import styles from './SubNavigation.module.css';

interface SubNavigationProps {
    onSportChange?: (sport: string) => void;
}

const sports = [
    { id: 'all', label: 'All Sports', icon: '⚽' },
    { id: 'football', label: 'Football', icon: '⚽' },
    { id: 'cricket', label: 'Cricket', icon: '🏏' },
    { id: 'basketball', label: 'Basketball', icon: '🏀' },
    { id: 'badminton', label: 'Badminton', icon: '🏸' },
    { id: 'volleyball', label: 'Volleyball', icon: '🏐' },
];

export function SubNavigation({ onSportChange }: SubNavigationProps) {
    const [activeSport, setActiveSport] = useState('all');

    const handleSportClick = (sportId: string) => {
        setActiveSport(sportId);
        onSportChange?.(sportId);
    };

    return (
        <nav className={styles.subNav}>
            <div className={styles.container}>
                <div className={styles.sportTabs}>
                    {sports.map((sport) => (
                        <button
                            key={sport.id}
                            className={`${styles.sportTab} ${activeSport === sport.id ? styles.sportTabActive : ''}`}
                            onClick={() => handleSportClick(sport.id)}
                        >
                            <span className={styles.sportIcon}>{sport.icon}</span>
                            <span className={styles.sportLabel}>{sport.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </nav>
    );
}
