/**
 * SlotCountdown — Renders a live "Held: M:SS" countdown.
 *
 * Calls `onExpired` when the countdown reaches zero.
 * Uses a 1-second interval for smooth updates.
 */

import React, { useState, useEffect } from 'react';

interface SlotCountdownProps {
    /** The absolute expiry time. */
    expiresAt: Date;
    /** Called once when the countdown reaches zero. */
    onExpired: () => void;
}

const SlotCountdown: React.FC<SlotCountdownProps> = ({
    expiresAt,
    onExpired,
}) => {
    const [remainingMs, setRemainingMs] = useState(() =>
        Math.max(0, expiresAt.getTime() - Date.now())
    );

    useEffect(() => {
        // Immediately check
        const diff = expiresAt.getTime() - Date.now();
        if (diff <= 0) {
            setRemainingMs(0);
            onExpired();
            return;
        }

        setRemainingMs(diff);

        const interval = setInterval(() => {
            const remaining = expiresAt.getTime() - Date.now();
            if (remaining <= 0) {
                setRemainingMs(0);
                clearInterval(interval);
                onExpired();
            } else {
                setRemainingMs(remaining);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [expiresAt, onExpired]);

    if (remainingMs <= 0) return null;

    const totalSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return (
        <span className="mt-0.5 text-[10px] font-medium tracking-wider text-indigo-300">
            Held: {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
    );
};

export default SlotCountdown;
