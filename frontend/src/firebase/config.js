/**
 * Firebase Configuration
 * 
 * Initializes Firebase app with Firestore, Authentication, and Storage.
 * Uses environment variables for sensitive configuration.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate configuration
const validateConfig = () => {
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
    console.error(
      '💡 Please update your .env file with actual Firebase configuration values.'
    );
  }
};

// Initialize Firebase
let app;
let auth;
let db;
let storage;

try {
  validateConfig();
  
  // Check if Firebase app already exists to prevent duplicate initialization
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized successfully');
  } else {
    app = getApp();
    console.log('✅ Using existing Firebase app');
  }
  
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  console.log('📦 Project ID:', firebaseConfig.projectId);
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  // Don't throw - allow app to continue with limited functionality
  console.warn('⚠️ App will continue without Firebase');
}

// Export Firebase instances
export { app, auth, db, storage };
export default app;
