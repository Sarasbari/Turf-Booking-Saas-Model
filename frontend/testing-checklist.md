# Firebase Firestore Integration - Testing Checklist

## Prerequisites

- [ ] Firebase SDK installed (`npm install firebase`)
- [ ] Environment variables configured in `.env` file
- [ ] Firebase project created in Firebase Console
- [ ] Firestore database enabled (Test mode initially)

---

## 1. Firebase Initialization

### Browser Console Tests

1. **Open your application in browser**
2. **Open Developer Console** (F12)
3. **Check for initialization messages:**
   - ✅ Should see: `✅ Firebase initialized successfully`
   - ✅ Should see: `📦 Project ID: turf-database`
   - ❌ Should NOT see any Firebase errors

### Verification Steps

- [ ] No Firebase initialization errors in console
- [ ] Firebase config loaded from environment variables
- [ ] `db`, `auth`, `storage` instances are defined

---

## 2. Authentication Flow

### Google Sign-In

1. **Test Sign-In:**
   - [ ] Click Google sign-in button
   - [ ] Google OAuth popup appears
   - [ ] Successfully sign in with Google account
   - [ ] Console shows: `✅ Signed in successfully: [Your Name]`

2. **User Document Creation:**
   - [ ] Go to Firebase Console → Firestore Database
   - [ ] Navigate to `users` collection
   - [ ] Verify your user document exists with:
     - `id`, `name`, `email`, `picture`
     - `role: "customer"` (default)
     - `createdAt` timestamp

3. **Test Sign-Out:**
   - [ ] Click sign-out button
   - [ ] Console shows: `✅ Signed out successfully`
   - [ ] User state cleared

### Role Verification

- [ ] `getCurrentUserRole()` returns correct role
- [ ] `isOwner()` returns `false` for customer accounts

---

## 3. Database Seeding

### Run Seed Script

1. **Create a temporary admin page or use browser console:**

```javascript
import { seedDatabase } from './utils/seedFirestore';

// Run in browser console or temporary page
seedDatabase().then(result => console.log(result));
```

2. **Verify in Firebase Console:**
   - [ ] Navigate to Firestore Database
   - [ ] Check `users` collection: 3 users created
   - [ ] Check `owners` collection: 2 owners created
   - [ ] Check `turfs` collection: 3 turfs created

3. **Verify Data Quality:**
   - [ ] All turfs have complete data (images, pricing, amenities)
   - [ ] Turfs are in different cities (Mumbai, Pune)
   - [ ] Owner IDs match between collections

---

## 4. Basic Turf Operations

### Fetch All Turfs

- [ ] Navigate to HomePage
- [ ] Turfs display in grid layout
- [ ] Shows correct count: "3 turfs available"
- [ ] Each card shows:
  - Cover image
  - Name, location, sport, size
  - Rating and reviews
  - Pricing
  - "View Details" button

### Fetch Single Turf

- [ ] Click on a turf card
- [ ] Navigate to turf detail page
- [ ] All turf information displays correctly:
  - Hero image
  - Description
  - Amenities
  - Operating hours
  - Pricing breakdown
  - Owner contact info

### Filter Turfs by City

```javascript
import { getTurfsByCity } from './firebase/turfs';

getTurfsByCity('Mumbai').then(turfs => {
  console.log(`Found ${turfs.length} turfs in Mumbai`);
});
```

- [ ] Returns only Mumbai turfs (2 turfs)
- [ ] Excludes Pune turfs

### Search with Filters

```javascript
import { searchTurfs } from './firebase/turfs';

searchTurfs({ 
  city: 'Mumbai', 
  sport: 'Football',
  maxPrice: 700 
}).then(turfs => {
  console.log('Filtered turfs:', turfs);
});
```

- [ ] Returns turfs matching all filters
- [ ] Correctly filters by price range

---

## 5. Real-Time Updates

### Test Live Data Synchronization

1. **Open turf detail page in TWO browser windows:**
   - Window A: Customer view (turf detail page)
   - Window B: Owner dashboard (edit turf page)

2. **Edit turf from Window B:**
   - Change turf name
   - Update pricing
   - Click "Save Changes"

3. **Verify in Window A:**
   - [ ] Changes appear INSTANTLY without refresh
   - [ ] No page reload required
   - [ ] All updated fields reflect new values

4. **Check Console:**
   - [ ] No errors during real-time update
   - [ ] onSnapshot listener working correctly

---

## 6. Owner Features

### Owner Authentication

1. **Create test owner account:**
   - Sign in with Google
   - Manually update user document in Firestore:
     - Set `role: "owner"`
     - Set `ownerId: "owner123"`

2. **Verify Owner Access:**
   - [ ] `isOwner()` returns `true`
   - [ ] Can access owner dashboard
   - [ ] Can see "Edit Turf" buttons on owned turfs

### Edit Turf (Ownership Verification)

1. **Edit Own Turf:**
   - [ ] Navigate to owned turf
   - [ ] Click "Edit Turf"
   - [ ] Form pre-fills with existing data
   - [ ] Make changes and save
   - [ ] Console shows: `✅ Turf updated successfully`
   - [ ] Changes reflected in Firestore

