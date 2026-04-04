/**
 * SmartRecommendation
 *
 * AI-powered slot suggestion card. Calls the backend recommendation
 * endpoint, caches the result in sessionStorage, and renders a
 * premium dark card with the suggested slot details.
 *
 * Display rules:
 * - Only renders when user is logged in (check externally or via useAuth)
 * - Only shows content when user has 3+ past bookings
 * - Shows skeleton while loading
 * - Caches in sessionStorage to avoid re-fetching every render
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/services/firebase';
import styles from './SmartRecommendation.module.css';

// ── Types ─────────────────────────────────────────────────────────────────

interface RecommendedSlot {
  turfId: string;
  turfName: string;
  turfCity: string;
  turfAddress: string;
  date: string;
  time: string;
  price: number;
  sport: string;
  reason: string;
}

interface RecommendationData {
  success: boolean;
  reason?: string;
  message?: string;
  bookingCount?: number;
  recommendedSlot?: RecommendedSlot;
  pattern?: string;
  confidence?: number;
  userPatterns?: {
    preferredDay: string;
    preferredTime: string;
    preferredSport: string;
    preferredVenue: string;
  };
}

// ── Constants ─────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const CACHE_KEY = 'turfhub_smart_recommendation';
const CITY_STORAGE_KEY = 'turfhub_header_selected_city';

// ── Helpers ───────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr: string): string {
  try {
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const endH = h + 1;
    const endPeriod = endH >= 12 ? 'PM' : 'AM';
    const endHour12 = endH === 0 ? 12 : endH > 12 ? endH - 12 : endH;
    return `${hour12}:${String(m).padStart(2, '0')} ${period} — ${endHour12}:${String(m).padStart(2, '0')} ${endPeriod}`;
  } catch {
    return timeStr;
  }
}

// ── Component ─────────────────────────────────────────────────────────────

export function SmartRecommendation() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<RecommendationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendation = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Check sessionStorage cache first
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as RecommendationData;
        setData(parsed);
        setLoading(false);
        return;
      }
    } catch {
      // cache miss — continue to fetch
    }

    try {
      setLoading(true);
      setError(null);

      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const city = localStorage.getItem(CITY_STORAGE_KEY)?.trim() || '';

      const response = await fetch(`${API_BASE}/api/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ city }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result: RecommendationData = await response.json();

      // Cache in sessionStorage
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(result));
      } catch {
        // sessionStorage full — silently ignore
      }

      setData(result);
    } catch (err) {
      console.error('Smart recommendation fetch failed:', err);
      setError('Unable to load recommendation');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRecommendation();
  }, [fetchRecommendation]);

  // ── Don't render if user is not logged in ──
  if (!user) return null;

  // ── Skeleton loader ──
  if (loading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.skeleton} id="smart-recommendation-skeleton">
          <div className={styles.skeletonHeader} />
          <div className={styles.skeletonBody} />
          <div className={styles.skeletonDetail} />
          <div className={styles.skeletonDetail} />
          <div className={styles.skeletonDetail} />
          <div className={styles.skeletonButton} />
        </div>
      </div>
    );
  }

  // ── Error state (subtle, doesn't break page) ──
  if (error) {
    return null; // Silently hide on error — don't break the home page
  }

  // ── Not enough bookings or no recommendation ──
  if (!data || !data.success || !data.recommendedSlot) {
    return null;
  }

  const slot = data.recommendedSlot;
  const confidence = Math.round((data.confidence || 0) * 100);

  const handleBookClick = () => {
    // Navigate to turf detail page with date/time pre-selected via query params
    const params = new URLSearchParams({
      date: slot.date,
      time: slot.time,
    });
    navigate(`/turf/${slot.turfId}?${params.toString()}`);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card} id="smart-recommendation-card">
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.aiIcon}>🤖</span>
          <div className={styles.headerText}>
            <h3>Smart Pick for You</h3>
            <span className={styles.badge}>AI-powered · Personalized</span>
          </div>
        </div>

        {/* Pattern description */}
        {data.pattern && (
          <p className={styles.pattern}>{data.pattern}</p>
        )}

        {/* Slot details */}
        <div className={styles.details}>
          <div className={styles.detailRow}>
            <span className={styles.detailIcon}>📍</span>
            <span className={styles.detailValue}>
              {slot.turfName}
              {slot.turfCity ? `, ${slot.turfCity}` : ''}
            </span>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.detailIcon}>📅</span>
            <span className={styles.detailValue}>{formatDate(slot.date)}</span>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.detailIcon}>⏰</span>
            <span className={styles.detailValue}>{formatTime(slot.time)}</span>
          </div>

          {slot.price > 0 && (
            <div className={styles.detailRow}>
              <span className={styles.detailIcon}>💰</span>
              <span className={styles.priceValue}>₹{slot.price}</span>
            </div>
          )}
        </div>

        {/* Confidence meter */}
        {confidence > 0 && (
          <div className={styles.confidenceBar}>
            <span className={styles.confidenceLabel}>Match confidence</span>
            <div className={styles.confidenceTrack}>
              <div
                className={styles.confidenceFill}
                style={{ width: `${confidence}%` }}
              />
            </div>
            <span className={styles.confidencePercent}>{confidence}%</span>
          </div>
        )}

        {/* Reason */}
        {slot.reason && (
          <p className={styles.pattern} style={{ marginBottom: '20px', fontStyle: 'italic' }}>
            💡 {slot.reason}
          </p>
        )}

        {/* CTA */}
        <button
          className={styles.cta}
          onClick={handleBookClick}
          id="smart-recommendation-book-btn"
        >
          Book This Slot
          <span className={styles.ctaArrow}>→</span>
        </button>
      </div>
    </div>
  );
}
