/**
 * Payment Controller
 *
 * Handles Razorpay order creation and payment verification.
 *
 * 3-Layer Atomic Locking:
 *   Layer 2 — create-order: acquireSlotLocks() BEFORE Razorpay order creation
 *   Layer 3 — verify: Firestore transaction to verify lock ownership,
 *             create booking, and confirm locks atomically
 *
 * Bookings are ONLY written to Firestore after server-side signature verification,
 * via the Admin SDK (bypasses Firestore security rules).
 */

import { createRazorpayOrder, verifyPaymentSignature } from '../services/paymentService.js';
import { markEmailSent } from '../services/bookingService.js';
import { acquireSlotLocks, releaseSlotLocks } from '../services/slotLockService.js';
import { config } from '../config/index.js';
import { sendBookingConfirmation, sendCancellationEmail } from '../services/emailService.js';
import { adminDb } from '../config/firebaseAdmin.js';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { invalidateCache } from '../middleware/cache.js';
import { emailQueue } from '../queues/index.js';
import * as Sentry from '@sentry/node';

// ---------------------------------------------------------------------------
// POST /api/payment/create-order
//
// Layer 2 — Pre-Payment Hard Lock:
//   1. Create Razorpay order (to get orderId)
//   2. Atomically acquire slot locks in Firestore
//   3. If locks fail → return 409 Conflict (slots unavailable)
//   4. If locks succeed → return order details + lock expiry to frontend
// ---------------------------------------------------------------------------

export async function handleCreateOrder(req, res) {
  try {
    const { turfId, slots, totalPrice, date } = req.body;
    const user = req.firebaseUser;

    // ── Input validation ──────────────────────────────────────────────
    if (!turfId || typeof turfId !== 'string') {
      return res.status(400).json({ error: 'turfId is required (string)' });
    }
    if (!Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ error: 'slots must be a non-empty array' });
    }
    if (typeof totalPrice !== 'number' || totalPrice <= 0) {
      return res.status(400).json({ error: 'totalPrice must be a positive number' });
    }
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ error: 'date is required (string, e.g. "2026-03-10")' });
    }

    // ── Generate receipt / booking reference ──────────────────────────
    const year = new Date().getFullYear();
    const random = Math.floor(10000 + Math.random() * 90000);
    const receipt = `TRF-${year}-${random}`;

    // ── Step 1: Create Razorpay order (amount in paise) ──────────────
    const amountInPaise = Math.round(totalPrice * 100);
    const order = await createRazorpayOrder(amountInPaise, 'INR', receipt);

    console.log(`✅ Razorpay order created: ${order.id} for user ${user.uid}`);

    // ── Step 2: Atomically acquire slot locks ─────────────────────────
    const lockResult = await acquireSlotLocks({
      turfId,
      date,
      slots,
      userId: user.uid,
      razorpayOrderId: order.id,
    });

    if (!lockResult.success) {
      // Slots not available — return 409 Conflict with details
      console.warn(
        `⚠️  Slot lock failed for user ${user.uid}:`,
        lockResult.error,
        lockResult.slot
      );
      return res.status(409).json({
        success: false,
        error: lockResult.error,
        slot: lockResult.slot,
        message: lockResult.message,
      });
    }

    // ── Step 3: Return order details + lock expiry to frontend ────────
    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: config.razorpay.keyId,
      receipt,
      locksExpiresAt: lockResult.expiresAt.toISOString(),
      meta: { turfId, slots, date, userId: user.uid },
    });
  } catch (error) {
    console.error('❌ Error creating Razorpay order:', error);
    Sentry.captureException(error, {
      tags: { feature: 'payment', step: 'create-order' },
      extra: { turfId: req.body.turfId, userId: req.body.userId },
    });
    return res.status(500).json({
      error: 'Failed to create payment order',
      message: config.nodeEnv === 'development' ? error.message : undefined,
    });
  }
}

