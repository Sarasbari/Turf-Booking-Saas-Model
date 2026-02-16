import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { OwnerData, BookingType } from '../../types/owner';
import { StatCard } from '../../components/Owner/StatCard';
import styles from '../../styles/Owner/OwnerRevenue.module.css';

type TimeFilter = 'week' | 'month' | '3months' | 'year';

export function OwnerRevenue() {
    const [ownerData, setOwnerData] = useState<OwnerData | null>(null);
    const [bookings, setBookings] = useState<BookingType[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<BookingType[]>([]);
    const [activeFilter, setActiveFilter] = useState<TimeFilter>('month');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        filterBookingsByTime();
    }, [bookings, activeFilter]);

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

            const bookingsQuery = query(
                collection(db, 'bookings'),
                where('turfId', '==', owner.turfId)
            );
            const bookingsSnapshot = await getDocs(bookingsQuery);
            const bookingsData = bookingsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as BookingType[];

            setBookings(bookingsData);
        } catch (error) {
            console.error('Error fetching revenue data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterBookingsByTime = () => {
        const now = new Date();
        let startDate: Date;

        switch (activeFilter) {
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case '3months':
                startDate = new Date(now);
                startDate.setMonth(now.getMonth() - 3);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
        }

        const filtered = bookings.filter(b => {
            const bookingDate = new Date(b.date);
            return bookingDate >= startDate && b.status !== 'cancelled';
        });

        setFilteredBookings(filtered);
    };

    const calculateStats = () => {
        const totalRevenue = filteredBookings.reduce((sum, b) => sum + (b.amount || 0), 0);
        const totalBookings = filteredBookings.length;
        const avgPerBooking = totalBookings > 0 ? totalRevenue / totalBookings : 0;

        // Best day revenue
        const revenueByDate: Record<string, number> = {};
        filteredBookings.forEach(b => {
            if (!revenueByDate[b.date]) {
                revenueByDate[b.date] = 0;
            }
            revenueByDate[b.date] += b.amount || 0;
        });

        const bestDayRevenue = Math.max(...Object.values(revenueByDate), 0);

        return {
            totalRevenue,
            totalBookings,
            avgPerBooking,
            bestDayRevenue
        };
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                <div style={{ color: '#6B7280' }}>Loading revenue data...</div>
            </div>
        );
    }

    const stats = calculateStats();

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Revenue Analytics</h1>
                <p className={styles.subtitle}>Track your earnings and booking performance</p>
            </div>

            {/* Time Filter */}
            <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '24px',
                flexWrap: 'wrap'
            }}>
                {(['week', 'month', '3months', 'year'] as TimeFilter[]).map(filter => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: activeFilter === filter ? '#FFF7ED' : 'white',
                            color: activeFilter === filter ? '#EA580C' : '#6B7280',
                            border: `1px solid ${activeFilter === filter ? '#EA580C' : '#E5E7EB'}`,
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {filter === 'week' && 'This Week'}
                        {filter === 'month' && 'This Month'}
                        {filter === '3months' && 'Last 3 Months'}
                        {filter === 'year' && 'This Year'}
                    </button>
                ))}
            </div>

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '32px'
            }}>
                <StatCard
                    title="Total Revenue"
                    value={`₹${stats.totalRevenue.toLocaleString()}`}
                    subtitle={`from ${stats.totalBookings} bookings`}
                    borderColor="#EA580C"
                    icon="💰"
                />
                <StatCard
                    title="Total Bookings"
                    value={stats.totalBookings}
                    subtitle="completed bookings"
                    borderColor="#3B82F6"
                    icon="📅"
                />
                <StatCard
                    title="Avg per Booking"
                    value={`₹${Math.round(stats.avgPerBooking)}`}
                    subtitle="average revenue"
                    borderColor="#F59E0B"
                    icon="📊"
                />
                <StatCard
                    title="Best Day Revenue"
                    value={`₹${stats.bestDayRevenue.toLocaleString()}`}
                    subtitle="highest earning day"
                    borderColor="#10B981"
                    icon="🏆"
                />
            </div>
        </div>
    );
}
