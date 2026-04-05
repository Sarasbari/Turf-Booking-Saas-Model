import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/services/firebase';

export function CancelBooking() {
    const [searchParams] = useSearchParams();
    const bookingId = searchParams.get('id');
    const bookedDate = searchParams.get('date') || '';
    const turfName = searchParams.get('turf') || 'Unknown Turf';
    const slots = searchParams.get('slots') || '';

    const { user } = useAuth();
    const [status, setStatus] = useState<'idle' | 'confirming' | 'submitting' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    // Check if cancellation is > 24hrs before booking
    const bookingDateTime = new Date(`${bookedDate}T00:00:00`);
    const hoursUntilBooking = (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
    const isRefundEligible = hoursUntilBooking > 24;

    const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

    const handleCancel = async () => {
        if (!bookingId || !user) return;
        setStatus('submitting');

        try {
            const token = await auth.currentUser?.getIdToken();
            const res = await fetch(`${API_BASE}/api/payment/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ bookingId }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to cancel booking');
            }

            setStatus('success');
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
            setStatus('error');
        }
    };

    if (!bookingId) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">No booking ID provided.</p>
                    <Link to="/profile" className="text-green-600 text-sm mt-2 inline-block">← Back to My Bookings</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16">
                <div className="max-w-xl mx-auto px-6">
                    <h1 className="text-3xl font-bold mb-2">Cancel Booking</h1>
                    <p className="text-gray-400 text-sm">Booking #{bookingId.slice(0, 8)}...</p>
                </div>
            </div>

            <div className="max-w-xl mx-auto px-6 py-10">
                {status === 'success' ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">✅</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Cancelled</h2>
                        {isRefundEligible ? (
                            <p className="text-gray-600 text-sm">
                                Your refund will be processed within <strong>5–7 business days</strong> to your original payment method.
                            </p>
                        ) : (
                            <p className="text-gray-600 text-sm">
                                Your booking has been cancelled. As per our policy, no refund is applicable for cancellations within 24 hours of the booking.
                            </p>
                        )}
                        <Link
                            to="/profile"
                            className="inline-block mt-6 px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                            Back to My Bookings
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
                        {/* Booking Details */}
                        <div className="bg-gray-50 rounded-xl p-5">
                            <h3 className="font-semibold text-gray-800 text-sm mb-3">Booking Details</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Turf</span>
                                    <span className="text-gray-800 font-medium">{turfName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Date</span>
                                    <span className="text-gray-800 font-medium">{bookedDate}</span>
                                </div>
                                {slots && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Slots</span>
                                        <span className="text-gray-800 font-medium">{slots}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Refund Policy */}
                        {isRefundEligible ? (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                <h3 className="font-semibold text-green-800 text-sm mb-1">✅ Refund Eligible</h3>
                                <p className="text-green-700 text-xs">
                                    This booking is more than 24 hours away. You're eligible for a full refund.
                                    Refund will be processed within 5–7 business days.
                                </p>
                            </div>
                        ) : (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                <h3 className="font-semibold text-red-800 text-sm mb-1">⚠️ No Refund</h3>
                                <p className="text-red-700 text-xs">
                                    This booking is within 24 hours. As per our cancellation policy, no refund
                                    will be issued. You can still cancel the booking.
                                </p>
                            </div>
                        )}

                        {/* Error */}
                        {status === 'error' && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
                                {errorMsg}
                            </div>
                        )}

                        {/* Actions */}
                        {status === 'confirming' ? (
                            <div className="space-y-3">
                                <p className="text-gray-700 text-sm font-medium text-center">
                                    Are you sure you want to cancel this booking?
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setStatus('idle')}
                                        className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                                    >
                                        Keep Booking
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
                                    >
                                        Yes, Cancel
                                    </button>
                                </div>
                            </div>
                        ) : status === 'submitting' ? (
                            <div className="flex items-center justify-center gap-2 py-3">
                                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-gray-600 text-sm">Cancelling booking...</span>
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <Link
                                    to="/profile"
                                    className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors text-center"
                                >
                                    ← Go Back
                                </Link>
                                <button
                                    onClick={() => setStatus('confirming')}
                                    className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
                                >
                                    Request Cancellation
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
