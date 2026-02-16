import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { initiateGoogleLogin } from '../../utils/auth';
import styles from './SignIn.module.css';

// ── Types ────────────────────────────────────────────────────
type TabType = 'user' | 'owner';
type OwnerView = 'signin' | 'register' | 'pending';

interface OwnerFormData {
    phone: string;
    turfId: string;
    claimCode: string;
}

interface OwnerFormErrors {
    phone: string | null;
    turfId: string | null;
    claimCode: string | null;
}

interface SignInModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// ── Google Sign In SVG Icon (reusable) ───────────────────────
function GoogleIcon() {
    return (
        <svg className={styles.googleIcon} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
    );
}

// ── Google Sign In Button (reusable) ─────────────────────────
function GoogleSignInButton({
    onClick,
    isLoading,
    label = 'Continue with Google'
}: {
    onClick: () => void;
    isLoading: boolean;
    label?: string;
}) {
    return (
        <button
            className={styles.googleButton}
            onClick={onClick}
            disabled={isLoading}
        >
            {isLoading ? (
                <>
                    <div className={styles.spinner}></div>
                    <span>Signing in...</span>
                </>
            ) : (
                <>
                    <GoogleIcon />
                    <span>{label}</span>
                </>
            )}
        </button>
    );
}

// ═════════════════════════════════════════════════════════════
//  MAIN MODAL COMPONENT
// ═════════════════════════════════════════════════════════════

