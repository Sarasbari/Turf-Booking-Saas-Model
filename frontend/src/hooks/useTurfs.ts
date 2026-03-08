import { useState, useEffect } from 'react';
import { Turf } from '../types';
import { turfService } from '../services/turfService';

export function useTurfs() {
    const [turfs, setTurfs] = useState<Turf[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchTurfs = async () => {
            try {
                setLoading(true);
                const data = await turfService.getAllTurfs();
                setTurfs(data);
            } catch (err) {
                console.error('Error fetching turfs:', err);
                setError(err instanceof Error ? err : new Error('Failed to fetch turfs'));
            } finally {
                setLoading(false);
            }
        };

        fetchTurfs();
    }, []);

    return { turfs, loading, error };
}
