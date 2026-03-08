import styles from './SignInRequiredModal.module.css';

interface SignInRequiredModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SignInRequiredModal({ isOpen, onClose }: SignInRequiredModalProps) {
    if (!isOpen) return null;

    const handleSignIn = () => {
        window.location.href = '/signin';
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className={styles.backdrop} onClick={handleBackdropClick}>
            <div className={`${styles.modal} ${isOpen ? styles.modalOpen : ''}`}>
                {/* Close Button */}
                <button
                    className={styles.closeButton}
                    onClick={onClose}
                    aria-label="Close"
                >
                    ✕
                </button>

                {/* Icon */}
                <div className={styles.iconContainer}>
                    <svg
                        className={styles.icon}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                    >
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth={2} />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth={2} />
                    </svg>
                </div>

                {/* Heading */}
                <h2 className={styles.heading}>Sign In Required</h2>

                {/* Message */}
                <p className={styles.message}>
                    You need to sign in to book a turf. Join us in seconds with Google!
                </p>

                {/* Primary Button */}
                <button
                    className={styles.signInButton}
                    onClick={handleSignIn}
                >
                    Sign In with Google
                </button>

                {/* Secondary Link */}
                <button
                    className={styles.continueLink}
                    onClick={onClose}
                >
                    Continue browsing
                </button>
            </div>
        </div>
    );
}
