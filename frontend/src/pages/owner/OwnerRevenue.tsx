import { useState, useMemo, useCallback } from 'react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer
} from 'recharts';
import { useDashboard } from '@/context/DashboardContext';
import { BookingType } from '@/types/owner';
import styles from '@/styles/Owner/OwnerRevenue.module.css';

// ── Types ──────────────────────────────────────────────────
type TimePeriod = 'week' | 'month' | 'quarter' | 'year' | 'custom';
type ChartView = 'daily' | 'weekly';

interface RevenueDataPoint {
    date: string;
    revenue: number;
    bookings: number;
}

interface InsightItem {
    icon: string;
    title: string;
    recommendation: string;
}

// ── Color palette ──────────────────────────────────────────
const SPORT_COLORS: Record<string, string> = {
    Football: '#EA580C',
    Cricket: '#3B82F6',
    Volleyball: '#F59E0B',
    Badminton: '#10B981',
    Basketball: '#8B5CF6',
    Pickleball: '#EC4899',
};

const GROUND_COLORS = ['#3B82F6', '#EA580C', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ── Helpers ────────────────────────────────────────────────
function getDateRange(period: TimePeriod, custom: { start: string; end: string }) {
    const now = new Date();
    let start: Date;
    let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    switch (period) {
        case 'week':
            start = new Date(now);
            start.setDate(now.getDate() - 6);
            start.setHours(0, 0, 0, 0);
            break;
        case 'month':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            break;
        case 'quarter':
            start = new Date(now);
            start.setDate(now.getDate() - 89);
            start.setHours(0, 0, 0, 0);
            break;
        case 'year':
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
            break;
        case 'custom':
            start = custom.start ? new Date(custom.start) : new Date(now.getFullYear(), now.getMonth(), 1);
            end = custom.end ? new Date(custom.end + 'T23:59:59') : new Date();
            break;
        default:
            start = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return { start, end };
}

function getPreviousRange(period: TimePeriod, current: { start: Date; end: Date }) {
    const diff = current.end.getTime() - current.start.getTime();
    return {
        start: new Date(current.start.getTime() - diff),
        end: new Date(current.start.getTime() - 1),
    };
}

function filterBookings(bookings: BookingType[], start: Date, end: Date) {
    return bookings.filter(b => {
        const d = new Date(b.date);
        return d >= start && d <= end;
    });
}

function formatCurrency(v: number) {
    return `₹${v.toLocaleString('en-IN')}`;
}

function pctChange(current: number, previous: number) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
}

function formatDate(d: string) {
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatDateFull(d: string) {
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getDayName(d: string) {
    return new Date(d).toLocaleDateString('en-US', { weekday: 'short' });
}

// ── Component ──────────────────────────────────────────────
export function OwnerRevenue() {
    const { bookings, loading } = useDashboard();

    const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
    const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
    const [chartView, setChartView] = useState<ChartView>('daily');

    // ── Filtered bookings for current + previous period ──
    const { currentRange, filteredBookings, prevBookings } = useMemo(() => {
        const range = getDateRange(timePeriod, customDateRange);
        const filtered = filterBookings(bookings, range.start, range.end);
        const prevRange = getPreviousRange(timePeriod, range);
        const prev = filterBookings(bookings, prevRange.start, prevRange.end);
        return { currentRange: range, filteredBookings: filtered, prevBookings: prev };
    }, [bookings, timePeriod, customDateRange]);

    const confirmedBookings = useMemo(
        () => filteredBookings.filter(b => b.status === 'confirmed'),
        [filteredBookings]
    );
    const prevConfirmed = useMemo(
        () => prevBookings.filter(b => b.status === 'confirmed'),
        [prevBookings]
    );

    // ── STAT CARDS ──
    const stats = useMemo(() => {
        const totalRevenue = confirmedBookings.reduce((s, b) => s + (b.amount || 0), 0);
        const totalBookings = confirmedBookings.length;
        const avgPerBooking = totalBookings > 0 ? totalRevenue / totalBookings : 0;

        const prevRevenue = prevConfirmed.reduce((s, b) => s + (b.amount || 0), 0);
        const prevTotal = prevConfirmed.length;
        const prevAvg = prevTotal > 0 ? prevRevenue / prevTotal : 0;

        // Best day
        const byDate: Record<string, number> = {};
        confirmedBookings.forEach(b => {
            byDate[b.date] = (byDate[b.date] || 0) + (b.amount || 0);
        });
        let bestDate = '';
        let bestDayRevenue = 0;
        Object.entries(byDate).forEach(([date, rev]) => {
            if (rev > bestDayRevenue) {
                bestDayRevenue = rev;
                bestDate = date;
            }
        });

        return {
            totalRevenue,
            revenueChange: pctChange(totalRevenue, prevRevenue),
            totalBookings,
            bookingsChange: pctChange(totalBookings, prevTotal),
            avgPerBooking,
            avgChange: pctChange(avgPerBooking, prevAvg),
            bestDayRevenue,
            bestDayDate: bestDate,
        };
    }, [confirmedBookings, prevConfirmed]);

    // ── REVENUE TREND ──
    const revenueData = useMemo(() => {
        const byDate: Record<string, { revenue: number; bookings: number }> = {};
        confirmedBookings.forEach(b => {
            const d = b.date;
            if (!byDate[d]) byDate[d] = { revenue: 0, bookings: 0 };
            byDate[d].revenue += b.amount || 0;
            byDate[d].bookings += 1;
        });

        const entries = Object.entries(byDate)
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (chartView === 'weekly' && entries.length > 7) {
            const weeks: RevenueDataPoint[] = [];
            for (let i = 0; i < entries.length; i += 7) {
                const chunk = entries.slice(i, i + 7);
                weeks.push({
                    date: `${formatDate(chunk[0].date)} - ${formatDate(chunk[chunk.length - 1].date)}`,
                    revenue: chunk.reduce((s, c) => s + c.revenue, 0),
                    bookings: chunk.reduce((s, c) => s + c.bookings, 0),
                });
            }
            return weeks;
        }

        return entries.map(e => ({
            ...e,
            date: timePeriod === 'week' ? getDayName(e.date) : formatDate(e.date),
        }));
    }, [confirmedBookings, chartView, timePeriod]);

    const totalRevenue = stats.totalRevenue;
    const avgPerDay = useMemo(() => {
        const days = Math.max(
            1,
            Math.ceil(
                (currentRange.end.getTime() - currentRange.start.getTime()) / (1000 * 60 * 60 * 24)
            )
        );
        return Math.round(totalRevenue / days);
    }, [totalRevenue, currentRange]);

    // ── PEAK HOURS ──
    const peakHoursData = useMemo(() => {
        const hourly: Record<string, { revenue: number; bookings: number }> = {};
        confirmedBookings.forEach(b => {
            const slot = `${b.startTime}-${b.endTime}`;
            if (!hourly[slot]) hourly[slot] = { revenue: 0, bookings: 0 };
            hourly[slot].revenue += b.amount || 0;
            hourly[slot].bookings += 1;
        });
        return Object.entries(hourly)
            .map(([hour, data]) => ({ hour, ...data }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 6);
    }, [confirmedBookings]);

    // ── SPORT REVENUE ──
    const sportData = useMemo(() => {
        const bySport: Record<string, { revenue: number; bookings: number }> = {};
        confirmedBookings.forEach(b => {
            const sp = b.sport || 'Other';
            if (!bySport[sp]) bySport[sp] = { revenue: 0, bookings: 0 };
            bySport[sp].revenue += b.amount || 0;
            bySport[sp].bookings += 1;
        });
        const total = Object.values(bySport).reduce((s, v) => s + v.revenue, 0) || 1;
        return Object.entries(bySport)
            .map(([name, data]) => ({
                name,
                value: data.revenue,
                bookings: data.bookings,
                percentage: ((data.revenue / total) * 100).toFixed(1),
            }))
            .sort((a, b) => b.value - a.value);
    }, [confirmedBookings]);

    // ── DAY OF WEEK ──
    const dayData = useMemo(() => {
        const byDay: Record<string, { revenue: number; bookings: number }> = {};
        confirmedBookings.forEach(b => {
            const day = getDayName(b.date);
            if (!byDay[day]) byDay[day] = { revenue: 0, bookings: 0 };
            byDay[day].revenue += b.amount || 0;
            byDay[day].bookings += 1;
        });
        return DAY_ORDER.map(day => ({
            day,
            revenue: byDay[day]?.revenue || 0,
            bookings: byDay[day]?.bookings || 0,
        }));
    }, [confirmedBookings]);

    const weekendPct = useMemo(() => {
        const we = (dayData.find(d => d.day === 'Sat')?.revenue || 0) + (dayData.find(d => d.day === 'Sun')?.revenue || 0);
        return totalRevenue > 0 ? Math.round((we / totalRevenue) * 100) : 0;
    }, [dayData, totalRevenue]);

    // ── GROUND REVENUE ──
    const groundData = useMemo(() => {
        const byGround: Record<string, { revenue: number; bookings: number }> = {};
        confirmedBookings.forEach(b => {
            const g = b.groundId || 'Main';
            if (!byGround[g]) byGround[g] = { revenue: 0, bookings: 0 };
            byGround[g].revenue += b.amount || 0;
            byGround[g].bookings += 1;
        });
        const total = Object.values(byGround).reduce((s, v) => s + v.revenue, 0) || 1;
        return Object.entries(byGround)
            .map(([name, data]) => ({
                name: name.startsWith('ground') ? `Ground ${name.replace('ground', '')}` : name,
                value: data.revenue,
                bookings: data.bookings,
                percentage: ((data.revenue / total) * 100).toFixed(1),
            }))
            .sort((a, b) => b.value - a.value);
    }, [confirmedBookings]);

    // ── BOOKING STATUS ──
    const statusData = useMemo(() => {
        const confirmed = filteredBookings.filter(b => b.status === 'confirmed');
        const pending = filteredBookings.filter(b => b.status === 'pending');
        const cancelled = filteredBookings.filter(b => b.status === 'cancelled');
        const total = filteredBookings.length || 1;

        return {
            confirmed: { count: confirmed.length, revenue: confirmed.reduce((s, b) => s + (b.amount || 0), 0), pct: Math.round((confirmed.length / total) * 100) },
            pending: { count: pending.length, revenue: pending.reduce((s, b) => s + (b.amount || 0), 0), pct: Math.round((pending.length / total) * 100) },
            cancelled: { count: cancelled.length, revenue: cancelled.reduce((s, b) => s + (b.amount || 0), 0), pct: Math.round((cancelled.length / total) * 100) },
            total: filteredBookings.length,
        };
    }, [filteredBookings]);

    // ── INSIGHTS ──
    const insights = useMemo<InsightItem[]>(() => {
        const items: InsightItem[] = [];
        if (confirmedBookings.length === 0) return items;

        // Peak days
        const sorted = [...dayData].sort((a, b) => b.revenue - a.revenue);
        const avgDayRev = totalRevenue / 7;
        if (sorted[0].revenue > avgDayRev * 1.3) {
            items.push({
                icon: '💡', title: `Peak Revenue Days: ${sorted[0].day} & ${sorted[1].day}`,
                recommendation: 'Consider premium pricing on these days',
            });
        }

        // Under-utilized slots
        const lowHours = peakHoursData.filter(h => h.bookings <= 1);
        if (lowHours.length > 0 && peakHoursData.length > 2) {
            items.push({
                icon: '💡', title: `Underutilized Slots: ${lowHours.length} time slots with ≤1 booking`,
                recommendation: 'Offer 15-20% discount for off-peak hours to increase occupancy',
            });
        }

        // Best time
        if (peakHoursData.length > 0) {
            items.push({
                icon: '💡', title: `Most Profitable Time: ${peakHoursData[0].hour}`,
                recommendation: 'Already at peak demand — maintain pricing',
            });
        }

        // Low occupancy ground
        const lowGrounds = groundData.filter(g => parseFloat(g.percentage) < 30);
        if (lowGrounds.length > 0 && groundData.length > 1) {
            items.push({
                icon: '💡', title: `${lowGrounds[0].name} Low Share: ${lowGrounds[0].percentage}%`,
                recommendation: 'Bundle: Book popular ground, get 30% off this ground',
            });
        }

        // Top sport
        if (sportData.length > 0) {
            items.push({
                icon: '💡', title: `${sportData[0].name} generates ${sportData[0].percentage}% of revenue`,
                recommendation: `Invest in better ${sportData[0].name.toLowerCase()} infrastructure`,
            });
        }

        // Cancellation rate
        if (statusData.cancelled.pct > 15) {
            items.push({
                icon: '⚠️', title: `Cancellation Rate: ${statusData.cancelled.pct}%`,
                recommendation: 'Consider requiring advance payment to reduce cancellations',
            });
        }

        return items;
    }, [confirmedBookings, dayData, peakHoursData, groundData, sportData, statusData, totalRevenue]);

    // ── TOP CUSTOMERS ──
    const topCustomers = useMemo(() => {
        const byCustomer: Record<string, { name: string; bookings: number; revenue: number }> = {};
        confirmedBookings.forEach(b => {
            const id = b.userId || 'unknown';
            if (!byCustomer[id]) {
                byCustomer[id] = { name: b.customerName || id, bookings: 0, revenue: 0 };
            }
            byCustomer[id].bookings += 1;
            byCustomer[id].revenue += b.amount || 0;
        });
        return Object.values(byCustomer)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
    }, [confirmedBookings]);

    // ── PROJECTED REVENUE ──
    const projected = useMemo(() => {
        const now = new Date();
        const dayOfMonth = now.getDate();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        if (dayOfMonth === 0 || totalRevenue === 0) return { projected: 0, potential: 0 };
        const rate = totalRevenue / dayOfMonth;
        const proj = Math.round(rate * daysInMonth);
        const potential = Math.round(proj * 1.15); // 15% improvement potential
        return { projected: proj, potential: potential - proj };
    }, [totalRevenue]);

    // ── EXPORT CSV ──
    const exportCSV = useCallback(() => {
        const rows = [['Date', 'Start Time', 'End Time', 'Customer', 'Sport', 'Ground', 'Amount', 'Status']];
        filteredBookings.forEach(b => {
            rows.push([
                b.date, b.startTime, b.endTime,
                b.customerName || b.userId || '',
                b.sport || '', b.groundId || '',
                String(b.amount || 0), b.status,
            ]);
        });
        const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        a.href = url;
        a.download = `revenue_report_${date}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [filteredBookings]);

    // ── LOADING STATE ──
    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.skeletonContainer}>
                    <div className={`${styles.skeleton} ${styles.skeletonHeader}`} />
                    <div className={`${styles.skeleton} ${styles.skeletonFilters}`} />
                    <div className={styles.skeletonGrid}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className={`${styles.skeleton} ${styles.skeletonCard}`} />
                        ))}
                    </div>
                    <div className={`${styles.skeleton} ${styles.skeletonChart}`} />
                    <div className={styles.analysisGrid}>
                        <div className={`${styles.skeleton} ${styles.skeletonChart}`} />
                        <div className={`${styles.skeleton} ${styles.skeletonChart}`} />
                    </div>
                </div>
            </div>
        );
    }

    // ── Trend helper for stat cards ──
    const trend = (v: number): 'up' | 'down' | 'neutral' => (v > 0 ? 'up' : v < 0 ? 'down' : 'neutral');
    const trendArrow = (v: number) => (v > 0 ? '↑' : v < 0 ? '↓' : '→');

    // ── RENDER ──
    return (
        <div className={styles.container}>
            {/* ═══ 1. HEADER ═══ */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}>💰 Revenue Analytics</h1>
                    <p className={styles.subtitle}>Track your earnings and booking performance</p>
                </div>
                <div className={styles.headerActions}>
                    <div className={styles.realtimeIndicator}>
                        <span className={styles.pulseDot} />
                        Live Updates
                    </div>
                    <button className={styles.exportBtn} onClick={exportCSV}>📥 Export CSV</button>
                    <button className={styles.printBtn} onClick={() => window.print()}>🖨️ Print</button>
                </div>
            </div>

            <div className={styles.body}>
                {/* ═══ 2. TIME PERIOD FILTERS ═══ */}
                <div className={styles.filterTabs}>
                    {([
                        ['week', 'This Week'],
                        ['month', 'This Month'],
                        ['quarter', 'Last 3 Months'],
                        ['year', 'This Year'],
                        ['custom', 'Custom ▼'],
                    ] as [TimePeriod, string][]).map(([key, label]) => (
                        <button
                            key={key}
                            className={`${styles.filterTab} ${timePeriod === key ? styles.filterTabActive : ''}`}
                            onClick={() => setTimePeriod(key)}
                        >
                            {label}
                        </button>
                    ))}
                    {timePeriod === 'custom' && (
                        <div className={styles.customDateInputs}>
                            <input
                                type="date"
                                className={styles.dateInput}
                                value={customDateRange.start}
                                onChange={e => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                            />
                            <span style={{ color: '#6B7280' }}>to</span>
                            <input
                                type="date"
                                className={styles.dateInput}
                                value={customDateRange.end}
                                onChange={e => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                            />
                        </div>
                    )}
                </div>

                {/* ═══ EMPTY STATE ═══ */}
                {confirmedBookings.length === 0 && filteredBookings.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📊</div>
                        <div className={styles.emptyTitle}>No Data Available</div>
                        <div className={styles.emptyText}>No bookings found in this time period. Try selecting a different range.</div>
                    </div>
                ) : (
                    <>
                        {/* ═══ 3. STAT CARDS ═══ */}
                        <div className={styles.statGrid}>
                            {/* Total Revenue */}
                            <div className={`${styles.statCard} ${styles.statCardOrange}`}>
                                <div className={styles.statCardHeader}>
                                    <span className={styles.statCardTitle}>Total Revenue</span>
                                    <span className={styles.statCardIcon}>💰</span>
                                </div>
                                <div className={styles.statValue}>{formatCurrency(stats.totalRevenue)}</div>
                                <div className={`${styles.statTrend} ${styles[trend(stats.revenueChange)]}`}>
                                    {trendArrow(stats.revenueChange)} {Math.abs(stats.revenueChange).toFixed(1)}% vs last period
                                </div>
                                <div className={styles.statSubtext}>from {stats.totalBookings} bookings</div>
                            </div>

                            {/* Total Bookings */}
                            <div className={`${styles.statCard} ${styles.statCardBlue}`}>
                                <div className={styles.statCardHeader}>
                                    <span className={styles.statCardTitle}>Total Bookings</span>
                                    <span className={styles.statCardIcon}>📅</span>
                                </div>
                                <div className={styles.statValue}>{stats.totalBookings}</div>
                                <div className={`${styles.statTrend} ${styles[trend(stats.bookingsChange)]}`}>
                                    {trendArrow(stats.bookingsChange)} {Math.abs(stats.bookingsChange).toFixed(1)}% vs last period
                                </div>
                                <div className={styles.statSubtext}>confirmed bookings</div>
                            </div>

                            {/* Avg per Booking */}
                            <div className={`${styles.statCard} ${styles.statCardYellow}`}>
                                <div className={styles.statCardHeader}>
                                    <span className={styles.statCardTitle}>Avg per Booking</span>
                                    <span className={styles.statCardIcon}>📊</span>
                                </div>
                                <div className={styles.statValue}>{formatCurrency(Math.round(stats.avgPerBooking))}</div>
                                <div className={`${styles.statTrend} ${styles[trend(stats.avgChange)]}`}>
                                    {trendArrow(stats.avgChange)} {Math.abs(stats.avgChange).toFixed(1)}% vs last period
                                </div>
                                <div className={styles.statSubtext}>average revenue</div>
                            </div>

                            {/* Best Day Revenue */}
                            <div className={`${styles.statCard} ${styles.statCardGreen}`}>
                                <div className={styles.statCardHeader}>
                                    <span className={styles.statCardTitle}>Best Day Revenue</span>
                                    <span className={styles.statCardIcon}>🏆</span>
                                </div>
                                <div className={styles.statValue}>{formatCurrency(stats.bestDayRevenue)}</div>
                                <div className={styles.statSubtext}>
                                    {stats.bestDayDate ? `on ${formatDateFull(stats.bestDayDate)}` : 'No data'}
                                </div>
                                <div className={styles.statSubtext}>
                                    {stats.bestDayDate ? getDayName(stats.bestDayDate) : ''}
                                </div>
                            </div>
                        </div>

                        {/* ═══ 4. REVENUE TREND LINE CHART ═══ */}
                        <div className={styles.chartCard}>
                            <div className={styles.chartHeader}>
                                <h3 className={styles.chartTitle}>📈 Revenue Trend</h3>
                                <div className={styles.chartToggle}>
                                    <button
                                        className={`${styles.chartToggleBtn} ${chartView === 'daily' ? styles.chartToggleBtnActive : ''}`}
                                        onClick={() => setChartView('daily')}
                                    >
                                        Daily
                                    </button>
                                    <button
                                        className={`${styles.chartToggleBtn} ${chartView === 'weekly' ? styles.chartToggleBtnActive : ''}`}
                                        onClick={() => setChartView('weekly')}
                                    >
                                        Weekly
                                    </button>
                                </div>
                            </div>

                            {revenueData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={revenueData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 12 }} stroke="#E5E7EB" />
                                        <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} stroke="#E5E7EB" tickFormatter={v => `₹${v}`} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                            formatter={(value) => [formatCurrency(value as number), 'Revenue']}
                                        />
                                        <Legend />
                                        <Line type="monotone" dataKey="revenue" stroke="#EA580C" strokeWidth={3} dot={{ r: 5, fill: '#EA580C' }} activeDot={{ r: 8 }} name="Revenue" />
                                        <Line type="monotone" dataKey="bookings" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3, fill: '#3B82F6' }} name="Bookings" yAxisId={0} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className={styles.emptyState}>
                                    <div className={styles.emptyText}>No revenue data for the selected period</div>
                                </div>
                            )}

                            <div className={styles.chartSummary}>
                                <span className={styles.chartSummaryItem}>
                                    <strong>Total:</strong> {formatCurrency(totalRevenue)}
                                </span>
                                <span className={styles.chartSummaryItem}>
                                    <strong>Avg:</strong> {formatCurrency(avgPerDay)}/day
                                </span>
                                {revenueData.length > 0 && (
                                    <span className={styles.chartSummaryItem}>
                                        <strong>Peak:</strong> {revenueData.reduce((max, d) => d.revenue > max.revenue ? d : max, revenueData[0]).date} ({formatCurrency(revenueData.reduce((max, d) => d.revenue > max.revenue ? d : max, revenueData[0]).revenue)})
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* ═══ 5. PEAK HOURS + SPORT REVENUE ═══ */}
                        <div className={styles.analysisGrid}>
                            {/* Peak Hours */}
                            <div className={styles.chartCard}>
                                <h3 className={styles.chartTitle}>🔥 Peak Hours Analysis</h3>
                                {peakHoursData.length > 0 ? (
                                    <>
                                        <ResponsiveContainer width="100%" height={250}>
                                            <BarChart data={peakHoursData} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                                <XAxis type="number" tickFormatter={v => `₹${v}`} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                                <YAxis type="category" dataKey="hour" width={100} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                                <Tooltip formatter={(v) => [formatCurrency(v as number), 'Revenue']} />
                                                <Bar dataKey="revenue" fill="#EA580C" radius={[0, 8, 8, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                        <div className={styles.insight}>
                                            <strong>Most Profitable:</strong> {peakHoursData[0].hour} ({formatCurrency(peakHoursData[0].revenue)})
                                        </div>
                                    </>
                                ) : (
                                    <div className={styles.emptyState}><div className={styles.emptyText}>No data</div></div>
                                )}
                            </div>

                            {/* Sport Revenue Pie */}
                            <div className={styles.chartCard}>
                                <h3 className={styles.chartTitle}>⚽ Revenue by Sport</h3>
                                {sportData.length > 0 ? (
                                    <>
                                        <ResponsiveContainer width="100%" height={250}>
                                            <PieChart>
                                                <Pie
                                                    data={sportData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={((entry: any) => `${entry.percentage}%`) as any}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {sportData.map((entry, i) => (
                                                        <Cell key={`sport-${i}`} fill={SPORT_COLORS[entry.name] || '#6B7280'} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value) => [formatCurrency(value as number), 'Revenue']} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className={styles.sportLegend}>
                                            {sportData.map(sp => (
                                                <div key={sp.name} className={styles.legendItem}>
                                                    <span className={styles.legendDot} style={{ backgroundColor: SPORT_COLORS[sp.name] || '#6B7280' }} />
                                                    <span>{sp.name}</span>
                                                    <span className={styles.legendValue}>{formatCurrency(sp.value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className={styles.insight}>
                                            <strong>Most Popular:</strong> {sportData[0].name} ({sportData[0].bookings} bookings)
                                        </div>
                                    </>
                                ) : (
                                    <div className={styles.emptyState}><div className={styles.emptyText}>No data</div></div>
                                )}
                            </div>
                        </div>

                        {/* ═══ 6. DAY OF WEEK + GROUND REVENUE ═══ */}
                        <div className={styles.analysisGrid}>
                            {/* Day of Week */}
                            <div className={styles.chartCard}>
                                <h3 className={styles.chartTitle}>📅 Revenue by Day of Week</h3>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={dayData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis type="number" tickFormatter={v => `₹${v}`} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                        <YAxis type="category" dataKey="day" width={50} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                        <Tooltip formatter={(v) => [formatCurrency(v as number), 'Revenue']} />
                                        <Bar dataKey="revenue" fill="#3B82F6" radius={[0, 8, 8, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                                <div className={styles.insight}>
                                    <strong>Weekends = {weekendPct}%</strong> of total revenue
                                </div>
                            </div>

                            {/* Ground Revenue Pie */}
                            <div className={styles.chartCard}>
                                <h3 className={styles.chartTitle}>🏟️ Revenue by Ground</h3>
                                {groundData.length > 0 ? (
                                    <>
                                        <ResponsiveContainer width="100%" height={250}>
                                            <PieChart>
                                                <Pie
                                                    data={groundData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={((entry: any) => `${entry.percentage}%`) as any}
                                                    outerRadius={80}
                                                    dataKey="value"
                                                >
                                                    {groundData.map((_, i) => (
                                                        <Cell key={`ground-${i}`} fill={GROUND_COLORS[i % GROUND_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value) => [formatCurrency(value as number), 'Revenue']} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className={styles.sportLegend}>
                                            {groundData.map((g, i) => (
                                                <div key={g.name} className={styles.legendItem}>
                                                    <span className={styles.legendDot} style={{ backgroundColor: GROUND_COLORS[i % GROUND_COLORS.length] }} />
                                                    <span>{g.name}</span>
                                                    <span className={styles.legendValue}>{formatCurrency(g.value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className={styles.emptyState}><div className={styles.emptyText}>No data</div></div>
                                )}
                            </div>
                        </div>

                        {/* ═══ 7. BOOKING STATUS BREAKDOWN ═══ */}
                        <div className={styles.statusCard}>
                            <h3 className={styles.statusTitle}>📊 Booking Status Breakdown</h3>

                            <div className={styles.statusBar}>
                                <span className={styles.statusLabel}>✅ Confirmed</span>
                                <div className={styles.statusProgress}>
                                    <div className={`${styles.statusFill} ${styles.fillConfirmed}`} style={{ width: `${statusData.confirmed.pct}%` }}>
                                        {statusData.confirmed.pct > 10 ? `${statusData.confirmed.count}` : ''}
                                    </div>
                                </div>
                                <span className={styles.statusInfo}>{statusData.confirmed.count} ({statusData.confirmed.pct}%)</span>
                            </div>

                            <div className={styles.statusBar}>
                                <span className={styles.statusLabel}>⏳ Pending</span>
                                <div className={styles.statusProgress}>
                                    <div className={`${styles.statusFill} ${styles.fillPending}`} style={{ width: `${statusData.pending.pct}%` }}>
                                        {statusData.pending.pct > 10 ? `${statusData.pending.count}` : ''}
                                    </div>
                                </div>
                                <span className={styles.statusInfo}>{statusData.pending.count} ({statusData.pending.pct}%)</span>
                            </div>

                            <div className={styles.statusBar}>
                                <span className={styles.statusLabel}>❌ Cancelled</span>
                                <div className={styles.statusProgress}>
                                    <div className={`${styles.statusFill} ${styles.fillCancelled}`} style={{ width: `${statusData.cancelled.pct}%` }}>
                                        {statusData.cancelled.pct > 10 ? `${statusData.cancelled.count}` : ''}
                                    </div>
                                </div>
                                <span className={styles.statusInfo}>{statusData.cancelled.count} ({statusData.cancelled.pct}%)</span>
                            </div>

                            <div className={styles.statusSummary}>
                                <span className={`${styles.statusSummaryItem} ${statusData.cancelled.pct <= 10 ? styles.great : statusData.cancelled.pct <= 25 ? styles.warning : styles.danger}`}>
                                    <strong>Cancellation Rate:</strong> {statusData.cancelled.pct}% {statusData.cancelled.pct <= 10 ? '🎉' : statusData.cancelled.pct <= 25 ? '⚠️' : '🔴'}
                                </span>
                                <span className={styles.statusSummaryItem}>
                                    <strong>Confirmation Rate:</strong> {statusData.confirmed.pct}%
                                </span>
                                <span className={styles.statusSummaryItem}>
                                    <strong>Revenue at Risk:</strong> {formatCurrency(statusData.pending.revenue + statusData.cancelled.revenue)}
                                </span>
                            </div>
                        </div>

                        {/* ═══ 8. KEY INSIGHTS ═══ */}
                        {insights.length > 0 && (
                            <div className={styles.insightsCard}>
                                <h3 className={styles.insightsTitle}>🎯 Key Insights & Recommendations</h3>
                                {insights.map((insight, i) => (
                                    <div key={i} className={styles.insightItem}>
                                        <span className={styles.insightIcon}>{insight.icon}</span>
                                        <div className={styles.insightContent}>
                                            <div className={styles.insightItemTitle}>{insight.title}</div>
                                            <div className={styles.insightRec}>→ {insight.recommendation}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ═══ 9. TOP CUSTOMERS + PROJECTED REVENUE ═══ */}
                        <div className={styles.analysisGrid}>
                            {/* Top Customers */}
                            <div className={styles.customersCard}>
                                <h3 className={styles.chartTitle}>🏆 Top Customers</h3>
                                {topCustomers.length > 0 ? (
                                    topCustomers.map((c, i) => (
                                        <div key={i} className={styles.customerItem}>
                                            <div className={styles.customerRank}>{i + 1}</div>
                                            <div className={styles.customerDetails}>
                                                <div className={styles.customerName}>{c.name}</div>
                                                <div className={styles.customerMeta}>{c.bookings} bookings</div>
                                            </div>
                                            <div className={styles.customerRevenue}>{formatCurrency(c.revenue)}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className={styles.emptyState}><div className={styles.emptyText}>No customer data</div></div>
                                )}
                            </div>

                            {/* Projected Revenue */}
                            <div className={styles.projectedCard}>
                                <h3 className={styles.chartTitle}>📅 Projected Revenue</h3>
                                <p style={{ fontSize: '14px', color: '#6B7280', margin: '8px 0' }}>Based on current trend:</p>
                                <div className={styles.projectedValue}>{formatCurrency(projected.projected)}</div>
                                <div className={styles.projectedSub}>projected from {formatCurrency(totalRevenue)} earned so far</div>

                                {revenueData.length > 1 && (
                                    <ResponsiveContainer width="100%" height={120}>
                                        <LineChart data={revenueData}>
                                            <Line type="monotone" dataKey="revenue" stroke="#EA580C" strokeWidth={2} dot={false} />
                                            <XAxis dataKey="date" tick={false} stroke="#E5E7EB" />
                                            <YAxis tick={false} stroke="transparent" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}

                                {projected.potential > 0 && (
                                    <div className={styles.projectedTip}>
                                        💡 With weekend discounts: Potential +{formatCurrency(projected.potential)}/month
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
