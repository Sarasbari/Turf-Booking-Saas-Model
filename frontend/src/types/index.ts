import { Timestamp } from 'firebase/firestore';
import { z } from 'zod';

export interface Turf {
    id: string;
    name: string;
    city: string;
    address: string;
    sport: 'Cricket' | 'Football' | 'Volleyball' | 'Basketball' | 'Tennis';
    sports?: string[];
    groundSize?: string;
    openTime?: string;
    closeTime?: string;
    pricePerHour: number;
    rating: number;
    totalReviews: number;
    amenities: string[];
    images: string[];
    ownerId: string;
    isActive: boolean;
    isLive: boolean;
    slug?: string;
    createdAt: Timestamp;
}

export interface Booking {
    id: string;
    turfId: string;
    turfName: string;
    userId: string;
    customerName?: string;
    customerPhone?: string;
    sport?: string;
    date: string; // YYYY-MM-DD
    timeSlots: string[]; // ['06:00', '07:00']
    totalPrice: number;
    status: 'pending' | 'confirmed' | 'cancelled';
    paymentMethod?: string;
    paymentId?: string;
    razorpayOrderId?: string;
    emailSent?: boolean;
    createdAt: Timestamp;
}

export interface User {
    uid: string;
    name: string;
    email: string;
    photoURL: string;
    role: 'user' | 'owner' | 'admin';
    createdAt: Timestamp;
}

// ── Zod Validation Schemas ─────────────────────────────────────────

export const TurfEditSchema = z.object({
    name: z.string().min(3, 'Turf name must be at least 3 characters'),
    city: z.string().min(2, 'City is required'),
    address: z.string().min(5, 'Address must be at least 5 characters'),
    sport: z.enum(['Cricket', 'Football', 'Volleyball', 'Basketball', 'Tennis']),
    pricePerHour: z.number().min(100, 'Price must be at least ₹100').max(10000, 'Price cannot exceed ₹10000'),
    amenities: z.array(z.string()).min(1, 'Select at least one amenity'),
    images: z.array(z.string().url('Must provide valid image URLs')).min(1, 'Provide at least one image URL'),
});

export const BookingFormSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    timeSlots: z.array(z.string().regex(/^\d{2}:\d{2}$/)).min(1, 'Select at least one time slot'),
});

export const SignInOwnerSchema = z.object({
    phone: z.string().regex(/^\d{10}$/, 'Phone must be exactly 10 digits'),
    turfId: z.string().min(3, 'Turf ID is required'),
    claimCode: z.string().min(5, 'Claim code is required'),
});

export type TurfEditFormType = z.infer<typeof TurfEditSchema>;
export type BookingFormType = z.infer<typeof BookingFormSchema>;
export type SignInOwnerFormType = z.infer<typeof SignInOwnerSchema>;
