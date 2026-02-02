import { Turf } from '../types/turf';

export const mockTurfs: Turf[] = [
    {
        id: '1',
        name: 'Green Arena Turf',
        location: 'Andheri West',
        city: 'Mumbai',
        type: 'Football',
        pricePerHour: 600,
        rating: 4.5,
        image: 'https://picsum.photos/seed/turf1/400/300',
        amenities: ['Floodlit', 'Parking', 'Changing Room']
    },
    {
        id: '2',
        name: 'Champions Ground',
        location: 'Koregaon Park',
        city: 'Pune',
        type: 'Cricket',
        pricePerHour: 1200,
        rating: 4.8,
        image: 'https://picsum.photos/seed/turf2/400/300',
        amenities: ['Floodlit', 'Cafeteria', 'First Aid']
    },
    {
        id: '3',
        name: 'Victory Sports Arena',
        location: 'Whitefield',
        city: 'Bangalore',
        type: 'Badminton',
        pricePerHour: 400,
        rating: 4.2,
        image: 'https://picsum.photos/seed/turf3/400/300',
        amenities: ['Parking', 'Changing Room']
    },
    {
        id: '4',
        name: 'Elite Football Hub',
        location: 'Bandra East',
        city: 'Mumbai',
        type: 'Football',
        pricePerHour: 800,
        rating: 4.6,
        image: 'https://picsum.photos/seed/turf4/400/300',
        amenities: ['Floodlit', 'Parking', 'Cafeteria']
    },
    {
        id: '5',
        name: 'Striker Zone',
        location: 'Viman Nagar',
        city: 'Pune',
        type: 'Pickleball',
        pricePerHour: 350,
        rating: 4.0,
        image: 'https://picsum.photos/seed/turf5/400/300',
        amenities: ['Changing Room', 'First Aid']
    },
    {
        id: '6',
        name: 'Premier Turf Complex',
        location: 'Indiranagar',
        city: 'Bangalore',
        type: 'Cricket',
        pricePerHour: 1500,
        rating: 4.9,
        image: 'https://picsum.photos/seed/turf6/400/300',
        amenities: ['Floodlit', 'Parking', 'Cafeteria', 'Changing Room']
    },
    {
        id: '7',
        name: 'Goal Masters Arena',
        location: 'Powai',
        city: 'Mumbai',
        type: 'Football',
        pricePerHour: 700,
        rating: 4.4,
        image: 'https://picsum.photos/seed/turf7/400/300',
        amenities: ['Floodlit', 'Parking']
    },
    {
        id: '8',
        name: 'Sports Villa',
        location: 'Hinjewadi',
        city: 'Pune',
        type: 'Volleyball',
        pricePerHour: 450,
        rating: 4.3,
        image: 'https://picsum.photos/seed/turf8/400/300',
        amenities: ['Parking', 'Changing Room', 'First Aid']
    },
    {
        id: '9',
        name: 'Mega Sports Ground',
        location: 'Electronic City',
        city: 'Bangalore',
        type: 'Tennis',
        pricePerHour: 650,
        rating: 4.7,
        image: 'https://picsum.photos/seed/turf9/400/300',
        amenities: ['Floodlit', 'Cafeteria', 'Changing Room']
    },
    {
        id: '10',
        name: 'PlayZone Turf',
        location: 'Juhu',
        city: 'Mumbai',
        type: 'Cricket',
        pricePerHour: 1100,
        rating: 4.5,
        image: 'https://picsum.photos/seed/turf10/400/300',
        amenities: ['Floodlit', 'Parking', 'Cafeteria']
    },
    {
        id: '11',
        name: 'Urban Sports Hub',
        location: 'Kharadi',
        city: 'Pune',
        type: 'Badminton',
        pricePerHour: 550,
        rating: 4.1,
        image: 'https://picsum.photos/seed/turf11/400/300',
        amenities: ['Parking', 'Changing Room']
    },
    {
        id: '12',
        name: 'Galaxy Turf Arena',
        location: 'HSR Layout',
        city: 'Bangalore',
        type: 'Volleyball',
        pricePerHour: 380,
        rating: 4.4,
        image: 'https://picsum.photos/seed/turf12/400/300',
        amenities: ['Floodlit', 'First Aid']
    }
];

export const cities = ['All Cities', 'Mumbai', 'Pune', 'Bangalore'];

export const turfTypes = ['All Types', 'Cricket', 'Football', 'Volleyball', 'Pickleball', 'Badminton', 'Tennis'];

export const generateTimeSlots = (date: string, turfId: string): { time: string; isBooked: boolean }[] => {
    const slots = [
        '9:00 AM',
        '11:00 AM',
        '1:00 PM',
        '3:00 PM',
        '5:00 PM',
        '7:00 PM',
        '9:00 PM'
    ];

    // Simulate random booked slots based on turf ID and date for consistency
    const seed = parseInt(turfId) + new Date(date).getDate();

    return slots.map((time, index) => ({
        time,
        isBooked: (seed + index) % 3 === 0 // Roughly 1/3 of slots are booked
    }));
};
