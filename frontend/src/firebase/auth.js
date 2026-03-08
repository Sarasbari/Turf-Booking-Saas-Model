/**
 * Firebase Authentication Functions
 * 
 * Handles user authentication with Google OAuth and user document management.
 */

import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';

/**
 * Sign in with Google OAuth
 * Creates user document in Firestore if it doesn't exist
 * @returns {Promise<Object>} User object with profile data
 */
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user document exists in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // Create new user document
      await setDoc(userDocRef, {
        id: user.uid,
        name: user.displayName,
        email: user.email,
        picture: user.photoURL,
        phone: null,
        role: 'customer', // Default role
        ownerId: null,
        preferredLocation: null,
        favoriteSport: null,
        favorites: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('✅ New user document created');
    }

    console.log('✅ Signed in successfully:', user.displayName);
    return {
      uid: user.uid,
      name: user.displayName,
      email: user.email,
      picture: user.photoURL,
    };
  } catch (error) {
    console.error('❌ Sign in error:', error);
    throw new Error(`Failed to sign in: ${error.message}`);
  }
};

/**
 * Sign out current user
 * @returns {Promise<boolean>} Success status
 */
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    console.log('✅ Signed out successfully');
    return true;
  } catch (error) {
    console.error('❌ Sign out error:', error);
    throw new Error(`Failed to sign out: ${error.message}`);
  }
};

/**
 * Get currently logged-in user
 * @returns {Object|null} Current user or null
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Get current user's role from Firestore
 * @returns {Promise<string>} User role ('customer' | 'owner' | 'admin')
 */
export const getCurrentUserRole = async () => {
  try {
    const user = getCurrentUser();
    if (!user) {
      return null;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      return userDoc.data().role;
    }

    return null;
  } catch (error) {
    console.error('❌ Error fetching user role:', error);
    return null;
  }
};

/**
 * Check if current user is an owner
 * @returns {Promise<boolean>} True if user is owner
 */
export const isOwner = async () => {
  const role = await getCurrentUserRole();
  return role === 'owner';
};

/**
 * Get current user's full profile from Firestore
 * @returns {Promise<Object|null>} User profile data
 */
export const getCurrentUserProfile = async () => {
  try {
    const user = getCurrentUser();
    if (!user) {
      return null;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }

    return null;
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    return null;
  }
};

/**
 * Listen to authentication state changes
 * @param {Function} callback - Function to call when auth state changes
 * @returns {Function} Unsubscribe function
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};
