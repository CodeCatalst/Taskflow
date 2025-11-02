# Quick Backend Deployment Guide

## Prerequisites
- Vercel CLI installed: `npm i -g vercel`
- Vercel account (free)
- MongoDB Atlas account with connection string

## Step 1: Deploy Backend to Vercel

```bash
# Navigate to backend folder
cd c:\Users\jassa_5gbrlvp\Documents\01_Projects\Taskflow\Taskflow\backend

# Login to Vercel (opens browser)
vercel login

# Deploy backend
vercel --prod
```

**Follow the prompts:**
- Set up and deploy? **Yes**
- Which scope? **Your username**
- Link to existing project? **No**
- Project name? **taskflow-backend** (or any name)
- In which directory? **./** (current directory)
- Want to modify settings? **No**

**Result:** You'll get a URL like: `https://taskflow-backend.vercel.app`

## Step 2: Add Environment Variables on Vercel

### Go to Vercel Dashboard:
1. Visit: https://vercel.com/dashboard
2. Find project: **taskflow-backend**
3. Click **Settings** → **Environment Variables**

### Add These Variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `MONGODB_URI` | Your MongoDB connection string | From MongoDB Atlas |
| `JWT_SECRET` | Your JWT secret key | Random secure string |
| `CLIENT_URL` | `https://taskflow-nine-phi.vercel.app` | Your frontend URL |
| `EMAIL_HOST` | `smtp.gmail.com` | Gmail SMTP |
| `EMAIL_PORT` | `587` | SMTP port |
| `EMAIL_SECURE` | `false` | Use TLS |
| `EMAIL_USER` | `updates.codecatalyst@gmail.com` | Your Gmail |
| `EMAIL_PASSWORD` | `kjuz elsu eoko tyyz` | Gmail App Password |
| `NODE_ENV` | `production` | Environment |
| `PORT` | `5000` | Optional |

### How to Add:
1. Click **Add New**
2. Name: `MONGODB_URI`
3. Value: Your MongoDB connection string
4. Environments: Check all (Production, Preview, Development)
5. Click **Save**
6. Repeat for each variable

## Step 3: Redeploy Backend

After adding environment variables:
```bash
vercel --prod
```

Or in Vercel Dashboard:
1. Go to **Deployments** tab
2. Click **...** on latest deployment
3. Click **Redeploy**
4. Check **Use existing Build Cache**
5. Click **Redeploy**

## Step 4: Update Frontend Configuration

Edit `frontend/.env.production`:
```bash
# Replace with your actual backend URL from Step 1
VITE_API_URL=https://taskflow-backend.vercel.app/api
VITE_SOCKET_URL=https://taskflow-backend.vercel.app
```

## Step 5: Redeploy Frontend

```bash
# Navigate to frontend folder
cd c:\Users\jassa_5gbrlvp\Documents\01_Projects\Taskflow\Taskflow\frontend

# Deploy frontend
vercel --prod
```

Or use Git:
```bash
git add .
git commit -m "Update frontend to use deployed backend"
git push
```
(If frontend is set to auto-deploy from Git)

## Step 6: Test Everything

### Test Backend Health:
```bash
curl https://taskflow-backend.vercel.app/api/health
```
Expected: `{"status":"OK","message":"CTMS Backend is running"}`

### Test Email Config:
```bash
curl https://taskflow-backend.vercel.app/api/test-email-config
```
Expected: All values should NOT say "NOT SET"

### Test User Creation:
1. Go to: https://taskflow-nine-phi.vercel.app
2. Login as admin
3. Go to User Management
4. Create a test user
5. Check user's email inbox
6. Email should arrive within 30 seconds

## Troubleshooting

### Backend Deploy Fails
```bash
# Check for errors
vercel logs

# Common issues:
- Missing package.json: Make sure you're in backend folder
- Build errors: Check server.js syntax
- Dependencies: Run npm install locally first
```

### Email Config Shows "NOT SET"
- Environment variables not added on Vercel
- Go to Settings → Environment Variables
- Make sure all EMAIL_* variables are added
- Redeploy after adding

### Frontend Can't Connect to Backend
- Check CORS configuration in backend/server.js
- Verify CLIENT_URL is set correctly
- Update frontend .env.production with correct backend URL
- Redeploy frontend

### MongoDB Connection Error
- Check MONGODB_URI is correct
- Ensure MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
- Network Access → Add IP Address → Allow from Anywhere

### Socket.IO Issues
- Update Socket.IO CORS in backend/server.js:
```javascript
const io = new Server(httpServer, {
  cors: {
    origin: [
      'https://taskflow-nine-phi.vercel.app',
      'http://localhost:3000',
      'http://localhost:5173'
    ],
    credentials: true
  }
});
```

## Verify Deployment

### Backend URLs to Test:
- Health: `https://taskflow-backend.vercel.app/api/health`
- Email Config: `https://taskflow-backend.vercel.app/api/test-email-config`
- Login: `POST https://taskflow-backend.vercel.app/api/auth/login`

### Frontend URL:
- App: `https://taskflow-nine-phi.vercel.app`

## Environment Variables Checklist

Before going live, verify in Vercel Dashboard:

Backend Project (`taskflow-backend`):
- [x] MONGODB_URI
- [x] JWT_SECRET
- [x] CLIENT_URL
- [x] EMAIL_HOST
- [x] EMAIL_PORT
- [x] EMAIL_SECURE
- [x] EMAIL_USER
- [x] EMAIL_PASSWORD
- [x] NODE_ENV

Frontend Project (`taskflow` or `taskflow-nine-phi`):
- [x] VITE_API_URL (should point to backend)
- [x] VITE_SOCKET_URL (should point to backend)

## Quick Commands Reference

```bash
# Deploy backend
cd backend
vercel --prod

# Deploy frontend
cd frontend
vercel --prod

# View logs
vercel logs <deployment-url>

# List deployments
vercel ls

# Environment variables
vercel env ls
vercel env add VARIABLE_NAME
vercel env pull
```

## Success Indicators

✅ Backend deployment successful
✅ All environment variables set
✅ Backend health check returns OK
✅ Email config check shows all variables SET
✅ Frontend loads and connects to backend
✅ User creation works and email is received
✅ No CORS errors in browser console

## Next Steps After Deployment

1. Test all features online
2. Create admin user if not exists
3. Test task creation, updates, comments
4. Test notifications
5. Test analytics and reporting
6. Verify email notifications work
7. Test PWA installation

---

**Need Help?**
- Vercel Docs: https://vercel.com/docs
- Deployment Issues: Check `vercel logs`
- Email Issues: Check backend logs in Vercel Dashboard
- CORS Issues: Update CLIENT_URL and redeploy
