/**
 * Turf Controller
 *
 * Handles Firestore reads for turf data. These handlers sit behind the
 * cacheMiddleware, so repeated reads are served from Redis.
 *
 * Security (api-security-best-practices):
 * - All params are validated (type, format, length)
 * - Errors never leak Firestore internals
 * - Only necessary fields are returned (no raw doc dumps)
 */

import { adminDb } from '../config/firebaseAdmin.js';

// ── Helpers ───────────────────────────────────────────────────────────────
const TURF_COLLECTION = 'turf';

/**
 * Serialize a Firestore doc snapshot to a plain object.
 * Strips server-only fields and adds the document ID.
 */
function serializeTurf(doc) {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name || '',
    city: data.city || '',
    address: data.address || '',
    image: data.image || data.imageUrl || '',
    price: data.price || data.pricePerHour || 0,
    sport: data.sport || '',
    rating: data.rating || 0,
    isActive: data.isActive !== false, // default true
    amenities: data.amenities || [],
    openTime: data.openTime || '',
    closeTime: data.closeTime || '',
    ownerContact: data.ownerContact || '',
    description: data.description || '',
  };
}

// ── Param validators ──────────────────────────────────────────────────────
const CITY_REGEX  = /^[a-zA-Z\s\-]{2,50}$/;
const ID_REGEX    = /^[a-zA-Z0-9_\-]{10,40}$/;
const DATE_REGEX  = /^\d{4}-\d{2}-\d{2}$/;

// ───────────────────────────────────────────────────────────────────────────
// GET /api/turfs
// ───────────────────────────────────────────────────────────────────────────

export async function getAllTurfs(req, res) {
  try {
    const snapshot = await adminDb
      .collection(TURF_COLLECTION)
      .where('isActive', '==', true)
      .get();

    const turfs = snapshot.docs.map(serializeTurf);
    return res.json({ success: true, count: turfs.length, turfs });
  } catch (error) {
    console.error('❌ Error fetching turfs:', error.message);
    return res.status(500).json({ error: 'Failed to fetch turfs' });
  }
}

// ───────────────────────────────────────────────────────────────────────────
// GET /api/turfs/city/:city
// ───────────────────────────────────────────────────────────────────────────

export async function getTurfsByCity(req, res) {
  const { city } = req.params;

  // Input validation
  if (!city || !CITY_REGEX.test(city)) {
    return res.status(400).json({
      error: 'Invalid city parameter',
      message: 'City must be 2-50 characters, letters/hyphens/spaces only',
    });
  }

  try {
    // Firestore is case-sensitive — normalize to title case for matching
    const normalizedCity = city.trim();

    const snapshot = await adminDb
      .collection(TURF_COLLECTION)
      .where('city', '==', normalizedCity)
      .where('isActive', '==', true)
      .get();

    const turfs = snapshot.docs.map(serializeTurf);
    return res.json({ success: true, count: turfs.length, city: normalizedCity, turfs });
  } catch (error) {
    console.error(`❌ Error fetching turfs for city "${city}":`, error.message);
    return res.status(500).json({ error: 'Failed to fetch turfs' });
  }
}

// ───────────────────────────────────────────────────────────────────────────
// GET /api/turfs/:id
// ───────────────────────────────────────────────────────────────────────────

export async function getTurfById(req, res) {
  const { id } = req.params;

  // Input validation
  if (!id || !ID_REGEX.test(id)) {
    return res.status(400).json({
      error: 'Invalid turf ID',
      message: 'ID must be 10-40 alphanumeric characters',
    });
  }

  try {
    const doc = await adminDb.collection(TURF_COLLECTION).doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Turf not found' });
    }

    const turf = serializeTurf(doc);
    return res.json({ success: true, turf });
  } catch (error) {
    console.error(`❌ Error fetching turf ${id}:`, error.message);
    return res.status(500).json({ error: 'Failed to fetch turf' });
  }
}

// ───────────────────────────────────────────────────────────────────────────
// GET /api/turfs/:id/slots/:date
// ───────────────────────────────────────────────────────────────────────────

export async function getSlotAvailability(req, res) {
  const { id, date } = req.params;

  // Input validation
  if (!id || !ID_REGEX.test(id)) {
    return res.status(400).json({
      error: 'Invalid turf ID',
      message: 'ID must be 10-40 alphanumeric characters',
    });
  }

  if (!date || !DATE_REGEX.test(date)) {
    return res.status(400).json({
      error: 'Invalid date format',
      message: 'Date must be in YYYY-MM-DD format',
    });
  }

  // Reject past dates and dates more than 30 days out
  const requestedDate = new Date(date + 'T00:00:00Z');
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 30);

  if (requestedDate < today) {
    return res.status(400).json({
      error: 'Invalid date',
      message: 'Cannot check availability for past dates',
    });
  }

  if (requestedDate > maxDate) {
    return res.status(400).json({
      error: 'Invalid date',
      message: 'Cannot check availability more than 30 days ahead',
    });
  }

  try {
    // 1. Verify turf exists
    const turfDoc = await adminDb.collection(TURF_COLLECTION).doc(id).get();
    if (!turfDoc.exists) {
      return res.status(404).json({ error: 'Turf not found' });
    }

    // 2. Get all confirmed bookings for this turf on this date
    const bookingsSnapshot = await adminDb
      .collection('bookings')
      .where('turfId', '==', id)
      .where('bookedDate', '==', date)
      .where('status', '==', 'confirmed')
      .get();

    // 3. Collect all booked time slots
    const bookedSlots = new Set();
    bookingsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (Array.isArray(data.timeSlots)) {
        data.timeSlots.forEach((slot) => bookedSlots.add(slot));
      }
    });

    // 4. Build all possible slots from the turf's operating hours
    const turfData = turfDoc.data();
    const openHour  = parseInt(turfData.openTime)  || 6;   // default 6 AM
    const closeHour = parseInt(turfData.closeTime) || 23;   // default 11 PM
    const allSlots = [];

    for (let h = openHour; h < closeHour; h++) {
      const slot = `${String(h).padStart(2, '0')}:00`;
      allSlots.push({
        time: slot,
        available: !bookedSlots.has(slot),
      });
    }

    return res.json({
      success: true,
      turfId: id,
      date,
      totalSlots: allSlots.length,
      availableSlots: allSlots.filter(s => s.available).length,
      bookedSlots: [...bookedSlots].sort(),
      slots: allSlots,
    });
  } catch (error) {
    console.error(`❌ Error fetching slots for turf ${id} on ${date}:`, error.message);
    return res.status(500).json({ error: 'Failed to fetch slot availability' });
  }
}
