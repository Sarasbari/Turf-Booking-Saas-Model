/**
 * Firebase Authentication Middleware
 *
 * Verifies Firebase ID tokens from the Authorization header.
 * Attaches the decoded user to req.firebaseUser on success.
 */

import { adminAuth } from '../config/firebaseAdmin.js';

/**
 * Require a valid Firebase ID token.
 * Expects header: Authorization: Bearer <idToken>
 */
export async function firebaseAuth(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Missing or malformed Authorization header',
    });
  }

  const idToken = authHeader.split('Bearer ')[1];

  if (!idToken) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'No token provided',
    });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    req.firebaseUser = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      name: decodedToken.name || null,
    };
    next();
  } catch (error) {
    console.error('❌ Firebase auth error:', error.message);
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Firebase ID token is invalid or expired',
    });
  }
}
