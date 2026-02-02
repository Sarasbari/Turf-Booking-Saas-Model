export interface Turf {
    id: string;
    name: string;
    location: string;
    city: string;
    type: 'Cricket' | 'Football' | 'Volleyball' | 'Pickleball' | 'Badminton' | 'Tennis';
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
    turfType: string;
}

export type SortOption = 'price-low' | 'price-high' | 'rating' | 'newest';
