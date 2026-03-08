import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { OwnerData, TurfData } from '../../types/owner';
import styles from '../../styles/Owner/OwnerSettings.module.css';

export function OwnerSettings() {
    const [ownerData, setOwnerData] = useState<OwnerData | null>(null);
    const [turfData, setTurfData] = useState<TurfData | null>(null);
    const [profileData, setProfileData] = useState({
        name: '',
        phone: '',
        email: ''
    });
    const [notifications, setNotifications] = useState({
        newBooking: true,
        cancellation: true,
        newReview: true,
        dailySummary: true
    });
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            setLoading(true);

            const ownerDocRef = doc(db, 'owners', user.uid);
            const ownerDoc = await getDoc(ownerDocRef);
            
            if (!ownerDoc.exists()) return;
            
            const owner = ownerDoc.data() as OwnerData;
            setOwnerData(owner);
            
            setProfileData({
                name: owner.name,
                phone: owner.phone,
                email: owner.email
            });

            if (owner.notifications) {
                setNotifications(owner.notifications);
            }

            const turfDocRef = doc(db, 'turf', owner.turfId);
            const turfDoc = await getDoc(turfDocRef);
            
            if (turfDoc.exists()) {
                const turf = { id: turfDoc.id, ...turfDoc.data() } as TurfData;
                setTurfData(turf);
                setMaintenanceMode(turf.isUnderMaintenance || false);
            }

        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!ownerData) return;

        try {
            setSaving(true);

            const ownerRef = doc(db, 'owners', ownerData.uid);
            await updateDoc(ownerRef, {
                name: profileData.name,
                phone: profileData.phone
            });

            alert('✅ Profile updated successfully');
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Failed to update profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveNotifications = async () => {
        if (!ownerData) return;

        try {
            setSaving(true);

            const ownerRef = doc(db, 'owners', ownerData.uid);
            await updateDoc(ownerRef, {
                notifications
            });

            alert('✅ Notification preferences updated');
        } catch (error) {
            console.error('Error saving notifications:', error);
            alert('Failed to update notifications. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleMaintenance = async () => {
        if (!ownerData || !turfData) return;

        const newState = !maintenanceMode;
        if (!confirm(`${newState ? 'Enable' : 'Disable'} maintenance mode?\n\n${newState ? 'New bookings will be blocked.' : 'Bookings will be enabled again.'}`)) {
            return;
        }

        try {
            setSaving(true);

            const turfRef = doc(db, 'turf', ownerData.turfId);
            await updateDoc(turfRef, {
                isUnderMaintenance: newState
            });

            setMaintenanceMode(newState);
            alert(`✅ Maintenance mode ${newState ? 'enabled' : 'disabled'}`);
        } catch (error) {
            console.error('Error toggling maintenance mode:', error);
            alert('Failed to update maintenance mode. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleSignOut = async () => {
        if (!confirm('Are you sure you want to sign out?')) return;

        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                <div style={{ color: '#6B7280' }}>Loading settings...</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Settings</h1>
                <p className={styles.subtitle}>Manage your profile and preferences</p>
            </div>

            {/* Profile Section */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Profile</h2>
                <div style={{ display: 'grid', gap: '20px', maxWidth: '500px' }}>
                    {ownerData && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <img
                                src={ownerData.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(ownerData.name)}
                                alt={ownerData.name}
                                style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: '3px solid #FFF7ED'
                                }}
                            />
                            <div>
                                <div style={{ fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                                    Profile Photo
                                </div>
                                <div style={{ fontSize: '13px', color: '#6B7280' }}>
                                    Managed through your Google account
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                            Name
                        </label>
                        <input
                            type="text"
                            value={profileData.name}
                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px',
                                fontSize: '14px'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                            Phone
                        </label>
                        <input
                            type="tel"
                            value={profileData.phone}
                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px',
                                fontSize: '14px'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={profileData.email}
                            disabled
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px',
                                fontSize: '14px',
                                backgroundColor: '#F9FAFB',
                                color: '#9CA3AF'
                            }}
                        />
                        <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
                            Email cannot be changed
                        </div>
                    </div>

                    <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#EA580C',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Notifications Section */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Notifications</h2>
                <div style={{ display: 'grid', gap: '16px', maxWidth: '500px' }}>
                    {Object.entries(notifications).map(([key, value]) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 600, color: '#111827', marginBottom: '2px' }}>
                                    {key === 'newBooking' && 'New Booking Alert'}
                                    {key === 'cancellation' && 'Cancellation Alert'}
                                    {key === 'newReview' && 'New Review Alert'}
                                    {key === 'dailySummary' && 'Daily Summary'}
                                </div>
                                <div style={{ fontSize: '13px', color: '#6B7280' }}>
                                    {key === 'newBooking' && 'Get notified when new bookings are made'}
                                    {key === 'cancellation' && 'Get notified when bookings are cancelled'}
                                    {key === 'newReview' && 'Get notified when customers leave reviews'}
                                    {key === 'dailySummary' && 'Receive daily summary of bookings and revenue'}
                                </div>
                            </div>
                            <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px' }}>
                                <input
                                    type="checkbox"
                                    checked={value}
                                    onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span style={{
                                    position: 'absolute',
                                    cursor: 'pointer',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: value ? '#EA580C' : '#E5E7EB',
                                    transition: '0.4s',
                                    borderRadius: '28px'
                                }}>
                                    <span style={{
                                        position: 'absolute',
                                        content: '',
                                        height: '20px',
                                        width: '20px',
                                        left: value ? '26px' : '4px',
                                        bottom: '4px',
                                        backgroundColor: 'white',
                                        transition: '0.4s',
                                        borderRadius: '50%'
                                    }} />
                                </span>
                            </label>
                        </div>
                    ))}
                    
                    <button
                        onClick={handleSaveNotifications}
                        disabled={saving}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#EA580C',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            marginTop: '4px'
                        }}
                    >
                        {saving ? 'Saving...' : 'Save Preferences'}
                    </button>
                </div>
            </div>

            {/* Turf Status Section */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Turf Status</h2>
                <div style={{ maxWidth: '500px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div>
                            <div style={{ fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                                Maintenance Mode
                            </div>
                            <div style={{ fontSize: '13px', color: '#6B7280' }}>
                                When ON, new bookings are blocked
                            </div>
                        </div>
                        <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px' }}>
                            <input
                                type="checkbox"
                                checked={maintenanceMode}
                                onChange={handleToggleMaintenance}
                                disabled={saving}
                                style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <span style={{
                                position: 'absolute',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: maintenanceMode ? '#DC2626' : '#E5E7EB',
                                transition: '0.4s',
                                borderRadius: '28px'
                            }}>
                                <span style={{
                                    position: 'absolute',
                                    content: '',
                                    height: '20px',
                                    width: '20px',
                                    left: maintenanceMode ? '26px' : '4px',
                                    bottom: '4px',
                                    backgroundColor: 'white',
                                    transition: '0.4s',
                                    borderRadius: '50%'
                                }} />
                            </span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Account Section */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Account</h2>
                <button
                    onClick={handleSignOut}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#DC2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                    }}
                >
                    🚪 Sign Out
                </button>
            </div>
        </div>
    );
}
