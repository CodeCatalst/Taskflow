# Automatic Logout Testing Guide

## 🔧 What Was Fixed

### Issues Identified:
1. **Timer scope problem**: `inactivityTimer` and `warningTimer` were declared with `let` outside `useEffect`, causing them to not persist across re-renders
2. **Missing visibility check**: No validation when user returns to tab after inactivity
3. **Cleanup issues**: Timers weren't properly cleared in cleanup function

### Solutions Implemented:
1. ✅ Changed timer variables to use `useRef` for proper persistence
2. ✅ Added `visibilitychange` event listener to check session when user returns to tab
3. ✅ Enhanced axios interceptor to dispatch custom logout events
4. ✅ Added console logging for debugging timer activity
5. ✅ Improved cleanup function to properly clear refs

---

## 🧪 How to Test Automatic Logout

### Test 1: Inactivity Warning (Quick Test - 10 seconds)

For quick testing, temporarily modify the timeout values:

1. **Open**: `frontend/src/context/AuthContext.jsx`
2. **Find** (around line 14-18):
   ```javascript
   const getSessionTimeout = () => {
     const savedTimeout = localStorage.getItem('sessionTimeout');
     return savedTimeout ? parseFloat(savedTimeout) * 60 * 60 * 1000 : 2 * 60 * 60 * 1000;
   };
   const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before logout
   ```

3. **Change to** (for testing):
   ```javascript
   const getSessionTimeout = () => {
     const savedTimeout = localStorage.getItem('sessionTimeout');
     return savedTimeout ? parseFloat(savedTimeout) * 60 * 60 * 1000 : 10 * 1000; // 10 seconds
   };
   const WARNING_TIME = 5 * 1000; // 5 seconds before logout
   ```

4. **Test Steps**:
   - Login to the application
   - **Don't move mouse or interact** for 5 seconds
   - You should see a warning popup: "⚠️ Session Timeout Warning - You will be logged out in 0.08 minutes..."
   - Click "Cancel" to logout immediately OR "OK" to stay logged in
   - If you click "OK", wait another 5 seconds without activity
   - You should be logged out automatically

5. **Don't forget** to revert the changes back to normal timeouts!

---

### Test 2: Tab Switching (Session Expiry Check)

1. **Set short timeout** (as in Test 1)
2. **Login** to the application
3. **Open a new tab** and leave it for 10+ seconds
4. **Return to the TaskFlow tab**
5. You should be immediately logged out with message: "🔒 Session Expired"

---

### Test 3: Activity Reset

1. **Set short timeout** (as in Test 1)
2. **Login** to the application
3. **Keep moving mouse** or clicking around
4. Open browser console (F12) and look for messages:
   ```
   🕐 Inactivity timer reset. Will warn in 5 minutes, logout in 10 minutes
   ```
5. Verify the timer keeps resetting as you interact

---

### Test 4: Production Settings (Full Test)

**Default Settings:**
- Warning: 115 minutes of inactivity (1 hour 55 minutes)
- Logout: 120 minutes of inactivity (2 hours)

**To test with production settings:**
1. Leave the default settings unchanged
2. Login and leave the browser open
3. Come back after 2+ hours
4. You should be logged out

---

## 🎯 Console Messages to Watch

When automatic logout is working correctly, you'll see these console messages:

```
✅ Login successful - timers initialized
🕐 Inactivity timer reset. Will warn in 115 minutes, logout in 120 minutes
⚠️ Showing inactivity warning (after 115 min of inactivity)
✅ User chose to stay logged in (if user clicks OK)
❌ User chose to logout (if user clicks Cancel)
🔒 Inactivity timeout reached - logging out (after full 120 min)
```

---

## ⚙️ Settings Page Integration

Users can customize their session timeout:

1. Go to **Settings** page
2. Look for **"Session Timeout"** dropdown
3. Options available:
   - 30 minutes
   - 1 hour
   - 2 hours (default)
   - 4 hours
   - 8 hours

4. Selection is saved in `localStorage.sessionTimeout`
5. Timer automatically adjusts on next login

---

## 🔍 Debugging Tips

### If logout is NOT working:

1. **Check browser console** for timer messages
2. **Verify localStorage** has `lastActivityTime`:
   ```javascript
   console.log(localStorage.getItem('lastActivityTime'))
   ```
3. **Check if timers are set**:
   - Open console while logged in
   - Look for "🕐 Inactivity timer reset" message
   - Should appear on every mouse move/click

4. **Verify event listeners** are attached:
   ```javascript
   // Should show resetInactivityTimer for each event
   getEventListeners(document)
   ```

5. **Check JWT expiration**:
   - Access token expires in **15 minutes**
   - Refresh token expires in **7 days**
   - If access token expires, it should auto-refresh

---

## 🚀 Quick Validation

**Run this in browser console while logged in:**

```javascript
// Check if inactivity detection is running
console.log('Last Activity:', localStorage.getItem('lastActivityTime'));
console.log('Session Timeout Setting:', localStorage.getItem('sessionTimeout'));

// Force a logout after 5 seconds (for testing)
setTimeout(() => {
  localStorage.setItem('lastActivityTime', Date.now() - (3 * 60 * 60 * 1000)); // 3 hours ago
  // Now click anywhere or switch tabs
}, 5000);
```

After running this:
1. Wait 5 seconds
2. Click anywhere on the page
3. You should see the session expired alert and be logged out

---

## 📋 Checklist

- [ ] Timers use `useRef` instead of `let`
- [ ] Visibility change listener checks session on tab return
- [ ] Console logs show timer activity
- [ ] Warning appears 5 minutes before logout
- [ ] Automatic logout happens after full timeout
- [ ] User can click "OK" to stay logged in
- [ ] Activity (mouse/keyboard) resets the timer
- [ ] Axios interceptor handles 401 errors
- [ ] LocalStorage cleared on logout

---

## ⚠️ Important Notes

1. **JWT Token Expiration**: Access tokens expire every 15 minutes, but are automatically refreshed. This is separate from the inactivity timeout.

2. **Events that Reset Timer**:
   - Mouse movement
   - Mouse clicks
   - Keyboard presses
   - Scrolling
   - Touch events (mobile)

3. **Browser Sleep/Lock**: When browser/computer goes to sleep, the timer pauses. On wake, the visibility change listener checks if session expired.

4. **Multiple Tabs**: Each tab has its own timer, but they all share `lastActivityTime` in localStorage.

---

## 🔄 Revert Test Changes

**Don't forget to change back** to production values:

```javascript
// PRODUCTION VALUES
const getSessionTimeout = () => {
  const savedTimeout = localStorage.getItem('sessionTimeout');
  return savedTimeout ? parseFloat(savedTimeout) * 60 * 60 * 1000 : 2 * 60 * 60 * 1000;
};
const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before logout
```
