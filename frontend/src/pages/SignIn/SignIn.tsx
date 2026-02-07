import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initiateGoogleLogin } from '../../utils/auth';
import styles from './SignIn.module.css';

export function SignIn() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Initiate Firebase Google sign-in
            await initiateGoogleLogin();

            // Sign-in successful, redirect to listings
            navigate('/listings');
        } catch (err: any) {
            console.error('Error during sign in:', err);
            setError(err.message || 'Failed to initiate sign in. Please try again.');
            setIsLoading(false);
        }
    };

    const handleBackClick = (e: React.MouseEvent) => {
        e.preventDefault();
        window.location.href = '/listings';
    };

    return (
        <div className={styles.page}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <h1 className={styles.headerLogo}>TurfBook</h1>
                </div>
            </header>

            {/* Main Content */}
            <main className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.card}>
                        {/* Welcome Section */}
                        <div className={styles.welcomeSection}>
                            <div className={styles.iconContainer}>
                                <svg className={styles.lockIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth={2} />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth={2} />
                                </svg>
                            </div>
                            <h2 className={styles.heading}>Sign In to TurfBook</h2>
                            <p className={styles.description}>
                                Sign in with your Google account to book turfs, manage reservations, and access exclusive features.
                            </p>
                        </div>

                        {/* Google Sign In Button */}
                        <button
                            className={styles.googleButton}
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <div className={styles.spinner}></div>
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <>
                                    <svg className={styles.googleIcon} viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    <span>Sign In with Google</span>
                                </>
                            )}
                        </button>

                        {/* Divider */}
                        <div className={styles.dividerContainer}>
                            <div className={styles.divider}></div>
                            <span className={styles.dividerText}>or</span>
                            <div className={styles.divider}></div>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className={styles.infoBox} style={{ borderColor: '#dc2626', backgroundColor: '#fef2f2' }}>
                                <svg className={styles.infoIcon} viewBox="0 0 24 24" fill="none" stroke="#dc2626">
                                    <circle cx="12" cy="12" r="10" strokeWidth={2} />
                                    <line x1="12" y1="8" x2="12" y2="12" strokeWidth={2} />
                                    <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth={2} />
                                </svg>
                                <div className={styles.infoText} style={{ color: '#dc2626' }}>
                                    <strong>Error:</strong> {error}
                                </div>
                            </div>
                        )}

                        {/* Info Box */}
                        {!error && (
                            <div className={styles.infoBox}>
                                <svg className={styles.infoIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <circle cx="12" cy="12" r="10" strokeWidth={2} />
                                    <line x1="12" y1="16" x2="12" y2="12" strokeWidth={2} />
                                    <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth={2} />
                                </svg>
                                <div className={styles.infoText}>
                                    <strong>Secure Sign In:</strong> You'll be redirected to Google's secure authentication page.
                                </div>
                            </div>
                        )}

                        {/* Back Link */}
                        <a href="/listings" onClick={handleBackClick} className={styles.backLink}>
                            ← Continue browsing without signing in
                        </a>
                    </div>

                    {/* Benefits Section */}
                    <div className={styles.benefitsSection}>
                        <h3 className={styles.benefitsHeading}>Why sign in?</h3>
                        <ul className={styles.benefitsList}>
                            <li className={styles.benefitItem}>
                                <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <polyline points="20 6 9 17 4 12" strokeWidth={2} />
                                </svg>
                                <span>Book turfs instantly</span>
                            </li>
                            <li className={styles.benefitItem}>
                                <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <polyline points="20 6 9 17 4 12" strokeWidth={2} />
                                </svg>
                                <span>Manage your bookings</span>
                            </li>
                            <li className={styles.benefitItem}>
                                <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <polyline points="20 6 9 17 4 12" strokeWidth={2} />
                                </svg>
                                <span>Get personalized recommendations</span>
                            </li>
                            <li className={styles.benefitItem}>
                                <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <polyline points="20 6 9 17 4 12" strokeWidth={2} />
                                </svg>
                                <span>Access exclusive deals</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
}
