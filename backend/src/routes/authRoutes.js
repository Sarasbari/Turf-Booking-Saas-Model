import express from 'express';
import rateLimit from 'express-rate-limit';
import {
    getCurrentUser,
    logout,
    verifyTokenEndpoint,
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ── Strict auth rate limiter (brute-force protection) ─────────────────────
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 5,                     // 5 auth attempts per 15 min per IP
    message: { error: 'Too many login attempts. Try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user information
 * @access  Protected
 */
router.get('/me', authenticateToken, getCurrentUser);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Protected
 */
router.post('/logout', authenticateToken, logout);

/**
 * @route   POST /api/auth/verify
 * @desc    Verify JWT token
 * @access  Public (rate-limited)
 */
router.post('/verify', authLimiter, verifyTokenEndpoint);

export default router;
