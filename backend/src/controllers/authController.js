import { getGoogleAuthUrl, verifyGoogleCode, generateToken, verifyToken } from '../services/authService.js';
import { config } from '../config/index.js';

/**
 * Initiates Google OAuth flow
 * Redirects user to Google's consent page
 */
export async function googleAuth(req, res) {
    try {
        const authUrl = getGoogleAuthUrl();
        res.json({ authUrl });
    } catch (error) {
        console.error('Error generating Google auth URL:', error);
        res.status(500).json({ 
            error: 'Failed to initiate authentication',
            message: error.message 
        });
    }
}

/**
 * Handles Google OAuth callback
 * Exchanges code for user information and generates JWT
 */
export async function googleCallback(req, res) {
    try {
        const { code } = req.query;

        if (!code) {
            return res.redirect(`${config.frontend.url}/signin?error=no_code`);
        }

        // Verify the code and get user info
        const userInfo = await verifyGoogleCode(code);

        // Generate JWT token
        const token = generateToken(userInfo);

        // Set token in HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: config.nodeEnv === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        // Redirect to frontend with user info
        const redirectUrl = `${config.frontend.url}/auth/callback?token=${token}`;
        res.redirect(redirectUrl);
    } catch (error) {
        console.error('Error in Google callback:', error);
        res.redirect(`${config.frontend.url}/signin?error=auth_failed`);
    }
}

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
