/**
 * Firebase Firestore - Bookings Collection Operations
 * 
 * Manages booking creation, retrieval, and status updates.
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
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { getCurrentUser } from './auth';

const BOOKINGS_COLLECTION = 'bookings';

/**
 * Generate unique booking ID
 * @returns {string} Booking ID in format "TRF-2025-12345"
 */
const generateBookingId = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `TRF-${year}-${random}`;
};

/**
 * Create new booking
 * @param {Object} bookingData - Booking details
 * @returns {Promise<Object>} Created booking object
 */
export const createBooking = async (bookingData) => {
  try {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to create booking');
    }

    const bookingId = generateBookingId();
    const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingId);

    const newBooking = {
      ...bookingData,
      id: bookingId,
      bookingId: bookingId,
      userId: user.uid,
      status: 'confirmed',
      paymentStatus: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      completedAt: null,
    };

    await setDoc(bookingRef, newBooking);

    console.log('✅ Booking created successfully:', bookingId);
    return { id: bookingId, ...newBooking };
  } catch (error) {
    console.error('❌ Error creating booking:', error);
    throw new Error(`Failed to create booking: ${error.message}`);
  }
};

/**
 * Get bookings for a specific user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of booking objects
 */
export const getBookingsByUser = async (userId) => {
  try {
    const bookingsRef = collection(db, BOOKINGS_COLLECTION);
    const q = query(
      bookingsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const bookings = [];

    querySnapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() });
    });

    console.log(`✅ Fetched ${bookings.length} bookings for user ${userId}`);
    return bookings;
  } catch (error) {
    console.error('❌ Error fetching user bookings:', error);
    throw new Error(`Failed to fetch bookings: ${error.message}`);
  }
};

/**
 * Get bookings for a specific owner (all their turfs)
 * @param {string} ownerId - Owner ID
 * @returns {Promise<Array>} Array of booking objects
 */
export const getBookingsByOwner = async (ownerId) => {
  try {
    const bookingsRef = collection(db, BOOKINGS_COLLECTION);
    const q = query(
      bookingsRef,
      where('ownerId', '==', ownerId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const bookings = [];

    querySnapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() });
    });

    console.log(`✅ Fetched ${bookings.length} bookings for owner ${ownerId}`);
    return bookings;
  } catch (error) {
    console.error('❌ Error fetching owner bookings:', error);
    throw new Error(`Failed to fetch bookings: ${error.message}`);
  }
};

/**
 * Get bookings for a specific turf
 * @param {string} turfId - Turf ID
 * @returns {Promise<Array>} Array of booking objects
 */
export const getBookingsByTurf = async (turfId) => {
  try {
    const bookingsRef = collection(db, BOOKINGS_COLLECTION);
    const q = query(
      bookingsRef,
      where('turfId', '==', turfId),
      orderBy('bookedDate', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const bookings = [];

    querySnapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() });
    });

    console.log(`✅ Fetched ${bookings.length} bookings for turf ${turfId}`);
    return bookings;
  } catch (error) {
    console.error('❌ Error fetching turf bookings:', error);
    throw new Error(`Failed to fetch bookings: ${error.message}`);
  }
};

/**
 * Get single booking by ID
 * @param {string} bookingId - Booking ID
 * @returns {Promise<Object>} Booking object
 */
export const getBookingById = async (bookingId) => {
  try {
    const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    const bookingDoc = await getDoc(bookingRef);

    if (!bookingDoc.exists()) {
      throw new Error('Booking not found');
    }

    console.log('✅ Fetched booking:', bookingId);
    return { id: bookingDoc.id, ...bookingDoc.data() };
  } catch (error) {
    console.error('❌ Error fetching booking:', error);
    throw new Error(`Failed to fetch booking: ${error.message}`);
  }
};

/**
 * Update booking status
 * @param {string} bookingId - Booking ID
 * @param {string} status - New status ('confirmed' | 'cancelled' | 'completed')
 * @returns {Promise<boolean>} Success status
 */
export const updateBookingStatus = async (bookingId, status) => {
  try {
    const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    const updates = {
      status,
      updatedAt: serverTimestamp(),
    };

    if (status === 'completed') {
      updates.completedAt = serverTimestamp();
    }

    await updateDoc(bookingRef, updates);

    console.log(`✅ Booking ${bookingId} status updated to ${status}`);
    return true;
  } catch (error) {
    console.error('❌ Error updating booking status:', error);
    throw new Error(`Failed to update booking: ${error.message}`);
  }
};

/**
 * Cancel booking (with user verification)
 * @param {string} bookingId - Booking ID
 * @param {string} userId - User ID requesting cancellation
 * @returns {Promise<boolean>} Success status
 */
export const cancelBooking = async (bookingId, userId) => {
  try {
    const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    const bookingDoc = await getDoc(bookingRef);

    if (!bookingDoc.exists()) {
      throw new Error('Booking not found');
    }

    const bookingData = bookingDoc.data();

    // Verify user owns this booking
    if (bookingData.userId !== userId) {
      throw new Error('Unauthorized: You do not own this booking');
    }

    // Check if booking can be cancelled (not already completed)
    if (bookingData.status === 'completed') {
      throw new Error('Cannot cancel completed booking');
    }

    await updateDoc(bookingRef, {
      status: 'cancelled',
      paymentStatus: 'refunded',
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ Booking ${bookingId} cancelled successfully`);
    return true;
  } catch (error) {
    console.error('❌ Error cancelling booking:', error);
    throw new Error(`Failed to cancel booking: ${error.message}`);
  }
};

/**
 * Update payment status
 * @param {string} bookingId - Booking ID
 * @param {string} paymentStatus - New payment status ('pending' | 'paid' | 'refunded')
 * @returns {Promise<boolean>} Success status
 */
export const updatePaymentStatus = async (bookingId, paymentStatus) => {
  try {
    const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingId);

    await updateDoc(bookingRef, {
      paymentStatus,
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ Payment status updated to ${paymentStatus}`);
    return true;
  } catch (error) {
    console.error('❌ Error updating payment status:', error);
    throw new Error(`Failed to update payment: ${error.message}`);
  }
};
