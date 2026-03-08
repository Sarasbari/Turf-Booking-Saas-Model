import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
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

    useEffect(() => {
        if (!ownerData?.turfId) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'bookings'),
            where('turfId', '==', ownerData.turfId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const bookingsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as BookingType[];

            // Sort by createdAt desc by default
            bookingsData.sort((a, b) => {
                const dateA = a.createdAt?.toMillis() || 0;
                const dateB = b.createdAt?.toMillis() || 0;
                return dateB - dateA;
            });

            setBookings(bookingsData);
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
