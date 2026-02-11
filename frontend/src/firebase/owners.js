/**
 * Firebase Firestore - Owners Collection Operations
 * 
 * Manages owner profiles, earnings, and business information.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { getBookingsByOwner } from './bookings';

const OWNERS_COLLECTION = 'owners';

/**
 * Create owner profile
 * @param {Object} ownerData - Owner profile data
 * @returns {Promise<Object>} Created owner object
 */
export const createOwnerProfile = async (ownerData) => {
  try {
    const ownerId = ownerData.id || doc(collection(db, OWNERS_COLLECTION)).id;
    const ownerRef = doc(db, OWNERS_COLLECTION, ownerId);

    const newOwner = {
      ...ownerData,
      id: ownerId,
      status: 'pending', // Needs admin approval
      turfIds: [],
      totalEarnings: 0,
      pendingPayouts: 0,
      createdAt: serverTimestamp(),
      approvedAt: null,
      lastPayoutDate: null,
    };

    await setDoc(ownerRef, newOwner);

    console.log('✅ Owner profile created successfully:', ownerId);
    return { id: ownerId, ...newOwner };
  } catch (error) {
    console.error('❌ Error creating owner profile:', error);
    throw new Error(`Failed to create owner profile: ${error.message}`);
  }
};

/**
 * Get owner by ID
 * @param {string} ownerId - Owner ID
 * @returns {Promise<Object>} Owner object
 */
export const getOwnerById = async (ownerId) => {
  try {
    const ownerRef = doc(db, OWNERS_COLLECTION, ownerId);
    const ownerDoc = await getDoc(ownerRef);

    if (!ownerDoc.exists()) {
      throw new Error('Owner not found');
    }

    console.log('✅ Fetched owner:', ownerId);
    return { id: ownerDoc.id, ...ownerDoc.data() };
  } catch (error) {
    console.error('❌ Error fetching owner:', error);
    throw new Error(`Failed to fetch owner: ${error.message}`);
  }
};

/**
 * Get owner by user ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Owner object or null
 */
export const getOwnerByUserId = async (userId) => {
  try {
    const ownersRef = collection(db, OWNERS_COLLECTION);
    const q = query(ownersRef, where('userId', '==', userId));

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const ownerDoc = querySnapshot.docs[0];
    console.log('✅ Fetched owner by user ID:', userId);
    return { id: ownerDoc.id, ...ownerDoc.data() };
  } catch (error) {
    console.error('❌ Error fetching owner by user ID:', error);
    throw new Error(`Failed to fetch owner: ${error.message}`);
  }
};

/**
 * Update owner profile
 * @param {string} ownerId - Owner ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<boolean>} Success status
 */
export const updateOwnerProfile = async (ownerId, updates) => {
  try {
    const ownerRef = doc(db, OWNERS_COLLECTION, ownerId);

    await updateDoc(ownerRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Owner profile updated:', ownerId);
    return true;
  } catch (error) {
    console.error('❌ Error updating owner profile:', error);
    throw new Error(`Failed to update owner profile: ${error.message}`);
  }
};

/**
 * Add turf to owner's turf list
 * @param {string} ownerId - Owner ID
 * @param {string} turfId - Turf ID to add
 * @returns {Promise<boolean>} Success status
 */
export const addTurfToOwner = async (ownerId, turfId) => {
  try {
    const ownerRef = doc(db, OWNERS_COLLECTION, ownerId);
    const ownerDoc = await getDoc(ownerRef);

    if (!ownerDoc.exists()) {
      throw new Error('Owner not found');
    }

    const currentTurfIds = ownerDoc.data().turfIds || [];

    if (!currentTurfIds.includes(turfId)) {
      currentTurfIds.push(turfId);

      await updateDoc(ownerRef, {
        turfIds: currentTurfIds,
        updatedAt: serverTimestamp(),
      });

      console.log(`✅ Turf ${turfId} added to owner ${ownerId}`);
    }

    return true;
  } catch (error) {
    console.error('❌ Error adding turf to owner:', error);
    throw new Error(`Failed to add turf: ${error.message}`);
  }
};

/**
 * Calculate owner's total earnings from bookings
 * @param {string} ownerId - Owner ID
 * @returns {Promise<Object>} Earnings summary
 */
export const getOwnerEarnings = async (ownerId) => {
  try {
    const bookings = await getBookingsByOwner(ownerId);

    let totalEarnings = 0;
    let pendingPayouts = 0;
    let completedBookings = 0;

    bookings.forEach((booking) => {
      if (booking.status === 'completed' && booking.paymentStatus === 'paid') {
        totalEarnings += booking.ownerAmount || 0;
        completedBookings++;
      } else if (
        booking.status === 'confirmed' &&
        booking.paymentStatus === 'paid'
      ) {
        pendingPayouts += booking.ownerAmount || 0;
      }
    });

    const earnings = {
      totalEarnings,
      pendingPayouts,
      completedBookings,
      totalBookings: bookings.length,
    };

    console.log('✅ Calculated owner earnings:', earnings);
    return earnings;
  } catch (error) {
    console.error('❌ Error calculating earnings:', error);
    throw new Error(`Failed to calculate earnings: ${error.message}`);
  }
};

/**
 * Approve owner (admin only)
 * @param {string} ownerId - Owner ID
 * @returns {Promise<boolean>} Success status
 */
export const approveOwner = async (ownerId) => {
  try {
    const ownerRef = doc(db, OWNERS_COLLECTION, ownerId);

    await updateDoc(ownerRef, {
      status: 'approved',
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ Owner ${ownerId} approved`);
    return true;
  } catch (error) {
    console.error('❌ Error approving owner:', error);
    throw new Error(`Failed to approve owner: ${error.message}`);
  }
};

/**
 * Reject owner (admin only)
 * @param {string} ownerId - Owner ID
 * @returns {Promise<boolean>} Success status
 */
export const rejectOwner = async (ownerId) => {
  try {
    const ownerRef = doc(db, OWNERS_COLLECTION, ownerId);

    await updateDoc(ownerRef, {
      status: 'rejected',
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ Owner ${ownerId} rejected`);
    return true;
  } catch (error) {
    console.error('❌ Error rejecting owner:', error);
    throw new Error(`Failed to reject owner: ${error.message}`);
  }
};
