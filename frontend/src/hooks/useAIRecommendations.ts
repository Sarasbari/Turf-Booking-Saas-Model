/**
 * useAIRecommendations — Client-side slot recommendation engine.
 *
 * Reads from Firestore:
 *   - `turf`        → all active turfs
 *   - `bookings`    → current user's past bookings (preference learning)
 *   - `blockedSlots` → currently blocked/busy slots for today
 *
 * Scoring algorithm (pure TypeScript — no external AI API):
 *   1. Slots with fewer blockedSlots/bookings → higher availability score
 *   2. Slots matching user's past booking times → familiarity boost
 *   3. Price in ₹300–₹800 "sweet spot" range → priority boost
 *   4. Evening slots (17:00–20:00) → slight preference boost
 *
 * Returns top 3 recommendations sorted by composite score.
 */

import { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    getDocs,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

// ── Types ────────────────────────────────────────────────────────────────────

export interface Recommendation {
    turfId: string;
    turfName: string;
    sport: string;
    recommendedSlot: string;   // "18:00"
    slotLabel: string;         // "6:00 PM – 7:00 PM"
    pricePerHour: number;
    reason: string;
    availabilityScore: number; // 0–100
    turfImage?: string;
}

interface UseAIRecommendationsReturn {
    recommendations: Recommendation[];
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Format 24h hour number to "h:00 AM/PM" string. */
function formatHour(hour: number): string {
    const normalized = ((hour % 24) + 24) % 24;
    const period = normalized >= 12 ? 'PM' : 'AM';
    const h = normalized % 12 || 12;
    return `${h}:00 ${period}`;
}

/** Build the readable slot label: "6:00 PM – 7:00 PM" */
function buildSlotLabel(hour: number): string {
    return `${formatHour(hour)} – ${formatHour(hour + 1)}`;
}

/** Today's date as YYYY-MM-DD */
function todayStr(): string {
    return new Date().toISOString().split('T')[0];
}

// Sport icon map used in the component
export const SPORT_ICONS: Record<string, string> = {
    Cricket: '🏏',
    Football: '⚽',
    Volleyball: '🏐',
    Basketball: '🏀',
    Tennis: '🎾',
    Badminton: '🏸',
};

// ── Reasons pool ─────────────────────────────────────────────────────────────

const REASONS = {
    lowCrowd: 'Less crowded — grab it before someone else does',
    sweetSpot: 'Great value in the sweet-spot price range',
    eveningPeak: 'Popular evening slot with openings today',
    matchesHistory: 'Matches your usual booking time',
    highAvail: 'Wide open — maximum availability right now',
    budgetFriendly: 'Budget-friendly option for today',
    locationMatch: 'Top rated in your selected city',
    sportMatch: 'Perfect venue for your favorite sport',
    trendingTurf: 'Highly popular trending turf right now',
} as const;

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAIRecommendations(): UseAIRecommendationsReturn {
    const { user } = useAuth();
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const refresh = () => setRefreshKey((k) => k + 1);

    useEffect(() => {
        let cancelled = false;

        async function compute() {
            setLoading(true);
            setError(null);

            try {
                const selectedCity = localStorage.getItem('turfhub_header_selected_city')?.trim().toLowerCase() || '';

                // ── 1. Fetch all turfs ──────────────────────────────────────
                const turfsSnap = await getDocs(collection(db, 'turf'));
                const turfs: Array<{
                    id: string;
                    name: string;
                    city: string;
                    sport: string;
                    pricePerHour: number;
                    openTime: string;
                    closeTime: string;
                    image?: string;
                    isActive: boolean;
                    totalBookings: number;
                }> = [];

                turfsSnap.forEach((docSnap) => {
                    const d = docSnap.data();
                    turfs.push({
                        id: docSnap.id,
                        name: d.name || 'Unnamed Turf',
                        city: (d.city || '').toLowerCase(),
                        sport: d.sport || d.sports?.[0] || 'Football',
                        pricePerHour: Number(d.pricePerHour || d.pricing?.basePrice || 0),
                        openTime: d.openTime || d.operatingHours?.opensAt || '06:00',
                        closeTime: d.closeTime || d.operatingHours?.closesAt || '22:00',
                        image: d.images?.[0] || d.coverImage || undefined,
                        isActive: d.isActive !== false,
                        totalBookings: Number(d.totalBookings || 0),
                    });
                });

                const activeTurfs = turfs.filter((t) => t.isActive && t.pricePerHour > 0);
                if (activeTurfs.length === 0) {
                    if (!cancelled) {
                        setRecommendations([]);
                        setLoading(false);
                    }
                    return;
                }

                // Map: turfId → Set of booked hour strings ("18:00")
                const bookedByTurf = new Map<string, Set<string>>();
                
                // Note: We cannot query ALL bookings due to Firestore security rules.
                // We rely on blockedSlots and the user's personal booking history.

                // ── 2. Fetch today's blocked slots ──────────────────────────
                const today = todayStr();
                const blockedQ = query(
                    collection(db, 'blockedSlots'),
                    where('date', '==', today)
                );
                const blockedSnap = await getDocs(blockedQ);
                const blockedByTurf = new Map<string, Set<string>>();
                blockedSnap.forEach((docSnap) => {
                    const d = docSnap.data();
                    const tid = d.turfId as string;
                    if (!blockedByTurf.has(tid)) blockedByTurf.set(tid, new Set());
                    blockedByTurf.get(tid)!.add(d.slot || d.startTime || '');
                });

                // ── 3. Fetch user's past booking times & activity ───────────
                const userSlotFrequency = new Map<number, number>(); // hour → count
                const userSportFrequency = new Map<string, number>(); // sport → count

                if (user?.uid) {
                    const userBookingsQ = query(
                        collection(db, 'bookings'),
                        where('userId', '==', user.uid),
                        where('status', '==', 'confirmed')
                    );
                    const userBookingsSnap = await getDocs(userBookingsQ);
                    userBookingsSnap.forEach((docSnap) => {
                        const d = docSnap.data();
                        
                        // Tally preferred times
                        if (Array.isArray(d.timeSlots)) {
                            d.timeSlots.forEach((s: string) => {
                                const h = parseInt(s.split(':')[0], 10);
                                if (!isNaN(h)) {
                                    userSlotFrequency.set(h, (userSlotFrequency.get(h) || 0) + 1);
                                }
                            });
                        }
                        
                        // Tally preferred sport/activity
                        const tsport = (d.sport || '').toLowerCase();
                        if (tsport) {
                            userSportFrequency.set(tsport, (userSportFrequency.get(tsport) || 0) + 1);
                        }
                    });
                }

                // Determine top favorite sport
                let topSport = '';
                let maxSportCount = 0;
                userSportFrequency.forEach((count, sport) => {
                    if (count > maxSportCount) {
                        maxSportCount = count;
                        topSport = sport;
                    }
                });

                // ── 4. Score every (turf, slot) pair ────────────────────────
                const candidates: Array<Recommendation & { _score: number }> = [];

                for (const turf of activeTurfs) {
                    const openH = parseInt(turf.openTime.split(':')[0], 10) || 6;
                    const closeH = parseInt(turf.closeTime.split(':')[0], 10) || 22;
                    const booked = bookedByTurf.get(turf.id) || new Set<string>();
                    const blocked = blockedByTurf.get(turf.id) || new Set<string>();
                    const totalSlots = closeH - openH;

                    for (let h = openH; h < closeH; h++) {
                        const slotKey = `${h.toString().padStart(2, '0')}:00`;

                        // Skip already booked or blocked
                        if (booked.has(slotKey) || blocked.has(slotKey)) continue;

                        // --- Scoring ---
                        let score = 50; // base
                        let reason: string = REASONS.highAvail;

                        // a) Availability: fewer booked slots on this turf = higher score
                        const occupancy = booked.size / Math.max(totalSlots, 1);
                        const availScore = Math.round((1 - occupancy) * 100);
                        score += availScore * 0.3;
                        if (availScore > 80) reason = REASONS.highAvail;
                        if (availScore > 60 && availScore <= 80) reason = REASONS.lowCrowd;

                        // b) User preference: boost if user frequently books this hour
                        const freq = userSlotFrequency.get(h) || 0;
                        if (freq > 0) {
                            score += Math.min(freq * 8, 25);
                            reason = REASONS.matchesHistory;
                        }

                        // c) Location Match: highly prioritize turfs in user's active city
                        let locationBoost = 0;
                        if (selectedCity && turf.city.includes(selectedCity)) {
                            locationBoost = 30;
                            score += locationBoost;
                            reason = REASONS.locationMatch;
                        }

                        // d) Sport Match: prioritize user's most booked sport
                        let sportBoost = 0;
                        if (topSport && turf.sport.toLowerCase().includes(topSport)) {
                            sportBoost = 25;
                            score += sportBoost;
                            if (locationBoost === 0 || sportBoost > 20) reason = REASONS.sportMatch;
                        }

                        // e) Trending/Popularity: boost turfs with high totalBookings
                        let trendingBoost = 0;
                        if (turf.totalBookings > 5) {
                            trendingBoost = Math.min((turf.totalBookings / 100) * 15, 15);
                            score += trendingBoost;
                            if (trendingBoost >= 10 && locationBoost === 0 && sportBoost === 0) {
                                reason = REASONS.trendingTurf;
                            }
                        }

                        // f) Price sweet-spot: ₹300–₹800
                        let priceBoost = 0;
                        if (turf.pricePerHour >= 300 && turf.pricePerHour <= 800) {
                            priceBoost = 15;
                            score += priceBoost;
                            if (score < 80) reason = REASONS.sweetSpot;
                        }
                        if (turf.pricePerHour < 300) {
                            priceBoost = 8;
                            score += priceBoost;
                            if (score < 80 && availScore <= 60) reason = REASONS.budgetFriendly;
                        }

                        // g) Evening preference (17:00–20:00)
                        if (h >= 17 && h <= 20) {
                            score += 10;
                            if (score < 85 && availScore > 60) reason = REASONS.eveningPeak;
                        }

                        // h) Slight recency: current-hour proximity bonus
                        const nowH = new Date().getHours();
                        if (h > nowH && h <= nowH + 4) {
                            score += 5; // upcoming slots get a nudge
                        }
                        // Skip past slots
                        if (h < nowH) continue;

                        candidates.push({
                            turfId: turf.id,
                            turfName: turf.name,
                            sport: turf.sport,
                            recommendedSlot: slotKey,
                            slotLabel: buildSlotLabel(h),
                            pricePerHour: turf.pricePerHour,
                            reason,
                            availabilityScore: availScore,
                            turfImage: turf.image,
                            _score: score,
                        });
                    }
                }

                // ── 5. Sort and take top 3 (dedupe by turfId for variety) ───
                candidates.sort((a, b) => b._score - a._score);

                const seen = new Set<string>();
                const top: Recommendation[] = [];
                for (const c of candidates) {
                    if (seen.has(c.turfId)) continue;
                    seen.add(c.turfId);
                    // Strip internal _score before returning
                    const { _score, ...rec } = c;
                    top.push(rec);
                    if (top.length >= 3) break;
                }

                if (!cancelled) {
                    setRecommendations(top);
                    setLoading(false);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error('❌ useAIRecommendations error:', err);
                    setError('Unable to load recommendations');
                    setLoading(false);
                }
            }
        }

        compute();
        return () => {
            cancelled = true;
        };
    }, [user?.uid, refreshKey]);

    return { recommendations, loading, error, refresh };
}
