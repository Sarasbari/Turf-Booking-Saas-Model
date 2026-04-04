import { useState, useMemo, useCallback } from 'react';
import {
    Search, LayoutList, CalendarDays, Phone, MessageCircle,
    CheckCircle2, XCircle, ChevronDown, ChevronUp, Download,
    Clock, Users, IndianRupee, TrendingUp, Filter, ArrowUpDown,
    Loader2, AlertTriangle, FileText
} from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useDashboard } from '@/context/DashboardContext';
import { BookingType } from '@/types/owner';

// ── Helpers ────────────────────────────────────────────────
function formatCurrency(v: number) {
    return `₹${v.toLocaleString('en-IN')}`;
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function timeAgo(ts: any): string {
    if (!ts) return '';
    const now = Date.now();
    const then = ts.toMillis ? ts.toMillis() : new Date(ts).getTime();
    const diff = now - then;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

function getToday() {
    return new Date().toISOString().split('T')[0];
}

function getTomorrow() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
}

function isThisWeek(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return d >= startOfWeek && d <= endOfWeek;
}

function getTimeOfDay(startTime: string): string {
    const hour = parseInt(startTime.split(':')[0], 10);
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
}

// ── Types ──────────────────────────────────────────────────
type DateFilter = 'all' | 'today' | 'tomorrow' | 'week';
type StatusFilter = 'all' | 'confirmed' | 'pending' | 'cancelled';
type SortOption = 'newest' | 'oldest' | 'amount_high' | 'amount_low';
type ViewMode = 'list' | 'calendar';

// ── Calendar hour helpers ──────────────────────────────────
const CALENDAR_HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM - 10 PM

function getHourLabel(h: number) {
    if (h === 0) return '12 AM';
    if (h < 12) return `${h} AM`;
    if (h === 12) return '12 PM';
    return `${h - 12} PM`;
}

// ── Component ──────────────────────────────────────────────
export function OwnerBookings() {
    const { bookings, loading, cancelBooking } = useDashboard();

    // UI state
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [dateFilter, setDateFilter] = useState<DateFilter>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [sportFilter, setSportFilter] = useState('all');
    const [groundFilter, setGroundFilter] = useState('all');
    const [timeOfDayFilter, setTimeOfDayFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [insightsOpen, setInsightsOpen] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // ── Unique values for filter dropdowns ──
    const sports = useMemo(() => [...new Set(bookings.map(b => b.sport).filter(Boolean))], [bookings]);
    const grounds = useMemo(() => [...new Set(bookings.map(b => b.groundId).filter(Boolean))], [bookings]);

    // ── Stats computed from real data ──
    const stats = useMemo(() => {
        const today = getToday();
        const todayBookings = bookings.filter(b => b.date === today && b.status === 'confirmed');
        const pendingBookings = bookings.filter(b => b.status === 'pending');
        const weekBookings = bookings.filter(b => isThisWeek(b.date) && b.status === 'confirmed');
        const weekRevenue = weekBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

        return [
            {
                label: 'Total Bookings',
                value: bookings.length.toString(),
                icon: Users,
                color: '#3B82F6',
                bgColor: '#EFF6FF',
                borderColor: '#BFDBFE'
            },
            {
                label: 'Pending Approval',
                value: pendingBookings.length.toString(),
                icon: Clock,
                color: '#D97706',
                bgColor: '#FFFBEB',
                borderColor: '#FDE68A',
                pulse: pendingBookings.length > 0
            },
            {
                label: 'Confirmed Today',
                value: todayBookings.length.toString(),
                icon: CheckCircle2,
                color: '#16A34A',
                bgColor: '#F0FDF4',
                borderColor: '#BBF7D0'
            },
            {
                label: 'Revenue This Week',
                value: formatCurrency(weekRevenue),
                icon: IndianRupee,
                color: '#EA580C',
                bgColor: '#FFF7ED',
                borderColor: '#FED7AA'
            }
        ];
    }, [bookings]);

    // ── Filtered + sorted bookings ──
    const filtered = useMemo(() => {
        let result = [...bookings];

        // Date filter
        if (dateFilter === 'today') result = result.filter(b => b.date === getToday());
        else if (dateFilter === 'tomorrow') result = result.filter(b => b.date === getTomorrow());
        else if (dateFilter === 'week') result = result.filter(b => isThisWeek(b.date));

        // Status filter
        if (statusFilter !== 'all') result = result.filter(b => b.status === statusFilter);

        // Sport filter
        if (sportFilter !== 'all') result = result.filter(b => b.sport === sportFilter);

        // Ground filter
        if (groundFilter !== 'all') result = result.filter(b => b.groundId === groundFilter);

        // Time of day filter
        if (timeOfDayFilter !== 'all') result = result.filter(b => getTimeOfDay(b.startTime) === timeOfDayFilter);

        // Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(b =>
                (b.customerName || '').toLowerCase().includes(q) ||
                (b.customerPhone || '').toLowerCase().includes(q) ||
                (b.id || '').toLowerCase().includes(q) ||
                (b.sport || '').toLowerCase().includes(q)
            );
        }

        // Sort
        result.sort((a, b) => {
            switch (sortBy) {
                case 'newest': return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
                case 'oldest': return (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0);
                case 'amount_high': return (b.amount || 0) - (a.amount || 0);
                case 'amount_low': return (a.amount || 0) - (b.amount || 0);
                default: return 0;
            }
        });

        return result;
    }, [bookings, dateFilter, statusFilter, sportFilter, groundFilter, timeOfDayFilter, searchQuery, sortBy]);

    // ── Selection helpers ──
    const toggleSelect = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const selectAll = useCallback(() => {
        if (selectedIds.size === filtered.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filtered.map(b => b.id)));
        }
    }, [filtered, selectedIds.size]);

    // ── Actions ────────────────────────────────────────────
    const confirmBooking = useCallback(async (bookingId: string) => {
        setActionLoading(bookingId);
        try {
            const bookingRef = doc(db, 'bookings', bookingId);
            await updateDoc(bookingRef, {
                status: 'confirmed',
                confirmedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error confirming booking:', error);
            alert('Failed to confirm booking. Please try again.');
        } finally {
            setActionLoading(null);
        }
    }, []);

    const handleCancel = useCallback(async (bookingId: string) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) return;
        setActionLoading(bookingId);
        try {
            await cancelBooking(bookingId, '');
        } catch (error) {
            console.error('Error cancelling booking:', error);
            alert('Failed to cancel booking. Please try again.');
        } finally {
            setActionLoading(null);
        }
    }, [cancelBooking]);

    const bulkConfirm = useCallback(async () => {
        const pendingSelected = filtered.filter(b => selectedIds.has(b.id) && b.status === 'pending');
        if (pendingSelected.length === 0) {
            alert('No pending bookings selected to confirm.');
            return;
        }
        if (!window.confirm(`Confirm ${pendingSelected.length} booking(s)?`)) return;
        setActionLoading('bulk');
        try {
            for (const b of pendingSelected) {
                const bookingRef = doc(db, 'bookings', b.id);
                await updateDoc(bookingRef, {
                    status: 'confirmed',
                    confirmedAt: serverTimestamp()
                });
            }
            setSelectedIds(new Set());
        } catch (error) {
            console.error('Error in bulk confirm:', error);
            alert('Some bookings may not have been confirmed. Please refresh.');
        } finally {
            setActionLoading(null);
        }
    }, [filtered, selectedIds]);

    const bulkCancel = useCallback(async () => {
        const cancellable = filtered.filter(b => selectedIds.has(b.id) && (b.status === 'pending' || b.status === 'confirmed'));
        if (cancellable.length === 0) {
            alert('No bookings selected that can be cancelled.');
            return;
        }
        if (!window.confirm(`Cancel ${cancellable.length} booking(s)? This cannot be undone.`)) return;
        setActionLoading('bulk');
        try {
            for (const b of cancellable) {
                await cancelBooking(b.id, '');
            }
            setSelectedIds(new Set());
        } catch (error) {
            console.error('Error in bulk cancel:', error);
            alert('Some bookings may not have been cancelled. Please refresh.');
        } finally {
            setActionLoading(null);
        }
    }, [filtered, selectedIds, cancelBooking]);

    const exportCSV = useCallback(() => {
        const rows = [['Booking ID', 'Customer', 'Phone', 'Sport', 'Ground', 'Date', 'Start', 'End', 'Amount', 'Status', 'Payment']];
        filtered.forEach(b => {
            rows.push([
                b.id,
                b.customerName || '',
                b.customerPhone || '',
                b.sport || '',
                b.groundId || '',
                b.date,
                b.startTime,
                b.endTime,
                String(b.amount || 0),
                b.status,
                b.paymentMethod || ''
            ]);
        });
        const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bookings_${getToday()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [filtered]);

    // ── Insights from real data ──
    const insights = useMemo(() => {
        const items: { icon: string; label: string; value: string; color: string }[] = [];
        const pending = bookings.filter(b => b.status === 'pending');
        const confirmed = bookings.filter(b => b.status === 'confirmed');
        const today = getToday();
        const todayBookings = bookings.filter(b => b.date === today);
        const totalSlots = 17; // 6AM-10PM
        const todayConfirmed = todayBookings.filter(b => b.status === 'confirmed');

        items.push({ icon: '⏳', label: 'Need Confirmation', value: `${pending.length} bookings`, color: '#D97706' });

        const pendingPayments = bookings.filter(b => b.paymentStatus === 'pending').length;
        items.push({ icon: '💳', label: 'Pending Payments', value: `${pendingPayments} bookings`, color: '#DC2626' });

        const occupancy = totalSlots > 0 ? Math.round((todayConfirmed.length / totalSlots) * 100) : 0;
        items.push({ icon: '📊', label: "Today's Occupancy", value: `${occupancy}%`, color: '#3B82F6' });

        // Peak time
        const hourCounts: Record<string, number> = {};
        confirmed.forEach(b => {
            const slot = `${b.startTime}-${b.endTime}`;
            hourCounts[slot] = (hourCounts[slot] || 0) + 1;
        });
        const peakSlot = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
        items.push({ icon: '🔥', label: 'Peak Time', value: peakSlot ? peakSlot[0] : 'N/A', color: '#EA580C' });

        // Most booked sport
        const sportCounts: Record<string, number> = {};
        bookings.forEach(b => {
            if (b.sport) sportCounts[b.sport] = (sportCounts[b.sport] || 0) + 1;
        });
        const topSport = Object.entries(sportCounts).sort((a, b) => b[1] - a[1])[0];
        items.push({ icon: '⚽', label: 'Most Booked', value: topSport ? topSport[0] : 'N/A', color: '#10B981' });

        return items;
    }, [bookings]);

    // ── Calendar data from real bookings ──
    const calendarBookings = useMemo(() => {
        const today = getToday();
        return bookings.filter(b => b.date === today);
    }, [bookings]);

    // ── Status badge styling ──
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'confirmed': return { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' };
            case 'pending': return { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' };
            case 'cancelled': return { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' };
            default: return { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' };
        }
    };

    // ── Loading State ──
    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <Loader2 style={{ width: 40, height: 40, color: '#EA580C', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ color: '#6B7280', fontSize: '16px' }}>Loading bookings...</p>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div>
            {/* ═══ HEADER ═══ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>📅 Bookings Management</h1>
                    <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>Manage all your turf bookings in one place</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#16A34A', backgroundColor: '#F0FDF4', padding: '6px 12px', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#16A34A', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                        Live Updates
                    </span>
                    <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#EA580C', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                        <Download style={{ width: 14, height: 14 }} /> Export CSV
                    </button>
                </div>
            </div>
            <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>

            {/* ═══ STATS BAR ═══ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {stats.map((s, i) => (
                    <div key={i} style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '20px',
                        border: `1px solid ${s.borderColor}`,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: 500, marginBottom: '8px' }}>{s.label}</div>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: '#111827' }}>{s.value}</div>
                            </div>
                            <div style={{
                                width: 44, height: 44, borderRadius: '10px',
                                backgroundColor: s.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <s.icon style={{ width: 22, height: 22, color: s.color }} />
                            </div>
                        </div>
                        {s.pulse && (
                            <div style={{
                                position: 'absolute', top: 12, right: 12,
                                width: 8, height: 8, borderRadius: '50%',
                                backgroundColor: s.color,
                                animation: 'pulse 2s infinite'
                            }} />
                        )}
                    </div>
                ))}
            </div>

            {/* ═══ VIEW TOGGLE + FILTERS ═══ */}
            <div style={{
                backgroundColor: 'white', borderRadius: '12px', padding: '16px', marginBottom: '16px',
                border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
            }}>
                {/* View toggle + date tabs */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                    {/* Date tabs */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {(['all', 'today', 'tomorrow', 'week'] as DateFilter[]).map(d => (
                            <button key={d} onClick={() => setDateFilter(d)} style={{
                                padding: '6px 14px', fontSize: '13px', fontWeight: 600, borderRadius: '6px', border: 'none', cursor: 'pointer',
                                backgroundColor: dateFilter === d ? '#EA580C' : '#F3F4F6',
                                color: dateFilter === d ? 'white' : '#6B7280',
                                transition: 'all 0.2s'
                            }}>
                                {d === 'all' ? 'All' : d === 'today' ? 'Today' : d === 'tomorrow' ? 'Tomorrow' : 'This Week'}
                            </button>
                        ))}
                    </div>
                    {/* View toggle */}
                    <div style={{ display: 'flex', backgroundColor: '#F3F4F6', borderRadius: '8px', padding: '3px' }}>
                        <button onClick={() => setViewMode('list')} style={{
                            display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                            backgroundColor: viewMode === 'list' ? 'white' : 'transparent',
                            color: viewMode === 'list' ? '#EA580C' : '#6B7280',
                            boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                        }}>
                            <LayoutList style={{ width: 14, height: 14 }} /> List
                        </button>
                        <button onClick={() => setViewMode('calendar')} style={{
                            display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                            backgroundColor: viewMode === 'calendar' ? 'white' : 'transparent',
                            color: viewMode === 'calendar' ? '#EA580C' : '#6B7280',
                            boxShadow: viewMode === 'calendar' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                        }}>
                            <CalendarDays style={{ width: 14, height: 14 }} /> Calendar
                        </button>
                    </div>
                </div>

                {/* Search + filters */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: '1 1 200px' }}>
                        <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#9CA3AF' }} />
                        <input
                            type="text"
                            placeholder="Search by name, phone, ID..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%', padding: '8px 12px 8px 34px', fontSize: '14px', borderRadius: '8px',
                                border: '1px solid #E5E7EB', outline: 'none', backgroundColor: '#F9FAFB', color: '#111827',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    <select value={sportFilter} onChange={e => setSportFilter(e.target.value)} style={selectStyle}>
                        <option value="all">All Sports</option>
                        {sports.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={groundFilter} onChange={e => setGroundFilter(e.target.value)} style={selectStyle}>
                        <option value="all">All Grounds</option>
                        {grounds.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)} style={selectStyle}>
                        <option value="all">All Status</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="pending">Pending</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <select value={timeOfDayFilter} onChange={e => setTimeOfDayFilter(e.target.value)} style={selectStyle}>
                        <option value="all">All Times</option>
                        <option value="morning">Morning</option>
                        <option value="afternoon">Afternoon</option>
                        <option value="evening">Evening</option>
                    </select>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)} style={selectStyle}>
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="amount_high">Amount ↑</option>
                        <option value="amount_low">Amount ↓</option>
                    </select>
                </div>
            </div>

            {/* ═══ BULK ACTIONS ═══ */}
            {selectedIds.size > 0 && (
                <div style={{
                    backgroundColor: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '12px', padding: '12px 16px',
                    marginBottom: '16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px'
                }}>
                    <button onClick={selectAll} style={{
                        padding: '6px 12px', fontSize: '13px', fontWeight: 600, borderRadius: '6px',
                        border: '1px solid #E5E7EB', backgroundColor: 'white', color: '#111827', cursor: 'pointer'
                    }}>
                        {selectedIds.size === filtered.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#EA580C' }}>{selectedIds.size} selected</span>
                    <div style={{ flex: 1 }} />
                    <button onClick={bulkConfirm} disabled={actionLoading === 'bulk'} style={{
                        display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '13px', fontWeight: 600,
                        borderRadius: '6px', border: 'none', backgroundColor: '#EA580C', color: 'white', cursor: 'pointer',
                        opacity: actionLoading === 'bulk' ? 0.5 : 1
                    }}>
                        {actionLoading === 'bulk' ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 style={{ width: 14, height: 14 }} />}
                        Confirm Selected
                    </button>
                    <button onClick={bulkCancel} disabled={actionLoading === 'bulk'} style={{
                        display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '13px', fontWeight: 600,
                        borderRadius: '6px', border: '1px solid #FEE2E2', backgroundColor: 'white', color: '#DC2626', cursor: 'pointer',
                        opacity: actionLoading === 'bulk' ? 0.5 : 1
                    }}>
                        <XCircle style={{ width: 14, height: 14 }} /> Cancel Selected
                    </button>
                </div>
            )}

            {/* ═══ MAIN CONTENT ═══ */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                {/* Bookings Area */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    {viewMode === 'list' ? (
                        /* ── LIST VIEW ── */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {filtered.length === 0 ? (
                                <div style={{
                                    backgroundColor: 'white', borderRadius: '12px', padding: '60px 20px',
                                    border: '1px solid #E5E7EB', textAlign: 'center'
                                }}>
                                    <Filter style={{ width: 48, height: 48, color: '#D1D5DB', margin: '0 auto 16px' }} />
                                    <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>No bookings found</div>
                                    <div style={{ fontSize: '14px', color: '#6B7280' }}>Try adjusting your filters or search query</div>
                                </div>
                            ) : (
                                filtered.map(b => {
                                    const isSelected = selectedIds.has(b.id);
                                    const isExpanded = expandedId === b.id;
                                    const isLoading = actionLoading === b.id;
                                    const ss = getStatusStyle(b.status);

                                    return (
                                        <div key={b.id} style={{
                                            backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden',
                                            border: `1px solid ${isSelected ? '#EA580C' : '#E5E7EB'}`,
                                            boxShadow: isSelected ? '0 0 0 2px rgba(234,88,12,0.1)' : '0 1px 3px rgba(0,0,0,0.06)',
                                            transition: 'all 0.2s'
                                        }}>
                                            {/* Header Row */}
                                            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelect(b.id)}
                                                    style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#EA580C' }}
                                                />

                                                {/* Avatar */}
                                                <img
                                                    src={b.customerPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(b.customerName || '?')}&background=FFF7ED&color=EA580C`}
                                                    alt={b.customerName}
                                                    style={{
                                                        width: 44, height: 44, borderRadius: '50%', objectFit: 'cover',
                                                        border: '2px solid #F3F4F6', flexShrink: 0
                                                    }}
                                                />

                                                {/* Name & Phone */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>{b.customerName || 'Unknown'}</div>
                                                    <div style={{ fontSize: '13px', color: '#6B7280' }}>{b.customerPhone || '—'}</div>
                                                </div>

                                                {/* Booking ID */}
                                                <div style={{ fontSize: '12px', color: '#9CA3AF', fontFamily: 'monospace' }}>#{b.id.slice(-6)}</div>

                                                {/* Status Badge */}
                                                <span style={{
                                                    padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                                    backgroundColor: ss.bg, color: ss.text, border: `1px solid ${ss.border}`,
                                                    textTransform: 'capitalize'
                                                }}>
                                                    {b.status}
                                                </span>

                                                {/* Booked ago */}
                                                <div style={{ fontSize: '12px', color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                                                    {timeAgo(b.createdAt)}
                                                </div>
                                            </div>

                                            {/* Details Row */}
                                            <div style={{
                                                padding: '0 20px 12px', display: 'flex', flexWrap: 'wrap', gap: '16px',
                                                fontSize: '13px', color: '#6B7280', borderBottom: '1px solid #F3F4F6'
                                            }}>
                                                {b.sport && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>⚽ {b.sport}</span>
                                                )}
                                                {b.groundId && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>🏟️ {b.groundId}</span>
                                                )}
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>📅 {formatDate(b.date)}</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>⏰ {b.startTime} - {b.endTime}</span>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: '#111827' }}>
                                                    💰 {formatCurrency(b.amount || 0)}
                                                </span>
                                                {b.paymentMethod && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>💳 {b.paymentMethod}</span>
                                                )}
                                                {b.paymentStatus && (
                                                    <span style={{
                                                        padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                                                        backgroundColor: b.paymentStatus === 'paid' ? '#F0FDF4' : '#FFFBEB',
                                                        color: b.paymentStatus === 'paid' ? '#16A34A' : '#D97706',
                                                        textTransform: 'capitalize'
                                                    }}>
                                                        {b.paymentStatus}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Alert Row */}
                                            {b.status === 'pending' && (
                                                <div style={{
                                                    padding: '8px 20px', backgroundColor: '#FFFBEB',
                                                    display: 'flex', alignItems: 'center', gap: '8px',
                                                    fontSize: '13px', color: '#D97706', borderBottom: '1px solid #F3F4F6'
                                                }}>
                                                    <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0 }} />
                                                    This booking needs your confirmation
                                                </div>
                                            )}

                                            {/* Quick Actions */}
                                            <div style={{ padding: '12px 20px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                                                {b.customerPhone && (
                                                    <a href={`tel:${b.customerPhone}`} style={actionBtnStyle('#EFF6FF', '#3B82F6')}>
                                                        <Phone style={{ width: 13, height: 13 }} /> Call
                                                    </a>
                                                )}
                                                {b.customerPhone && (
                                                    <a
                                                        href={`https://wa.me/91${b.customerPhone.replace(/[^0-9]/g, '')}?text=Hi ${encodeURIComponent(b.customerName || '')}, regarding your booking on ${formatDate(b.date)} at ${b.startTime}`}
                                                        target="_blank" rel="noopener noreferrer"
                                                        style={actionBtnStyle('#ECFDF5', '#10B981')}
                                                    >
                                                        <MessageCircle style={{ width: 13, height: 13 }} /> WhatsApp
                                                    </a>
                                                )}
                                                {b.status === 'pending' && (
                                                    <button
                                                        onClick={() => confirmBooking(b.id)}
                                                        disabled={isLoading}
                                                        style={{
                                                            ...actionBtnBase,
                                                            backgroundColor: '#EA580C', color: 'white', border: 'none',
                                                            opacity: isLoading ? 0.5 : 1
                                                        }}
                                                    >
                                                        {isLoading ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 style={{ width: 13, height: 13 }} />}
                                                        Confirm
                                                    </button>
                                                )}
                                                {(b.status === 'pending' || b.status === 'confirmed') && (
                                                    <button
                                                        onClick={() => handleCancel(b.id)}
                                                        disabled={isLoading}
                                                        style={{
                                                            ...actionBtnBase,
                                                            backgroundColor: 'white', color: '#DC2626', border: '1px solid #FEE2E2',
                                                            opacity: isLoading ? 0.5 : 1
                                                        }}
                                                    >
                                                        <XCircle style={{ width: 13, height: 13 }} /> Cancel
                                                    </button>
                                                )}

                                                <div style={{ flex: 1 }} />
                                                <button
                                                    onClick={() => setExpandedId(isExpanded ? null : b.id)}
                                                    style={{ ...actionBtnBase, backgroundColor: '#F9FAFB', color: '#6B7280', border: '1px solid #E5E7EB' }}
                                                >
                                                    {isExpanded ? <ChevronUp style={{ width: 13, height: 13 }} /> : <ChevronDown style={{ width: 13, height: 13 }} />}
                                                    {isExpanded ? 'Hide Details' : 'View Details'}
                                                </button>
                                            </div>

                                            {/* Expanded Details */}
                                            {isExpanded && (
                                                <div style={{ padding: '0 20px 20px', borderTop: '1px solid #F3F4F6' }}>
                                                    <div style={{ padding: '16px 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                                                        <DetailItem label="Booking ID" value={b.id} />
                                                        <DetailItem label="Customer Name" value={b.customerName || '—'} />
                                                        <DetailItem label="Phone" value={b.customerPhone || '—'} />
                                                        <DetailItem label="Sport" value={b.sport || '—'} />
                                                        <DetailItem label="Ground" value={b.groundId || '—'} />
                                                        <DetailItem label="Date" value={formatDate(b.date)} />
                                                        <DetailItem label="Time" value={`${b.startTime} – ${b.endTime}`} />
                                                        <DetailItem label="Amount" value={formatCurrency(b.amount || 0)} />
                                                        <DetailItem label="Payment" value={b.paymentMethod || '—'} />
                                                        <DetailItem label="Payment Status" value={b.paymentStatus || '—'} />
                                                        <DetailItem label="Booked By" value={b.bookedBy || '—'} />
                                                        <DetailItem label="Team" value={b.teamName || '—'} />
                                                        {b.notes && <DetailItem label="Notes" value={b.notes} />}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    ) : (
                        /* ── CALENDAR VIEW ── */
                        <div style={{
                            backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden',
                            border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                        }}>
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827' }}>
                                    📅 Today's Schedule — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </h3>
                                <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 10, height: 10, borderRadius: '3px', backgroundColor: '#16A34A', display: 'inline-block' }} /> Confirmed</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 10, height: 10, borderRadius: '3px', backgroundColor: '#D97706', display: 'inline-block' }} /> Pending</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 10, height: 10, borderRadius: '3px', backgroundColor: '#E5E7EB', display: 'inline-block' }} /> Available</span>
                                </div>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(2, 1fr)', minWidth: '500px' }}>
                                    {/* Column headers */}
                                    <div style={{ padding: '10px', borderBottom: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>Time</div>
                                    <div style={{ padding: '10px', borderBottom: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', fontSize: '12px', fontWeight: 600, color: '#6B7280', borderLeft: '1px solid #E5E7EB' }}>Ground 1</div>
                                    <div style={{ padding: '10px', borderBottom: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', fontSize: '12px', fontWeight: 600, color: '#6B7280', borderLeft: '1px solid #E5E7EB' }}>Ground 2</div>

                                    {CALENDAR_HOURS.map(hour => {
                                        const hourStr = `${String(hour).padStart(2, '0')}:00`;
                                        const nextHourStr = `${String(hour + 1).padStart(2, '0')}:00`;
                                        const ground1Booking = calendarBookings.find(b => b.startTime === hourStr && (b.groundId === 'ground1' || !b.groundId));
                                        const ground2Booking = calendarBookings.find(b => b.startTime === hourStr && b.groundId === 'ground2');

                                        return [
                                            <div key={`t-${hour}`} style={{ padding: '10px', fontSize: '12px', color: '#6B7280', borderBottom: '1px solid #F3F4F6', whiteSpace: 'nowrap' }}>
                                                {getHourLabel(hour)}
                                            </div>,
                                            <CalendarCell key={`g1-${hour}`} booking={ground1Booking} />,
                                            <CalendarCell key={`g2-${hour}`} booking={ground2Booking} />
                                        ];
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ═══ INSIGHTS PANEL ═══ */}
                <div style={{ width: '280px', flexShrink: 0 }}>
                    <div style={{
                        backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden',
                        border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                        position: 'sticky', top: '80px'
                    }}>
                        <button onClick={() => setInsightsOpen(!insightsOpen)} style={{
                            width: '100%', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            border: 'none', backgroundColor: 'transparent', cursor: 'pointer', borderBottom: insightsOpen ? '1px solid #E5E7EB' : 'none'
                        }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>💡 Smart Insights</span>
                            {insightsOpen ? <ChevronUp style={{ width: 16, height: 16, color: '#6B7280' }} /> : <ChevronDown style={{ width: 16, height: 16, color: '#6B7280' }} />}
                        </button>
                        {insightsOpen && (
                            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {insights.map((item, i) => (
                                    <div key={i} style={{
                                        padding: '12px', borderRadius: '8px', backgroundColor: '#F9FAFB',
                                        border: '1px solid #F3F4F6'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '16px' }}>{item.icon}</span>
                                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{item.label}</span>
                                        </div>
                                        <div style={{ fontSize: '18px', fontWeight: 700, color: item.color }}>{item.value}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Sub-components ─────────────────────────────────────────
function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</div>
            <div style={{ fontSize: '14px', color: '#111827', wordBreak: 'break-all' }}>{value}</div>
        </div>
    );
}

function CalendarCell({ booking }: { booking?: BookingType }) {
    if (!booking) {
        return (
            <div style={{
                padding: '8px 10px', borderLeft: '1px solid #E5E7EB', borderBottom: '1px solid #F3F4F6',
                backgroundColor: '#FAFAFA', fontSize: '12px', color: '#D1D5DB', fontStyle: 'italic'
            }}>
                Available
            </div>
        );
    }

    const colors = booking.status === 'confirmed'
        ? { bg: '#F0FDF4', border: '#16A34A', text: '#16A34A' }
        : booking.status === 'pending'
            ? { bg: '#FFFBEB', border: '#D97706', text: '#D97706' }
            : { bg: '#FEF2F2', border: '#DC2626', text: '#DC2626' };

    return (
        <div style={{
            padding: '6px 10px', borderLeft: `3px solid ${colors.border}`, borderBottom: '1px solid #F3F4F6',
            backgroundColor: colors.bg
        }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: colors.text }}>{booking.customerName}</div>
            <div style={{ fontSize: '11px', color: '#6B7280' }}>{booking.sport} • {booking.startTime}-{booking.endTime}</div>
        </div>
    );
}

// ── Shared styles ──────────────────────────────────────────
const selectStyle: React.CSSProperties = {
    padding: '8px 12px',
    fontSize: '13px',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB',
    color: '#111827',
    outline: 'none',
    cursor: 'pointer',
    minWidth: '120px'
};

const actionBtnBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '7px 14px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.2s',
    border: 'none'
};

function actionBtnStyle(bg: string, color: string): React.CSSProperties {
    return {
        ...actionBtnBase,
        backgroundColor: bg,
        color: color,
        border: 'none',
        textDecoration: 'none'
    };
}