export function SignInModal({ isOpen, onClose }: SignInModalProps) {
    const navigate = useNavigate();

    // ── Shared state ─────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<TabType>('user');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ── Owner state ──────────────────────────────────────────
    const [ownerView, setOwnerView] = useState<OwnerView>('signin');
    const [googleUser, setGoogleUser] = useState<User | null>(null);
    const [ownerForm, setOwnerForm] = useState<OwnerFormData>({
        phone: '',
        turfId: '',
        claimCode: '',
    });
    const [formErrors, setFormErrors] = useState<OwnerFormErrors>({
        phone: null,
        turfId: null,
        claimCode: null,
    });

    // ── Body scroll lock ─────────────────────────────────────
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    // ── Escape key ───────────────────────────────────────────
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // ── Reset state when tab changes ─────────────────────────
    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        setError(null);
        setOwnerView('signin');
        setGoogleUser(null);
        setOwnerForm({ phone: '', turfId: '', claimCode: '' });
        setFormErrors({ phone: null, turfId: null, claimCode: null });
    };

    // ── Clear field error on type ────────────────────────────
    const handleFormChange = (field: keyof OwnerFormData, value: string) => {
        setOwnerForm(prev => ({ ...prev, [field]: value }));
        setFormErrors(prev => ({ ...prev, [field]: null }));
        setError(null);
    };

    // ═════════════════════════════════════════════════════════
    //  USER TAB — Google Sign In (existing logic)
    // ═════════════════════════════════════════════════════════

    const handleUserGoogleSignIn = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await initiateGoogleLogin();
            onClose();
            window.location.reload();
        } catch (err: any) {
            console.error('Error during sign in:', err);
            setError(err.message || 'Failed to sign in. Please try again.');
            setIsLoading(false);
        }
    };

    // ═════════════════════════════════════════════════════════
    //  OWNER TAB — Google Sign In (check owners collection)
    // ═════════════════════════════════════════════════════════

    const handleOwnerGoogleSignIn = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check owners collection
            const ownerDoc = await getDoc(doc(db, 'owners', user.uid));

            if (ownerDoc.exists()) {
                const ownerData = ownerDoc.data();
                if (ownerData.isApproved === true) {
                    // ✅ Approved owner → go to dashboard
                    onClose();
                    navigate('/owner/dashboard');
                } else {
                    // ⏳ Pending approval
                    setOwnerView('pending');
                }
            } else {
                // ❌ Not registered as owner
                setError('Not registered as owner. Please register first.');
                setGoogleUser(user);
                setTimeout(() => setOwnerView('register'), 1500);
            }
        } catch (err: any) {
            console.error('Owner sign in error:', err);
            setError(err.message || 'Failed to sign in. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // ═════════════════════════════════════════════════════════
    //  OWNER REGISTER — Google Sign In (just authenticate)
    // ═════════════════════════════════════════════════════════

    const handleRegisterGoogleSignIn = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            setGoogleUser(result.user);
        } catch (err: any) {
            console.error('Google sign in error:', err);
            setError(err.message || 'Failed to sign in with Google.');
        } finally {
            setIsLoading(false);
        }
    };

    // ═════════════════════════════════════════════════════════
    //  OWNER REGISTER — Complete Registration
    // ═════════════════════════════════════════════════════════

    const handleCompleteRegistration = async () => {
        // 1. Check Google sign in
        if (!googleUser) {
            setError('Please sign in with Google first.');
            return;
        }

        // 2. Validate phone
        const phoneClean = ownerForm.phone.replace(/\s/g, '');
        if (!phoneClean || phoneClean.length !== 10 || !/^\d{10}$/.test(phoneClean)) {
            setFormErrors(prev => ({ ...prev, phone: 'Enter valid 10-digit phone number' }));
            return;
        }

        // 3. Validate turf ID
        if (!ownerForm.turfId.trim()) {
            setFormErrors(prev => ({ ...prev, turfId: 'Enter your Turf ID' }));
            return;
        }

        // 4. Validate claim code
        if (!ownerForm.claimCode.trim()) {
            setFormErrors(prev => ({ ...prev, claimCode: 'Enter your claim code' }));
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // 5. Check turf exists
            const turfDoc = await getDoc(doc(db, 'turf', ownerForm.turfId.trim()));
            if (!turfDoc.exists()) {
                setFormErrors(prev => ({ ...prev, turfId: 'Turf ID not found. Contact admin.' }));
                setIsLoading(false);
                return;
            }

            const turfData = turfDoc.data();

            // 6. Check claim code matches
            if (turfData.claimCode !== ownerForm.claimCode.trim()) {
                setFormErrors(prev => ({ ...prev, claimCode: 'Invalid claim code' }));
                setIsLoading(false);
                return;
            }

            // 7. Check claim code not already used
            if (turfData.claimCodeUsed === true) {
                setFormErrors(prev => ({ ...prev, claimCode: 'Claim code already used. Contact admin.' }));
                setIsLoading(false);
                return;
            }

            // 8. Check turf doesn't already have an owner
            if (turfData.ownerId) {
                setError('This turf already has an owner.');
                setIsLoading(false);
                return;
            }

            // ✅ All checks passed — Create owner document
            await setDoc(doc(db, 'owners', googleUser.uid), {
                uid: googleUser.uid,
                name: googleUser.displayName || '',
                email: googleUser.email || '',
                phone: phoneClean,
                photoURL: googleUser.photoURL || '',
                turfId: ownerForm.turfId.trim(),
                role: 'owner',
                isApproved: false,
                createdAt: new Date(),
            });

            // Update turf document
            await updateDoc(doc(db, 'turf', ownerForm.turfId.trim()), {
                claimCodeUsed: true,
                ownerId: googleUser.uid,
            });

            // Show pending view
            setOwnerView('pending');
        } catch (err: any) {
            console.error('Registration error:', err);
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // ═════════════════════════════════════════════════════════
    //  RENDER
    // ═════════════════════════════════════════════════════════

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

                {/* ✅ Tab Switcher */}
                <div className={styles.tabContainer}>
                    <button
                        className={`${styles.tab} ${activeTab === 'user' ? styles.tabActive : ''}`}
                        onClick={() => handleTabChange('user')}
                    >
                        User
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'owner' ? styles.tabActive : ''}`}
                        onClick={() => handleTabChange('owner')}
                    >
                        Owner
                    </button>
                </div>

                {/* ══════════ USER TAB ══════════ */}
                {activeTab === 'user' && (
                    <>
                        <GoogleSignInButton onClick={handleUserGoogleSignIn} isLoading={isLoading} />
                        <div className={styles.divider}></div>
                        {error && <div className={styles.errorMessage}>{error}</div>}
                        <p className={styles.terms}>
                            I agree to{' '}
                            <a href="/terms" target="_blank" rel="noopener noreferrer">Terms & Conditions</a>
                            {' '}and{' '}
                            <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
                        </p>
                    </>
                )}

                {/* ══════════ OWNER TAB ══════════ */}
                {activeTab === 'owner' && (
                    <>
                        {/* ── VIEW 1: Owner Sign In ── */}
                        {ownerView === 'signin' && (
                            <>
                                <GoogleSignInButton onClick={handleOwnerGoogleSignIn} isLoading={isLoading} />

                                <p className={styles.ownerHint}>
                                    Already registered as owner?<br />
                                    Your dashboard will load automatically
                                </p>

                                {error && <div className={styles.errorMessage}>{error}</div>}

                                <div className={styles.dividerText}>
                                    <span>or</span>
                                </div>

                                <button
                                    className={styles.registerButton}
                                    onClick={() => { setOwnerView('register'); setError(null); }}
                                >
                                    + Register as Turf Owner
                                </button>
                            </>
                        )}

                        {/* ── VIEW 2: Register Form ── */}
                        {ownerView === 'register' && (
                            <div className={styles.registerForm}>
                                {/* Back button */}
                                <button
                                    className={styles.backButton}
                                    onClick={() => { setOwnerView('signin'); setError(null); setGoogleUser(null); }}
                                >
                                    ← Back
                                </button>

                                <h3 className={styles.registerHeading}>Register as Turf Owner</h3>

                                {/* Step 1: Google Sign In */}
                                {!googleUser ? (
                                    <>
                                        <GoogleSignInButton
                                            onClick={handleRegisterGoogleSignIn}
                                            isLoading={isLoading}
                                            label="Sign in with Google"
                                        />
                                        <div className={styles.dividerText}>
                                            <span>then complete your details</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className={styles.googleConnected}>
                                        <img
                                            src={googleUser.photoURL || ''}
                                            alt=""
                                            className={styles.googleAvatar}
                                        />
                                        <div>
                                            <div className={styles.googleName}>{googleUser.displayName}</div>
                                            <div className={styles.googleEmail}>{googleUser.email}</div>
                                        </div>
                                        <span className={styles.connectedBadge}>✓</span>
                                    </div>
                                )}

                                {/* General error */}
                                {error && <div className={styles.errorMessage}>{error}</div>}

                                {/* Phone */}
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Phone Number</label>
                                    <input
                                        type="tel"
                                        className={`${styles.fieldInput} ${formErrors.phone ? styles.fieldInputError : ''}`}
                                        placeholder="e.g. 9876543210"
                                        maxLength={10}
                                        value={ownerForm.phone}
                                        onChange={(e) => handleFormChange('phone', e.target.value.replace(/\D/g, ''))}
                                    />
                                    {formErrors.phone && <span className={styles.fieldError}>{formErrors.phone}</span>}
                                </div>

                                {/* Turf ID */}
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Turf ID</label>
                                    <input
                                        type="text"
                                        className={`${styles.fieldInput} ${formErrors.turfId ? styles.fieldInputError : ''}`}
                                        placeholder="e.g. TRF001"
                                        value={ownerForm.turfId}
                                        onChange={(e) => handleFormChange('turfId', e.target.value.toUpperCase())}
                                    />
                                    <span className={styles.fieldHelper}>Provided by admin</span>
                                    {formErrors.turfId && <span className={styles.fieldError}>{formErrors.turfId}</span>}
                                </div>

                                {/* Claim Code */}
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Claim Code</label>
                                    <input
                                        type="text"
                                        className={`${styles.fieldInput} ${formErrors.claimCode ? styles.fieldInputError : ''}`}
                                        placeholder="e.g. TRF-K29XM4"
                                        value={ownerForm.claimCode}
                                        onChange={(e) => handleFormChange('claimCode', e.target.value.toUpperCase())}
                                    />
                                    <span className={styles.fieldHelper}>One-time code from admin</span>
                                    {formErrors.claimCode && <span className={styles.fieldError}>{formErrors.claimCode}</span>}
                                </div>

                                {/* Submit */}
                                <button
                                    className={styles.submitButton}
                                    onClick={handleCompleteRegistration}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <div className={styles.spinner}></div>
                                            <span>Registering...</span>
                                        </>
                                    ) : (
                                        'Complete Registration'
                                    )}
                                </button>

                                {/* WhatsApp help */}
                                <p className={styles.helpText}>
                                    Need a claim code?{' '}
                                    <a
                                        href="https://wa.me/919876543210?text=Hi%2C%20I%20need%20a%20claim%20code%20to%20register%20as%20a%20turf%20owner%20on%20TurfBook."
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.whatsappLink}
                                    >
                                        WhatsApp us
                                    </a>
                                </p>
                            </div>
                        )}

                        {/* ── VIEW 3: Pending Approval ── */}
                        {ownerView === 'pending' && (
                            <div className={styles.pendingView}>
                                <div className={styles.pendingIcon}>⏳</div>
                                <h3 className={styles.pendingHeading}>Registration Submitted!</h3>
                                <p className={styles.pendingText}>
                                    Your account is under review.<br />
                                    You will receive access within 24 hours.
                                </p>
                                <a
                                    href="https://wa.me/919876543210?text=Hi%2C%20I%20registered%20as%20a%20turf%20owner%20on%20TurfBook.%20Please%20approve%20my%20account."
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.whatsappButton}
                                >
                                    💬 Contact Admin on WhatsApp
                                </a>
                                <button className={styles.closePendingButton} onClick={onClose}>
                                    Close
                                </button>
                            </div>
                        )}
                    </>
                )}

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