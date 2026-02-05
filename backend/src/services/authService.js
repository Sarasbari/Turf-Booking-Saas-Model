import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

const client = new OAuth2Client(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectUri
);

/**
 * Generates the Google OAuth URL for user authentication
 * @returns {string} Google OAuth authorization URL
 */
export function getGoogleAuthUrl() {
    const scopes = [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
    ];

    return client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
    });
}

/**
 * Verifies the Google OAuth code and retrieves user information
 * @param {string} code - Authorization code from Google
 * @returns {Promise<Object>} User information from Google
 */
export async function verifyGoogleCode(code) {
    try {
        const { tokens } = await client.getToken(code);
        client.setCredentials(tokens);

        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: config.google.clientId,
        });

        const payload = ticket.getPayload();
        
        return {
            googleId: payload.sub,
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
            emailVerified: payload.email_verified,
        };
    } catch (error) {
        console.error('Error verifying Google code:', error);
        throw new Error('Failed to verify Google authentication');
    }
}

/**
 * Generates a JWT token for the authenticated user
 * @param {Object} user - User information
 * @returns {string} JWT token
 */
export function generateToken(user) {
    return jwt.sign(
        {
            id: user.googleId,
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
