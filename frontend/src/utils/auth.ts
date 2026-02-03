export interface UserData {
    name: string;
    email: string;
    picture: string;
}

/**
 * Checks if a user is currently logged in
 * @returns true if user data exists in localStorage, false otherwise
 */
export function isLoggedIn(): boolean {
    try {
        const userData = localStorage.getItem('user');
        return userData !== null;
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
 * Signs out the user by removing data from localStorage and redirecting to homepage
 */
export function signOut(): void {
    try {
        localStorage.removeItem('user');
        window.location.href = '/';
    } catch (error) {
        console.error('Error signing out:', error);
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
