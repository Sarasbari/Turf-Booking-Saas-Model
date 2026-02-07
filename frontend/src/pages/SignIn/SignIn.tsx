import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initiateGoogleLogin } from '../../utils/auth';
import styles from './SignIn.module.css';

interface SignInModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SignInModal({ isOpen, onClose }: SignInModalProps) {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setError(null);

        try {
            await initiateGoogleLogin();
            onClose();
            // Reload the page to ensure all components get the updated auth state
            window.location.reload();
        } catch (err: any) {
            console.error('Error during sign in:', err);
            setError(err.message || 'Failed to sign in. Please try again.');
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button className={styles.closeButton} onClick={onClose} aria-label="Close">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <line x1="18" y1="6" x2="6" y2="18" strokeWidth={2} strokeLinecap="round" />
                        <line x1="6" y1="6" x2="18" y2="18" strokeWidth={2} strokeLinecap="round" />
                    </svg>
                </button>

                {/* Heading */}
                <h2 className={styles.heading}>Get Started</h2>

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
                            <span>Continue with Google</span>
                        </>
                    )}
                </button>

                {/* Divider */}
                <div className={styles.divider}></div>

                {/* Error Message */}
                {error && (
                    <div className={styles.errorMessage}>
                        {error}
                    </div>
                )}

                {/* Terms & Conditions */}
                <p className={styles.terms}>
                    I agree to{' '}
                    <a href="/terms" target="_blank" rel="noopener noreferrer">
                        Terms & Conditions
                    </a>
                    {' '}and{' '}
                    <a href="/privacy" target="_blank" rel="noopener noreferrer">
                        Privacy Policy
                    </a>
                </p>
            </div>
        </div>
    );
}

// Keep the original SignIn page component for direct /signin route
export function SignIn() {
    const [isModalOpen, setIsModalOpen] = useState(true);
    const navigate = useNavigate();

    const handleClose = () => {
        setIsModalOpen(false);
        navigate('/listings');
    };

    return <SignInModal isOpen={isModalOpen} onClose={handleClose} />;
}