2. **Try to Edit Another Owner's Turf:**
   - [ ] Navigate to turf owned by `owner456`
   - [ ] Try to update via code:
   
   ```javascript
   import { updateTurf } from './firebase/turfs';
   import { getCurrentUser } from './firebase/auth';
   
   const user = getCurrentUser();
   updateTurf('playzone-pune-baner', { name: 'Hacked!' }, user.uid)
     .catch(err => console.log('Expected error:', err.message));
   ```
   
   - [ ] Error: `Unauthorized: You do not own this turf`
   - [ ] Update blocked successfully

---

## 7. Security Rules Validation

### Deploy Security Rules

1. **Go to Firebase Console**
2. **Navigate to:** Firestore Database → Rules
3. **Paste security rules** from `firestore-security-rules.txt`
4. **Click "Publish"**
5. **Wait for deployment** (usually instant)

### Test Security Rules

1. **Unauthenticated Access:**
   - [ ] Sign out completely
   - [ ] Can still view active turfs (read access)
   - [ ] Cannot create/update turfs (write blocked)

2. **Customer Access:**
   - [ ] Sign in as customer
   - [ ] Can view all turfs
   - [ ] Can create bookings
   - [ ] Cannot edit other users' data

3. **Owner Access:**
   - [ ] Sign in as owner
   - [ ] Can edit own turfs
   - [ ] Cannot edit other owners' turfs
   - [ ] Can view bookings for own turfs

4. **Test Unauthorized Write:**
   
   ```javascript
   // Try to update another user's document
   import { doc, updateDoc } from 'firebase/firestore';
   import { db } from './firebase/config';
   
   const otherUserRef = doc(db, 'users', 'user456');
   updateDoc(otherUserRef, { name: 'Hacked!' })
     .catch(err => console.log('Blocked by security rules:', err));
   ```
   
   - [ ] Error: `Missing or insufficient permissions`
   - [ ] Security rules working correctly

---

## 8. Booking Operations

### Create Booking

```javascript
import { createBooking } from './firebase/bookings';

const bookingData = {
  turfId: 'green-arena-andheri',
  turfName: 'Green Arena Turf',
  turfLocation: 'Andheri West, Mumbai',
  userName: 'Test User',
  userEmail: 'test@example.com',
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

createBooking(bookingData).then(booking => {
  console.log('Booking created:', booking);
});
```

- [ ] Booking created successfully
- [ ] Booking ID generated (format: `TRF-2026-XXXXX`)
- [ ] Document appears in Firestore `bookings` collection

### Fetch User Bookings

- [ ] `getBookingsByUser(userId)` returns user's bookings
- [ ] Sorted by creation date (newest first)

### Cancel Booking

- [ ] User can cancel their own booking
- [ ] Status changes to `cancelled`
- [ ] Payment status changes to `refunded`
- [ ] Cannot cancel another user's booking

---

## 9. Performance & Optimization

### Loading States

- [ ] Loading spinner shows while fetching data
- [ ] Smooth transition from loading to content
- [ ] No layout shift during load

### Error Handling

- [ ] Graceful error messages for failed requests
- [ ] "Try Again" button works correctly
- [ ] Console errors are descriptive

### Real-Time Listener Cleanup

- [ ] No memory leaks when navigating away
- [ ] Listeners properly unsubscribed on unmount
- [ ] Check browser DevTools → Performance

---

## 10. Cross-Browser Testing

### Desktop Browsers

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers

- [ ] Chrome Mobile
- [ ] Safari iOS
- [ ] Samsung Internet

### Responsive Design

- [ ] Grid layout: 4 columns (desktop)
- [ ] Grid layout: 3 columns (tablet)
- [ ] Grid layout: 1 column (mobile)
- [ ] All components responsive

---

## 11. Production Readiness

### Environment Variables

- [ ] `.env` file NOT committed to Git
- [ ] `.gitignore` includes `.env` files
- [ ] Production environment variables configured

### Security

- [ ] Firestore rules deployed
- [ ] API keys secured
- [ ] No sensitive data in client code

### Data Validation

- [ ] All required fields validated
- [ ] Proper error messages for invalid input
- [ ] Server-side validation via security rules

---

## Summary

**Total Tests:** ~60 checkpoints

**Critical Tests (Must Pass):**
1. ✅ Firebase initialization
2. ✅ Google authentication
3. ✅ Fetch and display turfs
4. ✅ Real-time updates
5. ✅ Ownership verification
6. ✅ Security rules enforcement

**Nice to Have:**
- Cross-browser compatibility
- Performance optimization
- Comprehensive error handling

---

## Troubleshooting

### Common Issues

**Issue:** Firebase initialization error
- **Solution:** Check environment variables in `.env`
- **Verify:** API key, project ID, auth domain

**Issue:** "Missing or insufficient permissions"
- **Solution:** Deploy security rules to Firebase Console
- **Verify:** Rules published successfully

**Issue:** Real-time updates not working
- **Solution:** Check onSnapshot listener setup
- **Verify:** Cleanup function called on unmount

**Issue:** Ownership verification failing
- **Solution:** Ensure user has `ownerId` field
- **Verify:** User document in Firestore has correct role

---

## Next Steps

After passing all tests:

1. **Switch to Production Mode:**
   - Firebase Console → Firestore → Rules
   - Change from Test Mode to Production Rules

2. **Enable Authentication:**
   - Firebase Console → Authentication
   - Enable Google sign-in method

3. **Deploy Application:**
   - Build production bundle
   - Deploy to hosting (Vercel, Netlify, Firebase Hosting)

4. **Monitor Usage:**
   - Firebase Console → Analytics
   - Track user engagement and errors
