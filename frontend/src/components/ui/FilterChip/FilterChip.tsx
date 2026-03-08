import { motion } from 'framer-motion';
import styles from './FilterChip.module.css';

interface FilterChipProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
}

export function FilterChip({ label, isActive, onClick }: FilterChipProps) {
    return (
        <motion.button
            className={`${styles.chip} ${isActive ? styles.active : ''}`}
            onClick={onClick}
            whileTap={{ scale: 0.95 }}
        >
            {label}
        </motion.button>
    );
}
