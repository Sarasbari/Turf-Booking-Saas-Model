import express from 'express';
import {
    googleAuth,
    googleCallback,
    getCurrentUser,
    logout,
    verifyTokenEndpoint,
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/auth/google
 * @desc    Get Google OAuth URL
 * @access  Public
 */
router.get('/google', googleAuth);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Handle Google OAuth callback
 * @access  Public
 */
router.get('/google/callback', googleCallback);

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
