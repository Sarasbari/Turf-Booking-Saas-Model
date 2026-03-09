import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { Turf } from '../types';

export const turfService = {
    normalizeForCard: (id: string, data: any): Turf => ({
        id,
        name: data.name || 'Unnamed Turf',
        city: data.location?.city || data.city || '',
        address: data.location?.address
            ? `${data.location.address}`
            : (data.address
                ? `${data.address}`
                : (typeof data.location === 'string' ? data.location : '')),
        images: Array.isArray(data.images) && data.images.length > 0
            ? data.images
            : (data.coverImage ? [data.coverImage] : ['https://via.placeholder.com/800x1200?text=No+Image']),
        pricePerHour: Number(data.pricing?.basePrice || data.pricePerHour || 0),
        rating: Number(data.rating || 0),
        totalReviews: Number(data.totalReviews || 0),
        amenities: Array.isArray(data.amenities) ? data.amenities : [],
        sport: (['Cricket', 'Football', 'Volleyball', 'Basketball', 'Tennis'].includes(data.sport) ? data.sport : 'Football') as Turf['sport'],
        ownerId: data.ownerId || '',
        isActive: typeof data.isActive === 'boolean' ? data.isActive : true,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
    }),

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