// ---------------------------------------------------------------------------
// POST /api/payment/verify
//
// Layer 3 — Atomic Transaction at Verify:
//   1. Verify Razorpay signature (HMAC-SHA256, timing-safe)
//   2. Firestore transaction:
//      a. READ all slot locks for the requested slots
//      b. VERIFY each lock belongs to this user and isn't expired
//      c. WRITE booking document
//      d. UPDATE all locks to status: 'confirmed'
//   3. If transaction fails → slot was taken, return 409 SLOT_TAKEN
//   4. Queue confirmation email (non-blocking)
//
// Expected request body:
//   razorpay_order_id, razorpay_payment_id, razorpay_signature  — from Razorpay
//   turfId, turfName, turfAddress, turfImage, ownerContact       — turf details
//   bookedDate (YYYY-MM-DD), timeSlots (['06:00','07:00']), totalPrice
//   userEmail, userName                                          — from frontend auth
// ---------------------------------------------------------------------------

export async function handleVerifyPayment(req, res) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      // Turf details (passed by frontend at verify time)
      turfId,
      turfName,
      turfAddress,
      turfImage,
      ownerContact,
      // Booking details
      bookedDate,
      timeSlots,
      totalPrice,
      sport,
      groundId,
      // User info (from frontend auth state)
      userEmail,
      userName,
    } = req.body;

    const user = req.firebaseUser; // Firebase-authenticated user (from middleware)

    // ── Input validation ──────────────────────────────────────────────
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        error: 'Missing payment verification fields',
        message: 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required',
      });
    }

    if (!turfId || !bookedDate || !Array.isArray(timeSlots) || timeSlots.length === 0) {
      return res.status(400).json({
        error: 'Missing booking data',
        message: 'turfId, bookedDate, and timeSlots are required',
      });
    }

    // ── Verify Razorpay signature (HMAC-SHA256, timing-safe) ──────────
    const isValidSignature = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValidSignature) {
      console.warn(`⚠️  Invalid payment signature for order ${razorpay_order_id} by user ${user.uid}`);
      return res.status(400).json({
        error: 'Payment verification failed',
        message: 'Invalid payment signature',
      });
    }

    console.log(`✅ Payment signature verified for order: ${razorpay_order_id}`);

    // ── Layer 3: Atomic Transaction — verify locks + create booking ────
    let bookingId;

    try {
      bookingId = await adminDb.runTransaction(async (transaction) => {

        // ── READ: Check all slot locks ──────────────────────────────────
        const lockRefs = timeSlots.map((slot) =>
          adminDb.collection('slotLocks').doc(`${turfId}_${bookedDate}_${slot}`)
        );
        const lockDocs = await Promise.all(
          lockRefs.map((ref) => transaction.get(ref))
        );

        // ── READ: Idempotency guard — check for existing booking ────────
        const existingQuery = adminDb
          .collection('bookings')
          .where('razorpayOrderId', '==', razorpay_order_id)
          .limit(1);
        const existingSnapshot = await transaction.get(existingQuery);

        if (!existingSnapshot.empty) {
          const existingId = existingSnapshot.docs[0].id;
          console.log(`ℹ️  Duplicate booking prevented for order: ${razorpay_order_id} → existing bookingId: ${existingId}`);
          return existingId;
        }

        // ── VERIFY: Each lock must belong to this user and not be expired ─
        for (let i = 0; i < lockDocs.length; i++) {
          const lockDoc = lockDocs[i];
          const slot = timeSlots[i];

          if (!lockDoc.exists) {
            throw new Error(
              `Lock missing for slot ${slot}. Session may have expired.`
            );
          }

          const lock = lockDoc.data();

          // Check if lock expired (10 min window passed)
          if (lock.expiresAt.toMillis() < Date.now()) {
            throw new Error(
              `Lock expired for slot ${slot}. Please try booking again.`
            );
          }

          // Check lock belongs to this user
          if (lock.lockedBy !== user.uid) {
            throw new Error(
              `Slot ${slot} was locked by another user while your payment was processing.`
            );
          }

          // Check not already confirmed (idempotency for lock)
          if (lock.status === 'confirmed' && lock.bookingId) {
            return lock.bookingId;
          }
        }

        // ── WRITE: Create booking document ──────────────────────────────
        const bookingRef = adminDb.collection('bookings').doc();

        transaction.set(bookingRef, {
          id: bookingRef.id,
          // User info
          userId: user.uid,
          userEmail: userEmail || user.email || '',
          userName: userName || user.name || 'User',
          // Turf info
          turfId,
          turfName: turfName || '',
          turfAddress: turfAddress || '',
          turfImage: turfImage || '',
          ownerContact: ownerContact || '',
          // Booking details
          bookedDate,
          date: bookedDate, // backward-compat alias for legacy queries
          timeSlots,
          totalPrice: typeof totalPrice === 'number' ? totalPrice : 0,
          amount: typeof totalPrice === 'number' ? totalPrice : 0,
          sport: sport || '',
          groundId: groundId || '',
          // Status
          status: 'confirmed',
          bookedBy: 'user',
          paymentMethod: 'razorpay',
          paymentStatus: 'paid',
          emailSent: false,
          // Payment reference
          paymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id,
          // Timestamps
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        // ── WRITE: Update all locks to confirmed ────────────────────────
        lockRefs.forEach((ref) => {
          transaction.update(ref, {
            status: 'confirmed',
            bookingId: bookingRef.id,
            confirmedAt: Timestamp.now(),
          });
        });

        console.log(
          `✅ Booking confirmed atomically: ${bookingRef.id} for user: ${user.uid}`
        );
        return bookingRef.id;
      });
    } catch (txnError) {
      // Transaction failed — slot was taken by another user
      console.error('❌ Atomic booking transaction failed:', txnError.message);

      Sentry.captureException(txnError, {
        tags: { feature: 'payment', step: 'verify-transaction' },
        extra: {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          userId: user.uid,
          turfId,
          timeSlots,
        },
      });

      // TODO: Initiate Razorpay refund for the captured payment
      // razorpay.payments.refund(razorpay_payment_id, { amount: totalPrice * 100 })

      return res.status(409).json({
        success: false,
        error: 'SLOT_TAKEN',
        message: txnError.message,
      });
    }

    console.log(`✅ Booking stored: ${bookingId}`);

    // ── Invalidate slot cache for this turf+date ─────────────────────
    invalidateCache(`cache:GET:/api/turfs/${turfId}/slots/${bookedDate}`).catch(() => {});
    invalidateCache(`cache:GET:/api/turfs/${turfId}*`).catch(() => {});

    // ── Queue confirmation email (or send directly if queue disabled) ──
    const formatDate = (dateString) => {
      try {
        return new Date(dateString).toLocaleDateString('en-US', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      } catch {
        return dateString;
      }
    };

    const emailData = {
      toEmail: userEmail || user.email || '',
      userName: userName || user.name || 'User',
      bookingId,
      turfName: turfName || 'Your Turf',
      turfAddress: turfAddress || '',
      ownerContact: ownerContact || '',
      bookedDate: formatDate(bookedDate),
      timeSlots,
      totalAmount: typeof totalPrice === 'number' ? totalPrice : 0,
      paymentId: razorpay_payment_id,
    };

    if (emailQueue && !process.env.VERCEL) {
      // ── BullMQ: queued with retry logic (Only for traditional servers) ──
      await emailQueue.add('booking-confirmation', emailData);
      console.log(`📧 Confirmation email queued for booking: ${bookingId}`);

      // ── Schedule reminder 2 hours before first slot ──────────────────
      try {
        const bookingDateTime = new Date(`${bookedDate}T${timeSlots[0]}`);
        const reminderTime = bookingDateTime.getTime() - (2 * 60 * 60 * 1000);
        const delay = reminderTime - Date.now();

        if (delay > 0) {
          await emailQueue.add('booking-reminder', {
            bookingId,
            toEmail: userEmail || user.email || '',
            userName: userName || user.name || 'User',
            turfName: turfName || 'Your Turf',
            turfAddress: turfAddress || '',
            bookedDate: formatDate(bookedDate),
            timeSlots,
          }, { delay });
          console.log(`⏰ Reminder scheduled in ${Math.round(delay / 60000)} minutes`);
        }
      } catch (reminderErr) {
        // Reminder scheduling failure is non-fatal
        console.error('⚠️  Failed to schedule reminder:', reminderErr.message);
      }
    } else {
      // ── Fallback: direct send (Vercel serverless or no queue) ───────────
      try {
        console.log(`📧 Sending confirmation email directly for ${bookingId}...`);
        await sendBookingConfirmation(emailData);
        await markEmailSent(bookingId);
      } catch (err) {
        console.error(`❌ Email failed for booking ${bookingId}:`, err.message);
      }
    }

    // ── Return success to frontend immediately ────────────────────────
    Sentry.addBreadcrumb({
      message: 'Payment verified and booking created',
      category: 'payment',
      data: { bookingId, amount: totalPrice, turfId },
      level: 'info',
    });

    return res.status(200).json({
      success: true,
      bookingId,
      message: 'Payment verified and booking confirmed',
    });

  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    Sentry.captureException(error, {
      tags: { feature: 'payment', step: 'verify' },
      extra: {
        orderId: req.body.razorpay_order_id,
        userId: req.body.userId,
        turfId: req.body.turfId,
      },
    });
    return res.status(500).json({
      error: 'Payment verification failed',
      message: config.nodeEnv === 'development' ? error.message : undefined,
    });
  }
}

// ---------------------------------------------------------------------------
// POST /api/payment/cancel
// ---------------------------------------------------------------------------

export async function handleCancelBooking(req, res) {
  try {
    const { bookingId } = req.body;
    const user = req.firebaseUser;

    if (!bookingId || typeof bookingId !== 'string') {
      return res.status(400).json({ error: 'bookingId is required (string)' });
    }

    // Fetch the booking
    const bookingRef = adminDb.collection('bookings').doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const bookingData = bookingDoc.data();

    // Verify the authenticated user owns this booking
    if (bookingData.userId !== user.uid) {
      return res.status(403).json({ error: 'You do not own this booking' });
    }

    // Prevent cancelling already-cancelled or completed bookings
    if (bookingData.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }
    if (bookingData.status === 'completed') {
      return res.status(400).json({ error: 'Cannot cancel a completed booking' });
    }

    // Update status to cancelled via Admin SDK
    await bookingRef.update({
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelledBy: 'user',
    });

    console.log(`✅ Booking ${bookingId} cancelled by user ${user.uid}`);

    // ── Release corresponding slot locks ──────────────────────────────
    if (bookingData.turfId && bookingData.bookedDate && bookingData.timeSlots) {
      await releaseSlotLocks({
        turfId: bookingData.turfId,
        date: bookingData.bookedDate,
        slots: bookingData.timeSlots,
      }).catch((err) => {
        console.warn('⚠️  Failed to release slot locks on cancel:', err.message);
      });
    }

    // ── Invalidate slot cache for the cancelled booking's turf+date ──
    if (bookingData.turfId && bookingData.bookedDate) {
      invalidateCache(`cache:GET:/api/turfs/${bookingData.turfId}/slots/${bookingData.bookedDate}`).catch(() => {});
    }

    // ── Queue cancellation email ──────────────────────────────────────
    const cancelEmailData = {
      bookingId,
      toEmail: bookingData.userEmail || '',
      userName: bookingData.userName || 'User',
      turfName: bookingData.turfName || '',
      bookedDate: bookingData.bookedDate || '',
      timeSlots: bookingData.timeSlots || [],
    };

    if (emailQueue && !process.env.VERCEL) {
      await emailQueue.add('booking-cancelled', cancelEmailData).catch((err) => {
        console.error('⚠️  Failed to queue cancellation email:', err.message);
      });
    } else {
      try {
        console.log(`📧 Sending cancellation email directly for ${bookingId}...`);
        await sendCancellationEmail(cancelEmailData);
      } catch (err) {
        console.error(`❌ Cancellation email failed for booking ${bookingId}:`, err.message);
      }
    }

    return res.status(200).json({ success: true, message: 'Booking cancelled successfully' });

  } catch (error) {
    console.error('❌ Error cancelling booking:', error);
    return res.status(500).json({
      error: 'Failed to cancel booking',
      message: config.nodeEnv === 'development' ? error.message : undefined,
    });
  }
}
