import { useState, FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { doc, addDoc, collection, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuth } from '@/context/AuthContext';
import { trackEvent } from '@/services/analyticsService';

export function LeaveReview() {
    const [searchParams] = useSearchParams();
    const turfId = searchParams.get('turfId') || '';
    const turfName = searchParams.get('turfName') || 'This Turf';
    const bookingId = searchParams.get('bookingId') || '';

    const { user } = useAuth();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (rating === 0 || !user || !turfId) return;

        setStatus('submitting');
        try {
            // Save review to Firestore
            await addDoc(collection(db, 'reviews'), {
                userId: user.uid,
                userName: user.displayName || 'User',
                userPhoto: user.photoURL || '',
                turfId,
                turfName,
                bookingId,
                rating,
                text: reviewText.trim(),
                createdAt: serverTimestamp(),
            });

            // Update turf average rating
            try {
                const turfRef = doc(db, 'turfs', turfId);
                const turfSnap = await getDoc(turfRef);
                if (turfSnap.exists()) {
                    const data = turfSnap.data();
                    const currentRating = data.rating || 0;
                    const currentCount = data.reviewCount || 0;
                    const newCount = currentCount + 1;
                    const newRating = ((currentRating * currentCount) + rating) / newCount;
                    await updateDoc(turfRef, {
                        rating: Math.round(newRating * 10) / 10,
                        reviewCount: newCount,
                    });
                }
            } catch {
                // Non-critical — rating update can fail silently
            }

            trackEvent.reviewSubmitted(turfId, rating);
            setStatus('success');
        } catch (err) {
            console.error('Error submitting review:', err);
            setStatus('error');
        }
    };

    const displayRating = hoverRating || rating;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16">
                <div className="max-w-xl mx-auto px-6">
                    <h1 className="text-3xl font-bold mb-2">Leave a Review</h1>
                    <p className="text-gray-400">How was your experience at {turfName}?</p>
                </div>
            </div>

            <div className="max-w-xl mx-auto px-6 py-10">
                {status === 'success' ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">⭐</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Thanks for your review!</h2>
                        <p className="text-gray-600 text-sm mb-6">
                            Your feedback helps other players find great turfs.
                        </p>
                        <Link
                            to="/"
                            className="inline-block px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                            Back to Home
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
                        {/* Star Rating */}
                        <div className="text-center">
                            <p className="text-sm text-gray-600 mb-3">Tap a star to rate</p>
                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className="transition-transform hover:scale-110 active:scale-95"
                                    >
                                        <span className={`text-4xl ${star <= displayRating ? 'opacity-100' : 'opacity-25'}`}>
                                            ⭐
                                        </span>
                                    </button>
                                ))}
                            </div>
                            {displayRating > 0 && (
                                <p className="text-xs text-gray-500 mt-2">
                                    {displayRating === 1 && 'Poor'}
                                    {displayRating === 2 && 'Below Average'}
                                    {displayRating === 3 && 'Average'}
                                    {displayRating === 4 && 'Good'}
                                    {displayRating === 5 && 'Excellent!'}
                                </p>
                            )}
                        </div>

                        {/* Review Text */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                Write a review (optional)
                            </label>
                            <textarea
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all resize-none"
                                placeholder="Tell others about your experience — turf quality, facilities, staff..."
                                maxLength={500}
                            />
                            <p className="text-xs text-gray-400 text-right mt-1">{reviewText.length}/500</p>
                        </div>

                        {status === 'error' && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
                                Failed to submit review. Please try again.
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={rating === 0 || status === 'submitting'}
                            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
                        >
                            {status === 'submitting' ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                'Submit Review'
                            )}
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center">
                    <Link to="/" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
