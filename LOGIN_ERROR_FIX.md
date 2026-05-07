# Login Error Fix: "Refresh Token Required and Login Failed"

## Problem Summary
When deployed online (Render backend + Vercel frontend), login fails with error: **"Refresh Token required and login failed"**

This occurs because:
1. **Cookies not being sent** across different domains in token refresh requests
2. **CORS credentials** not properly configured
3. **Frontend API URL** not pointing to correct backend
4. **Backend CORS origin** not configured for frontend URL

---

## Solution Implementation

### ✅ Changes Made

#### 1. **Frontend: Enhanced Token Refresh Logic** (`frontend/src/api/axios.js`)
- Added fallback mechanism to send refresh token in **request body** when cookies fail
- Stores tokens from response body as fallback if cookies aren't persisted
- Handles cross-domain requests gracefully

#### 2. **Backend: Return Tokens in Response Body** (`backend/routes/auth.js`)
- Updated `/auth/login` endpoint to include `accessToken` and `refreshToken` in response
- Updated `/auth/refresh` endpoint to include tokens in response body (not just cookies)
- Ensures tokens are available even if cookie transmission fails

#### 3. **Updated render.yaml Configuration**
- Fixed environment variable names (`JWT_REFRESH_SECRET` → `REFRESH_SECRET`)
- Added comprehensive comments for all required variables
- Set `TRUST_PROXY=1` for proper IP detection behind Render's reverse proxy

---

## 🚀 Deployment Setup Instructions

### Step 1: Generate Secure Secrets

Generate 3 secure random strings (at least 32 bytes each):

**On Linux/Mac:**
```bash
openssl rand -hex 32
openssl rand -hex 32
openssl rand -hex 32
```

**On Windows (PowerShell):**
```powershell
$bytes = New-Object Byte[] 32
$rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::new()
$rng.GetBytes($bytes)
[Convert]::ToBase64String($bytes)
# Repeat 3 times
```

**Or use online:** https://randomkeygen.com/

Save these 3 values:
- `JWT_SECRET` (for access token signing)
- `REFRESH_SECRET` (for refresh token signing)
- `CRON_API_KEY` (for automation triggers)

---

### Step 2: Deploy Backend on Render

1. **Go to Render Dashboard:** https://dashboard.render.com
2. **Create new Web Service** (or update existing)
3. **Set Environment Variables:**

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Already set in render.yaml |
| `MONGODB_URI` | Your MongoDB Atlas URL | Format: `mongodb+srv://user:pass@cluster.mongodb.net/taskflow` |
| `JWT_SECRET` | Generated secret #1 | Keep this secure! |
| `REFRESH_SECRET` | Generated secret #2 | Keep this secure! |
| `FRONTEND_URL` | Your Vercel URL | Example: `https://taskflow-frontend.vercel.app` |
| `BREVO_API_KEY` | Your Brevo API key | From Brevo dashboard |
| `EMAIL_USER` | Your email | For sending emails |
| `EMAIL_PASS` | Your app password | Gmail app password or SMTP password |
| `CRON_API_KEY` | Generated secret #3 | For automation |
| `TRUST_PROXY` | `1` | Already set in render.yaml |

4. **Deploy:** Click "Deploy"
5. **Copy Backend URL:** When deployed, copy the full URL from Render dashboard (e.g., `https://taskflow-backend.onrender.com`)

---

### Step 3: Deploy Frontend on Vercel (or similar)

1. **Create `.env.production` file in `frontend/` folder:**

```env
VITE_API_URL=https://taskflow-backend.onrender.com/api
```

Replace `taskflow-backend.onrender.com` with your actual Render backend URL.

2. **Deploy to Vercel:**
   - Push changes to GitHub
   - Vercel auto-deploys, OR
   - Deploy manually in Vercel dashboard
   - Copy your frontend URL (e.g., `https://taskflow-frontend.vercel.app`)

---

### Step 4: Update Backend with Frontend URL

1. **Go back to Render Dashboard**
2. **Update environment variable:**
   - `FRONTEND_URL` = Your Vercel frontend URL
3. **Redeploy backend** (manual redeploy or auto-redeploy on git push)

---

### Step 5: Test Login Flow

1. **Go to your frontend URL:** `https://taskflow-frontend.vercel.app`
2. **Attempt login** with test credentials
3. **Verify successful login** (should redirect to dashboard)

**If still getting "Refresh Token required" error:**

**Check Browser Console (F12):**
- Look for CORS errors
- Check Network tab → `/api/auth/refresh` request
  - Should see `200` response
  - Should contain `accessToken` and `refreshToken` in response body

---

## 🔍 Troubleshooting

### Error: "Refresh Token required"

**Cause:** Refresh token not being sent to backend

**Fix:**
1. Check `FRONTEND_URL` is set correctly in Render environment
2. Verify browser cookies are enabled
3. Check Network tab → see if refreshToken cookie is sent
4. Verify CORS allows your frontend domain

### Error: "CORS policy" blocked request

**Cause:** Frontend URL not in backend's allowed origins

**Fix:**
1. Ensure `FRONTEND_URL` environment variable is set
2. Backend's CORS uses this to allow requests
3. Redeploy backend after setting variable

### Error: Still failing after fixes

**Debug Steps:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Attempt login → check `/api/auth/login` response:
   - Should return `accessToken` and `refreshToken`
   - Should set cookies (see Cookies tab)
4. Check `/api/auth/refresh` response:
   - Should return `200` (not `400` or `401`)
   - Should contain tokens in response body

**Check Backend Logs:**
- Go to Render Dashboard
- View service logs
- Look for CORS errors or JWT validation errors

---

## 📋 Environment Variables Reference

### Backend (Render)

```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<32-byte-random-hex>
REFRESH_SECRET=<32-byte-random-hex>
FRONTEND_URL=https://your-frontend.vercel.app
BREVO_API_KEY=<your-key>
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
CRON_API_KEY=<32-byte-random-hex>
TRUST_PROXY=1
```

### Frontend (Vercel / .env.production)

```
VITE_API_URL=https://taskflow-backend.onrender.com/api
```

---

## 🔐 Security Notes

- ✅ Never commit `.env` files to Git
- ✅ Use separate secrets for dev and production
- ✅ Rotate `CRON_API_KEY` periodically
- ✅ Use strong, randomly generated secrets (minimum 32 bytes)
- ✅ Enable HTTPS on both frontend and backend (auto-enabled on Render/Vercel)

---

## 📝 Summary of Code Changes

| File | Change | Reason |
|------|--------|--------|
| `frontend/src/api/axios.js` | Added token-in-body fallback for refresh | Handle cross-domain requests |
| `backend/routes/auth.js` | Return tokens in response body | Support frontend fallback |
| `render.yaml` | Updated env vars & added comments | Correct configuration for production |

---

## ✨ You're All Set!

After these changes and proper environment variable configuration, login should work seamlessly online. The system now handles both:
- ✅ Cookie-based token storage (primary, secure)
- ✅ LocalStorage fallback (for cross-domain scenarios)

If you have issues, follow the **Troubleshooting** section above. 🚀
