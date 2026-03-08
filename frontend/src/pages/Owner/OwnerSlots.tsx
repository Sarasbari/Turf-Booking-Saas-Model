import { useState, useEffect, useMemo, useCallback } from 'react';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot, setDoc, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { OwnerData, TurfData, BookingType, SlotType, BlockedSlot, GroundConfig } from '../../types/owner';
import { generateTimeSlots, getGroundsForTurf } from '../../utils/slotUtils';
import styles from '../../styles/Owner/OwnerSlots.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '../../context/DashboardContext';
import { BookSlotModal } from '../../components/features/Owner/BookSlotModal';

// --- Sub-Components ---

const StatCard = ({ label, value, color, icon, delay }: { label: string, value: string | number, color: string, icon: string, delay: number }) => (
    <motion.div
        className={styles.statCard}
        style={{ '--accent-color': color } as any}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
    >
        <div className={styles.statLabel}>
            <span>{icon}</span> {label}
        </div>
        <div className={styles.statValue}>{value}</div>
    </motion.div>
);

const LiveClock = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className={styles.liveClock}>
            <div className={styles.pulsingDot}></div>
            Live: {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
    );
};

// --- Main Component ---

export function OwnerSlots() {
    const [ownerData, setOwnerData] = useState<OwnerData | null>(null);
    const [turfData, setTurfData] = useState<TurfData | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [slots, setSlots] = useState<SlotType[]>([]);
    const { bookings, bookSlot, cancelBooking, loading: contextLoading } = useDashboard();
    const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [isBookModalOpen, setIsBookModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingBooking, setEditingBooking] = useState<BookingType | null>(null);

    // Ground & time format state
    const [grounds, setGrounds] = useState<GroundConfig[]>([]);
    const [selectedGround, setSelectedGround] = useState<GroundConfig | null>(null);
    const [timeFormat, setTimeFormat] = useState<'12hr' | '24hr'>(() => {
        return (localStorage.getItem('slotTimeFormat') as '12hr' | '24hr') || '12hr';
    });

    // Popup State
    const [popup, setPopup] = useState<{
        isOpen: boolean;
        slot: SlotType | null;
        status: 'available' | 'booked' | 'blocked' | 'pending';
        booking?: BookingType;
        position: { x: number, y: number };
    }>({ isOpen: false, slot: null, status: 'available', position: { x: 0, y: 0 } });

    // Persist time format
    useEffect(() => {
        localStorage.setItem('slotTimeFormat', timeFormat);
    }, [timeFormat]);

    // Auth & Data Fetching
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                fetchData();
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // Derived State: Grounds
    useEffect(() => {
        if (turfData) {
            const turfGrounds = getGroundsForTurf(turfData);
            setGrounds(turfGrounds);
            if (!selectedGround || !turfGrounds.find(g => g.id === selectedGround.id)) {
                setSelectedGround(turfGrounds[0]);
            }
        }
    }, [turfData]);

    // Derived State: Slots (Regenerate when ground changes)
    useEffect(() => {
        if (turfData && selectedGround) {
            const timeSlots = generateTimeSlots(turfData, selectedGround);
            setSlots(timeSlots);
        }
    }, [turfData, selectedGround]);

    // Filter bookings for selected ground and date
    const filteredBookings = useMemo(() => {
        return bookings.filter(b =>
            b.date === selectedDate &&
            (!b.groundId || (selectedGround && b.groundId === selectedGround.id))
        );
    }, [bookings, selectedDate, selectedGround]);

    // Real-time Blocked Slots
    useEffect(() => {
        if (!ownerData || !turfData || !selectedGround) return;
        const blockedQuery = query(
            collection(db, 'blockedSlots'),
            where('turfId', '==', ownerData.turfId),
            where('date', '==', selectedDate)
        );
        const unsubscribe = onSnapshot(blockedQuery, (snapshot) => {
            const blockedData = snapshot.docs
                .map(doc => ({ ...doc.data() })) as BlockedSlot[];
            const filteredBlocked = blockedData.filter(bs =>
                !bs.groundId || bs.groundId === selectedGround.id
            );
            setBlockedSlots(filteredBlocked);
        });
        return () => unsubscribe();
    }, [selectedDate, ownerData, turfData, selectedGround]);

    const fetchData = async () => {
        if (!auth.currentUser) return;
        const user = auth.currentUser;
        try {
            setLoading(true);
            const ownerDoc = await getDoc(doc(db, 'owners', user.uid));
            if (!ownerDoc.exists()) return;
            const owner = ownerDoc.data() as OwnerData;
            setOwnerData(owner);

            const turfDoc = await getDoc(doc(db, 'turf', owner.turfId));
            if (!turfDoc.exists()) return;
            setTurfData({ id: turfDoc.id, ...turfDoc.data() } as TurfData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- Helpers ---

    const getSlotStatus = (slot: SlotType): { status: 'available' | 'booked' | 'blocked' | 'pending'; booking?: BookingType } => {
        const isBlocked = blockedSlots.some(bs => bs.startTime === slot.startTime);
        if (isBlocked) return { status: 'blocked' };



        const booking = filteredBookings.find(b => b.startTime === slot.startTime && b.status !== 'cancelled');
        if (booking) return { status: booking.status === 'pending' ? 'pending' : 'booked', booking };

        return { status: 'available' };
    };

    const pricePerHour = turfData?.pricePerHour || 0;

    const stats = useMemo(() => {
        let available = 0, booked = 0, revenue = 0, potentialRevenue = 0;
        slots.forEach(slot => {
            const { status, booking } = getSlotStatus(slot);
            if (status === 'available') {
                available++;
                potentialRevenue += pricePerHour;
            }
            if (status === 'booked' || status === 'pending' || status === 'blocked') {
                booked++;
                if ((status === 'booked' || status === 'pending') && booking?.amount) {
                    revenue += Number(booking.amount);
                }
            }
        });

        return { available, booked, revenue, potentialRevenue, total: slots.length };
    }, [slots, filteredBookings, blockedSlots, pricePerHour]);

    // --- Actions ---

    const handleBlockSlot = async () => {
        if (!popup.slot || !ownerData || !selectedGround || !auth.currentUser) return;
        try {
            const slotId = `${ownerData.turfId}_${selectedGround.id}_${selectedDate}_${popup.slot.startTime}`;
            const blockedSlotData: BlockedSlot = {
                turfId: ownerData.turfId,
                groundId: selectedGround.id,
                date: selectedDate,
                startTime: popup.slot.startTime,
                endTime: popup.slot.endTime,
                blockedAt: Timestamp.now(),
                blockedBy: auth.currentUser.uid
            };
            await setDoc(doc(db, 'blockedSlots', slotId), blockedSlotData);
            setPopup(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
            alert('Failed to block slot. Check stats/permissions.');
        }
    };

    const handleUnblockSlot = async () => {
        if (!popup.slot || !ownerData || !selectedGround) return;
        try {
            const slotId = `${ownerData.turfId}_${selectedGround.id}_${selectedDate}_${popup.slot.startTime}`;
            await deleteDoc(doc(db, 'blockedSlots', slotId));
            setPopup(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
            alert('Failed to unblock slot.');
        }
    };

    const handleBlockEntireDay = async () => {
        if (!confirm('Block ALL available slots for this day?')) return;
        // Implementation similar to original, loops slots and blocks available ones
        if (!ownerData || !selectedGround || !auth.currentUser) return;
        const promises = slots.map(async (slot) => {
            const { status } = getSlotStatus(slot);
            if (status === 'available') {
                const slotId = `${ownerData.turfId}_${selectedGround.id}_${selectedDate}_${slot.startTime}`;
                await setDoc(doc(db, 'blockedSlots', slotId), {
                    turfId: ownerData.turfId,
                    groundId: selectedGround.id,
                    date: selectedDate,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    blockedAt: Timestamp.now(),
                    blockedBy: auth.currentUser!.uid
                });
            }
        });
        await Promise.all(promises);
    };

    const handleUnblockAll = async () => {
        if (!confirm('Unblock ALL blocked slots for this day?')) return;
        if (!ownerData || !selectedGround) return;
        const promises = blockedSlots.map(async (bs) => {
            const slotId = `${ownerData.turfId}_${selectedGround.id}_${selectedDate}_${bs.startTime}`;
            await deleteDoc(doc(db, 'blockedSlots', slotId));
        });
        await Promise.all(promises);
    };

    const handleManualBooking = async (formData: any) => {
        if (!popup.slot || !selectedGround || !ownerData) return;

        try {
            if (isEditMode && editingBooking) {
                // Update existing booking
                const bookingRef = doc(db, 'bookings', editingBooking.id);
                await updateDoc(bookingRef, {
                    customerName: formData.customerName,
                    customerPhone: formData.customerPhone,
                    sport: formData.sportType,
                    teamName: formData.teamName || null,
                    amount: Number(formData.amount),
                    paymentMethod: formData.paymentMethod,
                    notes: formData.notes || null,
                });
                alert('Booking updated successfully ✓');
            } else {
                // Create new booking
                await bookSlot(
                    { ...popup.slot, date: selectedDate, price: turfData?.pricePerHour || 0 },
                    selectedGround.id,
                    selectedGround.name,
                    formData
                );
                alert('Slot booked successfully ✓');
            }
            setIsBookModalOpen(false);
            setIsEditMode(false);
            setEditingBooking(null);
            setPopup(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
            console.error(error);
            alert(isEditMode ? 'Failed to update booking.' : 'Failed to book slot.');
        }
    };

    const handleCancelBookingAction = async () => {
        if (!popup.booking || !popup.slot) return;
        if (!confirm(`Cancel this booking for ${popup.booking.customerName}?`)) return;

        try {
            const slotRefId = `${ownerData?.turfId}_${selectedGround?.id}_${selectedDate}_${popup.slot.startTime}`;
            await cancelBooking(popup.booking.id, slotRefId);
            setPopup(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
            alert('Failed to cancel booking');
        }
    };

    const openPopup = (e: React.MouseEvent, slot: SlotType) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const { status, booking } = getSlotStatus(slot);
        setPopup({
            isOpen: true,
            slot,
            status,
            booking,
            // Store the slot card rect center as initial hint — will be adjusted by ref
            position: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
        });
    };

    // Callback ref to position the popup after it renders (measures actual size)
    const popupRef = useCallback((node: HTMLDivElement | null) => {
        if (!node) return;
        const popupRect = node.getBoundingClientRect();
        const pw = popupRect.width;
        const ph = popupRect.height;
        const pad = 12;

        // Center horizontally on the stored position, clamp to viewport
        let x = popup.position.x - pw / 2;
        if (x + pw > window.innerWidth - pad) x = window.innerWidth - pw - pad;
        if (x < pad) x = pad;

        // Vertically: try below the click point, flip above if no room
        let y = popup.position.y + 20; // below the center of the card
        if (y + ph > window.innerHeight - pad) {
            // Not enough room below — show above
            y = popup.position.y - ph - 20;
        }
        // Final clamp
        if (y < pad) y = pad;
        if (y + ph > window.innerHeight - pad) y = window.innerHeight - ph - pad;

        node.style.left = `${x}px`;
        node.style.top = `${y}px`;
    }, [popup.position.x, popup.position.y]);

    // --- Render Helpers ---

    const formatHour = (time: string) => {
        if (timeFormat === '24hr') return time;
        const [h, m] = time.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${display}:${m} ${ampm}`;
    };

    const isSlotPassed = (slot: SlotType): boolean => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        if (selectedDate < todayStr) return true;
        if (selectedDate > todayStr) return false;

        const [h, m] = slot.startTime.split(':').map(Number);
        const slotDate = new Date();
        slotDate.setHours(h, m, 0, 0);

        return now > slotDate; // Passed if current time is after start time
    };

    if (loading) return <div className={styles.loading}>Loading Dashboard...</div>;
    if (!ownerData || !turfData) return <div className={styles.loading}>Error loading data.</div>;

    return (
        <div className={styles.container} onClick={() => popup.isOpen && setPopup(p => ({ ...p, isOpen: false }))}>

            {/* Header */}
            <div className={styles.header}>
                <div className={styles.titleGroup}>
                    <h1>Slot Manager</h1>
                    <p>Overview for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <LiveClock />
            </div>

            {/* Stat Cards */}
            <div className={styles.statsGrid}>
                <StatCard label="Available Slots" value={stats.available} color="#10B981" icon="🟢" delay={0.1} />
                <StatCard label="Booked Slots" value={stats.booked} color="#EF4444" icon="🔴" delay={0.2} />
                <StatCard label="Booked Revenue" value={`₹${stats.revenue.toLocaleString()}`} color="#3B82F6" icon="💰" delay={0.3} />
                <StatCard label="Est. Total" value={`₹${(stats.revenue + stats.potentialRevenue).toLocaleString()}`} color="#8B5CF6" icon="📊" delay={0.4} />
            </div>

            {/* Controls */}
            <div className={styles.controlsLayout}>
                <div className={styles.toolbarTop}>
                    {/* Date Nav */}
                    <div className={styles.dateGroup}>
                        <button onClick={() => setSelectedDate(d => {
                            const date = new Date(d); date.setDate(date.getDate() - 1); return date.toISOString().split('T')[0];
                        })}>← Prev</button>
                        <button style={{ cursor: 'default' }}>{selectedDate}</button>
                        <button onClick={() => setSelectedDate(d => {
                            const date = new Date(d); date.setDate(date.getDate() + 1); return date.toISOString().split('T')[0];
                        })}>Next →</button>
                    </div>

                    {/* Ground Toggle */}
                    <div className={styles.groundPills}>
                        {grounds.map(g => (
                            <button
                                key={g.id}
                                className={`${styles.groundPill} ${selectedGround?.id === g.id ? styles.groundPillActive : ''}`}
                                onClick={() => setSelectedGround(g)}
                            >
                                🏟️ {g.name}
                            </button>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className={styles.quickActions}>
                        <button className={styles.actionButton} onClick={() => setTimeFormat(prev => prev === '12hr' ? '24hr' : '12hr')}>
                            🕐 {timeFormat}
                        </button>
                        <button className={styles.actionButton} onClick={handleBlockEntireDay} style={{ color: '#DC2626' }}>
                            🚫 Block Day
                        </button>
                        <button className={styles.actionButton} onClick={handleUnblockAll} style={{ color: '#10B981' }}>
                            ✓ Unblock All
                        </button>
                    </div>
                </div>

                {/* Visual Timeline Bar */}
                <div className={styles.timelineSection}>
                    <div className={styles.timelineHeader}>
                        <span className={styles.timelineLabel}>Day Overview ({new Date(selectedDate).toLocaleDateString()})</span>
                    </div>
                    <div className={styles.timelineBar}>
                        {slots.map((slot, i) => {
                            const { status } = getSlotStatus(slot);
                            const isPassed = isSlotPassed(slot);
                            let bg = '#E5E7EB';

                            if (isPassed) {
                                bg = '#D1D5DB'; // Gray for passed
                            } else {
                                if (status === 'available') bg = '#10B981';
                                if (status === 'booked' || status === 'pending') bg = '#EF4444';
                                // Blocked stays gray/default unless I want to change it
                            }

                            return (
                                <div
                                    key={i}
                                    className={styles.timelineSegment}
                                    style={{ backgroundColor: bg, opacity: isPassed ? 0.5 : 1 }}
                                    title={`${formatHour(slot.startTime)} - ${status} ${isPassed ? '(Passed)' : ''}`}
                                    onClick={(e) => { e.stopPropagation(); if (!isPassed) openPopup(e, slot); }}
                                />
                            );
                        })}
                    </div>
                    <div className={styles.timelineTimeLabels}>
                        <span>6 AM</span>
                        <span>9 AM</span>
                        <span>12 PM</span>
                        <span>3 PM</span>
                        <span>6 PM</span>
                        <span>9 PM</span>
                        <span>11 PM</span>
                    </div>
                </div>
            </div>

            {/* Slot Grid */}
            <motion.div className={styles.slotGrid} layout>
                <AnimatePresence>
                    {slots.map((slot, i) => {
                        const { status, booking } = getSlotStatus(slot);
                        const isPassed = isSlotPassed(slot);

                        return (
                            <motion.div
                                key={slot.id}
                                className={`${styles.slotCard} ${isPassed ? styles.statusPassed : (status === 'available' ? styles.statusAvailable : (status === 'booked' || status === 'blocked') ? styles.statusBooked : styles.statusBlocked)}`}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.02 }}
                                onClick={(e) => { e.stopPropagation(); if (!isPassed) openPopup(e, slot); }}
                            >
                                <div className={styles.slotTime}>
                                    {formatHour(slot.startTime)} - {formatHour(slot.endTime)}
                                </div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: (status === 'booked' || status === 'pending') && booking?.amount ? '#059669' : '#6B7280', margin: '2px 0' }}>
                                    ₹{(status === 'booked' || status === 'pending') && booking?.amount ? Number(booking.amount).toLocaleString() : pricePerHour.toLocaleString()}
                                </div>
                                <span className={`${styles.slotStatusBadge} ${status === 'available' ? styles.badgeAvailable : (status === 'booked' || status === 'blocked') ? styles.badgeBooked : styles.badgeBlocked}`}>
                                    {isPassed ? 'Passed' : (status === 'blocked' ? 'Booked' : status)}
                                </span>
                                {booking && <div className={styles.customerName}>👤 {booking.customerName}</div>}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </motion.div>

            {/* Popup */}
            {popup.isOpen && popup.slot && (
                <>
                    <div className={styles.popupOverlay} onClick={() => setPopup(prev => ({ ...prev, isOpen: false }))}></div>
                    <div ref={popupRef} className={styles.popupContent} style={{ top: 0, left: 0 }} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.popupHeader}>
                            <div className={styles.popupTime}>
                                {formatHour(popup.slot.startTime)} - {formatHour(popup.slot.endTime)}
                            </div>
                            <div className={styles.popupStatus} style={{ color: popup.status === 'available' ? '#10B981' : popup.status === 'booked' ? '#EF4444' : '#6B7280' }}>
                                ● {popup.status.toUpperCase()}
                            </div>
                        </div>
                        <div className={styles.popupBody}>
                            {popup.status === 'available' && (
                                <>
                                    <div style={{ fontSize: '13px', color: '#059669', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        💰 Price: ₹{pricePerHour.toLocaleString()}
                                    </div>
                                    <button className={`${styles.popupBtn} ${styles.btnPrimary}`} onClick={() => { setIsBookModalOpen(true); }} style={{ marginBottom: '4px' }}>
                                        📋 Book This Slot
                                    </button>
                                    <button className={`${styles.popupBtn} ${styles.btnDanger}`} onClick={handleBlockSlot}>
                                        🚫 Block This Slot
                                    </button>
                                </>
                            )}
                            {popup.status === 'blocked' && (
                                <button className={`${styles.popupBtn} ${styles.btnPrimary}`} onClick={handleUnblockSlot}>
                                    ✓ Unblock Slot
                                </button>
                            )}
                            {(popup.status === 'booked' || popup.status === 'pending') && popup.booking && (
                                <>
                                    <div style={{ fontSize: '13px', color: '#4B5563', marginBottom: '8px' }}>
                                        Booked by <strong>{popup.booking.customerName}</strong><br />
                                        {popup.booking.customerPhone}<br />
                                        <span style={{ color: '#059669', fontWeight: 600 }}>Amount: ₹{Number(popup.booking.amount).toLocaleString()}</span>
                                        {popup.booking.bookedBy && <><br /><span style={{ fontSize: '11px', color: '#9CA3AF' }}>via {popup.booking.bookedBy === 'owner' ? 'Owner' : 'User'}</span></>}
                                    </div>
                                    <a href={`tel:${popup.booking.customerPhone}`} className={`${styles.popupBtn} ${styles.btnAction}`} style={{ display: 'block', textDecoration: 'none' }}>
                                        📞 Call Customer
                                    </a>
                                    <button className={`${styles.popupBtn} ${styles.btnEdit}`} onClick={() => {
                                        setEditingBooking(popup.booking!);
                                        setIsEditMode(true);
                                        setIsBookModalOpen(true);
                                    }} style={{ marginTop: '4px' }}>
                                        ✏️ Edit Booking
                                    </button>
                                    <button className={`${styles.popupBtn} ${styles.btnDanger}`} onClick={handleCancelBookingAction} style={{ marginTop: '4px' }}>
                                        ✕ Cancel Booking
                                    </button>
                                </>
                            )}
                            <button className={styles.popupBtn} style={{ marginTop: '4px', color: '#6B7280' }} onClick={() => setPopup(prev => ({ ...prev, isOpen: false }))}>
                                Close
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Bottom Summary Bar */}
            <div className={styles.summaryBar}>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Available</span>
                    <span className={styles.summaryValue} style={{ color: '#10B981' }}>{stats.available}</span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Booked</span>
                    <span className={styles.summaryValue} style={{ color: '#EF4444' }}>{stats.booked}</span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Occupancy</span>
                    <span className={styles.summaryValue}>
                        {stats.total > 0 ? Math.round((stats.booked / stats.total) * 100) : 0}%
                    </span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Price/Slot</span>
                    <span className={styles.summaryValue} style={{ color: '#8B5CF6' }}>₹{pricePerHour.toLocaleString()}</span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Revenue</span>
                    <span className={styles.summaryValue} style={{ color: '#3B82F6' }}>₹{stats.revenue.toLocaleString()}</span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Est. Total</span>
                    <span className={styles.summaryValue} style={{ color: '#8B5CF6' }}>₹{(stats.revenue + stats.potentialRevenue).toLocaleString()}</span>
                </div>
            </div>
            {/* Book/Edit Slot Modal */}
            {popup.slot && (
                <BookSlotModal
                    isOpen={isBookModalOpen}
                    onClose={() => { setIsBookModalOpen(false); setIsEditMode(false); setEditingBooking(null); }}
                    onConfirm={handleManualBooking}
                    slot={{ ...popup.slot, date: selectedDate, price: turfData?.pricePerHour || 0 }}
                    groundName={selectedGround?.name || ''}
                    editData={isEditMode && editingBooking ? {
                        customerName: editingBooking.customerName,
                        customerPhone: editingBooking.customerPhone,
                        sportType: editingBooking.sport,
                        teamName: editingBooking.teamName || '',
                        amount: String(editingBooking.amount),
                        paymentMethod: editingBooking.paymentMethod || 'Cash',
                        notes: editingBooking.notes || '',
                    } : undefined}
                />
            )}
        </div>
    );
}
