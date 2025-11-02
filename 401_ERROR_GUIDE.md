# 401 Unauthorized Error - Troubleshooting Guide

## What is a 401 Error?

**401 Unauthorized** means the server rejected your request because:
- You're not logged in
- Your session expired
- Your authentication token is invalid

---

## Common Causes:

### 1. **Not Logged In**
**Symptom:** 401 error immediately when accessing the app  
**Cause:** No accessToken in localStorage  
**Fix:** Login at https://taskflow-nine-phi.vercel.app/login

### 2. **Session Expired**
**Symptom:** 401 error after being logged in for a while  
**Cause:** Access token and refresh token both expired  
**Fix:** Login again

### 3. **Token Refresh Failed**
**Symptom:** 401 error, then automatic redirect to login  
**Cause:** Refresh token expired or invalid  
**Fix:** This is normal - just login again

### 4. **CORS Issues Preventing Token Refresh**
**Symptom:** 401 errors and refresh fails silently  
**Cause:** Backend not accepting requests from frontend  
**Fix:** Already fixed with CORS update

---

## Quick Diagnosis:

### Open Browser Console (F12) and check:

**1. Check if you're logged in:**
```javascript
localStorage.getItem('accessToken')
localStorage.getItem('refreshToken')
localStorage.getItem('user')
```

**2. If they're all null:**
- You're not logged in
- Solution: Login

**3. If they exist but you still get 401:**
- Tokens might be expired
- Solution: Clear and login again
```javascript
localStorage.clear()
location.reload()
```

---

## Auto-Fix Already Implemented:

Your `axios.js` has automatic token refresh:

```javascript
// When 401 occurs:
1. Try to refresh token automatically
2. If refresh succeeds → retry request
3. If refresh fails → redirect to login
```

This means:
- ✅ Most 401 errors are handled automatically
- ✅ You'll be redirected to login when needed
- ✅ No manual intervention required

---

## Specific 401 Scenarios:

### Scenario A: Dashboard loads with 401
**What's happening:**
- Dashboard trying to fetch data
- No valid auth token
- Auto-redirects to login

**This is NORMAL behavior!**

### Scenario B: Socket.IO 401 errors
**What's happening:**
- Socket.IO connection needs auth
- CORS might be blocking it

**Fix:** Already applied:
- CORS configuration updated
- Socket.IO origins configured

### Scenario C: API calls return 401
**What's happening:**
- Request missing Authorization header
- Or token is invalid

**Auto-fix:**
- Token refresh attempted
- If fails, redirect to login

---

## How to Test:

### 1. Fresh Login Test:
```
1. Clear localStorage (F12 → Console → localStorage.clear())
2. Go to login page
3. Login with valid credentials
4. Should work without 401 errors
```

### 2. Check Token Flow:
```
1. Login successfully
2. Open Console (F12)
3. Look for logs:
   - "✅ Login successful"
   - "Bearer token" in Network tab requests
4. No 401 errors should appear
```

### 3. Check Network Tab:
```
1. Press F12
2. Go to Network tab
3. Look for failed requests (red)
4. Click on 401 request
5. Check:
   - Request URL
   - Request Headers (Authorization present?)
   - Response body
```

---

## Expected Behavior:

### ✅ Normal Flow:
1. User not logged in → 401 on protected routes
2. Auto-redirect to /login
3. User logs in → gets tokens
4. All requests include token
5. No more 401 errors

### ✅ Token Expiry Flow:
1. Access token expires
2. Request gets 401
3. System tries refresh token
4. If refresh succeeds → request retried
5. If refresh fails → redirect to login

---

## Quick Fixes:

### Fix 1: Clear Everything and Login
```javascript
// In browser console:
localStorage.clear()
sessionStorage.clear()
location.href = '/login'
```

### Fix 2: Check Your Credentials
- Email: Your registered email
- Password: Your password or temp password from email

### Fix 3: Check Backend is Running
```javascript
// Test backend:
fetch('https://taskflow-henr.onrender.com/api/health')
  .then(r => r.json())
  .then(console.log)
```

---

## When to Worry:

### ⚠️ Constant 401 Even After Fresh Login
**This means:**
- Backend auth is broken
- Token generation failed
- CORS blocking requests

**Check:**
1. Backend logs on Render
2. Network tab for actual error
3. Console for detailed error messages

### ⚠️ Socket.IO Constant 401
**This means:**
- Socket.IO auth configuration issue
- CORS not allowing connection

**Already fixed in our updates!**

---

## Most Likely Cause:

Based on your situation, the 401 is probably:

**You're not logged in yet** OR **session expired**

**Solution:** Just login at the login page!

The axios interceptor will handle everything automatically:
- ✅ Attach token to requests
- ✅ Try refresh on 401
- ✅ Redirect to login if needed

---

## Still Getting 401?

**Check these in order:**

1. ✅ Backend is online (https://taskflow-henr.onrender.com/api/health)
2. ✅ You're logging in with correct credentials
3. ✅ Browser console shows no CORS errors
4. ✅ Network tab shows Authorization header in requests
5. ✅ Latest code is deployed to Vercel/Render

**If all above check out and still 401:**
- Check Render logs for auth errors
- Verify JWT_SECRET is set on Render
- Test with a fresh user account

---

## Summary:

**401 errors are NORMAL when:**
- Not logged in → Login
- Session expired → Login again
- Accessing protected routes → Auto-redirect

**Your app handles this automatically!**

Just make sure to:
1. Login with valid credentials
2. Don't clear localStorage while logged in
3. Let the auto-refresh handle token expiry

**The 401 you're seeing is probably just the app redirecting you to login, which is correct behavior!** ✅
