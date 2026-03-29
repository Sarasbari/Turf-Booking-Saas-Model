import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from '../../../utils/auth';
import type { UserData } from '../../../utils/auth';
import styles from './NavigationDrawer.module.css';

interface NavigationDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserData | null;
    favoriteCount?: number;
    onSignInClick?: () => void;
}

export function NavigationDrawer({ isOpen, onClose, user, favoriteCount = 0, onSignInClick }: NavigationDrawerProps) {
    const navigate = useNavigate();

    // Handle Escape key to close drawer
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleSignIn = () => {
        onClose();
        if (onSignInClick) {
            onSignInClick();
        } else {
            navigate('/signin');
        }
    };

    const handleEditProfile = () => {
        navigate('/profile');
        onClose();
    };

    const handleMenuClick = (path: string) => {
        navigate(path);
        onClose();
    };

    const handleSignOut = () => {
        signOut();
        onClose();
        navigate('/');
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className={styles.backdrop} onClick={onClose} />

            {/* Drawer */}
            <div className={styles.drawer}>
                {/* Header Section */}
                <div className={styles.header}>
                    {user ? (
                        <>
                            <div className={styles.headerTop}>
                                <h2 className={styles.greeting}>Hey, {user.name.split(' ')[0]}!</h2>
                                <img
                                    src={user.picture}
                                    alt={user.name}
                                    className={styles.profilePic}
                                />
                            </div>
                            <button className={styles.editProfileLink} onClick={handleEditProfile}>
                                Edit Profile &gt;
                            </button>
                        </>
                    ) : (
                        <>
                            <h2 className={styles.greeting}>Hey!</h2>
                            <button className={styles.signInButton} onClick={handleSignIn}>
                                Sign In
                            </button>
                        </>
                    )}
                </div>

                {/* Menu Items */}
                <nav className={styles.menu}>
                    {/* Your Bookings */}
                    <button
                        className={styles.menuItem}
                        onClick={() => handleMenuClick('/profile?section=bookings')}
                    >
                        <div className={styles.menuItemContent}>
                            <span className={styles.icon}>🎟️</span>
                            <div className={styles.menuItemText}>
                                <span className={styles.label}>Your Bookings</span>
                                <span className={styles.sublabel}>View all your bookings & purchases</span>
                            </div>
                            <span className={styles.chevron}>›</span>
                        </div>
                    </button>
                </nav>

                {/* Footer - Sign Out */}
                {user && (
                    <div className={styles.footer}>
                        <button className={styles.signOutButton} onClick={handleSignOut}>
                            <span className={styles.icon}>🚪</span>
                            Sign out
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
