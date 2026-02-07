// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCXadSaDFHk6oPH5poOfGMBdd9pi1ZdACI",
    authDomain: "turf-database.firebaseapp.com",
    projectId: "turf-database",
    storageBucket: "turf-database.firebasestorage.app",
    messagingSenderId: "651924114624",
    appId: "1:651924114624:web:d81b0f80f349b2d2ff7125",
    measurementId: "G-HBWDEF57HP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Set auth persistence to LOCAL (persists even when browser is closed)
setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error('Error setting auth persistence:', error);
});

// Initialize Analytics (only in browser environment)
let analytics;
if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
}

export { analytics };
export default app;
