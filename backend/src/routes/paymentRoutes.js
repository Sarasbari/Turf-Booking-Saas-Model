import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { firebaseAuth } from '../middleware/firebaseAuth.js';
import { handleCreateOrder, handleVerifyPayment, handleCancelBooking } from '../controllers/paymentController.js';
import rateLimit from 'express-rate-limit';

// ── Strict rate limit for payment endpoints ───────────────────────────────
const paymentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,  // 1 hour
    max: 10,                    // 10 payment attempts per hour per IP
    message: { error: 'Too many payment attempts. Try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
});

// Strict rate limit for payment verification (prevent brute forcing)
const verifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per 15 minutes per IP
    message: {
        error: 'Too many verification attempts, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
});

// ── Input validation rules ────────────────────────────────────────────────
const createOrderValidation = [
    body('turfId').isString().notEmpty().withMessage('turfId is required'),
    body('totalPrice').isNumeric().isFloat({ min: 1, max: 100000 }).withMessage('totalPrice must be between 1 and 100000'),
    body('slots').isArray({ min: 1, max: 8 }).withMessage('slots must be an array of 1-8 items'),
    body('date').isString().notEmpty().withMessage('date is required'),
];

const verifyValidation = [
    body('razorpay_order_id').isString().notEmpty(),
    body('razorpay_payment_id').isString().notEmpty(),
    body('razorpay_signature').isString().notEmpty(),
    body('turfId').isString().notEmpty(),
    body('bookedDate').isString().notEmpty(),
    body('timeSlots').isArray({ min: 1, max: 8 }),
];

// ── Validation middleware ─────────────────────────────────────────────────
function validate(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Invalid input',
            details: errors.array(),
        });
    }
    next();
}

const router = Router();

router.post('/create-order', paymentLimiter, firebaseAuth, createOrderValidation, validate, handleCreateOrder);
router.post('/verify', firebaseAuth, verifyLimiter, verifyValidation, validate, handleVerifyPayment);
router.post('/cancel', firebaseAuth, handleCancelBooking);

export default router;
