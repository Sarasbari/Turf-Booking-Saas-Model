import { Timestamp } from 'firebase/firestore';
import { Turf } from '../types';

// Enhanced Mock Turf Data for BookMyShow-Style Platform
// 15 turfs with varied data for different sections

export const mockTurfs: Turf[] = [
    {
        id: '1',
        name: 'Green Arena Turf',
        city: 'Mumbai',
        address: 'vasai West, Mumbai',
        images: ['https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&h=1200&fit=crop'],
        pricePerHour: 800,
        rating: 4.8,
        totalReviews: 120,
        amenities: ['Floodlit', 'Parking', 'Changing Room', 'Water', 'First Aid'],
        sport: 'Cricket',
        ownerId: 'owner_1',
        isActive: true,
        createdAt: Timestamp.now(),
    },
    {
        id: '2',
        name: 'Champions Cricket Ground',
        city: 'Mumbai',
        address: 'Bandra East, Mumbai',
        images: ['https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&h=1200&fit=crop'],
        pricePerHour: 1200,
        rating: 4.9,
        totalReviews: 85,
        amenities: ['Floodlit', 'Parking', 'Changing Room', 'Scoreboard', 'Seating'],
        sport: 'Cricket',
        ownerId: 'owner_2',
        isActive: true,
        createdAt: Timestamp.now(),
    },
    {
        id: '3',
        name: 'Urban Football Hub',
        city: 'Mumbai',
        address: 'Powai, Mumbai',
        images: ['https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=1200&fit=crop'],
        pricePerHour: 600,
        rating: 4.5,
        totalReviews: 210,
        amenities: ['Floodlit', 'Parking', 'Water'],
        sport: 'Football',
        ownerId: 'owner_3',
        isActive: true,
        createdAt: Timestamp.now(),
    },
    {
        id: '4',
        name: 'Elite Basketball Court',
        city: 'Mumbai',
        address: 'Juhu, Mumbai',
        images: ['https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=1200&fit=crop'],
        pricePerHour: 450,
        rating: 4.6,
        totalReviews: 54,
        amenities: ['Floodlit', 'Changing Room', 'Water'],
        sport: 'Basketball',
        ownerId: 'owner_4',
        isActive: true,
        createdAt: Timestamp.now(),
    },
    {
        id: '5',
        name: 'Prime Turf Sports Arena',
        city: 'Mumbai',
        address: 'Goregaon, Mumbai',
        images: ['https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=1200&fit=crop'],
        pricePerHour: 700,
        rating: 4.7,
        totalReviews: 95,
        amenities: ['Floodlit', 'Parking', 'Changing Room', 'Cafeteria'],
        sport: 'Football',
        ownerId: 'owner_5',
        isActive: true,
        createdAt: Timestamp.now(),
    },
    {
        id: '6',
        name: 'Badminton Pro Center',
        city: 'Mumbai',
        address: 'Malad, Mumbai',
        images: ['https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&h=1200&fit=crop'],
        pricePerHour: 400,
        rating: 4.4,
        totalReviews: 76,
        amenities: ['Air Conditioned', 'Parking', 'Changing Room', 'Equipment Rental'],
        sport: 'Tennis', // Replaced Badminton with Tennis to match new types
        ownerId: 'owner_6',
        isActive: true,
        createdAt: Timestamp.now(),
    },
    {
        id: '7',
        name: 'Victory Football Ground',
        city: 'Thane',
        address: 'Thane West',
        images: ['https://images.unsplash.com/photo-1589487391730-58f20eb2c308?w=800&h=1200&fit=crop'],
        pricePerHour: 550,
        rating: 4.3,
        totalReviews: 124,
        amenities: ['Floodlit', 'Parking', 'Water'],
        sport: 'Football',
        ownerId: 'owner_7',
        isActive: true,
        createdAt: Timestamp.now(),
    },
    {
        id: '8',
        name: 'Striker Sports Complex',
        city: 'Mumbai',
        address: 'Kandivali, Mumbai',
        images: ['https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&h=1200&fit=crop'],
        pricePerHour: 900,
        rating: 4.8,
        totalReviews: 310,
        amenities: ['Floodlit', 'Parking', 'Changing Room', 'Cafeteria', 'First Aid'],
        sport: 'Football',
        ownerId: 'owner_8',
        isActive: true,
        createdAt: Timestamp.now(),
    },
    {
        id: '9',
        name: 'Ace Cricket Academy',
        city: 'Mumbai',
        address: 'Borivali, Mumbai',
        images: ['https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&h=1200&fit=crop'],
        pricePerHour: 1000,
        rating: 4.7,
        totalReviews: 145,
        amenities: ['Floodlit', 'Parking', 'Changing Room', 'Coaching', 'Equipment'],
        sport: 'Cricket',
        ownerId: 'owner_9',
        isActive: true,
        createdAt: Timestamp.now(),
    },
    {
        id: '10',
        name: 'Budget Sports Turf',
        city: 'Mumbai',
        address: 'Dahisar, Mumbai',
        images: ['https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&h=1200&fit=crop'],
        pricePerHour: 350,
        rating: 4.2,
        totalReviews: 45,
        amenities: ['Floodlit', 'Water'],
        sport: 'Football',
        ownerId: 'owner_10',
        isActive: true,
        createdAt: Timestamp.now(),
    },
    {
        id: '11',
        name: 'Volleyball Arena Pro',
        city: 'Navi Mumbai',
        address: 'Vashi, Navi Mumbai',
        images: ['https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&h=1200&fit=crop'],
        pricePerHour: 500,
        rating: 4.5,
        totalReviews: 68,
        amenities: ['Floodlit', 'Parking', 'Changing Room'],
        sport: 'Volleyball',
        ownerId: 'owner_11',
        isActive: true,
        createdAt: Timestamp.now(),
    },
    {
        id: '12',
        name: 'Premium Football Club',
        city: 'Mumbai',
        address: 'Lower Parel, Mumbai',
        images: ['https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&h=1200&fit=crop'],
        pricePerHour: 1500,
        rating: 4.9,
        totalReviews: 412,
        amenities: ['Floodlit', 'Parking', 'Changing Room', 'Cafeteria', 'Lounge', 'Gym'],
        sport: 'Football',
        ownerId: 'owner_12',
        isActive: true,
        createdAt: Timestamp.now(),
    },
    {
        id: '13',
        name: 'Community Sports Ground',
        city: 'Mumbai',
        address: 'Chembur, Mumbai',
        images: ['https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&h=1200&fit=crop'],
        pricePerHour: 400,
        rating: 4.1,
        totalReviews: 92,
        amenities: ['Parking', 'Water'],
        sport: 'Football',
        ownerId: 'owner_13',
        isActive: true,
        createdAt: Timestamp.now(),
    },
    {
        id: '14',
        name: 'Hoops Basketball Arena',
        city: 'Mumbai',
        address: 'Worli, Mumbai',
        images: ['https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=800&h=1200&fit=crop'],
        pricePerHour: 650,
        rating: 4.6,
        totalReviews: 128,
        amenities: ['Air Conditioned', 'Parking', 'Changing Room', 'Equipment'],
        sport: 'Basketball',
        ownerId: 'owner_14',
        isActive: true,
        createdAt: Timestamp.now(),
    },
    {
        id: '15',
        name: 'Express Cricket Nets',
        city: 'Mumbai',
        address: 'Mulund, Mumbai',
        images: ['https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=800&h=1200&fit=crop'],
        pricePerHour: 300,
        rating: 4.0,
        totalReviews: 32,
        amenities: ['Floodlit', 'Equipment Rental'],
        sport: 'Cricket',
        ownerId: 'owner_15',
        isActive: true,
        createdAt: Timestamp.now(),
    },
];

// Helper functions for filtering
export const getRecommendedTurfs = (): Turf[] => {
    return mockTurfs.filter(turf => turf.rating >= 4.7).slice(0, 10);
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
        turf.address.toLowerCase().includes(lowerQuery) ||
        turf.sport.toLowerCase().includes(lowerQuery)
    );
};

// Export cities and turf types for filters
export const cities = ['All Cities', 'Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai', 'Thane', 'Navi Mumbai'];

export const turfTypes = ['all'];

// Generate time slots for booking
export const generateTimeSlots = (date: string, turfId: string): { time: string; isBooked: boolean }[] => {
    const slots = [];
    const hours = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];

    for (const hour of hours) {
        // Randomly mark some slots as booked (for demo purposes)
        const isBooked = Math.random() > 0.7;
        slots.push({ time: hour, isBooked });
    }

    return slots;
};
