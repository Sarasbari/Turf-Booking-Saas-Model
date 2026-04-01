/**
 * Payment Controller
 *
 * Handles Razorpay order creation and payment verification.
 * Bookings are ONLY written to Firestore after server-side signature verification,
 * via the bookingService (Admin SDK — bypasses Firestore security rules).
 */

import { createRazorpayOrder, verifyPaymentSignature } from '../services/paymentService.js';
import { createBooking, markEmailSent } from '../services/bookingService.js';
import { config } from '../config/index.js';
import { sendBookingConfirmation, sendCancellationEmail } from '../services/emailService.js';
import { adminDb } from '../config/firebaseAdmin.js';
import { invalidateCache } from '../middleware/cache.js';
import { emailQueue } from '../queues/index.js';
import * as Sentry from '@sentry/node';

// ---------------------------------------------------------------------------
// POST /api/payment/create-order
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

    // ── Create Razorpay order (amount in paise) ──────────────────────
    const amountInPaise = Math.round(totalPrice * 100);
    const order = await createRazorpayOrder(amountInPaise, 'INR', receipt);

    console.log(`✅ Razorpay order created: ${order.id} for user ${user.uid}`);

    return res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: config.razorpay.keyId,
      receipt,
      // Pass back metadata the frontend will need for verification
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

    // ── Write booking to Firestore via bookingService (Admin SDK) ─────
    // Admin SDK bypasses Firestore security rules — this is the ONLY place
    // a booking document is ever created.
    const bookingId = await createBooking({
      userId:          user.uid,
      userEmail:       userEmail || user.email || '',
      userName:        userName  || user.name  || 'User',
      turfId,
      turfName:        turfName    || '',
      turfAddress:     turfAddress || '',
      turfImage:       turfImage   || '',
      ownerContact:    ownerContact || '',
      bookedDate,
      timeSlots,
      totalPrice:      typeof totalPrice === 'number' ? totalPrice : 0,
      sport:           sport || '',
      groundId:        groundId || '',
      paymentId:       razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
    });

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
      toEmail:      userEmail || user.email || '',
      userName:     userName  || user.name  || 'User',
      bookingId,
      turfName:     turfName    || 'Your Turf',
      turfAddress:  turfAddress || '',
      ownerContact: ownerContact || '',
      bookedDate:   formatDate(bookedDate),
      timeSlots,
      totalAmount:  typeof totalPrice === 'number' ? totalPrice : 0,
      paymentId:    razorpay_payment_id,
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
