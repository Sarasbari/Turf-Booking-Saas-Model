/**
 * Payment Routes
 *
 * POST /api/payment/create-order  — Create Razorpay order (authenticated)
 * POST /api/payment/verify        — Verify payment signature (authenticated)
 */

import { Router } from 'express';
import { firebaseAuth } from '../middleware/firebaseAuth.js';
import { handleCreateOrder, handleVerifyPayment } from '../controllers/paymentController.js';

const router = Router();

router.post('/create-order', firebaseAuth, handleCreateOrder);
router.post('/verify', firebaseAuth, handleVerifyPayment);

export default router;
