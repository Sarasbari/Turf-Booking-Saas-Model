import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import styles from './AuthCallback.module.css';

export function AuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState<string>('');

    useEffect(() => {
        const error = searchParams.get('error');

        if (error) {
            setStatus('error');
            setErrorMessage(
                error === 'no_code'
                    ? 'No authorization code received from Google'
                    : 'Authentication failed. Please try again.'
            );
            return;
        }

        if (!loading) {
            if (user) {
                setStatus('success');
                setTimeout(() => {
                    navigate('/listings', { replace: true });
                }, 1500);
            } else {
                setStatus('error');
                setErrorMessage('No authentication token received');
            }
        }
    }, [searchParams, navigate, user, loading]);

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.card}>
                    {status === 'loading' && (
                        <>
                            <div className={styles.spinner}></div>
                            <h2 className={styles.heading}>Completing Sign In...</h2>
                            <p className={styles.description}>
                                Please wait while we verify your credentials.
                            </p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className={styles.successIcon}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path
                                        d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
                                        strokeWidth={2}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <polyline
                                        points="22 4 12 14.01 9 11.01"
                                        strokeWidth={2}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                            <h2 className={styles.heading}>Sign In Successful!</h2>
                            <p className={styles.description}>
                                Redirecting you to the listings page...
                            </p>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className={styles.errorIcon}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <circle cx="12" cy="12" r="10" strokeWidth={2} />
                                    <line x1="15" y1="9" x2="9" y2="15" strokeWidth={2} />
                                    <line x1="9" y1="9" x2="15" y2="15" strokeWidth={2} />
                                </svg>
                            </div>
                            <h2 className={styles.heading}>Sign In Failed</h2>
                            <p className={styles.description}>{errorMessage}</p>
                            <button
                                className={styles.retryButton}
                                onClick={() => navigate('/signin')}
                            >
                                Try Again
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
