# Turf Booking System

A modern turf booking application built with React, TypeScript, and Firebase.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository** (if not already done)

2. **Install dependencies**

```bash
# Frontend
cd frontend
npm install

# Backend (if using)
cd ../backend
npm install
```

3. **Start the development server**

```bash
# Frontend
cd frontend
npm run dev
```

The app will be available at **http://localhost:5173**

## ✅ Current Status

### ✨ Working Features

1. **Landing Page** - Hero section with location and date inputs
2. **Turf Listings** - Two-panel layout with filters and results
3. **Filters** - Location, date, price range, and turf type
4. **Active Filters Display** - Visual feedback on applied filters
5. **Responsive Design** - Works on desktop, tablet, and mobile
6. **Firebase Integration** - Ready for authentication and database

### 🔥 Firebase Setup

Firebase has been integrated with the following services:
- **Authentication** - For Google sign-in
- **Firestore** - For storing turf and booking data
- **Analytics** - For tracking user behavior

**Configuration file**: `src/lib/firebase.ts`

See `FIREBASE_SETUP.md` for detailed integration guide.

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/           # Page components
│   │   ├── Home/        # Landing page
│   │   ├── TurfListings/# Listings with filters
│   │   ├── SignIn/      # Sign-in page
│   │   └── AuthCallback/# OAuth callback
│   ├── lib/             # Firebase configuration
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript types
│   ├── data/            # Mock data
│   └── styles/          # Global styles
├── index.html
├── vite.config.ts
└── package.json
```

## 🎨 Features

### Two-Panel Layout (Listings Page)

**Desktop (>1280px):**
- Left sidebar: 320px (sticky filters)
- Right panel: Remaining space (turf results)
- Gap: 32px

**Tablet (<1024px):**
- Single column layout
- Filters on top (2-column grid)
- Results below

**Mobile (<768px):**
- Single column throughout
- Vertical stacking

### Filter Options

- **Location** - Filter by city
- **Date** - Select booking date
- **Price Range** - Under ₹500, ₹500-₹1000, Over ₹1000
- **Turf Type** - Cricket, Football, Volleyball, etc.

### Active Filters

Visual tags showing currently applied filters:
- 📍 Location
- 📅 Date
- 💰 Price Range
- ⚽ Sport Type

## 🔧 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Tech Stack

**Frontend:**
- React 18
- TypeScript
- Vite
- React Router
- Firebase
- Framer Motion (animations)
- GSAP (animations)
- Tailwind CSS

## 🔐 Firebase Configuration

Your Firebase project is configured with:
- **Project ID**: turf-database
- **Auth Domain**: turf-database.firebaseapp.com

### Next Steps for Firebase

1. **Enable Google Authentication**:
   - Go to Firebase Console → Authentication
   - Enable Google sign-in method

2. **Create Firestore Database**:
   - Go to Firestore Database
   - Create database (test mode for development)
   - Add security rules (see FIREBASE_SETUP.md)

3. **Update Auth Utilities**:
   - Replace localStorage auth with Firebase Auth
   - Implement Google sign-in flow

## 📊 Data Structure

### Turfs Collection
```typescript
{
  id: string;
  name: string;
  city: string;
  address: string;
  type: string; // Cricket, Football, etc.
  pricePerHour: number;
  rating: number;
  amenities: string[];
  images: string[];
  createdAt: timestamp;
}
```

### Bookings Collection
```typescript
{
  id: string;
  turfId: string;
  userId: string;
  date: string;
  timeSlots: string[];
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: timestamp;
}
```

## 🐛 Troubleshooting

### App not loading?

1. **Check if server is running**:
   ```bash
   netstat -ano | findstr :5173
   ```

2. **Clear browser cache** and reload

3. **Check console** for errors (F12 in browser)

4. **Verify Firebase config** in `src/lib/firebase.ts`

### Port already in use?

```bash
# Kill process on port 5173 (Windows)
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

## 📚 Documentation

- `FIREBASE_SETUP.md` - Firebase integration guide
- Component documentation in respective files

## 🎯 Roadmap

- [ ] Implement Firebase Authentication
- [ ] Migrate mock data to Firestore
- [ ] Add booking functionality with Firestore
- [ ] Implement user profiles
- [ ] Add payment integration
- [ ] Add admin dashboard

## 📝 License

Private project

---

**Your app is running at http://localhost:5173** 🎉
