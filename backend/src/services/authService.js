import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

/**
 * Generates a JWT token for the authenticated user
 * @param {Object} user - User information
 * @returns {string} JWT token
 */
export function generateToken(user) {
    return jwt.sign(
        {
            id: user.id || user.googleId,
            email: user.email,
            name: user.name,
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
    );
}

/**
 * Verifies a JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
export function verifyToken(token) {
    try {
        return jwt.verify(token, config.jwt.secret);
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
}
