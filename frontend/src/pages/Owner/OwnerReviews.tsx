import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, getDocs, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { OwnerData, ReviewData } from '../../types/owner';
import styles from '../../styles/Owner/OwnerReviews.module.css';

type FilterType = 'all' | '5' | '4' | '3' | '2' | '1' | 'replied' | 'notReplied';

export function OwnerReviews() {
    const [ownerData, setOwnerData] = useState<OwnerData | null>(null);
    const [reviews, setReviews] = useState<ReviewData[]>([]);
    const [filteredReviews, setFilteredReviews] = useState<ReviewData[]>([]);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReviews();
    }, []);

    useEffect(() => {
        filterReviews();
    }, [reviews, activeFilter]);

    const fetchReviews = async () => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            setLoading(true);

            const ownerDocRef = doc(db, 'owners', user.uid);
            const ownerDoc = await getDoc(ownerDocRef);
            
            if (!ownerDoc.exists()) return;
            
            const owner = ownerDoc.data() as OwnerData;
            setOwnerData(owner);

            const reviewsRef = collection(db, 'turf', owner.turfId, 'reviews');
            const reviewsSnapshot = await getDocs(reviewsRef);
            const reviewsData = reviewsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ReviewData[];

            reviewsData.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
            setReviews(reviewsData);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterReviews = () => {
        let filtered = [...reviews];

        if (activeFilter === 'replied') {
            filtered = filtered.filter(r => r.ownerReply);
        } else if (activeFilter === 'notReplied') {
            filtered = filtered.filter(r => !r.ownerReply);
        } else if (activeFilter !== 'all') {
            const rating = parseInt(activeFilter);
            filtered = filtered.filter(r => r.rating === rating);
        }

        setFilteredReviews(filtered);
    };

    const handleReply = async (reviewId: string) => {
        if (!ownerData || !replyText.trim()) return;

        try {
            const reviewRef = doc(db, 'turf', ownerData.turfId, 'reviews', reviewId);
            await updateDoc(reviewRef, {
                ownerReply: replyText.trim(),
                repliedAt: Timestamp.now()
            });

            setReviews(prev =>
                prev.map(r =>
                    r.id === reviewId
                        ? { ...r, ownerReply: replyText.trim(), repliedAt: Timestamp.now() }
                        : r
                )
            );

            setReplyingTo(null);
            setReplyText('');
        } catch (error) {
            console.error('Error replying to review:', error);
            alert('Failed to post reply. Please try again.');
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                <div style={{ color: '#6B7280' }}>Loading reviews...</div>
            </div>
        );
    }

    const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Reviews Management</h1>
                <p className={styles.subtitle}>View and respond to customer reviews</p>
            </div>

            {/* Rating Summary */}
            <div className={styles.section}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ fontSize: '48px', fontWeight: 700, color: '#EA580C' }}>
                        {avgRating.toFixed(1)} ⭐
                    </div>
                    <div style={{ color: '#6B7280', fontSize: '14px' }}>
                        Based on {reviews.length} reviews
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '24px',
                flexWrap: 'wrap'
            }}>
                {(['all', '5', '4', '3', '2', '1', 'replied', 'notReplied'] as FilterType[]).map(filter => (
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
                            cursor: 'pointer'
                        }}
                    >
                        {filter === 'all' && 'All'}
                        {filter === 'replied' && 'Replied'}
                        {filter === 'notReplied' && 'Not Replied'}
                        {['5', '4', '3', '2', '1'].includes(filter) && `${filter}⭐`}
                    </button>
                ))}
            </div>

            {/* Reviews List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredReviews.length > 0 ? (
                    filteredReviews.map(review => (
                        <div
                            key={review.id}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                padding: '20px',
                                border: '1px solid #E5E7EB'
                            }}
                        >
                            <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                                <img
                                    src={review.userPhoto || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(review.userName)}
                                    alt={review.userName}
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        objectFit: 'cover'
                                    }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, color: '#111827' }}>{review.userName}</div>
                                            <div style={{ fontSize: '14px', color: '#F59E0B' }}>
                                                {'⭐'.repeat(review.rating)}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                                            {review.createdAt.toDate().toLocaleDateString()}
                                        </div>
                                    </div>
                                    <p style={{ marginTop: '12px', color: '#6B7280', lineHeight: '1.6' }}>
                                        {review.comment}
                                    </p>

                                    {review.ownerReply && (
                                        <div style={{
                                            marginTop: '16px',
                                            padding: '16px',
                                            backgroundColor: '#FFF7ED',
                                            borderRadius: '8px',
                                            borderLeft: '3px solid #EA580C'
                                        }}>
                                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#EA580C', marginBottom: '8px' }}>
                                                Owner's Reply
                                            </div>
                                            <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.6' }}>
                                                {review.ownerReply}
                                            </p>
                                        </div>
                                    )}

                                    {!review.ownerReply && replyingTo === review.id && (
                                        <div style={{ marginTop: '16px' }}>
                                            <textarea
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="Write your reply..."
                                                style={{
                                                    width: '100%',
                                                    minHeight: '80px',
                                                    padding: '12px',
                                                    border: '1px solid #E5E7EB',
                                                    borderRadius: '8px',
                                                    fontSize: '14px',
                                                    resize: 'vertical',
                                                    marginBottom: '12px'
                                                }}
                                            />
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => handleReply(review.id)}
                                                    style={{
                                                        padding: '8px 16px',
                                                        backgroundColor: '#EA580C',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        fontSize: '14px',
                                                        fontWeight: 600,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Post Reply
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setReplyingTo(null);
                                                        setReplyText('');
                                                    }}
                                                    style={{
                                                        padding: '8px 16px',
                                                        backgroundColor: 'white',
                                                        color: '#6B7280',
                                                        border: '1px solid #E5E7EB',
                                                        borderRadius: '6px',
                                                        fontSize: '14px',
                                                        fontWeight: 600,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {!review.ownerReply && replyingTo !== review.id && (
                                        <button
                                            onClick={() => setReplyingTo(review.id)}
                                            style={{
                                                marginTop: '12px',
                                                padding: '8px 16px',
                                                backgroundColor: 'white',
                                                color: '#EA580C',
                                                border: '1px solid #EA580C',
                                                borderRadius: '6px',
                                                fontSize: '14px',
                                                fontWeight: 600,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            💬 Reply
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <div style={{ fontSize: '64px', marginBottom: '16px' }}>⭐</div>
                        <div style={{ color: '#9CA3AF' }}>No reviews found</div>
                    </div>
                )}
            </div>
        </div>
    );
}
