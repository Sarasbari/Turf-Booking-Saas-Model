# Firebase Firestore Integration - Quick Start Guide

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd c:\coding\TurfBookingSystem\frontend
npm install firebase
```

### 2. Configure Environment Variables

Update the `.env` file with your actual Firebase configuration from the Firebase Console:

```env
VITE_FIREBASE_API_KEY=your_actual_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=turf-database.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=turf-database
VITE_FIREBASE_STORAGE_BUCKET=turf-database.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
VITE_FIREBASE_APP_ID=your_actual_app_id
```

**Where to find these values:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `turf-database`
3. Click ⚙️ Settings → Project settings
4. Scroll to "Your apps" section
5. Click on your web app or create one
6. Copy the config values

### 3. Deploy Security Rules

1. Go to Firebase Console → Firestore Database → Rules
2. Copy the contents of `firestore-security-rules.txt`
3. Paste into the rules editor
4. Click "Publish"

### 4. Seed Sample Data

Create a temporary admin page or use browser console:

```javascript
import { seedDatabase } from './utils/seedFirestore';

// Run this once to populate your database
seedDatabase().then(result => {
  console.log(result);
});
```

This will create:
- 3 sample users
- 2 sample owners
- 3 sample turfs (Mumbai and Pune)

---

## 📁 File Structure

```
frontend/
├── src/
│   ├── firebase/
│   │   ├── config.js          # Firebase initialization
│   │   ├── auth.js            # Authentication functions
│   │   ├── turfs.js           # Turf CRUD operations
│   │   ├── bookings.js        # Booking operations
│   │   └── owners.js          # Owner profile operations
│   │
│   ├── pages/
│   │   ├── HomePage.jsx       # Browse all turfs
│   │   ├── TurfDetailPage.jsx # Single turf view
│   │   └── OwnerEditTurf.jsx  # Edit turf form
│   │
│   └── utils/
│       └── seedFirestore.js   # Database seeding
│
├── .env                        # Environment variables
├── firestore-security-rules.txt
└── testing-checklist.md
```

---

## 🔥 Common Usage Patterns

### Authentication

```javascript
import { signInWithGoogle, signOut, getCurrentUser } from './firebase/auth';

// Sign in with Google
const handleSignIn = async () => {
  try {
    const user = await signInWithGoogle();
    console.log('Signed in:', user);
  } catch (error) {
    console.error('Sign in failed:', error);
  }
};

// Sign out
const handleSignOut = async () => {
  await signOut();
};

// Get current user
const user = getCurrentUser();
if (user) {
  console.log('User is signed in:', user.displayName);
}
```

### Fetch Turfs

```javascript
import { getAllTurfs, getTurfById, getTurfsByCity } from './firebase/turfs';

// Get all active turfs
const turfs = await getAllTurfs();

// Get single turf
const turf = await getTurfById('green-arena-andheri');

// Filter by city
const mumbaiTurfs = await getTurfsByCity('Mumbai');
```

### Real-Time Updates

```javascript
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase/config';

useEffect(() => {
  const turfRef = doc(db, 'turfs', turfId);
  
  // Set up real-time listener
  const unsubscribe = onSnapshot(turfRef, (snapshot) => {
    if (snapshot.exists()) {
      setTurf(snapshot.data());
    }
  });
  
  // Cleanup on unmount
  return () => unsubscribe();
}, [turfId]);
```

### Create Booking

```javascript
import { createBooking } from './firebase/bookings';

const bookingData = {
  turfId: 'green-arena-andheri',
  turfName: 'Green Arena Turf',
  turfLocation: 'Andheri West, Mumbai',
  userName: 'John Doe',
  userEmail: 'john@example.com',
  userPhone: '+91 98765 43210',
  ownerId: 'owner123',
  date: '2026-02-15',
  startTime: '18:00',
  endTime: '20:00',
  duration: 2,
  pricePerHour: 600,
  totalAmount: 1200,
  platformFee: 240,
  ownerAmount: 960,
};

const booking = await createBooking(bookingData);
```

### Update Turf (Owner Only)

```javascript
import { updateTurf } from './firebase/turfs';
import { getCurrentUser } from './firebase/auth';

const user = getCurrentUser();

const updates = {
  pricing: {
    basePrice: 650,
    weekendPrice: 750,
    peakHourPrice: 850,
  },
  status: 'active',
};

await updateTurf('green-arena-andheri', updates, user.uid);
```

---

## 🔒 Security Rules Summary

### Turfs Collection
- **Read:** Anyone can read active turfs; authenticated users can read all
- **Create:** Only owners can create turfs
- **Update:** Only turf owner or admin can update
- **Delete:** Only turf owner or admin can delete

### Users Collection
- **Read:** Any authenticated user
- **Write:** Only to own document

### Owners Collection
- **Read:** Anyone (for displaying on turf pages)
- **Write:** Only associated user or admin

### Bookings Collection
- **Read:** User's own bookings or owner's turf bookings
- **Create:** Any authenticated user
- **Update:** Booking owner or turf owner
- **Delete:** Admin only

---

## 🎨 Component Examples

### Display Turfs Grid

```jsx
import { useState, useEffect } from 'react';
import { getAllTurfs } from './firebase/turfs';

