# Fix Email on Render Backend

## Current Setup
- ✅ **Backend**: Deployed on Render at `https://taskflow-henr.onrender.com`
- ✅ **Frontend**: Deployed on Vercel at `https://taskflow-nine-phi.vercel.app`
- ✅ **Frontend Updated**: Now points to Render backend
- ❓ **Email Configuration**: Need to verify on Render

## Problem
Emails work locally but not on production because the Render deployment might be missing email environment variables.

## Solution: Add Environment Variables on Render

### Step 1: Go to Render Dashboard

1. Visit: https://dashboard.render.com
2. Find your service: **taskflow-henr** (or the service name for your backend)
3. Click on the service

### Step 2: Add Environment Variables

1. Click **Environment** in the left sidebar
2. Click **Add Environment Variable** for each of the following:

#### Required Email Variables:

| Key | Value |
|-----|-------|
| `EMAIL_HOST` | `smtp.gmail.com` |
| `EMAIL_PORT` | `587` |
| `EMAIL_SECURE` | `false` |
| `EMAIL_USER` | `updates.codecatalyst@gmail.com` |
| `EMAIL_PASSWORD` | `kjuz elsu eoko tyyz` |

#### Other Important Variables (if not already set):

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Your MongoDB connection string |
| `JWT_SECRET` | Your JWT secret |
| `CLIENT_URL` | `https://taskflow-nine-phi.vercel.app` |
| `PORT` | `5000` (optional, Render sets this) |

### Step 3: Save and Redeploy

1. After adding all variables, click **Save Changes**
2. Render will automatically redeploy your service
3. Wait for deployment to complete (check the **Logs** tab)

### Step 4: Verify Deployment

Once deployment completes:

1. **Test Backend Health**:
   ```bash
   curl https://taskflow-henr.onrender.com/api/health
   ```
   Expected: `{"status":"OK","message":"CTMS Backend is running"}`

2. **Check Logs**:
   - In Render Dashboard → Your Service → **Logs**
   - Look for startup messages
   - Check for any email-related errors

### Step 5: Test Email Sending

1. Go to your app: https://taskflow-nine-phi.vercel.app
2. Login as admin
3. Go to **User Management**
4. Create a test user
5. Check the new user's email inbox
6. Email should arrive within 30 seconds

### Step 6: Check Logs for Email Status

In Render Dashboard → Logs, look for:
- ✅ `📧 Queueing email to: user@example.com`
- ✅ `✅ Email sent successfully`
- ❌ `❌ Email configuration missing` (if variables not set)
- ❌ `❌ Error sending email` (if wrong credentials)

## Troubleshooting

### Email Configuration Missing
**Symptoms**: Console shows "Email configuration missing!"

**Solution**:
1. Verify all EMAIL_* variables are set in Render
2. No typos in variable names
3. Redeploy after adding variables

### Invalid Login / Authentication Failed
**Symptoms**: Error "Invalid login" or "Username and Password not accepted"

**Solution**:
1. Verify `EMAIL_USER` is correct: `updates.codecatalyst@gmail.com`
2. Verify `EMAIL_PASSWORD` is a Gmail **App Password**, not regular password
3. If needed, generate new App Password:
   - Go to: https://myaccount.google.com/apppasswords
   - Sign in to Gmail account
   - Generate new app password
   - Update `EMAIL_PASSWORD` on Render
   - Redeploy

### Connection Timeout
**Symptoms**: "Connection timeout" or "ETIMEDOUT"

**Solution**:
1. Verify `EMAIL_HOST` is `smtp.gmail.com`
2. Verify `EMAIL_PORT` is `587`
3. Verify `EMAIL_SECURE` is `false` (for port 587)
4. Check Render's firewall/network settings

### Email Sent but Not Received
**Symptoms**: Logs show "Email sent successfully" but inbox is empty

**Solution**:
1. Check spam/junk folder
2. Check "Sent" folder of `updates.codecatalyst@gmail.com`
3. Verify recipient email is correct
4. Wait a few minutes (Gmail can be slow)

## Frontend Deployment

The frontend has been rebuilt with the correct backend URL. To deploy:

### Option 1: Push to Git (if auto-deploy is enabled)
```bash
cd c:\Users\jassa_5gbrlvp\Documents\01_Projects\Taskflow\Taskflow
git add frontend/.env.production
git commit -m "Update frontend to use Render backend"
git push
```

### Option 2: Deploy via Vercel CLI
```bash
cd c:\Users\jassa_5gbrlvp\Documents\01_Projects\Taskflow\Taskflow\frontend
vercel --prod
```

### Option 3: Manual Deploy via Vercel Dashboard
1. Go to: https://vercel.com/dashboard
2. Find project: **taskflow-nine-phi**
3. Click **Deployments**
4. Click **Redeploy** on latest deployment
5. Select **Use existing Build Cache**
6. Click **Redeploy**

## Verification Checklist

After completing all steps:

- [ ] All EMAIL_* variables set on Render
- [ ] Render service redeployed successfully
- [ ] Backend health check works: `curl https://taskflow-henr.onrender.com/api/health`
- [ ] Frontend redeployed with updated backend URL
- [ ] Frontend loads without errors
- [ ] Browser console shows no CORS errors
- [ ] Test user creation works
- [ ] Email arrives in inbox
- [ ] Render logs show "Email sent successfully"

## Current Configuration

### Backend (Render)
- URL: `https://taskflow-henr.onrender.com`
- Status: ✅ Running (health check passed)
- Email: ❓ **Need to verify environment variables**

### Frontend (Vercel)
- URL: `https://taskflow-nine-phi.vercel.app`
- Status: ✅ Deployed
- Configuration: ✅ Updated to use Render backend
- Build: ✅ Completed successfully

### What to Do Now

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Add EMAIL_* environment variables** (Step 2 above)
3. **Wait for automatic redeploy** (Render will restart service)
4. **Deploy frontend** (Option 1, 2, or 3 above)
5. **Test user creation** and verify email arrives

## Quick Reference

**Render Backend**: https://taskflow-henr.onrender.com
**Render Dashboard**: https://dashboard.render.com
**Vercel Frontend**: https://taskflow-nine-phi.vercel.app
**Vercel Dashboard**: https://vercel.com/dashboard

**Email Account**: updates.codecatalyst@gmail.com
**App Password**: kjuz elsu eoko tyyz

---

**Note**: After adding environment variables on Render, the service will automatically redeploy. This takes 2-5 minutes. Monitor the **Logs** tab to see when deployment completes.
