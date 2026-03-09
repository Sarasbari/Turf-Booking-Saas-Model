/**
 * Payment Controller
 *
 * Handles Razorpay order creation and payment verification.
 * Bookings are ONLY written to Firestore after server-side signature verification.
 */

import { createRazorpayOrder, verifyPaymentSignature } from '../services/paymentService.js';
import { adminDb } from '../config/firebaseAdmin.js';
import { config } from '../config/index.js';
import { FieldValue } from 'firebase-admin/firestore';

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
    return res.status(500).json({
      error: 'Failed to create payment order',
      message: config.nodeEnv === 'development' ? error.message : undefined,
    });
  }
}

// ---------------------------------------------------------------------------
// POST /api/payment/verify
// ---------------------------------------------------------------------------

export async function handleVerifyPayment(req, res) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingData,
    } = req.body;

    const user = req.firebaseUser;

    // ── Input validation ──────────────────────────────────────────────
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        error: 'Missing payment verification fields',
        message: 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required',
      });
    }

    if (!bookingData || !bookingData.turfId || !bookingData.slots || !bookingData.date) {
      return res.status(400).json({
        error: 'Missing booking data',
        message: 'bookingData with turfId, slots, and date is required',
      });
    }

    // ── Verify signature (HMAC-SHA256) ────────────────────────────────
    const isValidSignature = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValidSignature) {
      console.warn(`⚠️ Invalid payment signature for order ${razorpay_order_id} by user ${user.uid}`);
      return res.status(400).json({
        error: 'Payment verification failed',
        message: 'Invalid payment signature',
      });
    }

    // ── Signature valid → create confirmed booking in Firestore ───────
    const bookingId = bookingData.receipt || `TRF-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const booking = {
      id: bookingId,
      bookingId,
      turfId: bookingData.turfId,
      userId: user.uid,
      date: bookingData.date,
      timeSlots: bookingData.slots,
      totalPrice: bookingData.totalPrice || 0,
      status: 'confirmed',
      paymentStatus: 'paid',
      paymentDetails: {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        method: 'razorpay',
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      completedAt: null,
    };

    await adminDb.collection('bookings').doc(bookingId).set(booking);

    console.log(`✅ Booking confirmed: ${bookingId} | Payment: ${razorpay_payment_id}`);

    return res.status(200).json({
      success: true,
      bookingId,
      message: 'Payment verified and booking confirmed',
    });
  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    return res.status(500).json({
      error: 'Payment verification failed',
      message: config.nodeEnv === 'development' ? error.message : undefined,
    });
  }
}
