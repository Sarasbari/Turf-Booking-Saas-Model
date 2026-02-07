import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getUserProfile, createUserProfile } from '../../utils/firestoreUtils';
import { UserProfile } from '../../types/profile';
import { ProfileSidebar } from '../../components/ProfileSidebar/ProfileSidebar';
import { MyBookings } from '../../components/MyBookings/MyBookings';
import { PersonalInfo } from '../../components/PersonalInfo/PersonalInfo';
import { Favorites } from '../../components/Favorites/Favorites';
import { Settings } from '../../components/Settings/Settings';
import './Profile.css';

export function Profile() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [activeSection, setActiveSection] = useState('bookings');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        // Wait for auth state to be determined
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                loadProfile(currentUser.uid);
            } else {
                // Not authenticated, redirect to sign in
                navigate('/signin');
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    const loadProfile = async (userId: string) => {
        try {
            setLoading(true);
            setError(null);

            // Try to fetch user profile
            let userProfile = await getUserProfile(userId);

            // If profile doesn't exist, create it
            if (!userProfile) {
                const currentUser = auth.currentUser;
                if (!currentUser) {
                    navigate('/signin');
                    return;
                }

                userProfile = await createUserProfile(userId, {
                    name: currentUser.displayName || 'User',
                    email: currentUser.email || '',
                    picture: currentUser.photoURL || '',
                });

                // Redirect to personal info to complete profile
                setActiveSection('personal');
            }

            setProfile(userProfile);
        } catch (err) {
            console.error('Error loading profile:', err);
            setError('Unable to load profile. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = () => {
        // Reload profile data after update
        const currentUser = auth.currentUser;
        if (currentUser) {
            loadProfile(currentUser.uid);
        }
    };

    const renderContent = () => {
        if (!profile) return null;

        switch (activeSection) {
            case 'bookings':
                return <MyBookings userId={profile.uid} />;
            case 'personal':
                return (
                    <PersonalInfo
                        userId={profile.uid}
                        profile={profile}
                        onProfileUpdate={handleProfileUpdate}
                    />
                );
            case 'favorites':
                return <Favorites />;
            case 'settings':
                return <Settings />;
            default:
                return <MyBookings userId={profile.uid} />;
        }
    };

    if (loading) {
        return (
            <div className="profile-loading">
                <div className="spinner-large"></div>
                <p>Loading your profile...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="profile-error">
                <h2>Oops! Something went wrong</h2>
                <p>{error}</p>
                <button onClick={() => {
                    const currentUser = auth.currentUser;
                    if (currentUser) loadProfile(currentUser.uid);
                }} className="retry-button">
                    Try Again
                </button>
            </div>
        );
    }

    if (!profile) {
        return null;
    }

    return (
        <div className="profile-page">
            <div className="profile-container">
                {/* Mobile Header */}
                <div className="mobile-header">
                    <button
                        className="mobile-menu-button"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        ☰
                    </button>
                    <h1>My Profile</h1>
                </div>

                {/* Sidebar */}
                <ProfileSidebar
                    user={{
                        name: profile.name,
                        email: profile.email,
                        picture: profile.picture,
                    }}
                    activeSection={activeSection}
                    onSectionChange={setActiveSection}
                    isMobileMenuOpen={isMobileMenuOpen}
                    onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
                />

                {/* Main Content */}
                <main className="profile-content">{renderContent()}</main>
            </div>
        </div>
    );
}
