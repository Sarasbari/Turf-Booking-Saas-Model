/**
 * Date and Time Utilities
 * 
 * Functions for date formatting, time calculations, and status checks.
 */

/**
 * Check if turf is currently open
 * @param {string} openTime - Opening time in 24hr format (e.g., "06:00")
 * @param {string} closeTime - Closing time in 24hr format (e.g., "23:00")
 * @param {string|null} weeklyOff - Day of week that's closed (e.g., "Sunday") or null
 * @returns {boolean} True if currently open
 */
export const isCurrentlyOpen = (openTime, closeTime, weeklyOff = null) => {
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
  
  // Check if today is weekly off
  if (weeklyOff && currentDay === weeklyOff) {
    return false;
  }

  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  return currentTime >= openTime && currentTime < closeTime;
};

/**
 * Get time until closing
 * @param {string} closeTime - Closing time in 24hr format
 * @returns {Object|null} Object with hours and minutes, or null if closed
 */
export const getTimeUntilClose = (closeTime) => {
  const now = new Date();
  const [closeHour, closeMin] = closeTime.split(':').map(Number);
  
  const closeDate = new Date();
  closeDate.setHours(closeHour, closeMin, 0, 0);
  
  if (now >= closeDate) return null;
  
  const diff = closeDate - now;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { hours, minutes };
};

/**
 * Get time until opening
 * @param {string} openTime - Opening time in 24hr format
 * @returns {Object|null} Object with hours and minutes, or null if already open
 */
export const getTimeUntilOpen = (openTime) => {
  const now = new Date();
  const [openHour, openMin] = openTime.split(':').map(Number);
  
  let openDate = new Date();
  openDate.setHours(openHour, openMin, 0, 0);
  
  // If opening time has passed today, calculate for tomorrow
  if (now >= openDate) {
    openDate.setDate(openDate.getDate() + 1);
  }
  
  const diff = openDate - now;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { hours, minutes };
};

/**
 * Format date for display
 * @param {Date|string} date - Date object or string
 * @param {string} format - Format type: 'short' | 'long' | 'full'
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'short') => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    case 'long':
      return dateObj.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    case 'full':
      return dateObj.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    default:
      return dateObj.toLocaleDateString('en-IN');
  }
};

/**
 * Format date for Firebase (YYYY-MM-DD)
 * @param {Date} date - Date object
 * @returns {string} Date in YYYY-MM-DD format
 */
export const formatDateForFirebase = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} Today's date
 */
export const getTodayDate = () => {
  return formatDateForFirebase(new Date());
};

/**
 * Get date N days from now
 * @param {number} days - Number of days to add
 * @returns {string} Date in YYYY-MM-DD format
 */
export const getDateAfterDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDateForFirebase(date);
};

/**
 * Check if date is today
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {boolean} True if date is today
 */
export const isToday = (dateString) => {
  return dateString === getTodayDate();
};

/**
 * Check if date is in the past
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {boolean} True if date is in the past
 */
export const isPastDate = (dateString) => {
  return dateString < getTodayDate();
};

/**
 * Get status message for turf
 * @param {string} openTime - Opening time
 * @param {string} closeTime - Closing time
 * @param {string|null} weeklyOff - Weekly off day
 * @returns {Object} Status object with message and type
 */
export const getTurfStatus = (openTime, closeTime, weeklyOff = null) => {
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
  
  // Check weekly off
  if (weeklyOff && currentDay === weeklyOff) {
    const nextDay = new Date(now);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayName = nextDay.toLocaleDateString('en-US', { weekday: 'long' });
    
    return {
      type: 'closed',
      message: `Closed today (${weeklyOff})`,
      detail: `Opens tomorrow (${nextDayName}) at ${openTime}`,
    };
  }
  
  const isOpen = isCurrentlyOpen(openTime, closeTime, weeklyOff);
  
  if (isOpen) {
    const timeUntilClose = getTimeUntilClose(closeTime);
    if (timeUntilClose) {
      const { hours, minutes } = timeUntilClose;
      return {
        type: 'open',
        message: 'Open Now',
        detail: `Closes in ${hours}h ${minutes}m`,
      };
    }
  }
  
  const timeUntilOpen = getTimeUntilOpen(openTime);
  if (timeUntilOpen) {
    const { hours, minutes } = timeUntilOpen;
    return {
      type: 'closed',
      message: 'Currently Closed',
      detail: `Opens in ${hours}h ${minutes}m`,
    };
  }
  
  return {
    type: 'closed',
    message: 'Closed',
    detail: '',
  };
};
