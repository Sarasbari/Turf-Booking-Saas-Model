import { Timestamp } from 'firebase/firestore';

export interface GroundConfig {
    id: string;
    name: string;
    openTime: string;
    closeTime: string;
}

export interface OwnerData {
    uid: string;
    name: string;
    email: string;
    phone: string;
    photoURL: string;
    turfId: string;
    role: 'owner';
    isApproved: boolean;
    notifications?: {
        newBooking: boolean;
        cancellation: boolean;
        newReview: boolean;
        dailySummary: boolean;
    };
    createdAt: Timestamp;
}

export interface BookingType {
    id: string;
    turfId: string;
    groundId?: string;
    userId: string;
    customerName: string;
    customerPhone: string;
    customerPhoto: string;
    sport: string;
    date: string;
    startTime: string;
    endTime: string;
    amount: number;
    paymentMethod?: string;
    paymentStatus?: 'paid' | 'pending' | 'failed';
    bookedBy?: 'owner' | 'user';
    game?: string; // Some parts use 'sport', others might use this? keeping 'sport' as primary
    teamName?: string;
    notes?: string;
    status: 'confirmed' | 'pending' | 'cancelled';
    createdAt: Timestamp;
}

export interface SlotType {
    id: string;
    startTime: string;
    endTime: string;
    label: string;
}

export interface BlockedSlot {
    turfId: string;
    groundId?: string;
    date: string;
    startTime: string;
    endTime: string;
    blockedAt: Timestamp;
    blockedBy: string;
}

export interface TurfData {
    id: string;
    name: string;
    city: string;
    area: string;
    address: string;
    description: string;
    sports: string[];
    groundSize: string;
    totalGrounds: number;
    grounds?: GroundConfig[];
    amenities: string[];
    openTime: string;
    closeTime: string;
    weeklyOff: string;
    pricePerHour: number;
    status: 'active' | 'inactive';
    discount?: {
        active: boolean;
        percent: number;
        description: string;
    };
    rating: number;
    images: string[];
    ownerId: string;
    isUnderMaintenance?: boolean;
    createdAt: Timestamp;

    // --- Extended fields for MyTurf editor ---
    state?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
    hasWeekendHours?: boolean;
    weekendOpenTime?: string;
    weekendCloseTime?: string;
    basePrice?: number;
    weekendPrice?: number;
    hasPeakPricing?: boolean;
    peakStartTime?: string;
    peakEndTime?: string;
    peakPrice?: number;
    turfStatus?: 'available' | 'closed' | 'maintenance';
    hasDiscount?: boolean;
    discountType?: 'percentage' | 'fixed';
    discountValue?: number;
    discountDescription?: string;
    promoCode?: string;
    discountValidUntil?: string;
    discountBadgeText?: string;
    tags?: string[];
    publishedAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface ReviewData {
    id: string;
    turfId: string;
    userId: string;
    userName: string;
    userPhoto: string;
    rating: number;
    comment: string;
    ownerReply?: string;
    repliedAt?: Timestamp;
    createdAt: Timestamp;
}

export interface ActivityData {
    id: string;
    type: 'booking' | 'review' | 'cancellation' | 'confirmed' | 'blocked';
    message: string;
    timestamp: Timestamp;
    icon: string;
    color: string;
}
