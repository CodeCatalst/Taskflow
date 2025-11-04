## 🔐 Authentication Error - Quick Fix Guide

### Problem:
You're seeing **401 (Unauthorized)** errors when trying to access:
- Notifications
- User Management
- Teams

### Root Cause:
Your authentication token is either:
- ❌ Missing (never logged in)
- ❌ Expired (session timed out)
- ❌ Invalid (cleared by browser/extension)

---

## ✅ Solution (Choose One):

### Option 1: Quick Browser Console Fix
1. Open browser console (F12)
2. Run this command:
   ```javascript
   localStorage.clear()
   ```
3. Refresh the page (F5)
4. Log in with your credentials

### Option 2: Use Logout Button
1. Click the **Logout** button in the navbar (if visible)
2. You'll be redirected to login page
3. Log in again with your credentials

### Option 3: Force Reload
1. Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. This clears cache and reloads
3. Log in again

---

## 🔍 Verify Your Credentials:

### Default Admin Account:
If you haven't created users yet, use:
```
Email: admin@example.com
Password: admin123
```

### Check If Backend Is Running:
1. Open: http://localhost:5000/api/health
2. Should see: `{"status":"OK","message":"CTMS Backend is running"}`
3. If page doesn't load, start backend:
   ```bash
   cd backend
   npm run dev
   ```

---

## 🛠️ Debug Steps:

### Step 1: Check Browser Console
Open console (F12) and check for:
- ✅ "Access Token: EXISTS" - Good
- ❌ "Access Token: MISSING" - Need to log in
- ❌ "No access token found" - Need to log in

### Step 2: Check Network Tab
1. Open Network tab (F12 → Network)
2. Look at failed requests
3. Check "Headers" section for Authorization header
4. Should see: `Authorization: Bearer <token>`

### Step 3: Test Backend
```bash
# Test if backend accepts your credentials
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

---

## 📝 Common Scenarios:

### Scenario 1: First Time User
**Problem**: Never logged in before
**Solution**: 
1. Go to login page
2. Use default admin credentials (above)
3. Create your account

### Scenario 2: Session Expired
**Problem**: Was working, now getting 401 errors
**Solution**:
1. `localStorage.clear()` in console
2. Log in again
3. Token refresh should work automatically

### Scenario 3: Multiple Tabs Open
**Problem**: Logged out in one tab, other tabs still open
**Solution**:
1. Close all TaskFlow tabs
2. Open one new tab
3. Log in again

### Scenario 4: Browser Extension Interference
**Problem**: Ad blocker or privacy extension clearing storage
**Solution**:
1. Disable extensions for localhost
2. Or use incognito/private mode
3. Log in again

---

## 🔧 Automatic Fix Script

Paste this in browser console to auto-fix:

```javascript
// Auto-fix authentication
console.log('🔧 Fixing authentication...');
localStorage.clear();
console.log('✅ Cleared old tokens');
console.log('🔄 Reloading page...');
setTimeout(() => {
  window.location.href = '/login';
}, 1000);
```

---

## 🚫 What NOT to Do:

- ❌ Don't clear browser cache (not needed)
- ❌ Don't restart backend (unless not running)
- ❌ Don't reinstall packages (not an npm issue)
- ❌ Don't modify .env files (credentials are fine)

---

## ✅ Prevention Tips:

### Keep Session Active:
- Stay active in the app
- Refresh tokens work automatically
- Don't close all tabs if you want to stay logged in

### For Development:
- Increase token expiry in backend
- Use "Remember Me" feature (if available)
- Keep backend running continuously

---

## 📞 Still Not Working?

If you're still seeing 401 errors after following these steps:

1. **Check backend is running**:
   ```bash
   # Should see: ✅ Server running on port 5000
   ```

2. **Verify database connection**:
   - Backend should show: "✅ MongoDB Connected"

3. **Test login endpoint**:
   - POST to: http://localhost:5000/api/auth/login
   - Should return tokens

4. **Check for CORS errors**:
   - Backend allows: localhost:3000 and localhost:5173

---

## 🎯 Quick Summary:

```
Problem: 401 Unauthorized
Cause:   Missing/expired auth token
Fix:     localStorage.clear() → Refresh → Login
Time:    < 1 minute
```

**TL;DR**: Just clear localStorage and log in again! 🔐✨
