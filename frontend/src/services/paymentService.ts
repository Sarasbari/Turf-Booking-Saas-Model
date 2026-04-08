/**
 * Payment Service — Frontend
 *
 * Handles communication with the backend payment API and
 * opens the Razorpay checkout modal.
 *
 * Security: The Razorpay key secret NEVER appears here.
 * Only VITE_RAZORPAY_KEY_ID is used (public key).
 *
 * Slot Locking:
 *   - createOrder() relies strictly on Razorpay order creation (Layer 2 locking removed)
 *   - 409 responses are handled gracefully (SLOT_LOCKED, SLOT_CONFIRMED)
 *   - verify() 409 responses indicate SLOT_TAKEN (refund scenario)
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

/** Successful create-order response */
interface CreateOrderSuccess {
    success: true;
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

/** Failed create-order response (409 Conflict — slot unavailable) */
interface CreateOrderConflict {
    success: false;
    error: 'SLOT_LOCKED' | 'SLOT_CONFIRMED';
    slot: string;
    message: string;
}

type CreateOrderResponse = CreateOrderSuccess | CreateOrderConflict;

/**
 * All fields sent to /api/payment/verify.
 * The backend uses these to write the booking document to Firestore
 * and send the confirmation email — without any secondary DB reads.
 */
interface VerifyPaymentPayload {
    // Razorpay fields
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    // Turf details (denormalized — backend stores these in the booking doc)
    turfId: string;
    turfName: string;
    turfAddress: string;
    turfImage: string;
    ownerContact: string;
    // Booking details
    bookedDate: string;       // 'YYYY-MM-DD'
    timeSlots: string[];      // ['06:00', '07:00']
    totalPrice: number;
    sport: string;
    groundId: string;
    // User info (from Firebase auth state)
    userEmail: string;
    userName: string;
}

interface VerifyPaymentSuccess {
    success: true;
    bookingId: string;
    message: string;
}

interface VerifyPaymentConflict {
    success: false;
    error: 'SLOT_TAKEN';
    message: string;
}

type VerifyPaymentResponse = VerifyPaymentSuccess | VerifyPaymentConflict;

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

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

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
 *
 * Does NOT throw on 409 — returns the error response for the caller to handle.
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

    // Handle 409 Conflict gracefully (slot locked/confirmed by another user)
    if (res.status === 409) {
        const data = await res.json().catch(() => ({
            success: false as const,
            error: 'SLOT_LOCKED' as const,
            slot: '',
            message: 'Slot is temporarily unavailable',
        }));
        return data as CreateOrderConflict;
    }

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create payment order');
    }

    return res.json();
}

/**
 * Verify payment signature via backend.
 * On success the backend creates the confirmed booking in Firestore via Admin SDK.
 *
 * Does NOT throw on 409 — returns the SLOT_TAKEN response for the caller to handle.
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

    // Handle 409 Conflict gracefully (slot taken during payment)
    if (res.status === 409) {
        const data = await res.json().catch(() => ({
            success: false as const,
            error: 'SLOT_TAKEN' as const,
            message: 'Slot was taken while your payment was processing.',
        }));
        return data as VerifyPaymentConflict;
    }

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
    orderData: CreateOrderSuccess;
    bookingMeta: {
        // Core booking fields
        turfId: string;
        slots: string[];       // ['06:00', '07:00']
        date: string;          // 'YYYY-MM-DD'
        totalPrice: number;
        // Turf details for backend booking document + email
        turfName: string;
        turfAddress: string;
        turfImage: string;
        ownerContact: string;
        // User details for backend booking document + email
        userEmail: string;
        userName: string;
        // Booking metadata
        sport: string;
        groundId: string;
    };
    userInfo?: { name?: string; email?: string; phone?: string };
    onSuccess: (bookingId: string) => void;
    onFailure: (error: string) => void;
    onSlotTaken?: (message: string) => void;
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
    onSlotTaken,
}: CheckoutOptions): void {
    if (typeof window.Razorpay === 'undefined') {
        onFailure('Razorpay SDK not loaded. Add the checkout.js script to index.html.');
        return;
    }

    const options: RazorpayOptions = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'aLiveHub',
        description: `Turf Booking — ${bookingMeta.slots.length} slot(s)`,
        order_id: orderData.orderId,
        handler: async (response: RazorpaySuccessResponse) => {
            try {
                const result = await verifyPayment({
                    // Razorpay fields
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    // Turf details — backend uses these for Firestore + email
                    turfId: bookingMeta.turfId,
                    turfName: bookingMeta.turfName,
                    turfAddress: bookingMeta.turfAddress,
                    turfImage: bookingMeta.turfImage,
                    ownerContact: bookingMeta.ownerContact,
                    // Booking details
                    bookedDate: bookingMeta.date,
                    timeSlots: bookingMeta.slots,
                    totalPrice: bookingMeta.totalPrice,
                    sport: bookingMeta.sport,
                    groundId: bookingMeta.groundId,
                    // User info
                    userEmail: bookingMeta.userEmail,
                    userName: bookingMeta.userName,
                });

                if (!result.success) {
                    // SLOT_TAKEN — payment went through but slot was taken
                    const msg = result.message || 'Slot was booked by another user. Your payment will be refunded.';
                    if (onSlotTaken) {
                        onSlotTaken(msg);
                    } else {
                        onFailure(msg);
                    }
                    return;
                }

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
        theme: { color: '#16a34a' },
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
