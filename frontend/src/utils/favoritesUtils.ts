import {
    doc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getUserProfile } from './firestoreUtils';
import { mockTurfs, type Turf } from '../data/mockTurfs';

/**
 * Add a turf to user's favorites
 */
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

/**
 * Remove a turf from user's favorites
 */
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

/**
 * Get user's favorite turf IDs
 */
export async function getUserFavorites(userId: string): Promise<string[]> {
    try {
        const profile = await getUserProfile(userId);
        return profile?.favorites || [];
    } catch (error) {
        console.error('Error getting user favorites:', error);
        return [];
    }
}

/**
 * Check if a turf is favorited by user
 */
export async function isTurfFavorited(userId: string, turfId: string): Promise<boolean> {
    try {
        const favorites = await getUserFavorites(userId);
        return favorites.includes(turfId);
    } catch (error) {
        console.error('Error checking if turf is favorited:', error);
        return false;
    }
}

/**
 * Get full turf objects for user's favorites
 */
export async function getFavoriteTurfs(userId: string): Promise<Turf[]> {
    try {
        const favoriteIds = await getUserFavorites(userId);
        // Filter mockTurfs by favoriteIds
        return mockTurfs.filter(turf => favoriteIds.includes(turf.id));
    } catch (error) {
        console.error('Error getting favorite turfs:', error);
        return [];
    }
}

/**
 * Get count of user's favorites
 */
export async function getFavoriteCount(userId: string): Promise<number> {
    try {
        const favorites = await getUserFavorites(userId);
        return favorites.length;
    } catch (error) {
        console.error('Error getting favorite count:', error);
        return 0;
    }
}
