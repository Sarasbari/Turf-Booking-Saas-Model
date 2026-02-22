import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    collection, doc, getDoc, onSnapshot, updateDoc, serverTimestamp, Timestamp
} from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { OwnerData, ReviewData } from '../../types/owner';
import {
    Star, Search, MessageCircle, ChevronDown, ChevronUp,
    Trophy, Clock, Send, Edit3, Sparkles, ThumbsUp, Loader2
} from 'lucide-react';

// ── Extend ReviewData for local UI state ───────────────────
interface ReviewLocal extends ReviewData {
    flaggedTestimonial?: boolean;
}

// ── Filter types ───────────────────────────────────────────
type FilterTab = 'all' | '5' | '4' | '3' | '2' | '1' | 'replied' | 'not_replied' | 'this_month' | 'flagged';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: '5', label: '5⭐' },
    { key: '4', label: '4⭐' },
    { key: '3', label: '3⭐' },
    { key: '2', label: '2⭐' },
    { key: '1', label: '1⭐' },
    { key: 'replied', label: 'Replied' },
    { key: 'not_replied', label: 'Not Replied' },
    { key: 'this_month', label: 'This Month' },
    { key: 'flagged', label: 'Flagged' },
];

// ── Stars helper ───────────────────────────────────────────
function Stars({ count, size = 16 }: { count: number; size?: number }) {
    return (
        <span style={{ display: 'inline-flex', gap: '2px' }}>
            {[1, 2, 3, 4, 5].map(i => (
                <Star
                    key={i}
                    style={{
                        width: size, height: size,
                        fill: i <= count ? '#F97316' : '#E5E7EB',
                        color: i <= count ? '#F97316' : '#E5E7EB'
                    }}
                />
            ))}
        </span>
    );
}

