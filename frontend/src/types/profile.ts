import { Timestamp } from 'firebase/firestore';

// User Profile Interface
export interface UserProfile {
    uid: string;
    name: string;
    email: string;
    picture: string;
    phone?: string;

    // Personal details
    firstName?: string;
    lastName?: string;
    birthday?: string; // Format: "YYYY-MM-DD"
    gender?: 'Woman' | 'Man';

    // Favorites
    favorites?: string[]; // Array of turf IDs

    preferredLocation?: string;
    favoriteSport?: string;
    preferredTurfSize?: '5-a-side' | '7-a-side' | '11-a-side';
    createdAt: Timestamp;
    updatedAt: Timestamp;
    profileCompletion: number;
}

// Booking Interface
export interface Booking {
    id: string;
    userId: string;
    turfId: string;
    turfName: string;
    turfLocation: string;
    date: string; // Format: "YYYY-MM-DD"
    time: string; // Format: "5:00 PM - 7:00 PM"
    duration: number; // Duration in hours
    price: number; // Total price in rupees
    status: 'upcoming' | 'completed' | 'cancelled';
    createdAt: Timestamp;
    bookingId: string; // Unique booking reference (e.g., "TRF-2025-84732")
}

// Form data for profile editing
export interface ProfileFormData {
    name: string;
    email: string;
    phone: string;
    preferredLocation: string;
    favoriteSport: string;
    preferredTurfSize: '5-a-side' | '7-a-side' | '11-a-side' | '';
}

// Settings Interface
export interface UserSettings {
    emailNotifications: boolean;
    smsNotifications: boolean;
    language: string;
}
