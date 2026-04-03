/**
 * Recommendation Routes
 *
 * AI-powered slot recommendations using Groq (llama3-70b-8192).
 * Analyzes a user's past bookings and suggests the best upcoming slot.
 *
 * ┌───────────────────────────────────────┬──────────────────────────────────┐
 * │ Route                                 │ Description                      │
 * ├───────────────────────────────────────┼──────────────────────────────────┤
 * │ POST /api/recommendations             │ Get AI slot recommendation       │
 * └───────────────────────────────────────┴──────────────────────────────────┘
 */

import { Router } from 'express';
import Groq from 'groq-sdk';
import { firebaseAuth } from '../middleware/firebaseAuth.js';
import { adminDb } from '../config/firebaseAdmin.js';

const router = Router();

// ── Initialize Groq client (outside handler for cold-start perf) ──────────
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const TURF_COLLECTION = 'turf';
const BOOKINGS_COLLECTION = 'bookings';

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Get the next 7 days as YYYY-MM-DD strings (IST-aware).
 */
function getNext7Days() {
  const days = [];
  const now = new Date();
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

/**
 * Day-of-week name from a YYYY-MM-DD string.
 */
function getDayName(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-IN', {
    weekday: 'long',
  });
}

/**
 * Extract user booking patterns from their history.
 */