// ── Helpers ────────────────────────────────────────────────
function getInitials(name: string) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = ['#F97316', '#8B5CF6', '#10B981', '#EF4444', '#3B82F6', '#EC4899', '#14B8A6', '#F59E0B'];
function avatarColor(name: string) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function daysSince(ts: Timestamp | undefined): number {
    if (!ts) return 0;
    const now = Date.now();
    const then = ts.toMillis();
    return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

function formatDate(ts: Timestamp | undefined): string {
    if (!ts) return '';
    const d = ts.toDate();
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function timeBetween(created: Timestamp | undefined, replied: Timestamp | undefined): string {
    if (!created || !replied) return '';
    const diffMs = replied.toMillis() - created.toMillis();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins} mins`;
    const hrs = Math.round(mins / 60 * 10) / 10;
    return `${hrs} hrs`;
}

// ── Component ──────────────────────────────────────────────
export function OwnerReviews() {
    const [reviews, setReviews] = useState<ReviewLocal[]>([]);
    const [loading, setLoading] = useState(true);
    const [turfId, setTurfId] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
    const [expandedReplyId, setExpandedReplyId] = useState<string | null>(null);
    const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
    const [editReplyText, setEditReplyText] = useState('');
    const [sendingReplyId, setSendingReplyId] = useState<string | null>(null);
    const [flagged, setFlagged] = useState<Set<string>>(new Set());

    // ── Fetch turfId from owner doc ──
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;
        (async () => {
            try {
                const ownerDoc = await getDoc(doc(db, 'owners', user.uid));
                if (ownerDoc.exists()) {
                    const data = ownerDoc.data() as OwnerData;
                    setTurfId(data.turfId);
                }
            } catch (e) {
                console.error('Error fetching owner:', e);
            }
        })();
    }, []);

    // ── Real-time listener on reviews subcollection ──
    useEffect(() => {
        if (!turfId) return;
        setLoading(true);
        const reviewsRef = collection(db, 'turf', turfId, 'reviews');
        const unsubscribe = onSnapshot(reviewsRef, (snapshot) => {
            const data = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            })) as ReviewLocal[];
            // Sort newest first by default
            data.sort((a, b) => {
                const ta = (a.createdAt as Timestamp)?.toMillis?.() || 0;
                const tb = (b.createdAt as Timestamp)?.toMillis?.() || 0;
                return tb - ta;
            });
            setReviews(data);
            setLoading(false);
        }, (error) => {
            console.error('Error listening to reviews:', error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [turfId]);

    // ── Computed Stats  ──
    const totalReviews = reviews.length;
    const overallRating = useMemo(() => {
        if (!totalReviews) return 0;
        const avg = reviews.reduce((s, r) => s + (r.rating || 0), 0) / totalReviews;
        return Math.round(avg * 10) / 10;
    }, [reviews, totalReviews]);

    const repliedCount = useMemo(() => reviews.filter(r => !!r.ownerReply).length, [reviews]);
    const awaitingReply = totalReviews - repliedCount;
    const responseRate = totalReviews ? Math.round((repliedCount / totalReviews) * 100) : 0;

    // Avg response time (only for replied reviews)
    const avgResponseTime = useMemo(() => {
        const repliedReviews = reviews.filter(r => r.ownerReply && r.repliedAt && r.createdAt);
        if (!repliedReviews.length) return '—';
        const totalMins = repliedReviews.reduce((sum, r) => {
            const diff = (r.repliedAt as Timestamp).toMillis() - (r.createdAt as Timestamp).toMillis();
            return sum + diff / 60000;
        }, 0);
        const avgMins = totalMins / repliedReviews.length;
        if (avgMins < 60) return `${Math.round(avgMins)} min`;
        return `${(avgMins / 60).toFixed(1)} hrs`;
    }, [reviews]);

    // Sentiment — simple: positive if >= 4 stars
    const sentimentPct = useMemo(() => {
        if (!totalReviews) return 0;
        const positive = reviews.filter(r => r.rating >= 4).length;
        return Math.round((positive / totalReviews) * 100);
    }, [reviews, totalReviews]);

    // Rating distribution
    const ratingDist = useMemo(() => {
        const counts = [0, 0, 0, 0, 0];
        reviews.forEach(r => { if (r.rating >= 1 && r.rating <= 5) counts[r.rating - 1]++; });
        return [5, 4, 3, 2, 1].map(star => ({
            star,
            count: counts[star - 1],
            pct: totalReviews ? Math.round((counts[star - 1] / totalReviews) * 100) : 0
        }));
    }, [reviews, totalReviews]);

    // ── Filtering ──
    const filtered = useMemo(() => {
        let result = [...reviews];
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        switch (activeFilter) {
            case '5': case '4': case '3': case '2': case '1':
                result = result.filter(r => r.rating === Number(activeFilter));
                break;
            case 'replied':
                result = result.filter(r => !!r.ownerReply);
                break;
            case 'not_replied':
                result = result.filter(r => !r.ownerReply);
                break;
            case 'this_month':
                result = result.filter(r => {
                    const d = (r.createdAt as Timestamp)?.toDate?.();
                    return d && d >= thisMonthStart;
                });
                break;
            case 'flagged':
                result = result.filter(r => flagged.has(r.id));
                break;
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(r =>
                (r.userName || '').toLowerCase().includes(q) ||
                (r.comment || '').toLowerCase().includes(q)
            );
        }

        result.sort((a, b) => {
            const ta = (a.createdAt as Timestamp)?.toMillis?.() || 0;
            const tb = (b.createdAt as Timestamp)?.toMillis?.() || 0;
            switch (sortBy) {
                case 'newest': return tb - ta;
                case 'oldest': return ta - tb;
                case 'highest': return (b.rating || 0) - (a.rating || 0);
                case 'lowest': return (a.rating || 0) - (b.rating || 0);
                default: return 0;
            }
        });

        return result;
    }, [reviews, activeFilter, searchQuery, sortBy, flagged]);

    // ── Actions ──
    const startEditing = useCallback((reviewId: string, text: string) => {
        setEditingReplyId(reviewId);
        setEditReplyText(text);
    }, []);

    const sendReply = useCallback(async (reviewId: string) => {
        if (!turfId || !editReplyText.trim()) return;
        setSendingReplyId(reviewId);
        try {
            const reviewRef = doc(db, 'turf', turfId, 'reviews', reviewId);
            await updateDoc(reviewRef, {
                ownerReply: editReplyText.trim(),
                repliedAt: serverTimestamp()
            });
            setEditingReplyId(null);
            setEditReplyText('');
        } catch (e) {
            console.error('Error sending reply:', e);
            alert('Failed to send reply. Please try again.');
        } finally {
            setSendingReplyId(null);
        }
    }, [turfId, editReplyText]);

    const toggleTestimonial = useCallback((reviewId: string) => {
        setFlagged(prev => {
            const next = new Set(prev);
            if (next.has(reviewId)) next.delete(reviewId);
            else next.add(reviewId);
            return next;
        });
    }, []);

    // ── Loading state ──
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', gap: '12px', color: '#6B7280' }}>
                <Loader2 style={{ width: 24, height: 24, animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '16px' }}>Loading reviews...</span>
            </div>
        );
    }

    return (
        <div>
            {/* ═══ HEADER ═══ */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>⭐ Reviews Management</h1>
                <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>View, respond and grow your reputation</p>
            </div>

            {/* ═══ ZONE 1 — REPUTATION SCORECARD ═══ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <StatCard
                    title="Overall Rating"
                    value={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{overallRating} <Stars count={Math.round(overallRating)} size={18} /></span>}
                    subtext={`Based on ${totalReviews} reviews`}
                    badge={totalReviews > 0 ? { text: `${totalReviews} total reviews`, color: '#10B981', bg: '#F0FDF4' } : undefined}
                    icon={<Star style={{ width: 22, height: 22, fill: '#F97316', color: '#F97316' }} />}
                    iconBg="#FFF7ED"
                />
                <StatCard
                    title="Response Rate"
                    value={`${responseRate}%`}
                    subtext={`${awaitingReply} awaiting reply`}
                    badge={awaitingReply > 0 ? { text: `⚠️ ${awaitingReply} unanswered`, color: '#D97706', bg: '#FFFBEB' } : { text: '✅ All answered', color: '#10B981', bg: '#F0FDF4' }}
                    icon={<MessageCircle style={{ width: 22, height: 22, color: '#3B82F6' }} />}
                    iconBg="#EFF6FF"
                />
                <StatCard
                    title="Avg Response Time"
                    value={avgResponseTime}
                    subtext="Time to reply"
                    badge={{ text: repliedCount > 0 ? '✅ Tracked' : 'No replies yet', color: repliedCount > 0 ? '#10B981' : '#6B7280', bg: repliedCount > 0 ? '#F0FDF4' : '#F3F4F6' }}
                    icon={<Clock style={{ width: 22, height: 22, color: '#10B981' }} />}
                    iconBg="#ECFDF5"
                />
                <StatCard
                    title="Sentiment Score"
                    value={`${sentimentPct >= 70 ? '😊' : sentimentPct >= 40 ? '😐' : '😞'} ${sentimentPct}%`}
                    subtext="Positive sentiment (≥4⭐)"
                    badge={{ text: 'Based on star ratings', color: '#6B7280', bg: '#F3F4F6' }}
                    icon={<ThumbsUp style={{ width: 22, height: 22, color: '#8B5CF6' }} />}
                    iconBg="#F5F3FF"
                />
            </div>

            {/* Rating Distribution */}
            {totalReviews > 0 && (
                <div style={{
                    backgroundColor: 'white', borderRadius: '12px', padding: '20px',
                    border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '20px'
                }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 16px 0' }}>Rating Breakdown</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {ratingDist.map(d => (
                            <div key={d.star} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827', width: '36px', flexShrink: 0 }}>{d.star}⭐</span>
                                <div style={{ flex: 1, height: '10px', backgroundColor: '#F3F4F6', borderRadius: '99px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${d.pct}%`, backgroundColor: '#F97316', borderRadius: '99px', transition: 'width 0.6s ease' }} />
                                </div>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280', width: '50px', textAlign: 'right' }}>{d.pct}% ({d.count})</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══ ZONE 2 — SMART INSIGHTS STRIP ═══ */}
            {totalReviews > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                    {awaitingReply > 0 && (
                        <InsightCard
                            borderColor="#EF4444"
                            title="⚠️ Needs Attention"
                            body={`${awaitingReply} review${awaitingReply > 1 ? 's' : ''} without a reply`}
                            btnLabel="View Unreplied"
                            btnColor="#F97316"
                            onAction={() => { setActiveFilter('not_replied'); setSearchQuery(''); }}
                        />
                    )}
                    {repliedCount > 0 && (
                        <InsightCard
                            borderColor="#10B981"
                            title="🔥 What's Working"
                            body={`You've replied to ${repliedCount} review${repliedCount > 1 ? 's' : ''}. Keep building relationships!`}
                            btnLabel="View Replied"
                            btnColor="#10B981"
                            onAction={() => { setActiveFilter('replied'); setSearchQuery(''); }}
                        />
                    )}
                    <InsightCard
                        borderColor="#3B82F6"
                        title="💡 Quick Win"
                        body="Responding within 1hr boosts re-bookings by 40%"
                        btnLabel={awaitingReply > 0 ? 'Reply Now' : 'All caught up!'}
                        btnColor="#3B82F6"
                        onAction={() => { if (awaitingReply > 0) setActiveFilter('not_replied'); }}
                    />
                </div>
            )}

            {/* ═══ ZONE 3 — FILTERS BAR ═══ */}
            <div style={{
                backgroundColor: 'white', borderRadius: '12px', padding: '16px',
                border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '20px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {FILTER_TABS.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveFilter(tab.key)}
                                style={{
                                    padding: '6px 14px', fontSize: '13px', fontWeight: 600, borderRadius: '6px', cursor: 'pointer',
                                    border: activeFilter === tab.key ? 'none' : '1px solid #E5E7EB',
                                    backgroundColor: activeFilter === tab.key ? '#F97316' : 'white',
                                    color: activeFilter === tab.key ? 'white' : '#6B7280',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280' }}>{filtered.length} reviews</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: '1 1 250px' }}>
                        <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#9CA3AF' }} />
                        <input
                            type="text"
                            placeholder="Search by keyword or customer name..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%', padding: '8px 12px 8px 34px', fontSize: '14px', borderRadius: '8px',
                                border: '1px solid #E5E7EB', outline: 'none', backgroundColor: '#F9FAFB', color: '#111827',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as typeof sortBy)}
                        style={{
                            padding: '8px 12px', fontSize: '13px', borderRadius: '8px',
                            border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', color: '#111827',
                            outline: 'none', cursor: 'pointer'
                        }}
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="highest">Highest Rated</option>
                        <option value="lowest">Lowest Rated</option>
                    </select>
                </div>
            </div>

            {/* ═══ ZONE 4 — REVIEW CARDS ═══ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
                {filtered.length === 0 ? (
                    <div style={{
                        backgroundColor: 'white', borderRadius: '12px', padding: '60px 20px',
                        border: '1px solid #E5E7EB', textAlign: 'center'
                    }}>
                        <Search style={{ width: 48, height: 48, color: '#D1D5DB', margin: '0 auto 16px' }} />
                        <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                            {totalReviews === 0 ? 'No reviews yet' : 'No reviews found'}
                        </div>
                        <div style={{ fontSize: '14px', color: '#6B7280' }}>
                            {totalReviews === 0 ? 'Reviews from your customers will appear here' : 'Try adjusting your filters or search query'}
                        </div>
                    </div>
                ) : (
                    filtered.map(review => {
                        const isEditing = editingReplyId === review.id;
                        const isSending = sendingReplyId === review.id;
                        const isExpanded = expandedReplyId === review.id;
                        const lowRating = review.rating <= 2;
                        const notReplied = !review.ownerReply;
                        const isFlagged = flagged.has(review.id);
                        const daysNoReply = notReplied ? daysSince(review.createdAt as Timestamp) : 0;

                        return (
                            <div key={review.id} style={{
                                backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden',
                                border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                                borderLeft: lowRating ? '4px solid #EF4444' : notReplied ? '4px solid #F97316' : '4px solid transparent',
                                transition: 'all 0.2s'
                            }}>
                                {/* Top Row */}
                                <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                                    {/* Avatar */}
                                    {review.userPhoto ? (
                                        <img src={review.userPhoto} alt={review.userName} style={{
                                            width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0
                                        }} />
                                    ) : (
                                        <div style={{
                                            width: 44, height: 44, borderRadius: '50%',
                                            backgroundColor: avatarColor(review.userName || ''),
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white', fontWeight: 700, fontSize: '15px', flexShrink: 0
                                        }}>
                                            {getInitials(review.userName || '?')}
                                        </div>
                                    )}

                                    {/* Name + stars + date */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>{review.userName || 'Anonymous'}</span>
                                            <Stars count={review.rating || 0} size={15} />
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                                            {formatDate(review.createdAt as Timestamp)}
                                        </div>
                                    </div>

                                    {/* Testimonial badge */}
                                    {isFlagged && (
                                        <span style={{
                                            padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                            backgroundColor: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A'
                                        }}>
                                            🏆 Testimonial
                                        </span>
                                    )}

                                    {/* Status badge */}
                                    <span style={{
                                        padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                        backgroundColor: !notReplied ? '#F0FDF4' : '#FEF2F2',
                                        color: !notReplied ? '#16A34A' : '#DC2626',
                                        border: `1px solid ${!notReplied ? '#BBF7D0' : '#FECACA'}`
                                    }}>
                                        {!notReplied ? '✅ Replied' : '🔴 Not Replied'}
                                    </span>
                                </div>

                                {/* Review text */}
                                <div style={{ padding: '0 20px 12px' }}>
                                    <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6', margin: '0' }}>
                                        {review.comment || ''}
                                    </p>
                                </div>

                                {/* Reply section for NOT REPLIED */}
                                {notReplied && (
                                    <div style={{ margin: '0 20px 12px', padding: '14px 16px', backgroundColor: '#FFF7ED', borderRadius: '10px', border: '1px solid #FED7AA' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                                            <Sparkles style={{ width: 14, height: 14, color: '#F97316' }} />
                                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#EA580C' }}>Write a Reply</span>
                                        </div>
                                        {isEditing ? (
                                            <>
                                                <textarea
                                                    value={editReplyText}
                                                    onChange={e => setEditReplyText(e.target.value)}
                                                    rows={4}
                                                    placeholder="Write your reply to this review..."
                                                    style={{
                                                        width: '100%', padding: '10px', fontSize: '13px', borderRadius: '8px',
                                                        border: '1px solid #FED7AA', backgroundColor: 'white', color: '#111827',
                                                        outline: 'none', resize: 'vertical', lineHeight: '1.5', boxSizing: 'border-box',
                                                        fontFamily: 'inherit'
                                                    }}
                                                />
                                                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                                    <button
                                                        onClick={() => sendReply(review.id)}
                                                        disabled={isSending || !editReplyText.trim()}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '6px',
                                                            padding: '8px 18px', fontSize: '13px', fontWeight: 600, borderRadius: '6px',
                                                            border: 'none', backgroundColor: '#F97316', color: 'white', cursor: 'pointer',
                                                            opacity: isSending || !editReplyText.trim() ? 0.6 : 1
                                                        }}
                                                    >
                                                        {isSending ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Send style={{ width: 14, height: 14 }} />}
                                                        {isSending ? 'Sending...' : 'Send Reply'}
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingReplyId(null)}
                                                        style={{
                                                            padding: '8px 18px', fontSize: '13px', fontWeight: 600, borderRadius: '6px',
                                                            border: '1px solid #E5E7EB', backgroundColor: 'white', color: '#6B7280', cursor: 'pointer'
                                                        }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                <button
                                                    onClick={() => startEditing(review.id, '')}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '5px',
                                                        padding: '7px 14px', fontSize: '13px', fontWeight: 600, borderRadius: '6px',
                                                        border: 'none', backgroundColor: '#F97316', color: 'white', cursor: 'pointer'
                                                    }}
                                                >
                                                    <Edit3 style={{ width: 13, height: 13 }} /> Write Reply
                                                </button>
                                                <button
                                                    onClick={() => toggleTestimonial(review.id)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '5px',
                                                        padding: '7px 14px', fontSize: '13px', fontWeight: 600, borderRadius: '6px',
                                                        border: '1px solid #BBF7D0', backgroundColor: 'white', color: '#10B981', cursor: 'pointer'
                                                    }}
                                                >
                                                    <Trophy style={{ width: 13, height: 13 }} /> {isFlagged ? 'Unflag' : 'Flag as Testimonial'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Owner Reply (already replied) */}
                                {!notReplied && review.ownerReply && (
                                    <div style={{ margin: '0 20px 12px' }}>
                                        <button
                                            onClick={() => setExpandedReplyId(isExpanded ? null : review.id)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600,
                                                color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0'
                                            }}
                                        >
                                            <MessageCircle style={{ width: 14, height: 14 }} />
                                            Your reply
                                            {review.repliedAt && review.createdAt && ` · Replied in ${timeBetween(review.createdAt as Timestamp, review.repliedAt as Timestamp)}`}
                                            {isExpanded ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
                                        </button>
                                        {isExpanded && (
                                            <div style={{
                                                marginTop: '8px', padding: '12px 16px', backgroundColor: '#F9FAFB',
                                                borderRadius: '8px', borderLeft: '3px solid #E5E7EB'
                                            }}>
                                                {isEditing ? (
                                                    <>
                                                        <textarea
                                                            value={editReplyText}
                                                            onChange={e => setEditReplyText(e.target.value)}
                                                            rows={3}
                                                            style={{
                                                                width: '100%', padding: '10px', fontSize: '13px', borderRadius: '8px',
                                                                border: '1px solid #E5E7EB', backgroundColor: 'white', color: '#111827',
                                                                outline: 'none', resize: 'vertical', lineHeight: '1.5', boxSizing: 'border-box',
                                                                fontFamily: 'inherit'
                                                            }}
                                                        />
                                                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                                            <button
                                                                onClick={() => sendReply(review.id)}
                                                                disabled={isSending}
                                                                style={{
                                                                    display: 'flex', alignItems: 'center', gap: '5px',
                                                                    padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '5px',
                                                                    border: 'none', backgroundColor: '#F97316', color: 'white', cursor: 'pointer',
                                                                    opacity: isSending ? 0.6 : 1
                                                                }}
                                                            >
                                                                {isSending ? <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} /> : <Send style={{ width: 12, height: 12 }} />}
                                                                Update Reply
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingReplyId(null)}
                                                                style={{
                                                                    padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '5px',
                                                                    border: '1px solid #E5E7EB', backgroundColor: 'white', color: '#6B7280', cursor: 'pointer'
                                                                }}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p style={{ fontSize: '13px', color: '#374151', lineHeight: '1.5', margin: 0 }}>
                                                            {review.ownerReply}
                                                        </p>
                                                        <button
                                                            onClick={() => startEditing(review.id, review.ownerReply || '')}
                                                            style={{
                                                                display: 'flex', alignItems: 'center', gap: '5px', marginTop: '10px',
                                                                padding: '5px 12px', fontSize: '12px', fontWeight: 600, borderRadius: '5px',
                                                                border: '1px solid #E5E7EB', backgroundColor: 'white', color: '#6B7280', cursor: 'pointer'
                                                            }}
                                                        >
                                                            <Edit3 style={{ width: 12, height: 12 }} /> Edit Reply
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Bottom Row */}
                                <div style={{
                                    padding: '10px 20px', borderTop: '1px solid #F3F4F6',
                                    display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px',
                                    fontSize: '12px', color: '#9CA3AF'
                                }}>
                                    <span>Review #{review.id.slice(0, 8)}</span>
                                    {!notReplied && review.repliedAt && review.createdAt ? (
                                        <span style={{ color: '#10B981', fontWeight: 600 }}>
                                            ✅ Replied in {timeBetween(review.createdAt as Timestamp, review.repliedAt as Timestamp)}
                                        </span>
                                    ) : (
                                        <span style={{ color: '#EF4444', fontWeight: 600 }}>
                                            ⚠️ {daysNoReply === 0 ? 'Today' : `${daysNoReply}d`} no reply
                                        </span>
                                    )}
                                    <div style={{ flex: 1 }} />
                                    <button
                                        onClick={() => toggleTestimonial(review.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '4px',
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            fontSize: '12px', fontWeight: 600,
                                            color: isFlagged ? '#D97706' : '#9CA3AF'
                                        }}
                                    >
                                        <Trophy style={{ width: 13, height: 13 }} />
                                        {isFlagged ? 'Testimonial ✓' : 'Flag as Testimonial'}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ═══ ZONE 5 — REVIEW STRATEGY PANEL ═══ */}
            {totalReviews > 0 && (
                <div style={{
                    backgroundColor: 'white', borderRadius: '12px', padding: '24px',
                    border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                }}>
                    <div style={{ marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: '0 0 4px 0' }}>📊 Review Strategy & Insights</h2>
                        <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Summary of your reviews</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                        {/* Column 1 — Summary */}
                        <div>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: '0 0 16px 0' }}>📈 Overview</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '13px', color: '#374151' }}>Total Reviews</span>
                                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>{totalReviews}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '13px', color: '#374151' }}>Average Rating</span>
                                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>{overallRating} ⭐</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '13px', color: '#374151' }}>5-Star Reviews</span>
                                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#10B981' }}>{ratingDist[0].count}</span>
                                </div>
                            </div>
                        </div>

                        {/* Column 2 — Response Stats */}
                        <div>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: '0 0 16px 0' }}>💬 Response Stats</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#F0FDF4', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '13px', color: '#374151' }}>Replied</span>
                                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#10B981' }}>{repliedCount}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: awaitingReply > 0 ? '#FEF2F2' : '#F9FAFB', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '13px', color: '#374151' }}>Awaiting Reply</span>
                                    <span style={{ fontSize: '16px', fontWeight: 700, color: awaitingReply > 0 ? '#EF4444' : '#111827' }}>{awaitingReply}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '13px', color: '#374151' }}>Response Rate</span>
                                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>{responseRate}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Column 3 — Rating breakdown bars */}
                        <div>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: '0 0 16px 0' }}>⭐ Rating Split</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {ratingDist.map(d => (
                                    <div key={d.star}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                                            <span style={{ color: '#374151', fontWeight: 500 }}>{d.star} Star</span>
                                            <span style={{ color: '#6B7280' }}>{d.count} review{d.count !== 1 ? 's' : ''}</span>
                                        </div>
                                        <div style={{ height: '8px', backgroundColor: '#F3F4F6', borderRadius: '99px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${d.pct}%`, backgroundColor: d.star >= 4 ? '#10B981' : d.star === 3 ? '#F59E0B' : '#EF4444', borderRadius: '99px', transition: 'width 0.6s ease' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {awaitingReply > 0 && (
                                <p style={{
                                    fontSize: '12px', color: '#D97706', fontWeight: 600, marginTop: '14px',
                                    padding: '8px 12px', backgroundColor: '#FFFBEB', borderRadius: '6px',
                                    border: '1px solid #FDE68A'
                                }}>
                                    💡 Reply to all reviews to build trust and boost rebookings
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Spin animation for loaders */}
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

// ── Sub-components ─────────────────────────────────────────

function StatCard({ title, value, subtext, badge, icon, iconBg }: {
    title: string;
    value: React.ReactNode;
    subtext: string;
    badge?: { text: string; color: string; bg: string };
    icon: React.ReactNode;
    iconBg: string;
}) {
    return (
        <div style={{
            backgroundColor: 'white', borderRadius: '12px', padding: '20px',
            border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>{title}</span>
                <div style={{
                    width: 40, height: 40, borderRadius: '10px',
                    backgroundColor: iconBg, display: 'flex',
                    alignItems: 'center', justifyContent: 'center'
                }}>
                    {icon}
                </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>{value}</div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: badge ? '8px' : '0' }}>{subtext}</div>
            {badge && (
                <span style={{
                    display: 'inline-block', padding: '3px 10px', borderRadius: '99px',
                    fontSize: '11px', fontWeight: 600, backgroundColor: badge.bg, color: badge.color
                }}>
                    {badge.text}
                </span>
            )}
        </div>
    );
}

function InsightCard({ borderColor, title, body, btnLabel, btnColor, onAction }: {
    borderColor: string;
    title: string;
    body: string;
    btnLabel: string;
    btnColor: string;
    onAction: () => void;
}) {
    return (
        <div style={{
            backgroundColor: 'white', borderRadius: '12px', padding: '18px 20px',
            border: '1px solid #E5E7EB', borderLeft: `4px solid ${borderColor}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
        }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: '0 0 6px 0' }}>{title}</h4>
            <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: '1.5', margin: '0 0 14px 0' }}>{body}</p>
            <button
                onClick={onAction}
                style={{
                    padding: '7px 16px', fontSize: '13px', fontWeight: 600, borderRadius: '6px',
                    border: `1px solid ${btnColor}`, backgroundColor: 'white',
                    color: btnColor, cursor: 'pointer', transition: 'all 0.2s'
                }}
            >
                {btnLabel}
            </button>
        </div>
    );
}
