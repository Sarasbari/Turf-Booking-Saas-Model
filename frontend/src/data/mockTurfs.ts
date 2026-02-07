// Enhanced Mock Turf Data for BookMyShow-Style Platform
// 15 turfs with varied data for different sections

export interface Turf {
    id: string;
    name: string;
    location: string;
    city: string;
    images: string[];
    pricePerHour: number;
    rating: number;
    size: '5-a-side' | '7-a-side' | '11-a-side';
    amenities: string[];
    isPromoted: boolean;
    availableToday: boolean;
    sport: 'Football' | 'Cricket' | 'Basketball' | 'Badminton' | 'Volleyball';
}

export const mockTurfs: Turf[] = [
    {
        id: '1',
        name: 'Green Arena Sports Complex',
        location: 'Andheri West, Mumbai',
        city: 'Mumbai',
        images: ['https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&h=1200&fit=crop'],
        pricePerHour: 800,
        rating: 4.8,
        size: '7-a-side',
        amenities: ['Floodlit', 'Parking', 'Changing Room', 'Water', 'First Aid'],
        isPromoted: true,
        availableToday: true,
        sport: 'Football',
    },
    {
        id: '2',
        name: 'Champions Cricket Ground',
        location: 'Bandra East, Mumbai',
        city: 'Mumbai',
        images: ['https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&h=1200&fit=crop'],
        pricePerHour: 1200,
        rating: 4.9,
        size: '11-a-side',
        amenities: ['Floodlit', 'Parking', 'Changing Room', 'Scoreboard', 'Seating'],
        isPromoted: true,
        availableToday: true,
        sport: 'Cricket',
    },
    {
        id: '3',
        name: 'Urban Football Hub',
        location: 'Powai, Mumbai',
        city: 'Mumbai',
        images: ['https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=1200&fit=crop'],
        pricePerHour: 600,
        rating: 4.5,
        size: '5-a-side',
        amenities: ['Floodlit', 'Parking', 'Water'],
        isPromoted: false,
        availableToday: true,
        sport: 'Football',
    },
    {
        id: '4',
        name: 'Elite Basketball Court',
        location: 'Juhu, Mumbai',
        city: 'Mumbai',
        images: ['https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=1200&fit=crop'],
        pricePerHour: 450,
        rating: 4.6,
        size: '5-a-side',
        amenities: ['Floodlit', 'Changing Room', 'Water'],
        isPromoted: false,
        availableToday: true,
        sport: 'Basketball',
    },
    {
        id: '5',
        name: 'Prime Turf Sports Arena',
        location: 'Goregaon, Mumbai',
        city: 'Mumbai',
        images: ['https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=1200&fit=crop'],
        pricePerHour: 700,
        rating: 4.7,
        size: '7-a-side',
        amenities: ['Floodlit', 'Parking', 'Changing Room', 'Cafeteria'],
        isPromoted: false,
        availableToday: true,
        sport: 'Football',
    },
    {
        id: '6',
        name: 'Badminton Pro Center',
        location: 'Malad, Mumbai',
        city: 'Mumbai',
        images: ['https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&h=1200&fit=crop'],
        pricePerHour: 400,
        rating: 4.4,
        size: '5-a-side',
        amenities: ['Air Conditioned', 'Parking', 'Changing Room', 'Equipment Rental'],
        isPromoted: false,
        availableToday: false,
        sport: 'Badminton',
    },
    {
        id: '7',
        name: 'Victory Football Ground',
        location: 'Thane West',
        city: 'Thane',
        images: ['https://images.unsplash.com/photo-1589487391730-58f20eb2c308?w=800&h=1200&fit=crop'],
        pricePerHour: 550,
        rating: 4.3,
        size: '7-a-side',
        amenities: ['Floodlit', 'Parking', 'Water'],
        isPromoted: false,
        availableToday: true,
        sport: 'Football',
    },
    {
        id: '8',
        name: 'Striker Sports Complex',
        location: 'Kandivali, Mumbai',
        city: 'Mumbai',
        images: ['https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&h=1200&fit=crop'],
        pricePerHour: 900,
        rating: 4.8,
        size: '11-a-side',
        amenities: ['Floodlit', 'Parking', 'Changing Room', 'Cafeteria', 'First Aid'],
        isPromoted: true,
        availableToday: true,
        sport: 'Football',
    },
    {
        id: '9',
        name: 'Ace Cricket Academy',
        location: 'Borivali, Mumbai',
        city: 'Mumbai',
        images: ['https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&h=1200&fit=crop'],
        pricePerHour: 1000,
        rating: 4.7,
        size: '11-a-side',
        amenities: ['Floodlit', 'Parking', 'Changing Room', 'Coaching', 'Equipment'],
        isPromoted: false,
        availableToday: true,
        sport: 'Cricket',
    },
    {
        id: '10',
        name: 'Budget Sports Turf',
        location: 'Dahisar, Mumbai',
        city: 'Mumbai',
        images: ['https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&h=1200&fit=crop'],
        pricePerHour: 350,
        rating: 4.2,
        size: '5-a-side',
        amenities: ['Floodlit', 'Water'],
        isPromoted: false,
        availableToday: true,
        sport: 'Football',
    },
    {
        id: '11',
        name: 'Volleyball Arena Pro',
        location: 'Vashi, Navi Mumbai',
        city: 'Navi Mumbai',
        images: ['https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&h=1200&fit=crop'],
        pricePerHour: 500,
        rating: 4.5,
        size: '7-a-side',
        amenities: ['Floodlit', 'Parking', 'Changing Room'],
        isPromoted: false,
        availableToday: true,
        sport: 'Volleyball',
    },
    {
        id: '12',
        name: 'Premium Football Club',
        location: 'Lower Parel, Mumbai',
        city: 'Mumbai',
        images: ['https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&h=1200&fit=crop'],
        pricePerHour: 1500,
        rating: 4.9,
        size: '11-a-side',
        amenities: ['Floodlit', 'Parking', 'Changing Room', 'Cafeteria', 'Lounge', 'Gym'],
        isPromoted: true,
        availableToday: true,
        sport: 'Football',
    },
    {
        id: '13',
        name: 'Community Sports Ground',
        location: 'Chembur, Mumbai',
        city: 'Mumbai',
        images: ['https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&h=1200&fit=crop'],
        pricePerHour: 400,
        rating: 4.1,
        size: '7-a-side',
        amenities: ['Parking', 'Water'],
        isPromoted: false,
        availableToday: true,
        sport: 'Football',
    },
    {
        id: '14',
        name: 'Hoops Basketball Arena',
        location: 'Worli, Mumbai',
        city: 'Mumbai',
        images: ['https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=800&h=1200&fit=crop'],
        pricePerHour: 650,
        rating: 4.6,
        size: '5-a-side',
        amenities: ['Air Conditioned', 'Parking', 'Changing Room', 'Equipment'],
        isPromoted: false,
        availableToday: true,
        sport: 'Basketball',
    },
    {
        id: '15',
        name: 'Express Cricket Nets',
        location: 'Mulund, Mumbai',
        city: 'Mumbai',
        images: ['https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=800&h=1200&fit=crop'],
        pricePerHour: 300,
        rating: 4.0,
        size: '5-a-side',
        amenities: ['Floodlit', 'Equipment Rental'],
        isPromoted: false,
        availableToday: true,
        sport: 'Cricket',
    },
];

