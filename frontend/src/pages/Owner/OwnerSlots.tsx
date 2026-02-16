import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs, setDoc, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { OwnerData, TurfData, BookingType, SlotType, BlockedSlot } from '../../types/owner';
import { SlotItem } from '../../components/Owner/SlotItem';
import styles from '../../styles/Owner/OwnerSlots.module.css';

export function OwnerSlots() {
    const [ownerData, setOwnerData] = useState<OwnerData | null>(null);
    const [turfData, setTurfData] = useState<TurfData | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [slots, setSlots] = useState<SlotType[]>([]);
    const [bookings, setBookings] = useState<BookingType[]>([]);
    const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (turfData) {
            fetchSlotsForDate();
        }
    }, [selectedDate, turfData]);

    const fetchData = async () => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            setLoading(true);

            // Fetch owner data
            const ownerDocRef = doc(db, 'owners', user.uid);
            const ownerDoc = await getDoc(ownerDocRef);
            
            if (!ownerDoc.exists()) return;
            
            const owner = ownerDoc.data() as OwnerData;
            setOwnerData(owner);

            // Fetch turf data
            const turfDocRef = doc(db, 'turf', owner.turfId);
            const turfDoc = await getDoc(turfDocRef);
            
            if (!turfDoc.exists()) return;
            
            const turf = { id: turfDoc.id, ...turfDoc.data() } as TurfData;
            setTurfData(turf);

            // Generate time slots
            const timeSlots = generateTimeSlots(turf);
            setSlots(timeSlots);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSlotsForDate = async () => {
        if (!ownerData || !turfData) return;

        try {
            // Fetch bookings for selected date
            const bookingsQuery = query(
                collection(db, 'bookings'),
                where('turfId', '==', ownerData.turfId),
                where('date', '==', selectedDate)
            );
            const bookingsSnapshot = await getDocs(bookingsQuery);
            const bookingsData = bookingsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as BookingType[];
            setBookings(bookingsData);

            // Fetch blocked slots for selected date
            const blockedQuery = query(
                collection(db, 'blockedSlots'),
                where('turfId', '==', ownerData.turfId),
                where('date', '==', selectedDate)
            );
            const blockedSnapshot = await getDocs(blockedQuery);
            const blockedData = blockedSnapshot.docs.map(doc => ({
                ...doc.data()
            })) as BlockedSlot[];
            setBlockedSlots(blockedData);

        } catch (error) {
            console.error('Error fetching slots for date:', error);
        }
    };

    const generateTimeSlots = (turf: TurfData): SlotType[] => {
        const slots: SlotType[] = [];
        const openHour = parseInt(turf.openTime?.split(':')[0] || '6');
        const closeHour = parseInt(turf.closeTime?.split(':')[0] || '22');
        
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
        
        return slots;
    };

    const getSlotStatus = (slot: SlotType): { status: 'available' | 'booked' | 'blocked' | 'pending'; booking?: BookingType } => {
        // Check if blocked
        const isBlocked = blockedSlots.some(bs => bs.startTime === slot.startTime);
        if (isBlocked) {
            return { status: 'blocked' };
        }

        // Check if booked
        const booking = bookings.find(b => b.startTime === slot.startTime && b.status !== 'cancelled');
        if (booking) {
            return { 
                status: booking.status === 'pending' ? 'pending' : 'booked',
                booking 
            };
        }

        return { status: 'available' };
    };

    const handleBlockSlot = async (slot: SlotType) => {
        if (!ownerData || !confirm(`Block ${slot.label} on ${formatDate(selectedDate)}?`)) return;

        try {
            const blockedSlotData: BlockedSlot = {
                turfId: ownerData.turfId,
                date: selectedDate,
                startTime: slot.startTime,
                endTime: slot.endTime,
                blockedAt: Timestamp.now(),
                blockedBy: ownerData.uid
            };

            const slotId = `${ownerData.turfId}_${selectedDate}_${slot.startTime}`;
            await setDoc(doc(db, 'blockedSlots', slotId), blockedSlotData);

            // Refresh slots
            await fetchSlotsForDate();
        } catch (error) {
            console.error('Error blocking slot:', error);
            alert('Failed to block slot. Please try again.');
        }
    };

    const handleUnblockSlot = async (slot: SlotType) => {
        if (!ownerData || !confirm(`Unblock ${slot.label} on ${formatDate(selectedDate)}?`)) return;

        try {
            const slotId = `${ownerData.turfId}_${selectedDate}_${slot.startTime}`;
            await deleteDoc(doc(db, 'blockedSlots', slotId));

            // Refresh slots
            await fetchSlotsForDate();
        } catch (error) {
            console.error('Error unblocking slot:', error);
            alert('Failed to unblock slot. Please try again.');
        }
    };

    const handleConfirmBooking = async (bookingId: string) => {
        if (!confirm('Confirm this booking?')) return;

        try {
            const bookingRef = doc(db, 'bookings', bookingId);
            await updateDoc(bookingRef, { status: 'confirmed' });

            // Refresh slots
            await fetchSlotsForDate();
        } catch (error) {
            console.error('Error confirming booking:', error);
            alert('Failed to confirm booking. Please try again.');
        }
    };

    const handleCancelBooking = async (bookingId: string) => {
        if (!confirm('Cancel this booking?')) return;

        try {
            const bookingRef = doc(db, 'bookings', bookingId);
            await updateDoc(bookingRef, { status: 'cancelled' });

            // Refresh slots
            await fetchSlotsForDate();
        } catch (error) {
            console.error('Error cancelling booking:', error);
            alert('Failed to cancel booking. Please try again.');
        }
    };

    const handleBlockEntireDay = async () => {
        if (!ownerData || !confirm(`Block all available slots for ${formatDate(selectedDate)}?`)) return;

        try {
            const promises = slots.map(async (slot) => {
                const { status } = getSlotStatus(slot);
                if (status === 'available') {
                    const blockedSlotData: BlockedSlot = {
                        turfId: ownerData.turfId,
                        date: selectedDate,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        blockedAt: Timestamp.now(),
                        blockedBy: ownerData.uid
                    };

                    const slotId = `${ownerData.turfId}_${selectedDate}_${slot.startTime}`;
                    await setDoc(doc(db, 'blockedSlots', slotId), blockedSlotData);
                }
            });

            await Promise.all(promises);
            await fetchSlotsForDate();
        } catch (error) {
            console.error('Error blocking entire day:', error);
            alert('Failed to block entire day. Please try again.');
        }
    };

    const handleUnblockAll = async () => {
        if (!ownerData || !confirm(`Unblock all slots for ${formatDate(selectedDate)}?`)) return;

        try {
            const promises = blockedSlots.map(async (bs) => {
                const slotId = `${ownerData.turfId}_${selectedDate}_${bs.startTime}`;
                await deleteDoc(doc(db, 'blockedSlots', slotId));
            });

            await Promise.all(promises);
            await fetchSlotsForDate();
        } catch (error) {
            console.error('Error unblocking all:', error);
            alert('Failed to unblock all slots. Please try again.');
        }
    };

    const changeDate = (days: number) => {
        const currentDate = new Date(selectedDate);
        currentDate.setDate(currentDate.getDate() + days);
        setSelectedDate(currentDate.toISOString().split('T')[0]);
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.loadingIcon}>⏳</div>
                <div className={styles.loadingText}>Loading slots...</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>Slot Manager</h1>
                <p className={styles.subtitle}>Manage time slots and block/unblock availability</p>
            </div>

            {/* Controls */}
            <div className={styles.controls}>
                <div className={styles.dateNav}>
                    <button className={styles.dateButton} onClick={() => changeDate(-1)}>
                        ← Previous
                    </button>
                    <div className={styles.currentDate}>{formatDate(selectedDate)}</div>
                    <button className={styles.dateButton} onClick={() => changeDate(1)}>
                        Next →
                    </button>
                </div>
                <div className={styles.quickActions}>
                    <button className={styles.actionButton} onClick={handleBlockEntireDay}>
                        🚫 Block Entire Day
                    </button>
                    <button 
                        className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                        onClick={handleUnblockAll}
                        disabled={blockedSlots.length === 0}
                    >
                        ✓ Unblock All
                    </button>
                </div>
            </div>

            {/* Slots List */}
            {slots.length > 0 ? (
                <div className={styles.slotsList}>
                    {slots.map(slot => {
                        const { status, booking } = getSlotStatus(slot);
                        return (
                            <SlotItem
                                key={slot.id}
                                slot={slot}
                                status={status}
                                booking={booking}
                                onBlock={status === 'available' ? () => handleBlockSlot(slot) : undefined}
                                onUnblock={status === 'blocked' ? () => handleUnblockSlot(slot) : undefined}
                                onConfirm={status === 'pending' && booking ? () => handleConfirmBooking(booking.id) : undefined}
                                onCancel={
                                    (status === 'booked' || status === 'pending') && booking
                                        ? () => handleCancelBooking(booking.id)
                                        : undefined
                                }
                            />
                        );
                    })}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>⏰</div>
                    <div className={styles.emptyStateText}>No time slots configured</div>
                </div>
            )}
        </div>
    );
}
