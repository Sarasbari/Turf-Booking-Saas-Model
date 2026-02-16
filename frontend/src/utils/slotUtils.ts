import { SlotType, TurfData } from '../types/owner';

/**
 * Generates time slots based on turf opening and closing hours
 * @param turf - The turf data containing openTime and closeTime
 * @returns Array of SlotType objects representing hourly slots
 */
export function generateTimeSlots(turf: TurfData): SlotType[] {
    const slots: SlotType[] = [];
    
    // Validate that openTime and closeTime exist and are strings
    if (!turf.openTime || !turf.closeTime || 
        typeof turf.openTime !== 'string' || 
        typeof turf.closeTime !== 'string') {
        console.warn('Invalid turf time configuration:', { openTime: turf.openTime, closeTime: turf.closeTime });
        return slots;
    }
    
    try {
        const openHour = parseInt(turf.openTime.split(':')[0]);
        const closeHour = parseInt(turf.closeTime.split(':')[0]);
        
        // Validate parsed hours
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
 * Formats time from 24-hour format to readable format
 * @param time - Time string in HH:MM format
 * @returns Formatted time string
 */
export function formatTime(time: string): string {
    if (!time || typeof time !== 'string') return time;
    
    try {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
    } catch (error) {
        return time;
    }
}
