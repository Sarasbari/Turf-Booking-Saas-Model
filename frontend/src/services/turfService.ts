import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { Turf } from '@/types';

const SPORT_MAP: Record<string, Turf['sport']> = {
    cricket: 'Cricket',
    football: 'Football',
    soccer: 'Football',
    volleyball: 'Volleyball',
    basketball: 'Basketball',
    badminton: 'Tennis',
    tennis: 'Tennis',
    pickleball: 'Tennis',
};

const normalizeSportValue = (value: string): Turf['sport'] | null => {
    const normalized = value.trim().toLowerCase();
    return SPORT_MAP[normalized] || null;
};

const extractSports = (data: Record<string, unknown>): string[] => {
    const values: string[] = [];
    if (typeof data.sport === 'string' && data.sport.trim()) {
        values.push(data.sport.trim());
    }

    if (Array.isArray(data.sports)) {
        data.sports.forEach((value) => {
            if (typeof value === 'string' && value.trim()) {
                values.push(value.trim());
            }
        });
    }

    return Array.from(new Set(values));
};

const resolvePrimarySport = (sports: string[]): Turf['sport'] => {
    for (const sport of sports) {
        const normalized = normalizeSportValue(sport);
        if (normalized) {
            return normalized;
        }
    }

    return 'Football';
};

export const turfService = {
    normalizeForCard: (id: string, rawData: unknown): Turf => {
        const data = (typeof rawData === 'object' && rawData !== null ? rawData : {}) as Record<string, unknown>;
        const sports = extractSports(data);

        return {
            id,
            name: typeof data.name === 'string' && data.name.trim() ? data.name : 'Unnamed Turf',
            city: typeof data.location === 'object' && data.location !== null && 'city' in data.location
                ? String((data.location as Record<string, unknown>).city || '')
                : String(data.city || ''),
            address: typeof data.location === 'object' && data.location !== null && 'address' in data.location
                ? String((data.location as Record<string, unknown>).address || '')
                : (typeof data.address === 'string' ? data.address : (typeof data.location === 'string' ? data.location : '')),
            images: Array.isArray(data.images) && data.images.length > 0
                ? data.images.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
                : (typeof data.coverImage === 'string' && data.coverImage
                    ? [data.coverImage]
                    : ['https://via.placeholder.com/800x1200?text=No+Image']),
            pricePerHour: Number((data.pricing as Record<string, unknown> | undefined)?.basePrice || data.pricePerHour || 0),
            rating: Number(data.rating || 0),
            totalReviews: Number(data.totalReviews || 0),
            amenities: Array.isArray(data.amenities)
                ? data.amenities.filter((value): value is string => typeof value === 'string')
                : [],
            sport: resolvePrimarySport(sports),
            sports,
            groundSize: typeof data.groundSize === 'string' ? data.groundSize : undefined,
            openTime: typeof data.openTime === 'string' ? data.openTime : undefined,
            closeTime: typeof data.closeTime === 'string' ? data.closeTime : undefined,
            ownerId: typeof data.ownerId === 'string' ? data.ownerId : '',
            isActive: typeof data.isActive === 'boolean' ? data.isActive : true,
            isLive: typeof data.isLive === 'boolean' ? data.isLive : true,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
        };
    },

    getAllTurfs: async (): Promise<Turf[]> => {
        const turfsRef = collection(db, 'turf');
        const snapshot = await getDocs(turfsRef);
        console.log(`✅ Fetched ${snapshot.size} turfs from Firebase via turfService`);

        const turfs: Turf[] = [];
        snapshot.forEach((doc) => {
            turfs.push(turfService.normalizeForCard(doc.id, doc.data()));
        });

        return turfs;
    }
};
