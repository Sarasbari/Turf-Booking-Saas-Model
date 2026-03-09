/**
 * Razorpay Payment Service
 *
 * Encapsulates Razorpay order creation and signature verification.
 * The Razorpay secret NEVER leaves this module.
 */

import Razorpay from 'razorpay';
import crypto from 'crypto';
import { config } from '../config/index.js';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: config.razorpay.keyId,
  key_secret: config.razorpay.keySecret,
});

/**
 * Create a Razorpay order.
 * @param {number} amount    - Amount in paise (INR × 100)
 * @param {string} currency  - Currency code (default 'INR')
 * @param {string} receipt   - Unique receipt / booking reference
 * @returns {Promise<Object>} Razorpay order object
 */
export async function createRazorpayOrder(amount, currency = 'INR', receipt) {
  const options = {
    amount,          // in paise
    currency,
    receipt,
    payment_capture: 1, // auto-capture
  };

  const order = await razorpay.orders.create(options);
  return order;
}

/**
 * Verify payment signature using HMAC-SHA256.
 *
 * Razorpay docs:
 *   generated_signature = hmac_sha256(order_id + "|" + payment_id, secret)
 *
 * @param {string} orderId    - razorpay_order_id
 * @param {string} paymentId  - razorpay_payment_id
 * @param {string} signature  - razorpay_signature from client
 * @returns {boolean} Whether the signature is valid
 */
export function verifyPaymentSignature(orderId, paymentId, signature) {
  const body = `${orderId}|${paymentId}`;

  const expectedSignature = crypto
    .createHmac('sha256', config.razorpay.keySecret)
    .update(body)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch {
    // If buffers are different lengths, signatures don't match
    return false;
  }
}
