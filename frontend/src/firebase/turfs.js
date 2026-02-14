/**
 * Firebase Firestore - Turfs Collection Operations
 * 
 * Complete CRUD operations for managing turf listings with ownership verification.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { getCurrentUserProfile } from './auth';

const TURFS_COLLECTION = 'turf';

// ... (Rest of the file remains same, updating seedSampleTurfs at the bottom)

// ============================================================================
// READ OPERATIONS (Public - anyone can call)
// ============================================================================

/**
 * Get all active turfs
 * @returns {Promise<Array>} Array of turf objects
 */
export const getAllTurfs = async () => {
  try {
    const turfsRef = collection(db, TURFS_COLLECTION);
    const q = query(
      turfsRef,
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const turfs = [];
    
    querySnapshot.forEach((doc) => {
      turfs.push({ id: doc.id, ...doc.data() });
    });

    console.log(`✅ Fetched ${turfs.length} active turfs`);
    return turfs;
  } catch (error) {
    console.error('❌ Error fetching turfs:', error);
    throw new Error(`Failed to fetch turfs: ${error.message}`);
  }
};

/**
 * Get single turf by ID
 * @param {string} turfId - Turf document ID
 * @returns {Promise<Object>} Turf object
 */
export const getTurfById = async (turfId) => {
  try {
    const turfRef = doc(db, TURFS_COLLECTION, turfId);
    const turfDoc = await getDoc(turfRef);

    if (!turfDoc.exists()) {
      throw new Error('Turf not found');
    }

    console.log('✅ Fetched turf:', turfId);
    return { id: turfDoc.id, ...turfDoc.data() };
  } catch (error) {
    console.error('❌ Error fetching turf:', error);
    throw new Error(`Failed to fetch turf: ${error.message}`);
  }
};

/**
 * Get turfs by city
 * @param {string} city - City name
 * @returns {Promise<Array>} Array of turf objects
 */
export const getTurfsByCity = async (city) => {
  try {
    const turfsRef = collection(db, TURFS_COLLECTION);
    const q = query(
      turfsRef,
      where('location.city', '==', city),
      where('status', '==', 'active')
    );

    const querySnapshot = await getDocs(q);
    const turfs = [];

    querySnapshot.forEach((doc) => {
      turfs.push({ id: doc.id, ...doc.data() });
    });

    console.log(`✅ Fetched ${turfs.length} turfs in ${city}`);
    return turfs;
  } catch (error) {
    console.error('❌ Error fetching turfs by city:', error);
    throw new Error(`Failed to fetch turfs by city: ${error.message}`);
  }
};

/**
 * Get turfs by sport type
 * @param {string} sport - Sport type (e.g., "Football", "Cricket")
 * @returns {Promise<Array>} Array of turf objects
 */
export const getTurfsBySport = async (sport) => {
  try {
    const turfsRef = collection(db, TURFS_COLLECTION);
    const q = query(
      turfsRef,
      where('sport', '==', sport),
      where('status', '==', 'active')
    );

    const querySnapshot = await getDocs(q);
    const turfs = [];

    querySnapshot.forEach((doc) => {
      turfs.push({ id: doc.id, ...doc.data() });
    });

    console.log(`✅ Fetched ${turfs.length} ${sport} turfs`);
    return turfs;
  } catch (error) {
    console.error('❌ Error fetching turfs by sport:', error);
    throw new Error(`Failed to fetch turfs by sport: ${error.message}`);
  }
};

/**
 * Get all turfs owned by a specific owner
 * @param {string} ownerId - Owner ID
 * @returns {Promise<Array>} Array of turf objects
 */
export const getTurfsByOwner = async (ownerId) => {
  try {
    const turfsRef = collection(db, TURFS_COLLECTION);
    const q = query(turfsRef, where('ownerId', '==', ownerId));

    const querySnapshot = await getDocs(q);
    const turfs = [];

    querySnapshot.forEach((doc) => {
      turfs.push({ id: doc.id, ...doc.data() });
    });

    console.log(`✅ Fetched ${turfs.length} turfs for owner ${ownerId}`);
    return turfs;
  } catch (error) {
    console.error('❌ Error fetching turfs by owner:', error);
    throw new Error(`Failed to fetch turfs by owner: ${error.message}`);
  }
};

/**
 * Advanced search with multiple filters
 * @param {Object} filters - Filter object { city?, sport?, maxPrice?, turfSize? }
 * @returns {Promise<Array>} Filtered array of turfs
 */
export const searchTurfs = async (filters = {}) => {
  try {
    const turfsRef = collection(db, TURFS_COLLECTION);
    let q = query(turfsRef, where('status', '==', 'active'));

    // Note: Firestore has limitations with multiple where clauses
    // For complex filtering, fetch all and filter in memory
    const querySnapshot = await getDocs(q);
    let turfs = [];

    querySnapshot.forEach((doc) => {
      turfs.push({ id: doc.id, ...doc.data() });
    });

    // Apply filters in memory
    if (filters.city) {
      turfs = turfs.filter((turf) => turf.location.city === filters.city);
    }

    if (filters.sport) {
      turfs = turfs.filter((turf) => turf.sport === filters.sport);
    }

    if (filters.maxPrice) {
      turfs = turfs.filter(
        (turf) => turf.pricing.basePrice <= filters.maxPrice
      );
    }

    if (filters.turfSize) {
      turfs = turfs.filter((turf) => turf.turfSize === filters.turfSize);
    }

    console.log(`✅ Search returned ${turfs.length} turfs`);
    return turfs;
  } catch (error) {
    console.error('❌ Error searching turfs:', error);
    throw new Error(`Failed to search turfs: ${error.message}`);
  }
};

// ============================================================================
// WRITE OPERATIONS (Protected - ownership checked)
// ============================================================================

/**
 * Create new turf
 * @param {string} turfId - Turf document ID (slug format)
 * @param {Object} turfData - Turf data object
 * @param {string} currentUserId - Current user's ID
 * @returns {Promise<Object>} Created turf object
 */
export const createTurf = async (turfId, turfData, currentUserId) => {
  try {
    // Get current user's profile to verify they're an owner
    const userProfile = await getCurrentUserProfile();
    
    if (!userProfile || userProfile.role !== 'owner') {
      throw new Error('Unauthorized: Only owners can create turfs');
    }

    if (!userProfile.ownerId) {
      throw new Error('User does not have an associated owner profile');
    }

    const turfRef = doc(db, TURFS_COLLECTION, turfId);

    const newTurf = {
      ...turfData,
      id: turfId,
      ownerId: userProfile.ownerId,
      status: 'pending', // Needs admin approval
      isApproved: false,
      totalBookings: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(turfRef, newTurf);

    console.log('✅ Turf created successfully:', turfId);
    return { id: turfId, ...newTurf };
  } catch (error) {
    console.error('❌ Error creating turf:', error);
    throw new Error(`Failed to create turf: ${error.message}`);
  }
};

/**
 * Update existing turf (with ownership verification)
 * @param {string} turfId - Turf document ID
 * @param {Object} updates - Fields to update
 * @param {string} currentUserId - Current user's ID
 * @returns {Promise<boolean>} Success status
 */
export const updateTurf = async (turfId, updates, currentUserId) => {
  try {
    // Get current user's profile
    const userProfile = await getCurrentUserProfile();
    
    if (!userProfile) {
      throw new Error('Unauthorized: User not authenticated');
    }

    // Fetch the turf to verify ownership
    const turfRef = doc(db, TURFS_COLLECTION, turfId);
    const turfDoc = await getDoc(turfRef);

    if (!turfDoc.exists()) {
      throw new Error('Turf not found');
    }

    const turfData = turfDoc.data();

    // Verify ownership (or admin)
    if (
      turfData.ownerId !== userProfile.ownerId &&
      userProfile.role !== 'admin'
    ) {
      throw new Error('Unauthorized: You do not own this turf');
    }

    // Update the turf
    await updateDoc(turfRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Turf updated successfully:', turfId);
    return true;
  } catch (error) {
    console.error('❌ Error updating turf:', error);
    throw new Error(`Failed to update turf: ${error.message}`);
  }
};

/**
 * Delete turf (soft delete - sets status to "deleted")
 * @param {string} turfId - Turf document ID
 * @param {string} currentUserId - Current user's ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteTurf = async (turfId, currentUserId) => {
  try {
    // Get current user's profile
    const userProfile = await getCurrentUserProfile();
    
    if (!userProfile) {
      throw new Error('Unauthorized: User not authenticated');
    }

    // Fetch the turf to verify ownership
    const turfRef = doc(db, TURFS_COLLECTION, turfId);
    const turfDoc = await getDoc(turfRef);

    if (!turfDoc.exists()) {
      throw new Error('Turf not found');
    }

    const turfData = turfDoc.data();

    // Verify ownership (or admin)
    if (
      turfData.ownerId !== userProfile.ownerId &&
      userProfile.role !== 'admin'
    ) {
      throw new Error('Unauthorized: You do not own this turf');
    }

    // Soft delete - just update status
    await updateDoc(turfRef, {
      status: 'deleted',
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Turf deleted successfully:', turfId);
    return true;
  } catch (error) {
    console.error('❌ Error deleting turf:', error);
    throw new Error(`Failed to delete turf: ${error.message}`);
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Seed sample turfs for development
 * @returns {Promise<string>} Success message
 */
export const seedSampleTurfs = async () => {
  try {
    const sampleTurfs = [
      {
        id: '1',  // This sets the Document ID in Firestore to "1"
        slug: 'green-arena-andheri',
        name: 'Green Arena Turf',
        description:
          'Premium 7-a-side football turf in the heart of Andheri West. Features high-quality artificial grass, floodlights, and modern amenities.',
        sport: 'Football',
        turfSize: '7-a-side',
        surfaceType: 'Artificial Grass',
        location: {
          address: 'Veera Desai Road, Andheri West',
          city: 'Mumbai',
          pincode: '400053',
          coordinates: { lat: 19.1334, lng: 72.8291 },
          googleMapsLink: 'https://maps.google.com',
        },
        amenities: [
          'Parking',
          'Changing Room',
          'Floodlights',
          'First Aid',
          'Water',
        ],
        images: [
          'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800',
          'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
        ],
        coverImage:
          'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800',
        pricing: {
          basePrice: 600,
          weekendPrice: 700,
          peakHourPrice: 800,
        },
        operatingHours: {
          opensAt: '06:00',
          closesAt: '23:00',
          availableDays: [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday',
          ],
        },
        ownerId: 'owner123',
        ownerName: 'Rajesh Kumar',
        ownerPhone: '+91 98765 43210',
        rating: 4.5,
        totalReviews: 128,
        totalBookings: 0,
        status: 'active',
        isApproved: true,
        isFeatured: true,
      },
      {
        id: '2', // Document ID "2"
        slug: 'sports-hub-bandra',
        name: 'Sports Hub Mumbai',
        description:
          'Compact 5-a-side turf perfect for quick matches. Located in Bandra West with easy access and great facilities.',
        sport: 'Football',
        turfSize: '5-a-side',
        surfaceType: 'Artificial Grass',
        location: {
          address: 'Hill Road, Bandra West',
          city: 'Mumbai',
          pincode: '400050',
          coordinates: { lat: 19.0596, lng: 72.8295 },
          googleMapsLink: 'https://maps.google.com',
        },
        amenities: ['Parking', 'Changing Room', 'Floodlights', 'Cafeteria'],
        images: [
          'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
        ],
        coverImage:
          'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
        pricing: {
          basePrice: 500,
          weekendPrice: 600,
          peakHourPrice: 700,
        },
        operatingHours: {
          opensAt: '07:00',
          closesAt: '22:00',
          availableDays: [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday',
          ],
        },
        ownerId: 'owner123',
        ownerName: 'Rajesh Kumar',
        ownerPhone: '+91 98765 43210',
        rating: 4.2,
        totalReviews: 85,
        totalBookings: 0,
        status: 'active',
        isApproved: true,
        isFeatured: false,
      },
      {
        id: '3', // Document ID "3"
        slug: 'cric-zone-pune',
        name: 'CricZone Pune',
        description:
          'Professional box cricket turf with net practice area. High ceilings (30ft) and excellent lighting for night matches.',
        sport: 'Cricket',
        turfSize: 'Box Cricket',
        surfaceType: 'Artificial Grass',
        location: {
          address: 'Baner Road',
          city: 'Pune',
          pincode: '411045',
          coordinates: { lat: 18.5593, lng: 73.7788 },
          googleMapsLink: 'https://maps.google.com',
        },
        amenities: [
          'Parking',
          'Changing Room',
          'Floodlights',
          'Seating',
          'Scoreboard',
          'Equipment Rental'
        ],
        images: [
          'https://images.unsplash.com/photo-1531415074984-618821df08cd?w=800',
        ],
        coverImage:
          'https://images.unsplash.com/photo-1531415074984-618821df08cd?w=800',
        pricing: {
          basePrice: 1200,
          weekendPrice: 1400,
          peakHourPrice: 1600,
        },
        operatingHours: {
          opensAt: '06:00',
          closesAt: '24:00',
          availableDays: [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday',
          ],
        },
        ownerId: 'owner456',
        ownerName: 'Amit Sharma',
        ownerPhone: '+91 98765 12345',
        rating: 4.7,
        totalReviews: 203,
        totalBookings: 0,
        status: 'active',
        isApproved: true,
        isFeatured: true,
      }
    ];

    for (const turf of sampleTurfs) {
      const turfRef = doc(db, TURFS_COLLECTION, turf.id);
      await setDoc(turfRef, {
        ...turf,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log(`✅ Seeded turf: ${turf.name}`);
    }

    return `✅ Successfully seeded ${sampleTurfs.length} sample turfs`;
  } catch (error) {
    console.error('❌ Error seeding turfs:', error);
    throw new Error(`Failed to seed turfs: ${error.message}`);
  }
};
