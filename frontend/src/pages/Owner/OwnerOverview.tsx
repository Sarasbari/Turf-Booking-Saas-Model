import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { OwnerData, TurfData, BookingType, ActivityData } from '../../types/owner';
import { StatCard } from '../../components/Owner/StatCard';
import { generateTimeSlots } from '../../utils/slotUtils';
import styles from '../../styles/Owner/OwnerOverview.module.css';

export function OwnerOverview() {
    const [ownerData, setOwnerData] = useState<OwnerData | null>(null);
    const [turfData, setTurfData] = useState<TurfData | null>(null);
    const [bookings, setBookings] = useState<BookingType[]>([]);
    const [todayBookings, setTodayBookings] = useState<BookingType[]>([]);
    const [stats, setStats] = useState({
        revenue: 0,
        totalBookings: 0,
        avgRating: 0,
        occupancyRate: 0,
        revenueTrend: 0,
        bookingsTrend: 0
    });
    const [activities, setActivities] = useState<ActivityData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            setLoading(true);

            // Fetch owner data
            const ownerDocRef = doc(db, 'owners', user.uid);
            const ownerDoc = await getDoc(ownerDocRef);
            
            if (!ownerDoc.exists()) return;
            
            const owner = ownerDoc.data() as OwnerData;
            setOwnerData(owner);

            // Fetch turf data
            const turfDocRef = doc(db, 'turf', owner.turfId);
            const turfDoc = await getDoc(turfDocRef);
            
            if (!turfDoc.exists()) return;
            
            const turf = { id: turfDoc.id, ...turfDoc.data() } as TurfData;
            setTurfData(turf);

            // Fetch bookings for this month
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            const bookingsQuery = query(
                collection(db, 'bookings'),
                where('turfId', '==', owner.turfId)
            );
            const bookingsSnapshot = await getDocs(bookingsQuery);
            const allBookings = bookingsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as BookingType[];

            setBookings(allBookings);

            // Filter bookings for this month
            const thisMonthBookings = allBookings.filter(booking => {
                const bookingDate = new Date(booking.date);
                return bookingDate >= firstDayOfMonth && bookingDate <= lastDayOfMonth;
            });

            // Filter bookings for today
            const today = new Date().toISOString().split('T')[0];
            const todaysBookings = allBookings.filter(booking => 
                booking.date === today && booking.status !== 'cancelled'
            );
            setTodayBookings(todaysBookings);

            // Calculate stats
            const revenue = thisMonthBookings
                .filter(b => b.status !== 'cancelled')
                .reduce((sum, b) => sum + (b.amount || 0), 0);

            const totalBookings = thisMonthBookings.filter(b => b.status !== 'cancelled').length;

            // Calculate last month for trends
            const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            
            const lastMonthBookings = allBookings.filter(booking => {
                const bookingDate = new Date(booking.date);
                return bookingDate >= firstDayOfLastMonth && bookingDate <= lastDayOfLastMonth;
            });

            const lastMonthRevenue = lastMonthBookings
                .filter(b => b.status !== 'cancelled')
                .reduce((sum, b) => sum + (b.amount || 0), 0);
            const lastMonthCount = lastMonthBookings.filter(b => b.status !== 'cancelled').length;

            const revenueTrend = lastMonthRevenue > 0 
                ? ((revenue - lastMonthRevenue) / lastMonthRevenue) * 100 
                : 0;
            const bookingsTrend = lastMonthCount > 0 
                ? ((totalBookings - lastMonthCount) / lastMonthCount) * 100 
                : 0;

            setStats({
                revenue,
                totalBookings,
                avgRating: turf.rating || 0,
                occupancyRate: calculateOccupancyRate(thisMonthBookings, turf),
                revenueTrend,
                bookingsTrend
            });

            // Generate activities
            const recentActivities = generateActivities(allBookings.slice(0, 5));
            setActivities(recentActivities);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateOccupancyRate = (bookings: BookingType[], turf: TurfData): number => {
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        
        // Assume 12 hours per day (typical turf operation)
        const totalSlotsInMonth = daysInMonth * 12;
        const bookedSlots = bookings.filter(b => b.status !== 'cancelled').length;
        
        return totalSlotsInMonth > 0 ? Math.round((bookedSlots / totalSlotsInMonth) * 100) : 0;
    };

    const generateActivities = (recentBookings: BookingType[]): ActivityData[] => {
        return recentBookings.map((booking, index) => {
            let type: ActivityData['type'];
            let icon: string;
            let color: string;
            let message: string;

            switch (booking.status) {
                case 'confirmed':
                    type = 'confirmed';
                    icon = '✅';
                    color = '#10B981';
                    message = `Booking confirmed for ${booking.customerName}`;
                    break;
                case 'pending':
                    type = 'booking';
                    icon = '🔵';
                    color = '#3B82F6';
                    message = `New booking request from ${booking.customerName}`;
                    break;
                case 'cancelled':
                    type = 'cancellation';
                    icon = '❌';
                    color = '#DC2626';
                    message = `Booking cancelled - ${booking.customerName}`;
                    break;
                default:
                    type = 'booking';
                    icon = '📅';
                    color = '#6B7280';
                    message = `Booking update - ${booking.customerName}`;
            }

            return {
                id: booking.id + index,
                type,
                message,
                timestamp: booking.createdAt,
                icon,
                color
            };
        });
    };

    const getGreeting = (): string => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const formatTimestamp = (timestamp: Timestamp): string => {
        if (!timestamp) return '';
        const date = timestamp.toDate();
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                <div style={{ color: '#6B7280' }}>Loading dashboard...</div>
            </div>
        );
    }

    if (!ownerData || !turfData) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
                <div style={{ color: '#6B7280' }}>Unable to load dashboard data</div>
            </div>
        );
    }

    const timeSlots = turfData ? generateTimeSlots(turfData) : [];

    const getSlotStatusFromSlot = (slot: { label: string; startTime: string }): { status: string; booking?: BookingType } => {
        const booking = todayBookings.find(b => b.startTime === slot.startTime);
        
        if (booking) {
            return { 
                status: booking.status === 'pending' ? 'pending' : 'booked', 
                booking 
            };
        }
        
        return { status: 'available' };
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.greeting}>
                    {getGreeting()}, {ownerData.name}! 👋
                </div>
                <div className={styles.turfInfo}>
                    {turfData.name} · {turfData.city}
                </div>
                <div className={styles.subtitle}>
                    Here's what's happening today
                </div>
            </div>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                <StatCard
                    title="Total Revenue"
                    value={`₹${stats.revenue.toLocaleString()}`}
                    subtitle="this month"
                    trend={stats.revenueTrend > 0 ? 'up' : stats.revenueTrend < 0 ? 'down' : 'neutral'}
                    trendText={`${Math.abs(stats.revenueTrend).toFixed(1)}% vs last month`}
                    borderColor="#EA580C"
                    icon="💰"
                />
                <StatCard
                    title="Total Bookings"
                    value={stats.totalBookings}
                    subtitle="this month"
                    trend={stats.bookingsTrend > 0 ? 'up' : stats.bookingsTrend < 0 ? 'down' : 'neutral'}
                    trendText={`${Math.abs(stats.bookingsTrend).toFixed(1)}% vs last month`}
                    borderColor="#3B82F6"
                    icon="📅"
                />
                <StatCard
                    title="Average Rating"
                    value={stats.avgRating.toFixed(1)}
                    subtitle="out of 5.0"
                    borderColor="#F59E0B"
                    icon="⭐"
                />
                <StatCard
                    title="Occupancy Rate"
                    value={`${stats.occupancyRate}%`}
                    subtitle="this month"
                    borderColor="#10B981"
                    icon="📊"
                />
            </div>

            {/* Today's Schedule */}
            <div>
                <h2 className={styles.sectionTitle}>Today's Schedule</h2>
                {timeSlots.length > 0 ? (
                    <div className={styles.scheduleGrid}>
                        {timeSlots.map((slot, index) => {
                            const { status, booking } = getSlotStatusFromSlot(slot);
                            return (
                                <div key={index} className={styles.slotCard}>
                                    <div className={styles.slotTime}>{slot.label}</div>
                                    <div className={`${styles.slotStatus} ${
                                        status === 'available' ? styles.slotStatusAvailable :
                                        status === 'booked' ? styles.slotStatusBooked :
                                        status === 'blocked' ? styles.slotStatusBlocked :
                                        styles.slotStatusPending
                                    }`}>
                                        {status === 'available' && '🟢 Available'}
                                        {status === 'booked' && '🔴 Booked'}
                                        {status === 'blocked' && '⚫ Blocked'}
                                        {status === 'pending' && '🟡 Pending'}
                                    </div>
                                    {booking && (
                                        <div className={styles.slotDetails}>
                                            <div className={styles.slotCustomer}>{booking.customerName}</div>
                                            <div>{booking.sport} · ₹{booking.amount}</div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyStateIcon}>📅</div>
                        <div className={styles.emptyStateText}>No time slots configured</div>
                    </div>
                )}
            </div>

            {/* Recent Activity */}
            <div>
                <h2 className={styles.sectionTitle}>Recent Activity</h2>
                {activities.length > 0 ? (
                    <div className={styles.activityFeed}>
                        {activities.map((activity) => (
                            <div key={activity.id} className={styles.activityItem}>
                                <div 
                                    className={styles.activityIcon}
                                    style={{ backgroundColor: `${activity.color}20`, color: activity.color }}
                                >
                                    {activity.icon}
                                </div>
                                <div className={styles.activityContent}>
                                    <div className={styles.activityMessage}>{activity.message}</div>
                                    <div className={styles.activityTime}>
                                        {formatTimestamp(activity.timestamp)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyStateIcon}>📋</div>
                        <div className={styles.emptyStateText}>No recent activity</div>
                    </div>
                )}
            </div>
        </div>
    );
}
