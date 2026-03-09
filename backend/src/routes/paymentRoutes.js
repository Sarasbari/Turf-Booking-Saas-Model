/**
 * Payment Routes
 *
 * POST /api/payment/create-order  — Create Razorpay order (authenticated)
 * POST /api/payment/verify        — Verify payment signature (authenticated)
 */

import { Router } from 'express';
import { firebaseAuth } from '../middleware/firebaseAuth.js';
import { handleCreateOrder, handleVerifyPayment } from '../controllers/paymentController.js';
import rateLimit from 'express-rate-limit';

// Strict rate limit for payment verification endpoints to prevent brute forcing
const verifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per 15 minutes per IP
    message: {
        error: 'Too many verification attempts, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const router = Router();

router.post('/create-order', firebaseAuth, handleCreateOrder);
router.post('/verify', firebaseAuth, verifyLimiter, handleVerifyPayment);

export default router;
