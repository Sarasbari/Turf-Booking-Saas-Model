import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { OwnerData, TurfData } from '../../types/owner';
import { DashboardProvider } from '../../context/DashboardContext';
import DashboardHeader from '../../components/features/Owner/DashboardHeader';
import styles from '../../styles/Owner/OwnerLayout.module.css';

export function OwnerLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [ownerData, setOwnerData] = useState<OwnerData | null>(null);
    const [turfData, setTurfData] = useState<TurfData | null>(null);
    const [pendingBookingsCount, setPendingBookingsCount] = useState(0);
    const [unrepliedReviewsCount, setUnrepliedReviewsCount] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const fetchOwnerAndTurfData = async () => {
            const user = auth.currentUser;
            if (!user) return;

            try {
                // Fetch owner data
                const ownerDocRef = doc(db, 'owners', user.uid);
                const ownerDoc = await getDoc(ownerDocRef);

                if (ownerDoc.exists()) {
                    const owner = ownerDoc.data() as OwnerData;
                    setOwnerData(owner);

                    // Fetch turf data
                    if (owner.turfId) {
                        const turfDocRef = doc(db, 'turf', owner.turfId);
                        const turfDoc = await getDoc(turfDocRef);

                        if (turfDoc.exists()) {
                            setTurfData({ id: turfDoc.id, ...turfDoc.data() } as TurfData);
                        }

                        // Fetch pending bookings count
                        const bookingsQuery = query(
                            collection(db, 'bookings'),
                            where('turfId', '==', owner.turfId),
                            where('status', '==', 'pending')
                        );
                        const bookingsSnapshot = await getDocs(bookingsQuery);
                        setPendingBookingsCount(bookingsSnapshot.size);

                        // Fetch unreplied reviews count - get all and filter
                        const reviewsRef = collection(db, 'turf', owner.turfId, 'reviews');
                        const reviewsSnapshot = await getDocs(reviewsRef);
                        const unrepliedCount = reviewsSnapshot.docs.filter(doc => !doc.data().ownerReply).length;
                        setUnrepliedReviewsCount(unrepliedCount);
                    }
                }
            } catch (error) {
                console.error('Error fetching owner/turf data:', error);
            }
        };

        fetchOwnerAndTurfData();
    }, []);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    return (
        <div className={styles.layout}>
            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
                {/* Logo */}
                <div className={styles.sidebarLogo}>
                    🏟️ Owner Dashboard
                </div>

                {/* Owner Info */}
                {ownerData && turfData && (
                    <div className={styles.ownerInfo}>
                        <div className={styles.ownerCard}>
                            <img
                                src={ownerData.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(ownerData.name)}
                                alt={ownerData.name}
                                className={styles.ownerAvatar}
                            />
                            <div className={styles.ownerDetails}>
                                <div className={styles.ownerName}>{ownerData.name}</div>
                                <div className={styles.ownerTurf}>{turfData.name}</div>
                                <div className={styles.ownerTurf} style={{ fontSize: '11px', marginTop: '2px' }}>
                                    ID: {ownerData.turfId}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className={styles.navSection}>
                    <div className={styles.navLabel}>MAIN</div>
                    <NavLink
                        to="/owner/dashboard"
                        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                        onClick={closeSidebar}
                    >
                        <span className={styles.navIcon}>🏠</span>
                        Overview
                    </NavLink>
                    <NavLink
                        to="/owner/bookings"
                        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                        onClick={closeSidebar}
                    >
                        <span className={styles.navIcon}>📅</span>
                        Bookings
                        {pendingBookingsCount > 0 && (
                            <span className={styles.badge}>{pendingBookingsCount}</span>
                        )}
                    </NavLink>
                    <NavLink
                        to="/owner/slots"
                        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                        onClick={closeSidebar}
                    >
                        <span className={styles.navIcon}>⏰</span>
                        Slot Manager
                    </NavLink>
                    <NavLink
                        to="/owner/turf"
                        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                        onClick={closeSidebar}
                    >
                        <span className={styles.navIcon}>🏟️</span>
                        My Turf
                    </NavLink>
                </nav>

                <nav className={styles.navSection}>
                    <div className={styles.navLabel}>INSIGHTS</div>
                    <NavLink
                        to="/owner/revenue"
                        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                        onClick={closeSidebar}
                    >
                        <span className={styles.navIcon}>💰</span>
                        Revenue
                    </NavLink>
                    <NavLink
                        to="/owner/reviews"
                        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                        onClick={closeSidebar}
                    >
                        <span className={styles.navIcon}>⭐</span>
                        Reviews
                        {unrepliedReviewsCount > 0 && (
                            <span className={styles.badge}>{unrepliedReviewsCount}</span>
                        )}
                    </NavLink>
                </nav>

                <nav className={styles.navSection}>
                    <div className={styles.navLabel}>OTHER</div>
                    <NavLink
                        to="/owner/settings"
                        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                        onClick={closeSidebar}
                    >
                        <span className={styles.navIcon}>⚙️</span>
                        Settings
                    </NavLink>
                    <div className={styles.navItem} onClick={handleSignOut}>
                        <span className={styles.navIcon}>🚪</span>
                        Sign Out
                    </div>
                </nav>
            </aside>

            {/* Overlay for mobile */}
            <div
                className={`${styles.overlay} ${sidebarOpen ? styles.overlayVisible : ''}`}
                onClick={closeSidebar}
            ></div>

            {/* Main Content */}
            <div className={styles.mainContent}>
                {/* Topbar */}
                <DashboardHeader
                    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    onSignOut={handleSignOut}
                    ownerData={ownerData}
                    turfData={turfData}
                />

                {/* Page Content */}
                <main className={styles.content}>
                    <DashboardProvider ownerData={ownerData} turfData={turfData}>
                        <Outlet />
                    </DashboardProvider>
                </main>
            </div>
        </div>
    );
}
