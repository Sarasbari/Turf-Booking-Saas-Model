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

  // Load the downloaded service account key directly
  try {
    const serviceAccountPath = new URL('../../service-account.json', import.meta.url);
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // databaseURL is only needed for Realtime Database, not Firestore.
      // Remove it, or make sure service-account.json has the SAME project_id
      // as your frontend's VITE_FIREBASE_PROJECT_ID
    });
    console.log('Admin SDK project:', admin.app().options.projectId || admin.app().options.credential?.projectId);
    console.log('Frontend should match:', process.env.FIREBASE_PROJECT_ID);
    console.log("✅ Firebase Admin Initialized with service-account.json");
  } catch (error) {
    console.error("❌ Failed to load service-account.json. Please ensure it's in the backend folder.");
    console.error(error.message);

    // Fall back to Application Default Credentials if file is missing
    admin.initializeApp({
      projectId: config.firebase.projectId,
    });
  }

  return admin.app();
}

initFirebaseAdmin();

// DEBUG: Confirm which project the Admin SDK is connected to
const app = admin.app();
console.log('🔍 Admin SDK projectId:', app.options.projectId || JSON.parse(readFileSync(new URL('../../service-account.json', import.meta.url), 'utf8')).project_id);
console.log('🔍 Expected (from env):', process.env.FIREBASE_PROJECT_ID);

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export default admin;
