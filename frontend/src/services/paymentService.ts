/**
 * Payment Service — Frontend
 *
 * Handles communication with the backend payment API and
 * opens the Razorpay checkout modal.
 *
 * Security: The Razorpay key secret NEVER appears here.
 * Only VITE_RAZORPAY_KEY_ID is used (public key).
 */

import { auth } from './firebase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreateOrderPayload {
    turfId: string;
    slots: string[];
    totalPrice: number;
    date: string;
}

interface CreateOrderResponse {
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
    receipt: string;
    meta: {
        turfId: string;
        slots: string[];
        date: string;
        userId: string;
    };
}

interface VerifyPaymentPayload {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    bookingData: {
        turfId: string;
        slots: string[];
        date: string;
        totalPrice: number;
        receipt: string;
    };
}

interface VerifyPaymentResponse {
    success: boolean;
    bookingId: string;
    message: string;
}

// Extend Window for Razorpay global
declare global {
    interface Window {
        Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
    }
}

interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    handler: (response: RazorpaySuccessResponse) => void;
    prefill?: {
        name?: string;
        email?: string;
        contact?: string;
    };
    theme?: { color?: string };
    modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
    open: () => void;
    on: (event: string, handler: (response: unknown) => void) => void;
}

interface RazorpaySuccessResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Get the current user's Firebase ID token for Authorization header.
 */
async function getAuthToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('User is not authenticated');
    }
    return user.getIdToken();
}

// ---------------------------------------------------------------------------
// API Calls
// ---------------------------------------------------------------------------

/**
 * Create a Razorpay order via backend.
 */
export async function createOrder(
    payload: CreateOrderPayload
): Promise<CreateOrderResponse> {
    const token = await getAuthToken();

    const res = await fetch(`${API_BASE}/api/payment/create-order`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create payment order');
    }

    return res.json();
}

/**
 * Verify payment signature via backend.
 * On success the backend creates the confirmed booking in Firestore.
 */
export async function verifyPayment(
    payload: VerifyPaymentPayload
): Promise<VerifyPaymentResponse> {
    const token = await getAuthToken();

    const res = await fetch(`${API_BASE}/api/payment/verify`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Payment verification failed');
    }

    return res.json();
}

// ---------------------------------------------------------------------------
// Razorpay Checkout Modal
// ---------------------------------------------------------------------------

interface CheckoutOptions {
    orderData: CreateOrderResponse;
    bookingMeta: {
        turfId: string;
        slots: string[];
        date: string;
        totalPrice: number;
    };
    userInfo?: { name?: string; email?: string; phone?: string };
    onSuccess: (bookingId: string) => void;
    onFailure: (error: string) => void;
}

/**
 * Open the Razorpay checkout modal and handle success/failure.
 *
 * Requires the Razorpay checkout.js script loaded in index.html:
 * <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
 */
export function openRazorpayCheckout({
    orderData,
    bookingMeta,
    userInfo,
    onSuccess,
    onFailure,
}: CheckoutOptions): void {
    if (typeof window.Razorpay === 'undefined') {
        onFailure('Razorpay SDK not loaded. Add the checkout.js script to index.html.');
        return;
    }

    const options: RazorpayOptions = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'BookMyTurf',
        description: `Turf Booking — ${bookingMeta.slots.length} slot(s)`,
        order_id: orderData.orderId,
        handler: async (response: RazorpaySuccessResponse) => {
            try {
                const result = await verifyPayment({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    bookingData: {
                        turfId: bookingMeta.turfId,
                        slots: bookingMeta.slots,
                        date: bookingMeta.date,
                        totalPrice: bookingMeta.totalPrice,
                        receipt: orderData.receipt,
                    },
                });

                onSuccess(result.bookingId);
            } catch (err) {
                onFailure(err instanceof Error ? err.message : 'Payment verification failed');
            }
        },
        prefill: {
            name: userInfo?.name || '',
            email: userInfo?.email || '',
            contact: userInfo?.phone || '',
        },
        theme: { color: '#4F46E5' },
        modal: {
            ondismiss: () => {
                onFailure('Payment cancelled by user');
            },
        },
    };

    const razorpay = new window.Razorpay(options);

    razorpay.on('payment.failed', (response: unknown) => {
        const errorDesc =
            (response as { error?: { description?: string } })?.error?.description ||
            'Payment failed';
        onFailure(errorDesc);
    });

    razorpay.open();
}
