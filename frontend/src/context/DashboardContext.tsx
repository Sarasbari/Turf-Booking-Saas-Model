import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    getDoc,
    writeBatch,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { BookingType, OwnerData, TurfData, SlotType } from '../types/owner';

interface BookingFormData {
    customerName: string;
    customerPhone: string;
    sportType: string;
    teamName?: string;
    amount: string;
    paymentMethod: string;
    notes?: string;
}

interface UserProfile {
    name?: string;
    email?: string;
    phone?: string;
    picture?: string;
    photoURL?: string;
}

interface DashboardContextType {
    bookings: BookingType[];
    loading: boolean;
    bookSlot: (slot: SlotType & { date: string, price: number }, groundId: string, groundName: string, formData: BookingFormData) => Promise<void>;
    cancelBooking: (bookingId: string, slotId: string) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({
    children,
    ownerData,
    turfData
}: {
    children: ReactNode;
    ownerData: OwnerData | null;
    turfData: TurfData | null;
}) {
    const [bookings, setBookings] = useState<BookingType[]>([]);
    const [loading, setLoading] = useState(true);
    const userCacheRef = useRef<Map<string, UserProfile>>(new Map());

    useEffect(() => {
        if (!ownerData?.turfId) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'bookings'),
            where('turfId', '==', ownerData.turfId)
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const rawBookings = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            })) as (BookingType & {
                userName?: string;
                userEmail?: string;
                userPhone?: string;
            })[];

            // ── Enrich bookings with user details ──
            // Collect unique userIds that need profile fetching
            const userIdsToFetch = new Set<string>();
            for (const b of rawBookings) {
                if (b.userId && !b.customerName && !userCacheRef.current.has(b.userId)) {
                    userIdsToFetch.add(b.userId);
                }
            }

            // Fetch user profiles in parallel (with cache)
            if (userIdsToFetch.size > 0) {
                const fetchPromises = Array.from(userIdsToFetch).map(async (uid) => {
                    try {
                        const userDoc = await getDoc(doc(db, 'users', uid));
                        if (userDoc.exists()) {
                            userCacheRef.current.set(uid, userDoc.data() as UserProfile);
                        } else {
                            // Cache empty so we don't re-fetch
                            userCacheRef.current.set(uid, {});
                        }
                    } catch (err) {
                        console.warn(`Failed to fetch user profile for ${uid}:`, err);
                        userCacheRef.current.set(uid, {});
                    }
                });
                await Promise.all(fetchPromises);
            }

            // Map raw booking data to BookingType with enriched user info
            const enrichedBookings: BookingType[] = rawBookings.map(b => {
                const raw = b as any;
                const userProfile = b.userId ? userCacheRef.current.get(b.userId) : undefined;

                // Resolve customer details: booking fields → raw userName/userEmail → user profile
                const customerName = b.customerName
                    || raw.userName
                    || userProfile?.name
                    || '';
                const customerPhone = b.customerPhone
                    || raw.userPhone
                    || userProfile?.phone
                    || '';
                const customerPhoto = b.customerPhoto
                    || userProfile?.picture
                    || userProfile?.photoURL
                    || '';

                // Resolve date: booking.date or booking.bookedDate
                const date = b.date || raw.bookedDate || '';

                // Resolve time fields: startTime/endTime or derive from timeSlots
                let startTime = b.startTime || '';
                let endTime = b.endTime || '';
                if (!startTime && Array.isArray(raw.timeSlots) && raw.timeSlots.length > 0) {
                    const sorted = [...raw.timeSlots].sort();
                    startTime = sorted[0];
                    // endTime = last slot + 1 hour
                    const lastHour = parseInt(sorted[sorted.length - 1].split(':')[0], 10);
                    endTime = `${String(lastHour + 1).padStart(2, '0')}:00`;
                }

                // Resolve amount
                const amount = b.amount || raw.totalPrice || 0;

                return {
                    ...b,
                    customerName,
                    customerPhone,
                    customerPhoto,
                    date,
                    startTime,
                    endTime,
                    amount,
                    bookedBy: b.bookedBy || (raw.userName ? 'user' : undefined),
                } as BookingType;
            });

            // Sort by createdAt desc by default
            enrichedBookings.sort((a, b) => {
                const dateA = a.createdAt?.toMillis?.() || 0;
                const dateB = b.createdAt?.toMillis?.() || 0;
                return dateB - dateA;
            });

            setBookings(enrichedBookings);
            setLoading(false);
        }, (error) => {
            console.error("Error listening to bookings:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [ownerData?.turfId]);

    const bookSlot = async (slot: SlotType, groundId: string, groundName: string, formData: BookingFormData) => {
        if (!ownerData?.turfId || !turfData) throw new Error("Missing owner or turf data");

        const batch = writeBatch(db);
        const bookingRef = doc(collection(db, 'bookings'));

        // Ensure we handle the date correctly
        // The slot object from SlotManager usually has date in ISO string YYYY-MM-DD
        // But let's rely on what's passed or derived. 
        // NOTE: The slot object in OwnerSlots might not have the date directly attached 
        // if it's just a time object, need to ensure we pass the context's selectedDate 
        // or the slot has it. 
        // Looking at OwnerSlots.tsx, the slot types are generated. 
        // We will assume the caller passes the correct date context if needed, 
        // but wait... SlotType in types/owner.ts only has startTime, endTime, label, id.
        // It does NOT have date. 
        // I should probably ask for date as an argument or assume it comes in the slot object if modified.
        // I will add `date` to the arguments of bookSlot to be safe.
        // Actually, looking at the request, the user provided code snippet uses `slot.date`.
        // I'll assume the caller extends the slot object or passes the date.
        // Let's UPDATE the signature to accept date explicitly to be safe.

        // Wait, I can't change the interface signature in the middle of writing the file easily without consistency.
        // I'll stick to the plan: `bookSlot(slot: SlotType, ...)` implies slot might have it. 
        // BUT standard SlotType doesn't. 
        // I will trust the User's snippet which implies `slot.date`.
        // To make TS happy, I might need to cast or expect an intersection type.
        // Let's add `date` as a separate arg to be clean.
    };

    // RE-WRITING the function body to matches my thought process above
    // I will add date as a param to bookSlot implementation below.

    return (
        <DashboardContext.Provider value={{
            bookings,
            loading,
            bookSlot: async (slot: SlotType & { date: string, price: number }, groundId: string, groundName: string, formData: BookingFormData) => {
                if (!ownerData?.turfId) throw new Error("No turf ID");

                const batch = writeBatch(db);
                const bookingRef = doc(collection(db, 'bookings'));

                // Parse startHour and duration for user-side compatibility
                // User-side fetchBookings checks data.startHour + data.duration
                const startHour = parseInt(slot.startTime.split(':')[0], 10);
                const endHour = parseInt(slot.endTime.split(':')[0], 10);
                const duration = endHour > startHour ? endHour - startHour : 1;

                const bookingData = {
                    turfId: ownerData.turfId,
                    turfName: turfData?.name || '',
                    bookingId: bookingRef.id,
                    slotId: slot.id,
                    groundId,
                    groundName,
                    date: slot.date,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    // Fields required by user-side slot detection
                    startHour,
                    duration,
                    sport: formData.sportType,
                    teamName: formData.teamName || null,
                    customerName: formData.customerName,
                    customerPhone: formData.customerPhone,
                    userName: formData.customerName,
                    amount: Number(formData.amount),
                    paymentMethod: formData.paymentMethod,
                    paymentStatus: "paid",
                    status: "confirmed",
                    bookedBy: "owner",
                    notes: formData.notes || null,
                    createdAt: serverTimestamp(),
                    userId: 'owner_manual_booking'
                };

                batch.set(bookingRef, bookingData);
                // Skipping slot doc update as slots are dynamic
                await batch.commit();
            },
            cancelBooking: async (bookingId: string, slotId: string) => {
                if (!ownerData?.turfId) return;
                const batch = writeBatch(db);
                const bookingRef = doc(db, 'bookings', bookingId);

                batch.update(bookingRef, {
                    status: 'cancelled',
                    cancelledAt: serverTimestamp(),
                    cancelledBy: 'owner'
                });

                // Again, ignoring slot restore if slot doc doesn't exist.
                // If there WAS a slot doc, I'd update it. 

                await batch.commit();
            }
        }}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (context === undefined) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
}
