import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { Turf } from '../types';

export const turfService = {
    normalizeForCard: (id: string, data: any): Turf => ({
        id,
        name: data.name || 'Unnamed Turf',
        location: data.location?.address
            ? `${data.location.address}, ${data.location.city || ''}`
            : (data.address
                ? `${data.address}, ${data.city || ''}`
                : (typeof data.location === 'string' ? data.location : '')),
        city: data.location?.city || data.city || '',
        images: data.images && data.images.length > 0
            ? data.images
            : (data.coverImage ? [data.coverImage] : ['https://via.placeholder.com/800x1200?text=No+Image']),
        pricePerHour: data.pricing?.basePrice || data.pricePerHour || 0,
        rating: data.rating || 0,
        size: data.turfSize || data.groundSize || data.size || '5-a-side',
        amenities: data.amenities || [],
        isPromoted: data.isFeatured || data.isPromoted || false,
        availableToday: true,
        sport: data.sport || data.sports?.[0] || 'Football',
        lat: data.geoPoint?.latitude ?? data.geoPoint?._lat ?? data.latitude ?? undefined,
        lng: data.geoPoint?.longitude ?? data.geoPoint?._long ?? data.longitude ?? undefined,
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
