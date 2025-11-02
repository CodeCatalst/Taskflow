# Email Issue: Works Offline but Not Online

## Root Cause
Your **backend is NOT deployed on Vercel** - only the frontend is deployed!

When you test locally (offline):
- ✅ Frontend: http://localhost:5173
- ✅ Backend: http://localhost:5000
- ✅ Backend has access to `backend/.env` file
- ✅ Emails work because EMAIL_* variables are set locally

When you use it online (production):
- ✅ Frontend: https://taskflow-nine-phi.vercel.app
- ❌ Backend: **NOT DEPLOYED** - frontend tries to call https://taskflow-nine-phi.vercel.app/api but gets 404
- ❌ No backend = No email sending

## Current Deployment Status

### ✅ Frontend (Deployed on Vercel)
- URL: https://taskflow-nine-phi.vercel.app
- Framework: React + Vite
- Status: Working
- API calls: Configured to call `https://taskflow-nine-phi.vercel.app/api` (doesn't exist)

### ❌ Backend (NOT Deployed)
- Framework: Node.js + Express
- Current state: Only runs locally on port 5000
- **NEEDS DEPLOYMENT**

## Solutions

### Option 1: Deploy Backend on Vercel (Recommended)
Vercel can host both frontend and backend (serverless functions).

#### Steps:
1. Create `vercel.json` in backend folder:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

2. Deploy backend:
```bash
cd backend
vercel --prod
```

3. Get the backend URL (e.g., `https://taskflow-backend-xyz.vercel.app`)

4. Update frontend environment variables:
```bash
# frontend/.env.production
VITE_API_URL=https://taskflow-backend-xyz.vercel.app/api
VITE_SOCKET_URL=https://taskflow-backend-xyz.vercel.app
```

5. Add environment variables to backend deployment on Vercel:
   - EMAIL_HOST: smtp.gmail.com
   - EMAIL_PORT: 587
   - EMAIL_SECURE: false
   - EMAIL_USER: updates.codecatalyst@gmail.com
   - EMAIL_PASSWORD: kjuz elsu eoko tyyz
   - MONGODB_URI: (your MongoDB connection string)
   - JWT_SECRET: (your JWT secret)
   - CLIENT_URL: https://taskflow-nine-phi.vercel.app

6. Redeploy frontend with updated API URL

---

### Option 2: Deploy Backend on Render/Railway/Heroku

#### Render (Free tier available):
1. Go to https://render.com
2. Sign up/Login
3. Click "New +" → "Web Service"
4. Connect GitHub repo
5. Select backend folder
6. Configure:
   - Name: taskflow-backend
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
7. Add environment variables (same as above)
8. Deploy
9. Get URL (e.g., `https://taskflow-backend.onrender.com`)
10. Update frontend `.env.production` with new backend URL

#### Railway (Free tier available):
1. Go to https://railway.app
2. Sign up/Login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repo
5. Select backend folder
6. Add environment variables
7. Deploy
8. Get URL
9. Update frontend configuration

---

### Option 3: Keep Backend Local (Development Only)
**Note**: This only works when you're connected to the same network.

1. Run backend locally: `cd backend && npm start`
2. Use ngrok to expose local server:
```bash
ngrok http 5000
```
3. Get ngrok URL (e.g., `https://abc123.ngrok.io`)
4. Update frontend `.env.production`:
```bash
VITE_API_URL=https://abc123.ngrok.io/api
VITE_SOCKET_URL=https://abc123.ngrok.io
```
5. Rebuild and redeploy frontend

**Limitations**: Backend must be running on your computer, ngrok URL changes on restart

---

## Quick Fix: Deploy Backend on Vercel

**1. Create backend deployment configuration:**
```bash
cd c:\Users\jassa_5gbrlvp\Documents\01_Projects\Taskflow\Taskflow\backend
```

Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ]
}
```

**2. Deploy backend:**
```bash
vercel
# Follow prompts, select "backend" as project name
```

**3. Add environment variables on Vercel dashboard:**
- Go to backend project on Vercel
- Settings → Environment Variables
- Add all required variables

**4. Get production URL and update frontend**

**5. Redeploy frontend**

---

## Why This Happens

Your `frontend/.env.production` has:
```bash
VITE_API_URL=https://taskflow-nine-phi.vercel.app/api
```

But `https://taskflow-nine-phi.vercel.app` only serves the React frontend, NOT the backend API.

You need either:
- **Separate backend deployment**: `https://taskflow-backend.vercel.app`
- **Same domain with API routes**: Configure Vercel to handle both frontend and backend

---

## Next Steps

1. **Decide on deployment platform** (Vercel recommended for simplicity)
2. **Deploy backend** following Option 1 above
3. **Configure environment variables** on the hosting platform
4. **Update frontend API URL** to point to deployed backend
5. **Test user creation** - emails should now work online

---

## Testing After Deployment

Once backend is deployed:

1. Test backend health:
```bash
curl https://your-backend-url.vercel.app/api/health
```

2. Test email config:
```bash
curl https://your-backend-url.vercel.app/api/test-email-config
```

3. Create a test user online and verify email arrives

---

## Current Status Summary

| Component | Local (Offline) | Online (Production) |
|-----------|----------------|---------------------|
| Frontend | ✅ Works (localhost:5173) | ✅ Works (Vercel) |
| Backend | ✅ Works (localhost:5000) | ❌ **NOT DEPLOYED** |
| Database | ✅ MongoDB connection | ❓ Unknown (check MONGODB_URI) |
| Email | ✅ Works | ❌ Backend not deployed |

**Bottom Line**: You MUST deploy the backend for emails to work online!
