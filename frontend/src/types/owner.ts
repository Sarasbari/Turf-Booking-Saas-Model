import { Timestamp } from 'firebase/firestore';

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
    userId: string;
    customerName: string;
    customerPhone: string;
    customerPhoto: string;
    sport: string;
    date: string;
    startTime: string;
    endTime: string;
    amount: number;
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
