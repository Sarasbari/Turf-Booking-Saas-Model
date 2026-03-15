/**
 * Booking Service
 *
 * Encapsulates all Firestore booking creation logic.
 * ONLY the backend (Admin SDK) calls these functions.
 * Clients CANNOT write to the 'bookings' collection (enforced by Firestore rules).
 *
 * Idempotency: If a booking with the same razorpayOrderId already exists,
 * the write is skipped and the existing booking ID is returned.
 * This prevents double-bookings if the verify endpoint is called twice.
 */

import { adminDb } from '../config/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Create a confirmed booking in Firestore.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.userEmail
 * @param {string} params.userName
 * @param {string} params.turfId
 * @param {string} params.turfName
 * @param {string} params.turfAddress
 * @param {string} params.turfImage
 * @param {string} params.ownerContact
 * @param {string} params.bookedDate        - 'YYYY-MM-DD'
 * @param {string[]} params.timeSlots       - ['06:00', '07:00', '08:00']
 * @param {number} params.totalPrice
 * @param {string} params.paymentId         - razorpay_payment_id
 * @param {string} params.razorpayOrderId   - razorpay_order_id (idempotency key)
 * @returns {Promise<string>} bookingId
 */
export async function createBooking(params) {
  const {
    userId,
    userEmail,
    userName,
    turfId,
    turfName,
    turfAddress,
    turfImage,
    ownerContact,
    bookedDate,
    timeSlots,
    totalPrice,
    paymentId,
    razorpayOrderId,
  } = params;

  // ── Idempotency guard ─────────────────────────────────────────────────────
  // If a booking already exists for this Razorpay order, return its ID.
  // This handles the case where /verify is called more than once (e.g., network retry).
  const existing = await adminDb
    .collection('bookings')
    .where('razorpayOrderId', '==', razorpayOrderId)
    .limit(1)
    .get();

  if (!existing.empty) {
    const existingId = existing.docs[0].id;
    console.log(`ℹ️  Duplicate booking prevented for order: ${razorpayOrderId} → existing bookingId: ${existingId}`);
    return existingId;
  }

  // ── Create new booking document ───────────────────────────────────────────
  const bookingRef = adminDb.collection('bookings').doc();

  await bookingRef.set({
    id: bookingRef.id,
    // User info
    userId,
    userEmail,
    userName,
    // Turf info (denormalized for fast reads — avoids secondary Firestore fetches in email/display)
    turfId,
    turfName,
    turfAddress,
    turfImage,
    ownerContact,
    // Booking details
    bookedDate,          // 'YYYY-MM-DD'
    date: bookedDate,    // backward-compat alias for legacy queries
    timeSlots,           // ['06:00', '07:00', '08:00']
    totalPrice,
    // Status
    status: 'confirmed',
    emailSent: false,
    // Payment reference
    paymentId,
    razorpayOrderId,
    // Timestamps
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log(`✅ Booking created in Firestore: ${bookingRef.id} for user: ${userId}`);
  return bookingRef.id;
}

/**
 * Mark a booking's emailSent flag as true.
 * Called after confirmation email is successfully sent.
 *
 * @param {string} bookingId
 * @returns {Promise<void>}
 */
export async function markEmailSent(bookingId) {
  try {
    await adminDb.collection('bookings').doc(bookingId).update({
      emailSent: true,
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`📧 emailSent=true for booking: ${bookingId}`);
  } catch (err) {
    // Non-fatal — booking is already confirmed, email status update is cosmetic
    console.error(`⚠️  Failed to update emailSent for booking ${bookingId}:`, err.message);
  }
}
