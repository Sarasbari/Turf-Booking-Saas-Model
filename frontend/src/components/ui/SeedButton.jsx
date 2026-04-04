import { useState } from 'react';
import { seedTurf1, seedAllTurfs } from '@/components/utils/seedTurf';

export default function SeedButton() {
    const [status, setStatus] = useState('idle'); // idle | loading | done | error

    const handleSeed = async () => {
        if (status === 'done') return;
        setStatus('loading');
        try {
            await seedTurf1();
            await seedAllTurfs();
            setStatus('done');
        } catch (err) {
            console.error(err);
            setStatus('error');
        }
    };

    const labels = {
        idle: '🌱 Seed All 102 Turfs',
        loading: '⏳ Adding data...',
        done: '✅ Done! Refresh /turf/1',
        error: '❌ Error — check console'
    };

    const colors = {
        idle: '#ea580c',
        loading: '#f97316',
        done: '#16a34a',
        error: '#dc2626'
    };

    return (
        <button
            onClick={handleSeed}
            disabled={status === 'loading' || status === 'done'}
            style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                background: colors[status],
                color: 'white',
                padding: '14px 28px',
                borderRadius: '10px',
                border: 'none',
                cursor: status === 'loading' || status === 'done' ? 'not-allowed' : 'pointer',
                fontWeight: '700',
                fontSize: '15px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                zIndex: 9999,
                transition: 'all 0.2s ease'
            }}
        >
            {labels[status]}
        </button>
    );
}
