/**
 * Time Slot Utilities
 * 
 * Functions for generating, formatting, and managing time slots for turf bookings.
 */

/**
 * Generate time slots from opening to closing time
 * @param {string} openTime - Opening time in 24hr format (e.g., "06:00")
 * @param {string} closeTime - Closing time in 24hr format (e.g., "23:00")
 * @param {number} duration - Slot duration in hours (default: 2)
 * @returns {Array} Array of slot objects
 */
export const generateSlots = (openTime, closeTime, duration = 2) => {
  const slots = [];
  let current = openTime;

  while (current < closeTime) {
    const [hours, minutes] = current.split(':').map(Number);
    const endHour = hours + duration;
    const end = `${String(endHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    if (end <= closeTime) {
      slots.push({
        startTime: current,
        endTime: end,
        label: `${formatTo12Hr(current)} - ${formatTo12Hr(end)}`,
        duration: duration,
      });
    }

    current = end;
  }

  return slots;
};

/**
 * Convert 24-hour time to 12-hour format with AM/PM
 * @param {string} time24 - Time in 24hr format (e.g., "14:30")
 * @returns {string} Time in 12hr format (e.g., "2:30 PM")
 */
export const formatTo12Hr = (time24) => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
};

/**
 * Check if a slot is booked
 * @param {Object} slot - Slot object with startTime and endTime
 * @param {Array} bookedSlots - Array of booked slot objects
 * @returns {boolean} True if slot is booked
 */
export const isSlotBooked = (slot, bookedSlots) => {
  if (!bookedSlots || bookedSlots.length === 0) return false;

  return bookedSlots.some((booked) => {
    // Check if there's any overlap
    return (
      (slot.startTime >= booked.startTime && slot.startTime < booked.endTime) ||
      (slot.endTime > booked.startTime && slot.endTime <= booked.endTime) ||
      (slot.startTime <= booked.startTime && slot.endTime >= booked.endTime)
    );
  });
};

/**
 * Check if a slot is blocked by owner
 * @param {Object} slot - Slot object with startTime and endTime
 * @param {Array} blockedSlots - Array of blocked slot objects
 * @returns {boolean} True if slot is blocked
 */
export const isSlotBlocked = (slot, blockedSlots) => {
  if (!blockedSlots || blockedSlots.length === 0) return false;

  return blockedSlots.some((blocked) => {
    return (
      (slot.startTime >= blocked.startTime && slot.startTime < blocked.endTime) ||
      (slot.endTime > blocked.startTime && slot.endTime <= blocked.endTime) ||
      (slot.startTime <= blocked.startTime && slot.endTime >= blocked.endTime)
    );
  });
};

/**
 * Calculate price for a slot with discount
 * @param {Object} slot - Slot object
 * @param {number} pricePerHour - Base price per hour
 * @param {number} discountPercent - Discount percentage (0-100)
 * @returns {Object} Price breakdown
 */
export const calculatePrice = (slot, pricePerHour, discountPercent = 0) => {
  const baseAmount = pricePerHour * slot.duration;
  const discountAmount = (baseAmount * discountPercent) / 100;
  const finalAmount = baseAmount - discountAmount;

  return {
    baseAmount,
    discountAmount,
    finalAmount,
    pricePerHour,
    duration: slot.duration,
  };
};

/**
 * Get slot status (available, booked, blocked)
 * @param {Object} slot - Slot object
 * @param {Array} bookedSlots - Array of booked slots
 * @param {Array} blockedSlots - Array of blocked slots
 * @returns {string} Status: 'available' | 'booked' | 'blocked'
 */
export const getSlotStatus = (slot, bookedSlots, blockedSlots) => {
  if (isSlotBlocked(slot, blockedSlots)) return 'blocked';
  if (isSlotBooked(slot, bookedSlots)) return 'booked';
  return 'available';
};

/**
 * Filter slots by status
 * @param {Array} slots - Array of all slots
 * @param {Array} bookedSlots - Array of booked slots
 * @param {Array} blockedSlots - Array of blocked slots
 * @param {string} status - Status to filter by
 * @returns {Array} Filtered slots
 */
export const filterSlotsByStatus = (slots, bookedSlots, blockedSlots, status) => {
  return slots.filter((slot) => {
    const slotStatus = getSlotStatus(slot, bookedSlots, blockedSlots);
    return slotStatus === status;
  });
};
