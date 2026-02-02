export interface Turf {
    id: string;
    name: string;
    location: string;
    city: string;
    size: '5-a-side' | '7-a-side' | '11-a-side';
    pricePerHour: number;
    rating: number;
    image: string;
    amenities: string[];
}

export interface TimeSlot {
    time: string;
    isBooked: boolean;
}

export interface BookingDetails {
    turf: Turf;
    date: string;
    timeSlot: string;
    duration: number;
    totalPrice: number;
}

export interface FilterState {
    location: string;
    date: string;
    priceRange: string;
    turfSize: string;
}

export type SortOption = 'price-low' | 'price-high' | 'rating' | 'newest';
