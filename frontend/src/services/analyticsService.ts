/**
 * Analytics Service
 *
 * Centralized Firebase Analytics event tracking.
 * Only initializes if the user has accepted cookies.
 */

import { Analytics, getAnalytics, logEvent } from 'firebase/analytics';
import { app } from './firebase';

let analytics: Analytics | null = null;

/**
 * Get or initialize analytics (only if consent was given).
 */
function getAnalyticsInstance(): Analytics | null {
    if (analytics) return analytics;

    const consent = localStorage.getItem('cookie_consent');
    if (consent !== 'accepted') return null;

    try {
        analytics = getAnalytics(app);
        return analytics;
    } catch {
        return null;
    }
}

/**
 * Safely log an analytics event (no-op if analytics disabled).
 */
function safeLogEvent(eventName: string, params?: Record<string, unknown>) {
    const instance = getAnalyticsInstance();
    if (instance) {
        logEvent(instance, eventName, params);
    }
}

/**
 * Pre-built event trackers for key user actions.
 */
export const trackEvent = {
    /** User viewed a turf detail page */
    turfViewed: (turfId: string, turfName: string) =>
        safeLogEvent('turf_viewed', { turfId, turfName }),

    /** User selected one or more time slots */
    slotSelected: (turfId: string, slots: string[]) =>
        safeLogEvent('slot_selected', { turfId, slotCount: slots.length }),

    /** User clicked "Pay" — beginning checkout */
    bookingStarted: (turfId: string, amount: number) =>
        safeLogEvent('begin_checkout', { turfId, value: amount, currency: 'INR' }),

    /** Payment succeeded, booking confirmed */
    bookingCompleted: (bookingId: string, amount: number, turfId: string) =>
        safeLogEvent('purchase', {
            transaction_id: bookingId,
            value: amount,
            currency: 'INR',
            items: [{ item_id: turfId }],
        }),

    /** Payment failed or errored */
    bookingFailed: (reason: string) =>
        safeLogEvent('booking_failed', { reason }),

    /** User performed a search */
    searchPerformed: (query: string, city: string) =>
        safeLogEvent('search', { search_term: query, city }),

    /** User applied a filter */
    filterApplied: (filterType: string, value: string) =>
        safeLogEvent('filter_applied', { filterType, value }),

    /** User submitted the contact form */
    contactFormSubmitted: () =>
        safeLogEvent('contact_form_submitted'),

    /** User submitted a bug report */
    bugReportSubmitted: () =>
        safeLogEvent('bug_report_submitted'),

    /** User left a review */
    reviewSubmitted: (turfId: string, rating: number) =>
        safeLogEvent('review_submitted', { turfId, rating }),
};
