export interface Turf {
    id: string;
    name: string;
    location: string;
    city: string;
    images: string[];
    pricePerHour: number;
    rating: number;
    size: string;
    amenities: string[];
    isPromoted: boolean;
    availableToday: boolean;
    sport: string;
    lat?: number;
    lng?: number;
}
