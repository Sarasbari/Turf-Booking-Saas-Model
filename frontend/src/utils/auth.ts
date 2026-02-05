const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface UserData {
    name: string;
    email: string;
    picture: string;
    id?: string;
}

/**
 * Checks if a user is currently logged in
 * @returns true if user data exists in localStorage, false otherwise
 */
export function isLoggedIn(): boolean {
    try {
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        return userData !== null && token !== null;
    } catch (error) {
        console.error('Error checking login status:', error);
        return false;
    }
}

/**
 * Retrieves user data from localStorage
 * @returns UserData object if exists, null otherwise
 */
export function getUserData(): UserData | null {
    try {
        const userData = localStorage.getItem('user');
        if (!userData) return null;
        return JSON.parse(userData) as UserData;
    } catch (error) {
        console.error('Error retrieving user data:', error);
        return null;
    }
}

/**
 * Saves user data to localStorage
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
 * Gets the authentication token from localStorage
 * @returns token string if exists, null otherwise
 */
export function getToken(): string | null {
    try {
        return localStorage.getItem('token');
    } catch (error) {
        console.error('Error retrieving token:', error);
        return null;
    }
}

/**
 * Saves authentication token to localStorage
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
 * Initiates Google OAuth flow
 * Redirects to backend which will redirect to Google
 */
export async function initiateGoogleLogin(): Promise<void> {
    try {
        const response = await fetch(`${API_URL}/api/auth/google`);
        const data = await response.json();

        if (data.authUrl) {
            window.location.href = data.authUrl;
        } else {
            throw new Error('Failed to get authentication URL');
        }
    } catch (error) {
        console.error('Error initiating Google login:', error);
        throw error;
    }
}

/**
 * Handles the OAuth callback and stores user data
 * @param token - JWT token from the callback URL
 */
export async function handleAuthCallback(token: string): Promise<void> {
    try {
        // Store the token
        setToken(token);

        // Fetch user data using the token
        const response = await fetch(`${API_URL}/api/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }

        const data = await response.json();

        // Store user data
        setUserData({
            name: data.user.name,
            email: data.user.email,
            picture: data.user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.name)}&background=ea580c&color=fff&size=128`,
            id: data.user.id,
        });
    } catch (error) {
        console.error('Error handling auth callback:', error);
        throw error;
    }
}

/**
 * Signs out the user by removing data from localStorage and calling logout endpoint
 */
export async function signOut(): Promise<void> {
    try {
        const token = getToken();

        if (token) {
            // Call logout endpoint
            await fetch(`${API_URL}/api/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
        }

        // Clear local storage
        localStorage.removeItem('user');
        localStorage.removeItem('token');

        // Redirect to homepage
        window.location.href = '/';
    } catch (error) {
        console.error('Error signing out:', error);
        // Clear local storage even if API call fails
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
        const token = getToken();

        if (!token) {
            return false;
        }

        const response = await fetch(`${API_URL}/api/auth/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
        });

        const data = await response.json();
        return data.valid === true;
    } catch (error) {
        console.error('Error verifying token:', error);
        return false;
    }
}

/**
 * Extracts the first name from a full name
 * @param fullName - The user's full name
 * @returns The first name (everything before the first space)
 */
export function getFirstName(fullName: string): string {
    return fullName.split(' ')[0];
}
