import { generateToken, verifyToken } from '../services/authService.js';
import { config } from '../config/index.js';

/**
 * Returns the current authenticated user's information
 */
export async function getCurrentUser(req, res) {
    try {
        // User info is attached by authenticateToken middleware
        res.json({
            user: req.user,
        });
    } catch (error) {
        console.error('Error getting current user:', error);
        res.status(500).json({ 
            error: 'Failed to get user information',
            message: error.message 
        });
    }
}

/**
 * Logs out the user by clearing the token cookie
 */
export async function logout(req, res) {
    try {
        res.clearCookie('token');
        res.json({ 
            success: true,
            message: 'Logged out successfully' 
        });
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).json({ 
            error: 'Failed to logout',
            message: error.message 
        });
    }
}

/**
 * Verifies if a token is valid
 */
export async function verifyTokenEndpoint(req, res) {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({ 
                valid: false,
                error: 'No token provided' 
            });
        }

        const decoded = verifyToken(token);
        res.json({ 
            valid: true,
            user: decoded 
        });
    } catch (error) {
        res.json({ 
            valid: false,
            error: error.message 
        });
    }
}
