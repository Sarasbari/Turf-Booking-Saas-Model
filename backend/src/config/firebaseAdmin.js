/**
 * Firebase Admin SDK initialization.
 *
 * Uses a service account JSON file (path via FIREBASE_SERVICE_ACCOUNT_PATH env)
 * or Application Default Credentials. Exports Firestore and Auth instances.
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { config } from './index.js';

function initFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (serviceAccountPath) {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: config.firebase.projectId,
    });
  } else {
    // Fall back to Application Default Credentials
    admin.initializeApp({
      projectId: config.firebase.projectId,
    });
  }

  return admin.app();
}

initFirebaseAdmin();

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export default admin;
