import { useState, useEffect, useRef } from 'react';
import { isLoggedIn, getUserData, signOut, UserData } from '../../utils/auth';
import styles from './Header.module.css';

export function Header() {
    const [user, setUser] = useState<UserData | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Check login status on component mount
        if (isLoggedIn()) {
            const userData = getUserData();
            setUser(userData);
        }
    }, []);

    useEffect(() => {
        // Handle click outside to close dropdown
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside as any);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside as any);
        };
    }, [isDropdownOpen]);

    const handleSignInClick = () => {
        window.location.href = '/signin';
    };

    const handleProfileClick = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleSignOut = () => {
        setIsDropdownOpen(false);
        signOut();
    };

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                {/* Logo */}
                <div className={styles.logo}>
                    <h1 className={styles.logoText}>TurfBook</h1>
                </div>

                {/* Profile Section */}
                <div className={styles.profileSection}>
                    {!user ? (
                        // Sign In Button (when NOT logged in)
                        <button
                            className={styles.signInButton}
                            onClick={handleSignInClick}
                        >
                            Sign In
                        </button>
                    ) : (
                        // Profile Avatar (when logged in)
                        <div className={styles.profileContainer} ref={dropdownRef}>
                            <button
                                className={styles.avatarButton}
                                onClick={handleProfileClick}
                                aria-label="User menu"
                            >
                                <img
                                    src={user.picture}
                                    alt={user.name}
                                    className={styles.avatar}
                                />
                                <span className={styles.statusDot}></span>
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className={styles.dropdown}>
                                    {/* User Information */}
                                    <div className={styles.userInfo}>
                                        <div className={styles.userName}>{user.name}</div>
                                        <div className={styles.userEmail}>{user.email}</div>
                                    </div>

                                    {/* Divider */}
                                    <div className={styles.divider}></div>

                                    {/* My Bookings (Disabled) */}
                                    <div className={styles.menuItem + ' ' + styles.menuItemDisabled}>
                                        <span>My Bookings</span>
                                        <span className={styles.comingSoonBadge}>Coming Soon</span>
                                    </div>

                                    {/* Sign Out */}
                                    <button
                                        className={styles.menuItem + ' ' + styles.signOutButton}
                                        onClick={handleSignOut}
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
