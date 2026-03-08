/**
 * Firebase Configuration
 * 
 * Initializes Firebase app with Firestore, Authentication, and Storage.
 * Uses environment variables for sensitive configuration.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig: Record<string, string> = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate configuration
const validateConfig = (): void => {
    const requiredKeys = [
        'apiKey',
        'authDomain',
        'projectId',
        'storageBucket',
        'messagingSenderId',
        'appId',
    ];

    const missingKeys = requiredKeys.filter(
        (key) => !firebaseConfig[key] || firebaseConfig[key].includes('your_')
    );

    if (missingKeys.length > 0) {
        console.error(
            '❌ Firebase Configuration Error: Missing or invalid environment variables:',
            missingKeys
        );
    }
};

// Initialize Firebase
function initFirebase() {
    validateConfig();

    // Check if Firebase app already exists to prevent duplicate initialization
    let firebaseApp: FirebaseApp;
    if (getApps().length === 0) {
        firebaseApp = initializeApp(firebaseConfig);
    } else {
        firebaseApp = getApp();
    }

    const firebaseAuth = getAuth(firebaseApp);
    const firebaseDb = getFirestore(firebaseApp);
    const firebaseStorage = getStorage(firebaseApp);

    // Set auth persistence to LOCAL (persists even when browser is closed)
    setPersistence(firebaseAuth, browserLocalPersistence).catch((error) => {
        console.error('Error setting auth persistence:', error);
    });

    return { app: firebaseApp, auth: firebaseAuth, db: firebaseDb, storage: firebaseStorage };
}

const { app, auth, db, storage } = initFirebase();

// Export Firebase instances
export { app, auth, db, storage };
export default app;
