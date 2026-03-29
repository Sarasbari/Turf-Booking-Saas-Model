/**
 * Firebase Admin Authentication Middleware
 *
 * Verifies that the caller is both authenticated AND has the `admin: true`
 * custom claim set on their Firebase ID token.
 *
 * Response codes:
 * - 401 Unauthorized → no token or invalid/expired token
 * - 403 Forbidden    → valid token but missing admin claim
 *
 * Security (api-security-best-practices):
 * - Always verify token server-side via Admin SDK (never trust client claims)
 * - Error messages are generic (no internal details leaked)
 * - Optional domain allowlist for defense-in-depth
 */

import { adminAuth } from '../config/firebaseAdmin.js';

// Optional: restrict admin access to specific email domains
const ADMIN_EMAIL_ALLOWLIST_DOMAINS = process.env.ADMIN_EMAIL_DOMAINS
  ? process.env.ADMIN_EMAIL_DOMAINS.split(',').map(d => d.trim().toLowerCase())
  : []; // empty = no domain restriction (claim-only)

/**
 * Require a valid Firebase ID token WITH `admin: true` custom claim.
 * Expects header: Authorization: Bearer <idToken>
 */
export async function adminAuth_middleware(req, res, next) {
  // ── 1. Extract bearer token ──────────────────────────────────────────────
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

  // ── 2. Verify token with Firebase Admin SDK ──────────────────────────────
  let decodedToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(idToken);
  } catch (error) {
    console.error('❌ Admin auth — token verification failed:', error.message);
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Firebase ID token is invalid or expired',
    });
  }

  // ── 3. Check admin custom claim ──────────────────────────────────────────
  if (decodedToken.admin !== true) {
    console.warn(`⚠️  Non-admin access attempt by UID: ${decodedToken.uid}`);
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin privileges required',
    });
  }

  // ── 4. Optional domain allowlist (defense-in-depth) ──────────────────────
  if (ADMIN_EMAIL_ALLOWLIST_DOMAINS.length > 0) {
    const email = (decodedToken.email || '').toLowerCase();
    const domain = email.split('@')[1];

    if (!domain || !ADMIN_EMAIL_ALLOWLIST_DOMAINS.includes(domain)) {
      console.warn(`⚠️  Admin domain blocked: ${email} (UID: ${decodedToken.uid})`);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin privileges required',
      });
    }
  }

  // ── 5. Attach decoded user and proceed ───────────────────────────────────
  req.firebaseUser = {
    uid: decodedToken.uid,
    email: decodedToken.email || null,
    name: decodedToken.name || null,
    admin: true,
  };

  next();
}
