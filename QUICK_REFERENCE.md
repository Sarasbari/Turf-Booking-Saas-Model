# Quick Reference - Google Authentication Feature

## 🚀 Quick Start

### Start the App
```bash
cd frontend
npm run dev
```
**URL**: http://localhost:5173

---

## 📍 Routes

| Route | Description |
|-------|-------------|
| `/` | Homepage with hero section |
| `/listings` | Turf listings page (main testing area) |
| `/signin` | Mock Google sign-in page |

---

## 🔑 Key Components

### Header (`src/components/Header/`)
- **Logged Out**: Shows "Sign In" button
- **Logged In**: Shows profile picture + dropdown

### SignInRequiredModal (`src/components/SignInRequiredModal/`)
- Appears when non-logged-in users try to book
- Redirects to `/signin` page

### SignIn Page (`src/pages/SignIn/`)
- Mock Google OAuth flow
- Saves user data to localStorage
- Redirects to homepage after 1.5s

---

## 🧪 Testing Shortcuts

### Check Login Status (Browser Console)
```javascript
localStorage.getItem('user')
```

### Manual Login
```javascript
localStorage.setItem('user', JSON.stringify({
  name: 'Test User',
  email: 'test@example.com',
  picture: 'https://ui-avatars.com/api/?name=Test+User&background=ea580c&color=fff&size=128'
}));
location.reload();
```

### Manual Logout
```javascript
localStorage.removeItem('user');
location.reload();
```

---

## ✅ Test Checklist

### Logged Out
- [ ] Header shows "Sign In" button
- [ ] Clicking "Book Now" shows sign-in modal
- [ ] Modal has lock icon and message
- [ ] "Sign In with Google" redirects to `/signin`
- [ ] Sign-in page has Google button
- [ ] After sign-in, redirects to homepage

### Logged In
- [ ] Header shows profile picture with green dot
- [ ] Clicking avatar opens dropdown
- [ ] Dropdown shows name and email
- [ ] "My Bookings" is disabled
- [ ] "Sign Out" button works
- [ ] Clicking "Book Now" opens booking modal directly
- [ ] Confirmation shows "Thanks, [FirstName]!"

### Responsive
- [ ] Works on mobile (<640px)
- [ ] Works on tablet (640-1023px)
- [ ] Works on desktop (1024px+)

---

## 🎨 Color Palette

```css
/* Primary Colors */
--orange-primary: #ea580c;
--orange-hover: #dc2626;
--orange-light-bg: #fff7ed;
--orange-border: #ffedd5;

/* Neutral Colors */
--white: #ffffff;
--dark-text: #0f172a;
--gray-text: #64748b;
--light-gray: #94a3b8;
--border-gray: #e5e7eb;

/* Status Colors */
--success-green: #22c55e;
--error-red: #dc2626;
```

---

## 📦 localStorage Structure

```json
{
  "user": {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "picture": "https://ui-avatars.com/api/?name=John+Doe&background=ea580c&color=fff&size=128"
  }
}
```

---

## 🔧 Utility Functions

### `auth.ts`

```typescript
isLoggedIn()          // Returns: boolean
getUserData()         // Returns: UserData | null
setUserData(data)     // Saves user data
signOut()             // Clears data & redirects
getFirstName(name)    // Extracts first name
```

---

## 🐛 Common Issues

### Issue: "Sign In" button not appearing
**Solution**: Clear localStorage and refresh

### Issue: Profile picture not showing after sign-in
**Solution**: Check localStorage has 'user' key, refresh page

### Issue: Dropdown not closing
**Solution**: Click outside dropdown or click avatar again

### Issue: Booking modal not opening
**Solution**: Make sure you're logged in (check localStorage)

---

## 📱 Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 640px) { }

/* Tablet */
@media (max-width: 768px) { }

/* Desktop */
@media (min-width: 1024px) { }
```

---

## 🎯 User Flow Summary

```
1. User visits /listings
2. Clicks "Book Now"
   ├─ If logged out → Sign-in modal → /signin → Login → Redirect
   └─ If logged in → Booking modal → Confirmation with greeting
```

---

## 📚 Documentation Files

- `IMPLEMENTATION_SUMMARY.md` - Complete feature overview
- `AUTHENTICATION_TESTING_GUIDE.md` - Detailed testing guide
- `QUICK_REFERENCE.md` - This file

---

## 💡 Pro Tips

1. **Use DevTools**: Open Application tab to inspect localStorage
2. **Test Both States**: Always test logged-in and logged-out flows
3. **Check Console**: Look for any errors or warnings
4. **Mobile Testing**: Use browser DevTools device emulation
5. **Clear Cache**: If something looks wrong, try hard refresh (Ctrl+Shift+R)

---

## 🎉 Ready to Test!

Open your browser to:
**http://localhost:5173/listings**

Happy testing! 🚀
