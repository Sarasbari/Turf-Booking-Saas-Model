/**
 * Firebase Admin SDK initialization.
 *
 * Credential loading priority:
 * 1. FIREBASE_SERVICE_ACCOUNT env var (JSON string — used on Vercel)
 * 2. service-account.json file (local development)
 * 3. Application Default Credentials (GCP environments)
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { config } from './index.js';

function initFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  let credential = null;

  // ── Priority 1: Environment variable (Vercel / CI) ──────────────────────
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      credential = admin.credential.cert(serviceAccount);
      console.log('✅ Firebase Admin initialized from FIREBASE_SERVICE_ACCOUNT env var');
    } catch (err) {
      console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT env var:', err.message);
    }
  }

  // ── Priority 2: Local service-account.json file ─────────────────────────
  if (!credential) {
    try {
      const serviceAccountPath = new URL('../../service-account.json', import.meta.url);
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      credential = admin.credential.cert(serviceAccount);
      console.log('✅ Firebase Admin initialized from service-account.json');
    } catch (err) {
      console.warn('⚠️  service-account.json not found:', err.message);
    }
  }

  // ── Initialize with credential or fall back to ADC ──────────────────────
  if (credential) {
    admin.initializeApp({ credential });
  } else {
    console.warn('⚠️  No service account found. Falling back to Application Default Credentials.');
    admin.initializeApp({ projectId: config.firebase.projectId });
  }

  console.log('🔍 Admin SDK projectId:', admin.app().options.projectId || 'unknown');
  return admin.app();
}

initFirebaseAdmin();

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export default admin;
