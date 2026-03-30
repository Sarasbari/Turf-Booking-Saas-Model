import { useState, useEffect, useMemo, Fragment } from 'react';
import { doc, getDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { OwnerData, TurfData, BookingType, BlockedSlot, ActivityData, SlotType } from '../../types/owner';
import { generateTimeSlots, getGroundsForTurf, formatTime } from '../../utils/slotUtils';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../styles/Owner/OwnerOverview.module.css';

/* ===========================================================
   Types
   =========================================================== */
interface RevenueData {
    date: string;
    day: string;
    revenue: number;
}

interface HeatmapCell {
    day: string;
    timeSlot: string;
    occupancy: number;
    status: 'low' | 'medium' | 'high';
}

/* ===========================================================
   Main Component
   =========================================================== */
export function OwnerOverview() {
    const navigate = useNavigate();

    const [ownerData, setOwnerData] = useState<OwnerData | null>(null);
    const [turfData, setTurfData] = useState<TurfData | null>(null);
    const [allBookings, setAllBookings] = useState<BookingType[]>([]);
    const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGroundId, setSelectedGroundId] = useState<string>('');

    /* --------------------------------------------------------
       Data Fetching
       -------------------------------------------------------- */
    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            setLoading(true);

            // 1. Owner data
            const ownerDoc = await getDoc(doc(db, 'owners', user.uid));
            if (!ownerDoc.exists()) return;
            const owner = ownerDoc.data() as OwnerData;
            setOwnerData(owner);

            // 2. Turf data
            const turfDoc = await getDoc(doc(db, 'turf', owner.turfId));
            if (!turfDoc.exists()) return;
            const turf = { id: turfDoc.id, ...turfDoc.data() } as TurfData;
            setTurfData(turf);

            // Set initial ground
            const grounds = getGroundsForTurf(turf);
            if (grounds.length > 0) setSelectedGroundId(grounds[0].id);

            // 3. All bookings for this turf — enrich user-created bookings
            const bookingsSnap = await getDocs(
                query(collection(db, 'bookings'), where('turfId', '==', owner.turfId))
            );
            const bookings = bookingsSnap.docs.map(d => {
                const raw = d.data() as any;

                // Resolve time fields: startTime/endTime or derive from timeSlots
                let startTime = raw.startTime || '';
                let endTime = raw.endTime || '';
                if (!startTime && Array.isArray(raw.timeSlots) && raw.timeSlots.length > 0) {
                    const sorted = [...raw.timeSlots].sort();
                    startTime = sorted[0];
                    const lastHour = parseInt(sorted[sorted.length - 1].split(':')[0], 10);
                    endTime = `${String(lastHour + 1).padStart(2, '0')}:00`;
                }

                return {
                    id: d.id,
                    ...raw,
                    // Normalize field names: user-side → owner-side
                    customerName: raw.customerName || raw.userName || '',
                    customerPhone: raw.customerPhone || raw.userPhone || '',
                    customerPhoto: raw.customerPhoto || '',
                    date: raw.date || raw.bookedDate || '',
                    amount: raw.amount || raw.totalPrice || 0,
                    startTime,
                    endTime,
                    bookedBy: raw.bookedBy || (raw.userName ? 'user' : undefined),
                } as BookingType;
            });
            setAllBookings(bookings);

            // 4. Blocked slots for today
            const today = getDateString(new Date());
            const blockedSnap = await getDocs(
                query(collection(db, 'blockedSlots'), where('turfId', '==', owner.turfId), where('date', '==', today))
            );
            setBlockedSlots(blockedSnap.docs.map(d => ({ ...d.data() })) as BlockedSlot[]);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    /* --------------------------------------------------------
       Helper Utilities
       -------------------------------------------------------- */
    const getDateString = (d: Date) =>
        `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;

    const getGreeting = (): string => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'Good Morning';
        if (hour >= 12 && hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const formatTimestamp = (timestamp: Timestamp | any): string => {
        if (!timestamp) return '';
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            if (diffMins < 1) return 'just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            const diffHrs = Math.floor(diffMins / 60);
            if (diffHrs < 24) return `${diffHrs}h ago`;
            const diffDays = Math.floor(diffHrs / 24);
            if (diffDays < 7) return `${diffDays}d ago`;
            return date.toLocaleDateString();
        } catch {
            return '';
        }
    };

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    /* --------------------------------------------------------
       Derived / Computed Data
       -------------------------------------------------------- */
    const now = new Date();
    const today = getDateString(now);
    const grounds = turfData ? getGroundsForTurf(turfData) : [];
    const selectedGround = grounds.find(g => g.id === selectedGroundId) || grounds[0];

    // Month boundaries
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Filtered booking sets
    const thisMonthBookings = useMemo(() =>
        allBookings.filter(b => {
            const d = new Date(b.date);
            return d >= firstOfMonth && d <= lastOfMonth && b.status !== 'cancelled';
        }), [allBookings]);

    const lastMonthBookings = useMemo(() =>
        allBookings.filter(b => {
            const d = new Date(b.date);
            return d >= firstOfLastMonth && d <= lastOfLastMonth && b.status !== 'cancelled';
        }), [allBookings]);

    const todayBookings = useMemo(() =>
        allBookings.filter(b => b.date === today && b.status !== 'cancelled'), [allBookings, today]);

    /* ---- SECTION 2: Stats ---- */
    const stats = useMemo(() => {
        const revenue = thisMonthBookings.reduce((s, b) => s + (b.amount || 0), 0);
        const lastRev = lastMonthBookings.reduce((s, b) => s + (b.amount || 0), 0);
        const revenueChange = lastRev > 0 ? ((revenue - lastRev) / lastRev) * 100 : 0;

        const bookingsCount = thisMonthBookings.length;
        const lastCount = lastMonthBookings.length;
        const bookingsChange = lastCount > 0 ? ((bookingsCount - lastCount) / lastCount) * 100 : 0;

        // Occupancy: assume each ground has (closeHour - openHour) slots per day
        const daysInMonth = lastOfMonth.getDate();
        const groundCount = grounds.length || 1;
        const openH = parseInt((turfData?.openTime || '06:00').split(':')[0]);
        const closeH = parseInt((turfData?.closeTime || '22:00').split(':')[0]);
        const slotsPerGroundPerDay = Math.max(closeH - openH, 1);
        const totalSlots = daysInMonth * slotsPerGroundPerDay * groundCount;
        const occupancyRate = totalSlots > 0 ? Math.round((bookingsCount / totalSlots) * 100) : 0;

        // Open slots today
        const todayTotal = slotsPerGroundPerDay * groundCount;
        const openSlotsToday = Math.max(todayTotal - todayBookings.length - blockedSlots.length, 0);

        return {
            revenue, revenueChange,
            bookingsCount, bookingsChange,
            avgRating: turfData?.rating || 0,
            totalReviews: 0,
            occupancyRate,
            openSlotsToday
        };
    }, [thisMonthBookings, lastMonthBookings, todayBookings, blockedSlots, turfData, grounds]);

    /* ---- SECTION 3: Today Summary ---- */
    const todaySummary = useMemo(() => {
        const confirmed = todayBookings.filter(b => b.status === 'confirmed').length;
        const pending = todayBookings.filter(b => b.status === 'pending').length;
        const todayRevenue = todayBookings.filter(b => b.status === 'confirmed').reduce((s, b) => s + (b.amount || 0), 0);

        const openH = parseInt((turfData?.openTime || '06:00').split(':')[0]);
        const closeH = parseInt((turfData?.closeTime || '22:00').split(':')[0]);
        const totalSlots = Math.max(closeH - openH, 1) * (grounds.length || 1);
        const bookedCount = todayBookings.length + blockedSlots.length;
        const occupancy = totalSlots > 0 ? Math.round((bookedCount / totalSlots) * 100) : 0;
        const available = Math.max(totalSlots - bookedCount, 0);

        return { confirmed, pending, todayRevenue, occupancy, available };
    }, [todayBookings, blockedSlots, turfData, grounds]);

    /* ---- SECTION 4: Revenue Chart (last 7 days) ---- */
    const revenueData: RevenueData[] = useMemo(() => {
        const data: RevenueData[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const ds = getDateString(d);
            const dayRevenue = allBookings
                .filter(b => b.date === ds && b.status !== 'cancelled')
                .reduce((s, b) => s + (b.amount || 0), 0);
            data.push({ date: ds, day: dayNames[d.getDay()], revenue: dayRevenue });
        }
        return data;
    }, [allBookings]);

    const maxRevenue = Math.max(...revenueData.map(d => d.revenue), 1);
    const totalLast7 = revenueData.reduce((s, d) => s + d.revenue, 0);
    const avgPerDay = Math.round(totalLast7 / 7);

    /* ---- SECTION 5: Heatmap ---- */
    const heatmapData = useMemo(() => {
        const timeBands = ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
        const cells: HeatmapCell[][] = [];

        for (const time of timeBands) {
            const row: HeatmapCell[] = [];
            const hour = parseInt(time.split(':')[0]);
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const ds = getDateString(d);
                const dayName = dayNames[d.getDay()];

                // Slots in this 3-hr band for this day
                const bandBookings = allBookings.filter(b => {
                    if (b.date !== ds || b.status === 'cancelled') return false;
                    const bHour = parseInt(b.startTime?.split(':')[0] || '0');
                    return bHour >= hour && bHour < hour + 3;
                }).length;

                const totalInBand = 3 * (grounds.length || 1); // 3 hours × grounds
                const occ = totalInBand > 0 ? Math.round((bandBookings / totalInBand) * 100) : 0;

                row.push({
                    day: dayName,
                    timeSlot: time,
                    occupancy: occ,
                    status: occ <= 30 ? 'low' : occ <= 70 ? 'medium' : 'high'
                });
            }
            cells.push(row);
        }
        return {
            timeBands, cells, dayHeaders: (() => {
                const headers: string[] = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    headers.push(dayNames[d.getDay()]);
                }
                return headers;
            })()
        };
    }, [allBookings, grounds]);

    /* ---- SECTION 6: Today's Schedule ---- */
    const timeSlots = turfData && selectedGround ? generateTimeSlots(turfData, selectedGround) : [];

    const getSlotStatus = (slot: SlotType): { status: string; booking?: BookingType } => {
        const booking = todayBookings.find(b =>
            b.startTime === slot.startTime && (!b.groundId || b.groundId === selectedGroundId)
        );
        if (booking) return { status: booking.status === 'pending' ? 'pending' : 'booked', booking };

        const blocked = blockedSlots.find(bs =>
            bs.startTime === slot.startTime && (!bs.groundId || bs.groundId === selectedGroundId)
        );
        if (blocked) return { status: 'blocked' };

        // Check if slot time has already passed today
        const now = new Date();
        const [endH, endM] = slot.endTime.split(':').map(Number);
        const slotEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endH, endM);
        if (now > slotEnd) return { status: 'passed' };

        return { status: 'available' };
    };

    const slotGroups = useMemo(() => {
        const morning: (SlotType & { slotStatus: string; booking?: BookingType })[] = [];
        const afternoon: typeof morning = [];
        const evening: typeof morning = [];

        timeSlots.forEach(slot => {
            const hour = parseInt(slot.startTime.split(':')[0]);
            const { status, booking } = getSlotStatus(slot);
            const entry = { ...slot, slotStatus: status, booking };
            if (hour < 12) morning.push(entry);
            else if (hour < 18) afternoon.push(entry);
            else evening.push(entry);
        });

        return [
            { label: '🌅 Morning (6 AM – 12 PM)', slots: morning },
            { label: '☀️ Afternoon (12 PM – 6 PM)', slots: afternoon },
            { label: '🌙 Evening (6 PM – 11 PM)', slots: evening },
        ].filter(g => g.slots.length > 0);
    }, [timeSlots, todayBookings, blockedSlots, selectedGroundId]);

    /* ---- SECTION 8: Activities ---- */
    const activities: ActivityData[] = useMemo(() => {
        const sorted = [...allBookings]
            .sort((a, b) => {
                const at = a.createdAt?.toDate?.() || new Date(0);
                const bt = b.createdAt?.toDate?.() || new Date(0);
                return bt.getTime() - at.getTime();
            })
            .slice(0, 5);

        return sorted.map((b, i) => {
            let icon = '📅', color = '#6B7280', type: ActivityData['type'] = 'booking', message = '';
            if (b.status === 'confirmed') {
                icon = '✅'; color = '#10B981'; type = 'confirmed';
                message = `${b.customerName} booked ${formatTime(b.startTime)}–${formatTime(b.endTime)}`;
            } else if (b.status === 'pending') {
                icon = '🔵'; color = '#3B82F6'; type = 'booking';
                message = `New booking request from ${b.customerName}`;
            } else if (b.status === 'cancelled') {
                icon = '❌'; color = '#DC2626'; type = 'cancellation';
                message = `${b.customerName} cancelled ${formatTime(b.startTime)}–${formatTime(b.endTime)}`;
            }
            return { id: b.id + i, type, message, timestamp: b.createdAt, icon, color };
        });
    }, [allBookings]);

    /* ===========================================================
       LOADING STATE
       =========================================================== */
    if (loading) {
        return (
            <div className={styles.container}>
                {/* Skeleton header */}
                <div className={`${styles.skeletonCard} ${styles.section}`} style={{ height: 100 }}>
                    <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: '55%' }} />
                    <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: '35%' }} />
                    <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: '25%' }} />
                </div>
                {/* Skeleton stats */}
                <div className={styles.statsGrid}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className={styles.skeletonCard}>
                            <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: '40%' }} />
                            <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: '60%', height: 28 }} />
                            <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineShort}`} />
                        </div>
                    ))}
                </div>
                {/* Skeleton today summary */}
                <div className={`${styles.skeletonCard} ${styles.section}`}>
                    <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: '30%' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className={`${styles.skeleton} ${styles.skeletonBlock}`} style={{ height: 70 }} />
                        ))}
                    </div>
                </div>
                {/* Skeleton chart */}
                <div className={`${styles.skeletonCard} ${styles.section}`}>
                    <div className={`${styles.skeleton} ${styles.skeletonLine}`} style={{ width: '40%' }} />
                    <div className={`${styles.skeleton} ${styles.skeletonBlock}`} style={{ height: 180, marginTop: 16 }} />
                </div>
            </div>
        );
    }

    if (!ownerData || !turfData) {
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}>❌</div>
                <div className={styles.emptyStateText}>Unable to load dashboard data</div>
            </div>
        );
    }

    /* ===========================================================
       RENDER
       =========================================================== */
    const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35 } };

    return (
        <div className={styles.container}>
            {/* ============== SECTION 1: Welcome Header ============== */}
            <motion.div className={styles.header} {...fadeIn}>
                <div className={styles.greeting}>
                    {getGreeting()}, {ownerData.name}! 👋
                </div>
                <div className={styles.turfInfo}>
                    {turfData.name} · {turfData.city}
                </div>
                <div className={styles.subtitle}>
                    Here's what's happening today
                </div>
            </motion.div>

            {/* ============== SECTION 2: Stats Grid ============== */}
            <motion.div className={styles.statsGrid} {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.05 }}>
                {[
                    {
                        title: 'Total Revenue', icon: '💰', borderColor: '#EA580C',
                        value: `₹${stats.revenue.toLocaleString()}`,
                        trend: stats.revenueChange, subtext: 'this month'
                    },
                    {
                        title: 'Total Bookings', icon: '📅', borderColor: '#3B82F6',
                        value: stats.bookingsCount,
                        trend: stats.bookingsChange, subtext: 'this month'
                    },
                    {
                        title: 'Average Rating', icon: '⭐', borderColor: '#F59E0B',
                        value: stats.avgRating.toFixed(1),
                        trend: null, subtext: 'out of 5.0'
                    },
                    {
                        title: 'Occupancy Rate', icon: '📊', borderColor: '#10B981',
                        value: `${stats.occupancyRate}%`,
                        trend: null, subtext: `${stats.openSlotsToday} slots open today`
                    },
                ].map((card, idx) => (
                    <div
                        key={idx}
                        className={styles.statCard}
                        style={{ borderLeftColor: card.borderColor }}
                    >
                        <div className={styles.statCardTop}>
                            <div>
                                <div className={styles.statTitle}>{card.title}</div>
                                <div className={styles.statValue}>{card.value}</div>
                            </div>
                            <div className={styles.statIcon}>{card.icon}</div>
                        </div>
                        <div className={styles.statBottom}>
                            {card.trend !== null && (
                                <span className={`${styles.trendBadge} ${card.trend > 0 ? styles.trendUp : card.trend < 0 ? styles.trendDown : styles.trendNeutral}`}>
                                    {card.trend > 0 ? '↑' : card.trend < 0 ? '↓' : '→'} {Math.abs(card.trend).toFixed(1)}%
                                </span>
                            )}
                            <span className={styles.statSubtext}>{card.subtext}</span>
                        </div>
                    </div>
                ))}
            </motion.div>

            {/* ============== SECTION 3: Today's Summary ============== */}
            <motion.div className={styles.todaySummary} {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.1 }}>
                <div className={styles.summaryHeader}>
                    <span className={styles.summaryTitle}>📊 Today's Summary</span>
                </div>
                <div className={styles.summaryGrid}>
                    {[
                        { icon: '✅', label: 'Confirmed', value: todaySummary.confirmed, bg: '#F0FDF4', color: '#16A34A' },
                        { icon: '⏳', label: 'Pending', value: todaySummary.pending, bg: '#FFFBEB', color: '#D97706' },
                        { icon: '💰', label: 'Earned Today', value: `₹${todaySummary.todayRevenue.toLocaleString()}`, bg: '#FFF7ED', color: '#EA580C' },
                        { icon: '📈', label: 'Occupancy', value: `${todaySummary.occupancy}%`, bg: '#EFF6FF', color: '#3B82F6' },
                        { icon: '🎯', label: 'Available', value: todaySummary.available, bg: '#F0FDF4', color: '#10B981' },
                    ].map((m, i) => (
                        <div key={i} className={styles.summaryMetric}>
                            <div className={styles.metricIcon} style={{ background: m.bg, color: m.color }}>
                                {m.icon}
                            </div>
                            <div className={styles.metricContent}>
                                <div className={styles.metricValue}>{m.value}</div>
                                <div className={styles.metricLabel}>{m.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* ============== SECTION 4: Revenue Chart ============== */}
            <motion.div className={styles.chartCard} {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.15 }}>
                <div className={styles.chartHeader}>
                    <div className={styles.chartTitle}>
                        💰 Revenue Trend — Last 7 Days
                    </div>
                    <div className={styles.chartSummary}>
                        <div className={styles.chartStat}>
                            <div className={styles.chartStatValue}>₹{totalLast7.toLocaleString()}</div>
                            <div className={styles.chartStatLabel}>Total</div>
                        </div>
                        <div className={styles.chartStat}>
                            <div className={styles.chartStatValue}>₹{avgPerDay.toLocaleString()}</div>
                            <div className={styles.chartStatLabel}>Avg/Day</div>
                        </div>
                    </div>
                </div>
                <div className={styles.barChart}>
                    {revenueData.map((d, i) => (
                        <div key={i} className={styles.barColumn}>
                            <div className={styles.barValue}>
                                {d.revenue > 0 ? `₹${d.revenue.toLocaleString()}` : ''}
                            </div>
                            <div
                                className={styles.bar}
                                style={{ height: `${Math.max((d.revenue / maxRevenue) * 100, 3)}%` }}
                            >
                                <div className={styles.barTooltip}>₹{d.revenue.toLocaleString()}</div>
                            </div>
                            <div className={styles.barLabel}>{d.day}</div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* ============== SECTION 5: Heatmap ============== */}
            <motion.div className={styles.heatmapCard} {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.2 }}>
                <div className={styles.summaryHeader}>
                    <span className={styles.summaryTitle}>🔥 Slot Occupancy — This Week</span>
                </div>
                <div className={styles.heatmapGrid}>
                    {/* Corner */}
                    <div className={styles.heatmapCorner} />
                    {/* Day headers */}
                    {heatmapData.dayHeaders.map((d, i) => (
                        <div key={i} className={styles.heatmapDayHeader}>{d}</div>
                    ))}
                    {/* Rows */}
                    {heatmapData.cells.map((row, ri) => (
                        <Fragment key={ri}>
                            <div className={styles.heatmapTimeLabel}>
                                {formatTime(heatmapData.timeBands[ri])}
                            </div>
                            {row.map((cell, ci) => (
                                <div
                                    key={`${ri}-${ci}`}
                                    className={`${styles.heatmapCell} ${cell.status === 'low' ? styles.heatmapLow : cell.status === 'medium' ? styles.heatmapMedium : styles.heatmapHigh}`}
                                    title={`${cell.day} ${heatmapData.timeBands[ri]} — ${cell.occupancy}%`}
                                >
                                    {cell.occupancy}%
                                </div>
                            ))}
                        </Fragment>
                    ))}
                </div>
                <div className={styles.heatmapLegend}>
                    <div className={styles.legendItem}>
                        <div className={styles.legendDot} style={{ background: '#BBF7D0' }} />
                        Low (0-30%)
                    </div>
                    <div className={styles.legendItem}>
                        <div className={styles.legendDot} style={{ background: '#FDE68A' }} />
                        Medium (31-70%)
                    </div>
                    <div className={styles.legendItem}>
                        <div className={styles.legendDot} style={{ background: '#FECACA' }} />
                        High (71-100%)
                    </div>
                </div>
            </motion.div>

            {/* ============== SECTION 6: Today's Schedule ============== */}
            <motion.div className={styles.scheduleCard} {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.25 }}>
                <div className={styles.scheduleHeader}>
                    <span className={styles.sectionTitle}>
                        📅 Today's Schedule · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </span>
                    {grounds.length > 1 && (
                        <div className={styles.groundPills}>
                            {grounds.map(g => (
                                <button
                                    key={g.id}
                                    className={`${styles.groundPill} ${selectedGroundId === g.id ? styles.groundPillActive : ''}`}
                                    onClick={() => setSelectedGroundId(g.id)}
                                >
                                    🏟️ {g.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {slotGroups.length > 0 ? (
                    slotGroups.map((group, gi) => (
                        <div key={gi} className={styles.timeGroup}>
                            <div className={styles.timeGroupLabel}>{group.label}</div>
                            <div className={styles.slotsRow}>
                                {group.slots.map((slot, si) => {
                                    const statusClass = slot.slotStatus === 'passed' ? styles.slotPassed
                                        : slot.slotStatus === 'available' ? styles.slotAvailable
                                            : slot.slotStatus === 'booked' ? styles.slotBooked
                                                : slot.slotStatus === 'pending' ? styles.slotPending
                                                    : styles.slotBlocked;
                                    const dotColor = slot.slotStatus === 'passed' ? '#9CA3AF'
                                        : slot.slotStatus === 'available' ? '#10B981'
                                            : slot.slotStatus === 'booked' ? '#DC2626'
                                                : slot.slotStatus === 'pending' ? '#F59E0B'
                                                    : '#9CA3AF';

                                    return (
                                        <div key={si} className={`${styles.slotCard} ${statusClass}`}>
                                            <div className={styles.slotTime}>
                                                {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                                            </div>
                                            <div className={styles.slotStatusRow}>
                                                <div className={styles.statusDot} style={{ background: dotColor }} />
                                                <span className={styles.slotStatusText} style={{ color: dotColor }}>
                                                    {slot.slotStatus}
                                                </span>
                                            </div>
                                            {slot.booking && (
                                                <div className={styles.slotCustomerName}>
                                                    👤 {slot.booking.customerName}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyStateIcon}>📅</div>
                        <div className={styles.emptyStateText}>No slots configured</div>
                    </div>
                )}
            </motion.div>

            {/* ============== SECTION 7: Quick Actions ============== */}
            <motion.div className={styles.actionsGrid} {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.3 }}>
                {[
                    { icon: '🚫', label: 'Block Slots', sub: 'Manage availability', path: '/owner/slots' },
                    { icon: '📅', label: 'View Bookings', sub: 'All reservations', path: '/owner/bookings' },
                    { icon: '💰', label: 'Revenue', sub: 'Financial overview', path: '/owner/revenue' },
                    { icon: '📊', label: 'My Turf', sub: 'Settings & details', path: '/owner/turf' },
                ].map((action, i) => (
                    <div
                        key={i}
                        className={styles.actionCard}
                        onClick={() => navigate(action.path)}
                    >
                        <div className={styles.actionIcon}>{action.icon}</div>
                        <div className={styles.actionLabel}>{action.label}</div>
                        <div className={styles.actionSub}>{action.sub}</div>
                        <div className={styles.actionLink}>→ Go</div>
                    </div>
                ))}
            </motion.div>

            {/* ============== SECTION 8: Recent Activity ============== */}
            <motion.div className={styles.activityCard} {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.35 }}>
                <div className={styles.summaryHeader}>
                    <span className={styles.summaryTitle}>📈 Recent Activity</span>
                </div>
                {activities.length > 0 ? (
                    activities.map((activity) => (
                        <div key={activity.id} className={styles.activityItem}>
                            <div
                                className={styles.activityIcon}
                                style={{ backgroundColor: `${activity.color}18`, color: activity.color }}
                            >
                                {activity.icon}
                            </div>
                            <div className={styles.activityContent}>
                                <div className={styles.activityMessage}>{activity.message}</div>
                                <div className={styles.activityTime}>{formatTimestamp(activity.timestamp)}</div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyStateIcon}>📋</div>
                        <div className={styles.emptyStateText}>No recent activity</div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