// Helper functions for filtering
export const getRecommendedTurfs = (): Turf[] => {
    return mockTurfs.filter(turf => turf.isPromoted || turf.rating >= 4.7).slice(0, 10);
};

export const getTurfsNearYou = (city: string = 'Mumbai'): Turf[] => {
    return mockTurfs.filter(turf => turf.city === city).slice(0, 10);
};

export const getBudgetFriendlyTurfs = (): Turf[] => {
    return mockTurfs.filter(turf => turf.pricePerHour < 500).slice(0, 10);
};

export const getTurfsBySport = (sport: string): Turf[] => {
    if (sport === 'All') return mockTurfs;
    return mockTurfs.filter(turf => turf.sport === sport);
};

export const searchTurfs = (query: string): Turf[] => {
    const lowerQuery = query.toLowerCase();
    return mockTurfs.filter(turf =>
        turf.name.toLowerCase().includes(lowerQuery) ||
        turf.location.toLowerCase().includes(lowerQuery) ||
        turf.sport.toLowerCase().includes(lowerQuery)
    );
};

// Export cities and turf types for filters
export const cities = ['All Cities', 'Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai', 'Thane', 'Navi Mumbai'];

export const turfTypes = ['all', '5-a-side', '7-a-side', '11-a-side'];

// Generate time slots for booking
export const generateTimeSlots = (date: string, turfId: string): { time: string; isBooked: boolean }[] => {
    const slots = [];
    const hours = ['06:00 AM', '08:00 AM', '10:00 AM', '12:00 PM', '02:00 PM', '04:00 PM', '06:00 PM', '08:00 PM'];

    for (const hour of hours) {
        // Randomly mark some slots as booked (for demo purposes)
        const isBooked = Math.random() > 0.7;
        slots.push({ time: hour, isBooked });
    }

    return slots;
};
