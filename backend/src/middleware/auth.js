import { verifyToken } from '../services/authService.js';

/**
 * Middleware to authenticate requests using JWT
 * Checks for token in cookies or Authorization header
 */
export function authenticateToken(req, res, next) {
    try {
        // Check for token in cookies first
        let token = req.cookies?.token;

        // If not in cookies, check Authorization header
        if (!token) {
            const authHeader = req.headers['authorization'];
            token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        }

        if (!token) {
            return res.status(401).json({ 
                error: 'Authentication required',
                message: 'No token provided' 
            });
        }

        const user = verifyToken(token);
        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ 
            error: 'Invalid token',
            message: error.message 
        });
    }
}

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't block the request
 */
export function optionalAuth(req, res, next) {
    try {
        let token = req.cookies?.token;

        if (!token) {
            const authHeader = req.headers['authorization'];
            token = authHeader && authHeader.split(' ')[1];
        }

        if (token) {
            const user = verifyToken(token);
            req.user = user;
        }
    } catch (error) {
        // Silently fail for optional auth
        console.log('Optional auth failed:', error.message);
    }
    next();
}
