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
 * @param {string} params.sport             - e.g. 'Football', 'Cricket'
 * @param {string} params.groundId          - e.g. 'ground-1'
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
    sport,
    groundId,
    paymentId,
    razorpayOrderId,
  } = params;

  return await adminDb.runTransaction(async (transaction) => {
    // ── Idempotency guard ─────────────────────────────────────────────────────
    // Query existing booking for this order ID
    const existingQuery = adminDb
      .collection('bookings')
      .where('razorpayOrderId', '==', razorpayOrderId)
      .limit(1);
    const existingSnapshot = await transaction.get(existingQuery);

    if (!existingSnapshot.empty) {
      const existingId = existingSnapshot.docs[0].id;
      console.log(`ℹ️  Duplicate booking prevented for order: ${razorpayOrderId} → existing bookingId: ${existingId}`);
      return existingId;
    }

    // ── Slot Availability Check ───────────────────────────────────────────────
    // Query all confirmed bookings for this turf on this date.
    // Owner-created bookings use `date`, user-created use `bookedDate`.
    // Firestore transactions don't allow Promise.all, so run sequentially.
    const byBookedDateQuery = adminDb
      .collection('bookings')
      .where('turfId', '==', turfId)
      .where('bookedDate', '==', bookedDate)
      .where('status', '==', 'confirmed');
    const byDateQuery = adminDb
      .collection('bookings')
      .where('turfId', '==', turfId)
      .where('date', '==', bookedDate)
      .where('status', '==', 'confirmed');

    const [byBookedDateSnap, byDateSnap] = await Promise.all([
      transaction.get(byBookedDateQuery),
      transaction.get(byDateQuery),
    ]);

    const bookedSlotsOnDate = new Set();
    const seenIds = new Set();

    function collectSlots(doc) {
      if (seenIds.has(doc.id)) return;
      seenIds.add(doc.id);
      const data = doc.data();

      // Format 1: timeSlots array
      if (Array.isArray(data.timeSlots) && data.timeSlots.length > 0) {
        data.timeSlots.forEach(slot => bookedSlotsOnDate.add(slot));
        return;
      }
      // Format 2: startTime/endTime
      if (data.startTime && data.endTime) {
        const sH = parseInt(data.startTime.split(':')[0], 10);
        const eH = parseInt(data.endTime.split(':')[0], 10);
        if (!isNaN(sH) && !isNaN(eH) && eH > sH) {
          for (let h = sH; h < eH; h++) {
            bookedSlotsOnDate.add(`${String(h).padStart(2, '0')}:00`);
          }
          return;
        }
      }
      // Format 3: startHour + duration
      if (typeof data.startHour === 'number' && typeof data.duration === 'number') {
        for (let h = data.startHour; h < data.startHour + data.duration; h++) {
          bookedSlotsOnDate.add(`${String(h).padStart(2, '0')}:00`);
        }
      }
    }

    byBookedDateSnap.forEach(collectSlots);
    byDateSnap.forEach(collectSlots);

    // Check if any requested timeSlot overlaps with already booked slots
    const conflictingSlots = timeSlots.filter(slot => bookedSlotsOnDate.has(slot));
    if (conflictingSlots.length > 0) {
      throw new Error(`The following slots are already booked: ${conflictingSlots.join(', ')}`);
    }

    // ── Create new booking document ───────────────────────────────────────────
    const bookingRef = adminDb.collection('bookings').doc();

    transaction.set(bookingRef, {
      id: bookingRef.id,
      // User info
      userId,
      userEmail,
      userName,
      // Turf info
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
      amount: totalPrice,  // alias for owner dashboard
      sport: sport || '',
      groundId: groundId || '',
      // Status
      status: 'confirmed',
      bookedBy: 'user',
      paymentMethod: 'razorpay',
      paymentStatus: 'paid',
      emailSent: false,
      // Payment reference
      paymentId,
      razorpayOrderId,
      // Timestamps
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`✅ Booking created in Firestore Transaction: ${bookingRef.id} for user: ${userId}`);
    return bookingRef.id;
  });
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
