# 🏟️ TurfBookaro - Turf Booking System

A modern, full-stack turf booking application with Google OAuth authentication.

## ✨ Features

- 🎨 Beautiful, responsive UI with smooth animations
- 🔐 Google OAuth 2.0 authentication
- 🏟️ Browse and search turf listings
- 📅 Book turfs with date and time selection
- 👤 User profile management
- 📱 Mobile-responsive design

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ installed
- Google Cloud Console account
- Google OAuth credentials (already configured)

### 1. Configure Google OAuth

**Important:** Add the redirect URI to your Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click your OAuth 2.0 Client ID
4. Add to **Authorized redirect URIs**:
   ```
   http://localhost:5000/api/auth/google/callback
   ```
5. Click **Save**

### 2. Start the Backend

```bash
cd backend
npm install  # First time only
npm run dev
```

Backend runs on: **http://localhost:5000**

### 3. Start the Frontend

In a new terminal:

```bash
cd frontend
npm install  # First time only
npm run dev
```

Frontend runs on: **http://localhost:5173**

### 4. Test It!

1. Open http://localhost:5173
2. Click "BookMyTurf" to see listings
3. Click "Sign In" in the header
4. Sign in with Google
5. Start booking turfs!

## 📁 Project Structure

```
TurfBookingSystem/
├── backend/                    # Express.js API server
│   ├── src/
│   │   ├── index.js           # Server entry point
│   │   ├── config/            # Configuration
│   │   ├── controllers/       # Request handlers
│   │   ├── middleware/        # Auth middleware
│   │   ├── routes/            # API routes
│   │   └── services/          # Business logic
│   ├── .env                   # Environment variables (configured)
│   └── package.json
│
├── frontend/                   # React + TypeScript app
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── utils/             # Utility functions
│   │   ├── types/             # TypeScript types
│   │   └── App.tsx            # Main app component
│   ├── .env                   # Environment variables (configured)
│   └── package.json
│
└── docs/                       # Documentation
    ├── COMPLETE_OAUTH_GUIDE.md
    ├── OAUTH_IMPLEMENTATION_SUMMARY.md
    ├── GOOGLE_OAUTH_SETUP.md
    └── QUICK_REFERENCE.md
```

## 🔐 Authentication

This app uses **Google OAuth 2.0** for authentication:

- Users sign in with their Google account
- JWT tokens for session management
- Secure HTTP-only cookies
- 7-day token expiration

**Your OAuth Credentials:**


## 📚 Documentation

- **[COMPLETE_OAUTH_GUIDE.md](COMPLETE_OAUTH_GUIDE.md)** - Complete setup and testing guide
- **[OAUTH_IMPLEMENTATION_SUMMARY.md](OAUTH_IMPLEMENTATION_SUMMARY.md)** - Implementation overview
- **[GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md)** - Detailed OAuth setup
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick reference for testing

## 🧪 Testing

### Backend Health Check
```bash
curl http://localhost:5000/health
```

### Manual Login (Browser Console)
```javascript
// For testing only
localStorage.setItem('user', JSON.stringify({
  name: 'Test User',
  email: 'test@example.com',
  picture: 'https://ui-avatars.com/api/?name=Test+User&background=ea580c&color=fff&size=128',
  id: 'test-123'
}));
localStorage.setItem('token', 'mock-token');
location.reload();
```

### Manual Logout
```javascript
localStorage.clear();
location.reload();
```

## 🛠️ Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Framer Motion
- GSAP

### Backend
- Node.js
- Express
- Google Auth Library
- JWT (jsonwebtoken)
- CORS
- Cookie Parser

## 🎨 Design Features

- Modern gradient backgrounds
- Smooth scroll animations
- Glassmorphism effects
- Responsive design (mobile, tablet, desktop)
- Micro-animations for better UX
- Premium color palette

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev  # Starts with nodemon (auto-reload)
```

### Frontend Development
```bash
cd frontend
npm run dev  # Starts Vite dev server
```

### Build for Production
```bash
# Frontend
cd frontend
npm run build

# Backend (no build needed, runs directly)
cd backend
npm start
```

## 🐛 Troubleshooting

### "redirect_uri_mismatch" Error
- Add `http://localhost:5000/api/auth/google/callback` to Google Cloud Console

### Backend Won't Start
- Check `.env` file exists in `backend/` directory
- Verify all environment variables are set

### CORS Errors
- Verify `FRONTEND_URL` in backend `.env` is `http://localhost:5173`
- Restart backend server

### Not Logged In After OAuth
- Check browser console for errors
- Verify token is in URL after redirect
- Clear localStorage and try again

## 📝 Environment Variables

### Backend (.env)
```env

GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
PORT=5000
NODE_ENV=development
SESSION_SECRET=your-session-secret
JWT_SECRET=your-jwt-secret
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
```

## 🚀 Deployment

### Before Deploying to Production

1. **Update Environment Variables:**
   - Change `FRONTEND_URL` to production domain
   - Change `GOOGLE_REDIRECT_URI` to production callback URL
   - Generate strong secrets for `JWT_SECRET` and `SESSION_SECRET`

2. **Update Google Cloud Console:**
   - Add production redirect URI
   - Consider separate OAuth credentials for production

3. **Enable HTTPS:**
   - Both frontend and backend should use HTTPS
   - Update CORS settings accordingly

## 🤝 Contributing

This is a personal project, but feel free to fork and customize!

## 📄 License

MIT License - feel free to use this project as you wish.

## 🎉 Acknowledgments

- Google OAuth for authentication
- React and Vite teams for amazing tools
- Tailwind CSS for styling utilities

---

**Built with ❤️ for turf enthusiasts**

Need help? Check the documentation in the root directory or review the troubleshooting sections.
