import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    query,
    where,
    orderBy,
    getDocs,
    Timestamp,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { UserProfile, Booking, ProfileFormData } from '../types/profile';

/**
 * Calculate profile completion percentage
 */
export function calculateProfileCompletion(profile: Partial<UserProfile>): number {
    const weights = {
        name: 20,
        email: 20,
        phone: 20,
        preferredLocation: 20,
        favoriteSport: 10,
        preferredTurfSize: 10,
    };

    let completion = 0;

    if (profile.name) completion += weights.name;
    if (profile.email) completion += weights.email;
    if (profile.phone) completion += weights.phone;
    if (profile.preferredLocation) completion += weights.preferredLocation;
    if (profile.favoriteSport) completion += weights.favoriteSport;
    if (profile.preferredTurfSize) completion += weights.preferredTurfSize;

    return completion;
}

/**
 * Fetch user profile from Firestore
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            return { uid: userId, ...userDoc.data() } as UserProfile;
        }
        return null;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }
}

/**
 * Create a new user profile in Firestore
 */
export async function createUserProfile(
    userId: string,
    userData: { name: string; email: string; picture: string }
): Promise<UserProfile> {
    try {
        // Split name into firstName and lastName
        const nameParts = userData.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const newProfile: Omit<UserProfile, 'uid'> = {
            name: userData.name,
            firstName,
            lastName,
            email: userData.email,
            picture: userData.picture,
            favorites: [], // Initialize empty favorites array
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            profileCompletion: calculateProfileCompletion({
                name: userData.name,
                email: userData.email,
            }),
        };

        const userDocRef = doc(db, 'users', userId);
        await setDoc(userDocRef, newProfile);

        return { uid: userId, ...newProfile };
    } catch (error) {
        console.error('Error creating user profile:', error);
        throw error;
    }
}

/**
 * Update user profile in Firestore
 */
export async function updateUserProfile(
    userId: string,
    formData: ProfileFormData
): Promise<void> {
    try {
        const userDocRef = doc(db, 'users', userId);

        const updateData: any = {
            name: formData.name,
            updatedAt: serverTimestamp(),
        };

        // Only add optional fields if they have values
        if (formData.phone !== undefined) updateData.phone = formData.phone;
        if (formData.firstName !== undefined) updateData.firstName = formData.firstName;
        if (formData.lastName !== undefined) updateData.lastName = formData.lastName;
        if (formData.birthday !== undefined) updateData.birthday = formData.birthday;
        if (formData.gender !== undefined) updateData.gender = formData.gender;
        if (formData.preferredLocation !== undefined) updateData.preferredLocation = formData.preferredLocation;
        if (formData.favoriteSport !== undefined) updateData.favoriteSport = formData.favoriteSport;
        if (formData.preferredTurfSize !== undefined) updateData.preferredTurfSize = formData.preferredTurfSize;

        const profileCompletion = calculateProfileCompletion({
            name: formData.name,
            email: formData.email,
            phone: formData.phone || '',
            preferredLocation: formData.preferredLocation || '',
            favoriteSport: formData.favoriteSport || '',
            preferredTurfSize: formData.preferredTurfSize || undefined,
        });
        updateData.profileCompletion = profileCompletion;

        await updateDoc(userDocRef, updateData);
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
}

/**
 * Fetch user bookings from Firestore
 */
export async function getUserBookings(
    userId: string,
    status: 'upcoming' | 'completed'
): Promise<Booking[]> {
    try {
        const bookingsRef = collection(db, 'bookings');
        const q = query(
            bookingsRef,
            where('userId', '==', userId),
            where('status', '==', status),
            orderBy('date', status === 'upcoming' ? 'asc' : 'desc')
        );

        const querySnapshot = await getDocs(q);
        const bookings: Booking[] = [];

        querySnapshot.forEach((doc) => {
            bookings.push({ id: doc.id, ...doc.data() } as Booking);
        });

        return bookings;
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        throw error;
    }
}

/**
 * Cancel a booking
 */
export async function cancelBooking(bookingId: string): Promise<void> {
    try {
        const bookingDocRef = doc(db, 'bookings', bookingId);
        await updateDoc(bookingDocRef, {
            status: 'cancelled',
        });
    } catch (error) {
        console.error('Error cancelling booking:', error);
        throw error;
    }
}

/**
 * Validate phone number (10 digits)
 */
export function validatePhoneNumber(phone: string): boolean {
    if (!phone) return true; // Phone is optional
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}
