import { auth } from '../lib/firebase';
import {
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User
} from 'firebase/auth';

export interface UserData {
    name: string;
    email: string;
    picture: string;
    id?: string;
    phone?: string;
}

/**
 * Checks if a user is currently logged in
 * @returns true if user is authenticated, false otherwise
 */
export function isLoggedIn(): boolean {
    return auth.currentUser !== null;
}

/**
 * Retrieves user data from Firebase Auth
 * @returns UserData object if exists, null otherwise
 */
export function getUserData(): UserData | null {
    const user = auth.currentUser;

    if (!user) return null;

    return {
        name: user.displayName || 'User',
        email: user.email || '',
        picture: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=ea580c&color=fff&size=128`,
        id: user.uid,
    };
}

/**
 * Saves user data to localStorage (for backward compatibility)
 * @param userData - User data object containing name, email, and picture
 */
export function setUserData(userData: UserData): void {
    try {
        localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
        console.error('Error saving user data:', error);
    }
}

/**
 * Gets the authentication token from Firebase
 * @returns token string if exists, null otherwise
 */
export async function getToken(): Promise<string | null> {
    try {
        const user = auth.currentUser;
        if (!user) return null;
        return await user.getIdToken();
    } catch (error) {
        console.error('Error retrieving token:', error);
        return null;
    }
}

/**
 * Saves authentication token to localStorage (for backward compatibility)
 * @param token - JWT token string
 */
export function setToken(token: string): void {
    try {
        localStorage.setItem('token', token);
    } catch (error) {
        console.error('Error saving token:', error);
    }
}

/**
 * Initiates Google sign-in with Firebase
 * Uses popup method for better UX
 */
export async function initiateGoogleLogin(): Promise<void> {
    try {
        const provider = new GoogleAuthProvider();

        // Add custom parameters if needed
        provider.setCustomParameters({
            prompt: 'select_account'
        });

        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Store user data in localStorage for backward compatibility
        const userData: UserData = {
            name: user.displayName || 'User',
            email: user.email || '',
            picture: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=ea580c&color=fff&size=128`,
            id: user.uid,
        };

        setUserData(userData);

        // Get and store token
        const token = await user.getIdToken();
        setToken(token);

        console.log('User signed in successfully:', userData);
    } catch (error: any) {
        console.error('Error during Google sign-in:', error);

        // Provide more specific error messages
        if (error.code === 'auth/popup-closed-by-user') {
            throw new Error('Sign-in cancelled. Please try again.');
        } else if (error.code === 'auth/popup-blocked') {
            throw new Error('Pop-up blocked. Please allow pop-ups and try again.');
        } else if (error.code === 'auth/network-request-failed') {
            throw new Error('Network error. Please check your connection.');
        } else {
            throw new Error('Failed to sign in. Please try again.');
        }
    }
}

/**
 * Alternative: Initiates Google sign-in with redirect (for mobile/popup issues)
 */
export async function initiateGoogleLoginWithRedirect(): Promise<void> {
    try {
        const { signInWithRedirect } = await import('firebase/auth');
        const provider = new GoogleAuthProvider();
        await signInWithRedirect(auth, provider);
    } catch (error) {
        console.error('Error during Google sign-in with redirect:', error);
        throw error;
    }
}

/**
 * Handles the OAuth callback (not needed for Firebase popup, but kept for compatibility)
 * @param token - JWT token from the callback URL
 */
export async function handleAuthCallback(token: string): Promise<void> {
    // This is handled automatically by Firebase
    console.log('Auth callback handled by Firebase');
}

/**
 * Signs out the user
 */
export async function signOut(): Promise<void> {
    try {
        await firebaseSignOut(auth);

        // Clear local storage
        localStorage.removeItem('user');
        localStorage.removeItem('token');

        // Redirect to homepage
        window.location.href = '/';
    } catch (error) {
        console.error('Error signing out:', error);
        // Clear local storage even if Firebase signOut fails
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/';
    }
}

/**
 * Verifies if the current token is valid
 * @returns true if token is valid, false otherwise
 */
export async function verifyToken(): Promise<boolean> {
    try {
        const user = auth.currentUser;
        if (!user) return false;

        // Try to get a fresh token
        await user.getIdToken(true);
        return true;
    } catch (error) {
        console.error('Error verifying token:', error);
        return false;
    }
}

/**
 * Sets up an auth state listener
 * @param callback - Function to call when auth state changes
 * @returns Unsubscribe function
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
}

/**
 * Extracts the first name from a full name
 * @param fullName - The user's full name
 * @returns The first name (everything before the first space)
 */
export function getFirstName(fullName: string): string {
    return fullName.split(' ')[0];
}