function TurfsPage() {
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTurfs = async () => {
      try {
        const data = await getAllTurfs();
        setTurfs(data);
      } finally {
        setLoading(false);
      }
    };
    fetchTurfs();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-4 gap-6">
      {turfs.map(turf => (
        <TurfCard key={turf.id} turf={turf} />
      ))}
    </div>
  );
}
```

### Authentication Button

```jsx
import { signInWithGoogle, signOut, onAuthChange } from './firebase/auth';

function AuthButton() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthChange((authUser) => {
      setUser(authUser);
    });
    return () => unsubscribe();
  }, []);

  if (user) {
    return (
      <button onClick={signOut}>
        Sign Out ({user.displayName})
      </button>
    );
  }

  return <button onClick={signInWithGoogle}>Sign In with Google</button>;
}
```

---

## 🐛 Troubleshooting

### Firebase Not Initialized

**Error:** `Firebase initialization error`

**Solution:**
1. Check `.env` file has all required variables
2. Verify no placeholder values (e.g., `your_api_key_here`)
3. Restart development server after changing `.env`

### Permission Denied

**Error:** `Missing or insufficient permissions`

**Solution:**
1. Deploy security rules to Firebase Console
2. Ensure user is authenticated
3. Check user has correct role (owner/customer/admin)

### Real-Time Updates Not Working

**Solution:**
1. Verify `onSnapshot` listener is set up correctly
2. Check cleanup function is called on unmount
3. Ensure Firestore rules allow read access

### Ownership Verification Failing

**Solution:**
1. User document must have `ownerId` field
2. User role must be `"owner"`
3. `ownerId` must match turf's `ownerId`

---

## 📊 Data Models

### Turf Document

```typescript
{
  id: "green-arena-andheri",
  name: "Green Arena Turf",
  description: "Premium 7-a-side football turf...",
  sport: "Football",
  turfSize: "7-a-side",
  surfaceType: "Artificial Grass",
  location: {
    address: "Veera Desai Road, Andheri West",
    city: "Mumbai",
    pincode: "400053",
    coordinates: { lat: 19.1334, lng: 72.8291 }
  },
  amenities: ["Parking", "Changing Room", "Floodlights"],
  images: ["https://..."],
  coverImage: "https://...",
  pricing: {
    basePrice: 600,
    weekendPrice: 700,
    peakHourPrice: 800
  },
  operatingHours: {
    opensAt: "06:00",
    closesAt: "23:00",
    availableDays: ["Monday", "Tuesday", ...]
  },
  ownerId: "owner123",
  ownerName: "Rajesh Kumar",
  ownerPhone: "+91 98765 43210",
  rating: 4.5,
  totalReviews: 128,
  totalBookings: 0,
  status: "active",
  isApproved: true,
  isFeatured: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### User Document

```typescript
{
  id: "user123",
  name: "John Doe",
  email: "john@example.com",
  picture: "https://...",
  phone: "+91 98765 43210",
  role: "customer", // or "owner" or "admin"
  ownerId: null, // or "owner123" if owner
  preferredLocation: "Mumbai",
  favoriteSport: "Football",
  favorites: ["green-arena-andheri"],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Booking Document

```typescript
{
  id: "TRF-2026-12345",
  bookingId: "TRF-2026-12345",
  turfId: "green-arena-andheri",
  turfName: "Green Arena Turf",
  turfLocation: "Andheri West, Mumbai",
  userId: "user123",
  userName: "John Doe",
  userEmail: "john@example.com",
  userPhone: "+91 98765 43210",
  ownerId: "owner123",
  date: "2026-02-15",
  startTime: "18:00",
  endTime: "20:00",
  duration: 2,
  pricePerHour: 600,
  totalAmount: 1200,
  platformFee: 240,
  ownerAmount: 960,
  status: "confirmed",
  paymentStatus: "pending",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  completedAt: null
}
```

---

## 🎯 Next Steps

1. **Configure Firebase Project:**
   - Update `.env` with actual credentials
   - Enable Google Authentication in Firebase Console

2. **Deploy Security Rules:**
   - Copy from `firestore-security-rules.txt`
   - Publish in Firebase Console

3. **Seed Database:**
   - Run `seedDatabase()` function
   - Verify data in Firestore

4. **Test Application:**
   - Follow `testing-checklist.md`
   - Verify all features work correctly

5. **Integrate with Existing App:**
   - Import components into your app
   - Set up routing for pages
   - Add authentication UI

---

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [React Firebase Hooks](https://github.com/CSFrequency/react-firebase-hooks)
- [Firebase Console](https://console.firebase.google.com/)

---

## 💡 Tips

1. **Always use serverTimestamp()** for dates
2. **Clean up listeners** in useEffect cleanup
3. **Verify ownership** before write operations
4. **Use environment variables** for sensitive config
5. **Test security rules** thoroughly before production
6. **Enable Firestore indexes** for complex queries
7. **Monitor usage** in Firebase Console

---

**Need help?** Check the testing checklist or Firebase documentation!
