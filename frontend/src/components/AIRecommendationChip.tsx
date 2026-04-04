/**
 * AIRecommendationChip — Floating "AI Pick" pill that expands into a
 * recommendation card showing the top 3 personalized slot suggestions.
 *
 * Placement: fixed bottom-right, z-50. Renders as a portal so it's
 * independent of any page layout.
 *
 * States:
 *   1. Collapsed — gradient pill "✨ AI Pick for you" with pulse animation
 *   2. Expanded  — 320px card with recommendation cards + close button
 *   3. Loading   — shimmer skeleton cards
 *
 * Interactions:
 *   - Click pill → expand
 *   - Click outside / Escape / ✕ → collapse
 *   - Auto-expand once on first visit (localStorage: bmt_ai_chip_seen)
 *   - [Book This Slot] → navigate to /turf/:id?date=...&slot=...
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    useAIRecommendations,
    SPORT_ICONS,
    type Recommendation,
} from '@/hooks/useAIRecommendations';

// ── Component ────────────────────────────────────────────────────────────────

export function AIRecommendationChip() {
    const navigate = useNavigate();
    const { recommendations, loading, error, refresh } = useAIRecommendations();
    const [isExpanded, setIsExpanded] = useState(false);
    const chipRef = useRef<HTMLDivElement>(null);

    // ── Auto-expand on first visit ───────────────────────────────────────
    useEffect(() => {
        const seen = localStorage.getItem('bmt_ai_chip_seen');
        if (!seen) {
            const timer = setTimeout(() => {
                setIsExpanded(true);
                localStorage.setItem('bmt_ai_chip_seen', '1');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    // ── Close on outside click ───────────────────────────────────────────
    useEffect(() => {
        if (!isExpanded) return;
        function handleClick(e: MouseEvent) {
            if (chipRef.current && !chipRef.current.contains(e.target as Node)) {
                setIsExpanded(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isExpanded]);

    // ── Close on Escape ──────────────────────────────────────────────────
    useEffect(() => {
        if (!isExpanded) return;
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setIsExpanded(false);
        }
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isExpanded]);

    // ── Book handler ─────────────────────────────────────────────────────
    const handleBook = useCallback(
        (rec: Recommendation) => {
            const today = new Date().toISOString().split('T')[0];
            navigate(`/turf/${rec.turfId}?date=${today}&slot=${rec.recommendedSlot}`);
            setIsExpanded(false);
        },
        [navigate]
    );

    // Don't render if there's an error and no data
    if (error && recommendations.length === 0 && !loading) return null;

    return (
        <div
            ref={chipRef}
            className="fixed bottom-6 right-6 z-50 flex flex-col items-end"
            style={{ maxWidth: '340px' }}
        >
            {/* ── Expanded Card ─────────────────────────────────────── */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="mb-3 w-80 rounded-2xl border border-slate-100 bg-white shadow-2xl overflow-hidden dark:border-slate-700 dark:bg-slate-900"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 pt-4 pb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">✨</span>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    AI Picks for You
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                                aria-label="Close recommendations"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M18 6 6 18" />
                                    <path d="m6 6 12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="px-4 pb-4 space-y-2.5 max-h-[380px] overflow-y-auto">
                            {loading ? (
                                <SkeletonCards />
                            ) : recommendations.length === 0 ? (
                                <div className="flex flex-col items-center py-6 text-center">
                                    <span className="text-3xl mb-2">🔍</span>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        No recommendations available right now.
                                    </p>
                                    <button
                                        onClick={refresh}
                                        className="mt-3 text-xs font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400"
                                    >
                                        Refresh
                                    </button>
                                </div>
                            ) : (
                                recommendations.map((rec, i) => (
                                    <RecommendationCard
                                        key={`${rec.turfId}-${rec.recommendedSlot}`}
                                        rec={rec}
                                        index={i}
                                        onBook={handleBook}
                                    />
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Collapsed Pill ─────────────────────────────────────── */}
            <button
                onClick={() => {
                    setIsExpanded((prev) => !prev);
                    if (!localStorage.getItem('bmt_ai_chip_seen')) {
                        localStorage.setItem('bmt_ai_chip_seen', '1');
                    }
                }}
                className={`
                    group relative flex items-center gap-2 rounded-full
                    bg-gradient-to-r from-orange-500 to-amber-500
                    px-5 py-3 text-sm font-semibold text-white
                    shadow-lg shadow-orange-500/25
                    transition-all duration-300
                    hover:shadow-xl hover:shadow-orange-500/30 hover:scale-[1.03]
                    active:scale-[0.98]
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2
                    ${!isExpanded ? 'animate-[ai-pulse_2.5s_ease-in-out_infinite]' : ''}
                `}
                aria-label={isExpanded ? 'Close AI recommendations' : 'Show AI recommendations'}
                aria-expanded={isExpanded}
            >
                <span className="text-base transition-transform group-hover:scale-110">✨</span>
                <span>AI Pick for you</span>

                {/* Notification dot when there are recommendations */}
                {recommendations.length > 0 && !isExpanded && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[9px] font-bold text-amber-900">
                            {recommendations.length}
                        </span>
                    </span>
                )}
            </button>
        </div>
    );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function RecommendationCard({
    rec,
    index,
    onBook,
}: {
    rec: Recommendation;
    index: number;
    onBook: (rec: Recommendation) => void;
}) {
    const sportIcon = SPORT_ICONS[rec.sport] || '⚽';

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08, duration: 0.2 }}
            className="group rounded-xl border border-slate-100 bg-slate-50/60 p-3 transition-colors hover:border-orange-200 hover:bg-orange-50/40 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-orange-500/30 dark:hover:bg-slate-800"
        >
            {/* Top row: turf name + sport */}
            <div className="flex items-start justify-between gap-2 mb-1.5">
                <h4 className="text-[13px] font-semibold text-slate-800 leading-tight line-clamp-1 dark:text-slate-100">
                    {sportIcon} {rec.turfName}
                </h4>
                <span className="shrink-0 rounded-md bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700 dark:bg-orange-500/20 dark:text-orange-300">
                    {rec.sport}
                </span>
            </div>

            {/* Slot time */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 mb-1">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-amber-500"
                >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span className="font-medium">{rec.slotLabel}</span>
            </div>

            {/* Price + availability */}
            <div className="flex items-center gap-3 mb-1.5">
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{rec.pricePerHour.toLocaleString('en-IN')}/hr
                </span>
                <div className="flex items-center gap-1">
                    <div className="h-1.5 w-12 rounded-full bg-slate-200 overflow-hidden dark:bg-slate-700">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                            style={{ width: `${rec.availabilityScore}%` }}
                        />
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {rec.availabilityScore}% open
                    </span>
                </div>
            </div>

            {/* Reason */}
            <p className="text-[11px] italic text-slate-400 mb-2.5 leading-relaxed dark:text-slate-500">
                📊 {rec.reason}
            </p>

            {/* Book button */}
            <button
                onClick={() => onBook(rec)}
                className="w-full rounded-lg bg-orange-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-700 active:bg-orange-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 dark:bg-orange-500 dark:hover:bg-orange-600"
            >
                Book This Slot →
            </button>
        </motion.div>
    );
}

function SkeletonCards() {
    return (
        <>
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 space-y-2.5 dark:border-slate-700 dark:bg-slate-800/60"
                >
                    {/* Title skeleton */}
                    <div className="flex items-center justify-between">
                        <div className="h-3.5 w-36 animate-pulse rounded-md bg-slate-200 dark:bg-slate-700" />
                        <div className="h-4 w-14 animate-pulse rounded-md bg-slate-200 dark:bg-slate-700" />
                    </div>
                    {/* Slot skeleton */}
                    <div className="h-3 w-32 animate-pulse rounded-md bg-slate-200 dark:bg-slate-700" />
                    {/* Price skeleton */}
                    <div className="flex items-center gap-3">
                        <div className="h-4 w-16 animate-pulse rounded-md bg-slate-200 dark:bg-slate-700" />
                        <div className="h-2 w-16 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
                    </div>
                    {/* Reason skeleton */}
                    <div className="h-2.5 w-full animate-pulse rounded-md bg-slate-200 dark:bg-slate-700" />
                    {/* Button skeleton */}
                    <div className="h-8 w-full animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
                </div>
            ))}
        </>
    );
}

export default AIRecommendationChip;
