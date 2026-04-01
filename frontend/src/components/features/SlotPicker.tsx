/**
 * SlotPicker — Real-time time-slot selection component.
 *
 * Displays 1-hour time slots from 06:00 to 23:00 with live Firestore
 * data indicating which slots are already booked. Supports multi-slot
 * selection with a non-consecutive warning, price preview, and
 * real-time "being viewed" indicators via slot blocking.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useBookedSlots } from '../../hooks/useBookedSlots';
import { useSlotBlocking } from '../../hooks/useSlotBlocking';
import { useAuth } from '../../hooks/useAuth';
import SlotCountdown from './SlotCountdown';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SlotPickerProps {
    turfId: string;
    selectedDate: string;
    onSlotsSelected: (slots: string[]) => void;
}

type SlotStatus = 'available' | 'booked' | 'viewing' | 'selected';

interface SlotInfo {
    time: string;       // e.g. "06:00"
    label: string;      // e.g. "06:00 – 07:00"
    status: SlotStatus;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate time-slot strings from 06:00 to 22:00 (17 one-hour blocks). */
function generateTimeSlots(): string[] {
    const slots: string[] = [];
    for (let hour = 6; hour <= 22; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
}

/** Format "HH:00" → "HH:00 – (HH+1):00" */
function formatSlotLabel(time: string): string {
    const hour = parseInt(time.split(':')[0], 10);
    const nextHour = hour + 1;
    return `${time} – ${nextHour.toString().padStart(2, '0')}:00`;
}

/** Check whether a list of time-slot strings are consecutive hours. */
function areSlotsConsecutive(slots: string[]): boolean {
    if (slots.length <= 1) return true;
    const hours = slots
        .map((s) => parseInt(s.split(':')[0], 10))
        .sort((a, b) => a - b);
    for (let i = 1; i < hours.length; i++) {
        if (hours[i] !== hours[i - 1] + 1) return false;
    }
    return true;
}

const ALL_SLOTS = generateTimeSlots();

// ---------------------------------------------------------------------------
// Toast helper (lightweight inline toast for slot expiry)
// ---------------------------------------------------------------------------

function useSlotToast() {
    const [toast, setToast] = useState<string | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout>>();

    const showToast = useCallback((message: string) => {
        setToast(message);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setToast(null), 4000);
    }, []);

    useEffect(() => () => {
        if (timerRef.current) clearTimeout(timerRef.current);
    }, []);

    return { toast, showToast };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SlotPicker: React.FC<SlotPickerProps> = ({
    turfId,
    selectedDate,
    onSlotsSelected,
}) => {
    const { user } = useAuth();

    // --- Real-time booked slots via custom hook ---
    const { bookedSlots, loading, error } = useBookedSlots(turfId, selectedDate);

    // --- Real-time slot blocking ---
    const {
        blockSlot,
        unblockSlot,
        isSlotBlockedByOther,
        getBlockExpiry,
        loading: blockingLoading,
    } = useSlotBlocking(turfId, selectedDate);

    // --- Local selection state ---
    const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
    const [pricePerHour, setPricePerHour] = useState<number>(0);
    const [priceLoading, setPriceLoading] = useState<boolean>(true);

    // --- Toast for slot expiry ---
    const { toast, showToast } = useSlotToast();

    // Reset selection when date/turf changes
    useEffect(() => {
        setSelectedSlots([]);
    }, [turfId, selectedDate]);

    // Propagate selection changes upward
    useEffect(() => {
        onSlotsSelected(selectedSlots);
    }, [selectedSlots, onSlotsSelected]);

    // Fetch turf pricePerHour once
    useEffect(() => {
        let cancelled = false;

        async function fetchPrice() {
            setPriceLoading(true);
            try {
                const turfDoc = await getDoc(doc(db, 'turf', turfId));
                if (!cancelled && turfDoc.exists()) {
                    const data = turfDoc.data();
                    setPricePerHour(data.pricing?.basePrice ?? data.pricePerHour ?? 0);
                }
            } catch (err) {
                console.error('❌ Failed to fetch turf price:', err);
            } finally {
                if (!cancelled) setPriceLoading(false);
            }
        }

        if (turfId) fetchPrice();
        return () => { cancelled = true; };
    }, [turfId]);

    // --- Slot toggle handler ---
    const toggleSlot = useCallback(
        async (time: string) => {
            if (!user) return;

            setSelectedSlots((prev) => {
                if (prev.includes(time)) {
                    // Deselect → unblock
                    unblockSlot(time).catch(console.error);
                    return prev.filter((s) => s !== time);
                } else {
                    // Select → block
                    blockSlot(time).catch(console.error);
                    return [...prev, time];
                }
            });
        },
        [user, blockSlot, unblockSlot]
    );

    // --- Handle slot hold expiry ---
    const handleSlotExpired = useCallback(
        (time: string) => {
            setSelectedSlots((prev) => prev.filter((s) => s !== time));
            unblockSlot(time).catch(console.error);
            showToast('⏳ Your slot hold expired. Please reselect.');
        },
        [unblockSlot, showToast]
    );

    // --- Derived data ---
    const slots: SlotInfo[] = useMemo(() =>
        ALL_SLOTS.map((time) => {
            let status: SlotStatus;
            if (bookedSlots.has(time)) {
                status = 'booked';
            } else if (isSlotBlockedByOther(time)) {
                status = 'viewing';
            } else if (selectedSlots.includes(time)) {
                status = 'selected';
            } else {
                status = 'available';
            }
            return {
                time,
                label: formatSlotLabel(time),
                status,
            };
        }),
        [bookedSlots, selectedSlots, isSlotBlockedByOther]
    );

    const isNonConsecutive = useMemo(
        () => selectedSlots.length > 1 && !areSlotsConsecutive(selectedSlots),
        [selectedSlots]
    );

    const totalPrice = selectedSlots.length * pricePerHour;

    // --- Styles per state ---
    const statusClasses: Record<SlotStatus, string> = {
        available:
            'border-emerald-400/60 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/50 hover:border-emerald-400 cursor-pointer',
        booked:
            'border-red-500/40 bg-red-950/30 text-red-300 cursor-not-allowed opacity-70',
        viewing:
            'border-amber-500/50 bg-amber-950/30 text-amber-300 cursor-not-allowed opacity-75',
        selected:
            'border-indigo-400 bg-indigo-600/40 text-indigo-100 ring-2 ring-indigo-400/50 cursor-pointer',
    };

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    // Loading skeleton
    if (loading || blockingLoading) {
        return (
            <div className="w-full rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-950/90 p-6 backdrop-blur-md">
                <h3 className="mb-5 text-lg font-semibold text-white/90">
                    Select Time Slots
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {Array.from({ length: 17 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-16 animate-pulse rounded-xl border border-white/5 bg-white/5"
                        />
                    ))}
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="w-full rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-red-300 backdrop-blur-md">
                <p className="font-medium">⚠️ Unable to load slot availability</p>
                <p className="mt-1 text-sm text-red-400">{error}</p>
            </div>
        );
    }

    return (
        <div className="relative w-full rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-950/90 p-6 backdrop-blur-md">
            {/* Inline toast for slot expiry */}
            {toast && (
                <div className="absolute left-1/2 top-4 z-50 -translate-x-1/2 animate-pulse rounded-lg border border-amber-500/40 bg-amber-950/90 px-4 py-2 text-sm text-amber-200 shadow-lg backdrop-blur-sm">
                    {toast}
                </div>
            )}

            {/* Header */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-white/90">
                    Select Time Slots
                </h3>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 text-xs text-white/50">
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block h-3 w-3 rounded-sm border border-emerald-400/60 bg-emerald-950/40" />
                        Available
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block h-3 w-3 rounded-sm border border-red-500/40 bg-red-950/30" />
                        Booked
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block h-3 w-3 rounded-sm border border-amber-500/50 bg-amber-950/30" />
                        Being Viewed
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block h-3 w-3 rounded-sm border border-indigo-400 bg-indigo-600/40" />
                        Selected
                    </span>
                </div>
            </div>

            {/* Slot grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {slots.map(({ time, label, status }) => (
                    <button
                        key={time}
                        type="button"
                        disabled={status === 'booked' || status === 'viewing'}
                        onClick={() =>
                            status !== 'booked' &&
                            status !== 'viewing' &&
                            toggleSlot(time)
                        }
                        className={`
              flex flex-col items-center justify-center rounded-xl border px-3 py-3
              text-sm font-medium transition-all duration-200
              ${statusClasses[status]}
            `}
                    >
                        <span className="text-base font-semibold">{label}</span>

                        {status === 'booked' && (
                            <span className="mt-0.5 text-[10px] uppercase tracking-wider text-red-400">
                                Booked
                            </span>
                        )}

                        {status === 'viewing' && (
                            <span className="mt-0.5 flex items-center gap-1 text-[10px] uppercase tracking-wider text-amber-400/90">
                                <span>👁</span> Being viewed
                            </span>
                        )}

                        {status === 'selected' && (() => {
                            const expiry = getBlockExpiry(time);
                            return expiry ? (
                                <SlotCountdown
                                    expiresAt={expiry}
                                    onExpired={() => handleSlotExpired(time)}
                                />
                            ) : (
                                <span className="mt-0.5 text-[10px] uppercase tracking-wider text-indigo-300">
                                    Selected
                                </span>
                            );
                        })()}
                    </button>
                ))}
            </div>

            {/* Non-consecutive warning */}
            {isNonConsecutive && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-950/20 px-4 py-2.5 text-sm text-amber-300">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 flex-shrink-0"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <span>
                        You've selected <strong>non-consecutive</strong> time slots. Consider
                        selecting adjacent slots for a seamless session.
                    </span>
                </div>
            )}

            {/* Price preview */}
            {selectedSlots.length > 0 && (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-500/20 bg-indigo-950/20 px-5 py-4">
                    <div className="text-sm text-white/70">
                        <span className="font-medium text-indigo-300">
                            {selectedSlots.length}
                        </span>{' '}
                        slot{selectedSlots.length > 1 ? 's' : ''} selected
                        {!priceLoading && pricePerHour > 0 && (
                            <span className="ml-1 text-white/40">
                                × ₹{pricePerHour.toLocaleString('en-IN')}/hr
                            </span>
                        )}
                    </div>

                    <div className="text-xl font-bold text-white">
                        {priceLoading ? (
                            <span className="inline-block h-6 w-20 animate-pulse rounded bg-white/10" />
                        ) : (
                            <>₹{totalPrice.toLocaleString('en-IN')}</>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SlotPicker;
