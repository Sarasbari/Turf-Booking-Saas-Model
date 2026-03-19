import express from 'express';
import {
    getCurrentUser,
    logout,
    verifyTokenEndpoint,
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

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
 * @access  Public
 */
router.post('/verify', verifyTokenEndpoint);

export default router;
