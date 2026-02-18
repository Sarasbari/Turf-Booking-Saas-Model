import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs, setDoc, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { OwnerData, TurfData, BookingType, SlotType, BlockedSlot, GroundConfig } from '../../types/owner';
import { SlotItem } from '../../components/Owner/SlotItem';
import { generateTimeSlots, getGroundsForTurf } from '../../utils/slotUtils';
import styles from '../../styles/Owner/OwnerSlots.module.css';

export function OwnerSlots() {
    const [ownerData, setOwnerData] = useState<OwnerData | null>(null);
    const [turfData, setTurfData] = useState<TurfData | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [slots, setSlots] = useState<SlotType[]>([]);
    const [bookings, setBookings] = useState<BookingType[]>([]);
    const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
    const [loading, setLoading] = useState(true);

    // Ground & time format state
    const [grounds, setGrounds] = useState<GroundConfig[]>([]);
    const [selectedGround, setSelectedGround] = useState<GroundConfig | null>(null);
    const [timeFormat, setTimeFormat] = useState<'12hr' | '24hr'>(() => {
        return (localStorage.getItem('slotTimeFormat') as '12hr' | '24hr') || '12hr';
    });

    // Persist time format
    useEffect(() => {
        localStorage.setItem('slotTimeFormat', timeFormat);
    }, [timeFormat]);

    useEffect(() => {
        fetchData();
    }, []);

    // When turfData loads, derive grounds and select the first
    useEffect(() => {
        if (turfData) {
            const turfGrounds = getGroundsForTurf(turfData);
            setGrounds(turfGrounds);
            if (!selectedGround || !turfGrounds.find(g => g.id === selectedGround.id)) {
                setSelectedGround(turfGrounds[0]);
            }
        }
    }, [turfData]);

    // Regenerate slots when ground or turfData changes
    useEffect(() => {
        if (turfData && selectedGround) {
            const timeSlots = generateTimeSlots(turfData, selectedGround);
            setSlots(timeSlots);
        }
    }, [turfData, selectedGround]);

    // Fetch bookings/blocked when date or ground changes
    useEffect(() => {
        if (turfData && selectedGround) {
            fetchSlotsForDate();
        }
    }, [selectedDate, turfData, selectedGround]);

    const fetchData = async () => {
        const user = auth.currentUser;
        if (!user) return;

        try {
            setLoading(true);

            const ownerDocRef = doc(db, 'owners', user.uid);
            const ownerDoc = await getDoc(ownerDocRef);

            if (!ownerDoc.exists()) return;

            const owner = ownerDoc.data() as OwnerData;
            setOwnerData(owner);

            const turfDocRef = doc(db, 'turf', owner.turfId);
            const turfDoc = await getDoc(turfDocRef);

            if (!turfDoc.exists()) return;

            const turf = { id: turfDoc.id, ...turfDoc.data() } as TurfData;
            setTurfData(turf);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSlotsForDate = async () => {
        if (!ownerData || !turfData || !selectedGround) return;

        try {
            // Fetch bookings for selected date + ground
            const bookingsQuery = query(
                collection(db, 'bookings'),
                where('turfId', '==', ownerData.turfId),
                where('date', '==', selectedDate)
            );
            const bookingsSnapshot = await getDocs(bookingsQuery);
            const bookingsData = bookingsSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() })) as BookingType[];
            // Filter by ground on client side (Firestore can't do too many where clauses)
            const filteredBookings = bookingsData.filter(b =>
                !b.groundId || b.groundId === selectedGround.id
            );
            setBookings(filteredBookings);

            // Fetch blocked slots for selected date + ground
            const blockedQuery = query(
                collection(db, 'blockedSlots'),
                where('turfId', '==', ownerData.turfId),
                where('date', '==', selectedDate)
            );
            const blockedSnapshot = await getDocs(blockedQuery);
            const blockedData = blockedSnapshot.docs
                .map(doc => ({ ...doc.data() })) as BlockedSlot[];
            const filteredBlocked = blockedData.filter(bs =>
                !bs.groundId || bs.groundId === selectedGround.id
            );
            setBlockedSlots(filteredBlocked);
        } catch (error) {
            console.error('Error fetching slots for date:', error);
        }
    };

    const getSlotStatus = (slot: SlotType): { status: 'available' | 'booked' | 'blocked' | 'pending'; booking?: BookingType } => {
        const isBlocked = blockedSlots.some(bs => bs.startTime === slot.startTime);
        if (isBlocked) {
            return { status: 'blocked' };
        }

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
        if (!ownerData || !selectedGround) return;

        try {
            const blockedSlotData: BlockedSlot = {
                turfId: ownerData.turfId,
                groundId: selectedGround.id,
                date: selectedDate,
                startTime: slot.startTime,
                endTime: slot.endTime,
                blockedAt: Timestamp.now(),
                blockedBy: ownerData.uid || auth.currentUser?.uid || 'owner'
            };

            const slotId = `${ownerData.turfId}_${selectedGround.id}_${selectedDate}_${slot.startTime}`;
            await setDoc(doc(db, 'blockedSlots', slotId), blockedSlotData);
            console.log('✅ Slot blocked:', slotId);
            await fetchSlotsForDate();
        } catch (error) {
            console.error('Error blocking slot:', error);
            alert('Failed to block slot: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    const handleUnblockSlot = async (slot: SlotType) => {
        if (!ownerData || !selectedGround) return;

        try {
            const slotId = `${ownerData.turfId}_${selectedGround.id}_${selectedDate}_${slot.startTime}`;
            await deleteDoc(doc(db, 'blockedSlots', slotId));
            console.log('✅ Slot unblocked:', slotId);
            await fetchSlotsForDate();
        } catch (error) {
            console.error('Error unblocking slot:', error);
            alert('Failed to unblock slot: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    const handleConfirmBooking = async (bookingId: string) => {
        if (!confirm('Confirm this booking?')) return;

        try {
            const bookingRef = doc(db, 'bookings', bookingId);
            await updateDoc(bookingRef, { status: 'confirmed' });
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
            await fetchSlotsForDate();
        } catch (error) {
            console.error('Error cancelling booking:', error);
            alert('Failed to cancel booking. Please try again.');
        }
    };

    const handleBlockEntireDay = async () => {
        if (!ownerData || !selectedGround || !confirm(`Block all available slots for ${formatDate(selectedDate)}?`)) return;

        try {
            const promises = slots.map(async (slot) => {
                const { status } = getSlotStatus(slot);
                if (status === 'available') {
                    const blockedSlotData: BlockedSlot = {
                        turfId: ownerData.turfId,
                        groundId: selectedGround.id,
                        date: selectedDate,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        blockedAt: Timestamp.now(),
                        blockedBy: ownerData.uid
                    };

                    const slotId = `${ownerData.turfId}_${selectedGround.id}_${selectedDate}_${slot.startTime}`;
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
        if (!ownerData || !selectedGround || !confirm(`Unblock all slots for ${formatDate(selectedDate)}?`)) return;

        try {
            const promises = blockedSlots.map(async (bs) => {
                const slotId = `${ownerData.turfId}_${selectedGround.id}_${selectedDate}_${bs.startTime}`;
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

    const use12hr = timeFormat === '12hr';

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>Slot Manager</h1>
                <p className={styles.subtitle}>Manage time slots and block/unblock availability</p>
            </div>

            {/* Ground Selector */}
            <div className={styles.groundSelector}>
                <label className={styles.groundLabel}>Select Ground</label>
                <div className={styles.groundPills}>
                    {grounds.map(ground => (
                        <button
                            key={ground.id}
                            className={`${styles.groundPill} ${selectedGround?.id === ground.id ? styles.groundPillActive : ''}`}
                            onClick={() => setSelectedGround(ground)}
                        >
                            🏟️ {ground.name}
                        </button>
                    ))}
                </div>
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
                    {/* Time Format Toggle */}
                    <button
                        className={styles.actionButton}
                        onClick={() => setTimeFormat(prev => prev === '12hr' ? '24hr' : '12hr')}
                        title="Toggle time format"
                    >
                        🕐 {timeFormat === '12hr' ? '12hr' : '24hr'}
                    </button>
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

            {/* Active Ground Info */}
            {selectedGround && (
                <div className={styles.groundInfo}>
                    <span>🏟️ <strong>{selectedGround.name}</strong></span>
                    <span className={styles.groundInfoTime}>
                        {use12hr
                            ? `${formatHour12(selectedGround.openTime)} – ${formatHour12(selectedGround.closeTime)}`
                            : `${selectedGround.openTime} – ${selectedGround.closeTime}`
                        }
                    </span>
                </div>
            )}

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
                                timeFormat={timeFormat}
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

/** Quick 12hr format helper */
function formatHour12(time: string): string {
    if (!time) return time;
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${display}:${m || '00'} ${ampm}`;
}
