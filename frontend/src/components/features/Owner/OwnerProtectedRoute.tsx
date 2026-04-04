import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/services/firebase';
import { OwnerData } from '@/types/owner';

export function OwnerProtectedRoute() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [ownerData, setOwnerData] = useState<OwnerData | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true);

            if (!currentUser) {
                setUser(null);
                setOwnerData(null);
                setLoading(false);
                return;
            }

            setUser(currentUser);

            // Check if user is an owner
            try {
                const ownerDocRef = doc(db, 'owners', currentUser.uid);
                const ownerDoc = await getDoc(ownerDocRef);

                if (ownerDoc.exists()) {
                    setOwnerData(ownerDoc.data() as OwnerData);
                } else {
                    setOwnerData(null);
                }
            } catch (error) {
                console.error('Error fetching owner data:', error);
                setOwnerData(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    // Show loading spinner
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#F9FAFB'
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        border: '4px solid #FFF7ED',
                        borderTop: '4px solid #EA580C',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    <p style={{ color: '#6B7280', fontSize: '14px' }}>Loading...</p>
                </div>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    // Redirect to home if not logged in
    if (!user) {
        return <Navigate to="/" replace />;
    }

    // Redirect to home if not an owner
    if (!ownerData) {
        return <Navigate to="/" replace />;
    }

    // Show pending approval page if not approved
    if (!ownerData.isApproved) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: '#F9FAFB',
                padding: '20px'
            }}>
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '48px',
                    maxWidth: '500px',
                    width: '100%',
                    textAlign: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)'
                }}>
                    <div style={{ fontSize: '64px', marginBottom: '24px' }}>⏳</div>
                    <h1 style={{
                        fontSize: '24px',
                        fontWeight: 700,
                        color: '#111827',
                        marginBottom: '12px'
                    }}>
                        Account Pending Approval
                    </h1>
                    <p style={{
                        fontSize: '16px',
                        color: '#6B7280',
                        lineHeight: '1.6',
                        marginBottom: '32px'
                    }}>
                        Your registration is under review. You will receive access within 24 hours.
                    </p>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        <a
                            href="https://wa.me/919999999999"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-block',
                                padding: '12px 24px',
                                backgroundColor: '#EA580C',
                                color: 'white',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                fontWeight: 600,
                                fontSize: '14px',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#C2410C'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#EA580C'}
                        >
                            Contact Admin on WhatsApp
                        </a>
                        <button
                            onClick={handleSignOut}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: 'white',
                                color: '#6B7280',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px',
                                fontWeight: 600,
                                fontSize: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.borderColor = '#EA580C';
                                e.currentTarget.style.color = '#EA580C';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.borderColor = '#E5E7EB';
                                e.currentTarget.style.color = '#6B7280';
                            }}
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Render child routes if approved
    return <Outlet />;
}
