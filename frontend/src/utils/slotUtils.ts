import { SlotType, TurfData, GroundConfig } from '../types/owner';

/**
 * Get the list of grounds for a turf.
 * If the turf has a `grounds` array, use it; otherwise, create a default ground from root-level times.
 */
export function getGroundsForTurf(turf: TurfData): GroundConfig[] {
    if (turf.grounds && turf.grounds.length > 0) {
        return turf.grounds;
    }
    // Use totalGrounds from Firestore to generate grounds dynamically
    const count = turf.totalGrounds && turf.totalGrounds > 0 ? turf.totalGrounds : 1;
    const grounds: GroundConfig[] = [];
    for (let i = 1; i <= count; i++) {
        grounds.push({
            id: `ground-${i}`,
            name: `Ground ${i}`,
            openTime: turf.openTime || '06:00',
            closeTime: turf.closeTime || '22:00',
        });
    }
    return grounds;
}

/**
 * Generates time slots based on open/close times.
 * Accepts optional ground override for per-ground timing.
 */
export function generateTimeSlots(
    turf: TurfData,
    ground?: GroundConfig
): SlotType[] {
    const slots: SlotType[] = [];

    const openTime = ground?.openTime || turf.openTime;
    const closeTime = ground?.closeTime || turf.closeTime;

    if (!openTime || !closeTime ||
        typeof openTime !== 'string' ||
        typeof closeTime !== 'string') {
        console.warn('Invalid turf time configuration:', { openTime, closeTime });
        return slots;
    }

    try {
        const openHour = parseInt(openTime.split(':')[0]);
        const closeHour = parseInt(closeTime.split(':')[0]);

        if (isNaN(openHour) || isNaN(closeHour) || openHour >= closeHour || openHour < 0 || closeHour > 24) {
            console.warn('Invalid hour values:', { openHour, closeHour });
            return slots;
        }

        for (let hour = openHour; hour < closeHour; hour++) {
            const startTime = `${hour.toString().padStart(2, '0')}:00`;
            const endHour = hour + 1;
            const endTime = `${endHour.toString().padStart(2, '0')}:00`;

            slots.push({
                id: `slot-${hour}`,
                startTime,
                endTime,
                label: `${startTime} - ${endTime}`
            });
        }
    } catch (error) {
        console.error('Error generating time slots:', error);
    }

    return slots;
}

/**
 * Formats time from 24-hour format to 12-hour or keeps 24-hour based on preference
 */
export function formatTime(time: string, use12hr: boolean = true): string {
    if (!time || typeof time !== 'string') return time;

    try {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);

        if (!use12hr) {
            return `${hour.toString().padStart(2, '0')}:${minutes}`;
        }

        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
    } catch (error) {
        return time;
    }
}

/**
 * Formats a slot label (startTime - endTime) in 12hr or 24hr format
 */
export function formatSlotLabel(startTime: string, endTime: string, use12hr: boolean = true): string {
    return `${formatTime(startTime, use12hr)} - ${formatTime(endTime, use12hr)}`;
}

/**
 * Checks if a time slot is in the past for a given date.
 * Returns true if the slot's start time has already passed.
 */
export function isSlotInPast(dateStr: string, startTime: string): boolean {
    try {
        const now = new Date();
        const today = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

        // Only check past for today's date
        if (dateStr !== today) {
            return false;
        }

        const [hours] = startTime.split(':').map(Number);
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();

        // Slot is past if startHour < currentHour, or startHour == currentHour and we're already into it
        return hours < currentHour || (hours === currentHour && currentMinutes > 0);
    } catch {
        return false;
    }
}
