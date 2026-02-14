import {
    doc,
    getDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getUserProfile } from './firestoreUtils';
// ✅ REMOVED: import { mockTurfs, type Turf } from '../data/mockTurfs';

// addToFavorites — unchanged ✅
export async function addToFavorites(userId: string, turfId: string): Promise<void> {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            favorites: arrayUnion(turfId),
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error adding to favorites:', error);
        throw error;
    }
}

// removeFromFavorites — unchanged ✅
export async function removeFromFavorites(userId: string, turfId: string): Promise<void> {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            favorites: arrayRemove(turfId),
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error removing from favorites:', error);
        throw error;
    }
}

// getUserFavorites — unchanged ✅
export async function getUserFavorites(userId: string): Promise<string[]> {
    try {
        const profile = await getUserProfile(userId);
        return profile?.favorites || [];
    } catch (error) {
        console.error('Error getting user favorites:', error);
        return [];
    }
}

// isTurfFavorited — unchanged ✅
export async function isTurfFavorited(userId: string, turfId: string): Promise<boolean> {
    try {
        const favorites = await getUserFavorites(userId);
        return favorites.includes(turfId);
    } catch (error) {
        console.error('Error checking if turf is favorited:', error);
        return false;
    }
}

// ✅ FIXED: Fetch favorite turfs from Firebase instead of mockTurfs
export async function getFavoriteTurfs(userId: string): Promise<any[]> {
    try {
        const favoriteIds = await getUserFavorites(userId);
        if (favoriteIds.length === 0) return [];

        // Fetch each turf from Firebase
        const turfs: any[] = [];
        for (const turfId of favoriteIds) {
            try {
                const turfRef = doc(db, 'turfs', turfId);
                const turfSnap = await getDoc(turfRef);
                if (turfSnap.exists()) {
                    const data = turfSnap.data();
                    // Normalize to match TurfCard expected shape
                    turfs.push({
                        id: turfSnap.id,
                        name: data.name || 'Unnamed Turf',
                        location: data.location?.address
                            ? `${data.location.address}, ${data.location.city || ''}`
                            : '',
                        city: data.location?.city || '',
                        images: data.images || [data.coverImage || 'https://via.placeholder.com/800x1200?text=No+Image'],
                        pricePerHour: data.pricing?.basePrice || 0,
                        rating: data.rating || 0,
                        size: data.turfSize || '5-a-side',
                        amenities: data.amenities || [],
                        isPromoted: data.isFeatured || false,
                        availableToday: data.status === 'active',
                        sport: data.sport || 'Football',
                    });
                }
            } catch (err) {
                console.error(`Error fetching turf ${turfId}:`, err);
            }
        }
        return turfs;
    } catch (error) {
        console.error('Error getting favorite turfs:', error);
        return [];
    }
}

// getFavoriteCount — unchanged ✅
export async function getFavoriteCount(userId: string): Promise<number> {
    try {
        const favorites = await getUserFavorites(userId);
        return favorites.length;
    } catch (error) {
        console.error('Error getting favorite count:', error);
        return 0;
    }
}