function extractPatterns(bookings) {
  const dayCounts = {};
  const timeCounts = {};
  const sportCounts = {};
  const locationCounts = {};

  for (const b of bookings) {
    // Day preference
    if (b.bookedDate) {
      const day = getDayName(b.bookedDate);
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    }

    // Time preference
    if (Array.isArray(b.timeSlots)) {
      for (const slot of b.timeSlots) {
        timeCounts[slot] = (timeCounts[slot] || 0) + 1;
      }
    }

    // Sport preference
    if (b.sport) {
      sportCounts[b.sport] = (sportCounts[b.sport] || 0) + 1;
    }

    // Location preference (turfName as proxy)
    if (b.turfName) {
      locationCounts[b.turfName] = (locationCounts[b.turfName] || 0) + 1;
    }
  }

  const topDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Saturday';
  const topTime = Object.entries(timeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '18:00';
  const topSport = Object.entries(sportCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Football';
  const topLocation = Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

  return { topDay, topTime, topSport, topLocation, dayCounts, timeCounts };
}

/**
 * Build available slots for next 7 days from active turfs near the user's city.
 */
async function getAvailableSlots(userCity) {
  const next7 = getNext7Days();

  // Fetch active turfs — filter by city if supplied
  let turfQuery = adminDb.collection(TURF_COLLECTION).where('isActive', '==', true);
  if (userCity) {
    turfQuery = turfQuery.where('city', '==', userCity);
  }

  const turfSnap = await turfQuery.limit(20).get();
  if (turfSnap.empty) {
    // Fallback: try all turfs
    const fallbackSnap = await adminDb
      .collection(TURF_COLLECTION)
      .where('isActive', '==', true)
      .limit(20)
      .get();
    if (fallbackSnap.empty) return [];
    return buildSlotList(fallbackSnap, next7);
  }

  return buildSlotList(turfSnap, next7);
}

async function buildSlotList(turfSnap, dates) {
  const slots = [];

  for (const turfDoc of turfSnap.docs) {
    const turf = turfDoc.data();
    const turfId = turfDoc.id;
    const openHour = parseInt(turf.openTime) || 6;
    const closeHour = parseInt(turf.closeTime) || 23;

    for (const date of dates) {
      // Get existing bookings for this turf+date
      const bookingsSnap = await adminDb
        .collection(BOOKINGS_COLLECTION)
        .where('turfId', '==', turfId)
        .where('bookedDate', '==', date)
        .where('status', '==', 'confirmed')
        .get();

      const bookedTimes = new Set();
      bookingsSnap.forEach((doc) => {
        const data = doc.data();
        if (Array.isArray(data.timeSlots)) {
          data.timeSlots.forEach((s) => bookedTimes.add(s));
        }
      });

      for (let h = openHour; h < closeHour; h++) {
        const time = `${String(h).padStart(2, '0')}:00`;
        if (!bookedTimes.has(time)) {
          slots.push({
            turfId,
            turfName: turf.name || '',
            turfCity: turf.city || '',
            turfAddress: turf.address || '',
            date,
            dayName: getDayName(date),
            time,
            price: turf.price || turf.pricePerHour || 0,
            sport: turf.sport || '',
          });
        }
      }
    }
  }

  // Cap to 50 to keep the prompt within token limits
  return slots.slice(0, 50);
}

// ───────────────────────────────────────────────────────────────────────────
// POST /api/recommendations
// ───────────────────────────────────────────────────────────────────────────

router.post('/', firebaseAuth, async (req, res) => {
  try {
    const userId = req.firebaseUser.uid;
    const userCity = req.body.city || '';

    // 1. Fetch last 10 bookings for this user, ordered by createdAt desc
    const bookingsSnap = await adminDb
      .collection(BOOKINGS_COLLECTION)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    if (bookingsSnap.size < 3) {
      return res.status(200).json({
        success: false,
        reason: 'insufficient_history',
        message: 'You need at least 3 bookings before we can recommend slots.',
        bookingCount: bookingsSnap.size,
      });
    }

    // 2. Prepare booking history
    const bookingHistory = bookingsSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        turfName: d.turfName || '',
        turfId: d.turfId || '',
        bookedDate: d.bookedDate || '',
        dayOfWeek: d.bookedDate ? getDayName(d.bookedDate) : '',
        timeSlots: d.timeSlots || [],
        sport: d.sport || '',
        city: d.city || userCity,
      };
    });

    // 3. Extract user patterns
    const patterns = extractPatterns(bookingHistory);

    // 4. Get available slots near the user
    const availableSlots = await getAvailableSlots(userCity);

    if (availableSlots.length === 0) {
      return res.status(200).json({
        success: false,
        reason: 'no_available_slots',
        message: 'No available slots found for the next 7 days.',
      });
    }

    // 5. Build prompt
    const prompt = `
You are a sports booking assistant for TurfHub India.
Analyze this user's booking history and suggest the best slot for their next booking.

Booking history:
${JSON.stringify(bookingHistory, null, 2)}

User patterns detected:
- Preferred day: ${patterns.topDay}
- Preferred time: ${patterns.topTime}
- Preferred sport: ${patterns.topSport}
- Preferred venue: ${patterns.topLocation}

Available slots for next 7 days near ${userCity || 'their location'}:
${JSON.stringify(availableSlots, null, 2)}

Respond in JSON only (no markdown, no explanation outside JSON):
{
  "recommendedSlot": {
    "turfId": "string",
    "turfName": "string",
    "turfCity": "string",
    "turfAddress": "string",
    "date": "YYYY-MM-DD",
    "time": "HH:MM",
    "price": number,
    "sport": "string",
    "reason": "one sentence why this slot suits them"
  },
  "pattern": "one sentence describing user's booking pattern",
  "confidence": 0.0 to 1.0
}
`;

    // 6. Call Groq AI
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-70b-8192',
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const rawResponse = chatCompletion.choices?.[0]?.message?.content;

    if (!rawResponse) {
      console.error('❌ Groq returned empty response');
      return res.status(500).json({ error: 'AI service returned an empty response' });
    }

    // 7. Parse and validate the response
    let recommendation;
    try {
      recommendation = JSON.parse(rawResponse);
    } catch (parseError) {
      console.error('❌ Failed to parse Groq response:', rawResponse);
      return res.status(500).json({ error: 'AI returned invalid JSON' });
    }

    // Ensure minimal structure
    if (!recommendation.recommendedSlot || !recommendation.recommendedSlot.turfId) {
      console.error('❌ Groq response missing required fields:', recommendation);
      return res.status(500).json({ error: 'AI recommendation was incomplete' });
    }

    return res.json({
      success: true,
      ...recommendation,
      userPatterns: {
        preferredDay: patterns.topDay,
        preferredTime: patterns.topTime,
        preferredSport: patterns.topSport,
        preferredVenue: patterns.topLocation,
      },
    });
  } catch (error) {
    console.error('❌ Recommendation error:', error.message);
    return res.status(500).json({
      error: 'Failed to generate recommendation',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

export default router;
