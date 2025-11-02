# Vercel Email Configuration Guide

## Problem
Emails work locally (offline) but not in production (online) because environment variables are missing on Vercel.

## Solution: Configure Environment Variables on Vercel

### Step 1: Go to Vercel Dashboard
1. Visit https://vercel.com/dashboard
2. Find your project: **Taskflow** or **taskflow-nine-phi**
3. Click on the project

### Step 2: Add Environment Variables
1. Click **Settings** in the top menu
2. Click **Environment Variables** in the left sidebar
3. Add the following variables:

#### Required Email Variables

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `EMAIL_HOST` | `smtp.gmail.com` | Production, Preview, Development |
| `EMAIL_PORT` | `587` | Production, Preview, Development |
| `EMAIL_SECURE` | `false` | Production, Preview, Development |
| `EMAIL_USER` | `updates.codecatalyst@gmail.com` | Production, Preview, Development |
| `EMAIL_PASSWORD` | `kjuz elsu eoko tyyz` | Production, Preview, Development |
| `NODE_ENV` | `production` | Production |

#### How to Add Each Variable
1. Click **Add New**
2. Enter **Name** (e.g., `EMAIL_HOST`)
3. Enter **Value** (e.g., `smtp.gmail.com`)
4. Select which environments: Check **Production**, **Preview**, **Development**
5. Click **Save**
6. Repeat for all variables above

### Step 3: Redeploy
After adding all environment variables:
1. Go to **Deployments** tab
2. Click the three dots (...) on the latest deployment
3. Click **Redeploy**
4. Check "Use existing Build Cache" (faster)
5. Click **Redeploy**

### Step 4: Verify Configuration
After redeployment:
1. Go to your app: https://taskflow-nine-phi.vercel.app
2. Open browser console (F12)
3. Try creating a user
4. Go to Vercel Dashboard → Project → **Logs** (in Real-time Logs tab)
5. Look for:
   - ✅ `📧 Queueing email to: user@example.com`
   - ✅ `✅ Email sent successfully`
   - ❌ `❌ Email configuration missing` (if variables not set)

## Alternative: Check via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# List environment variables
vercel env ls

# Add environment variable
vercel env add EMAIL_HOST
# Enter value: smtp.gmail.com
# Select environments: Production, Preview, Development

# Pull environment variables locally (for testing)
vercel env pull
```

## Troubleshooting

### Check Current Environment Variables
In Vercel Dashboard → Settings → Environment Variables, you should see:
- ✅ EMAIL_HOST
- ✅ EMAIL_PORT
- ✅ EMAIL_SECURE
- ✅ EMAIL_USER
- ✅ EMAIL_PASSWORD
- ✅ NODE_ENV

### Check Deployment Logs
1. Vercel Dashboard → Your Project → **Logs**
2. Select latest deployment
3. Look for:
   ```
   📧 Queueing email to: [email]
   Environment: production
   Email Config: { host: 'smtp.gmail.com', port: 587, ... }
   ```

### Email Still Not Working?
If variables are set but emails still don't work:

1. **Check Gmail App Password**: The password `kjuz elsu eoko tyyz` must be a Gmail App Password, not your regular Gmail password
2. **Verify Gmail Account**: Make sure `updates.codecatalyst@gmail.com` allows less secure apps
3. **Check Vercel Logs**: Look for specific error messages
4. **Test Locally**: Run `npm run test:email` in backend folder

### Common Errors

#### "Email configuration missing"
**Cause**: Environment variables not set on Vercel
**Fix**: Follow Step 2 above to add variables

#### "Invalid login"
**Cause**: Wrong EMAIL_PASSWORD or EMAIL_USER
**Fix**: 
1. Verify EMAIL_USER is correct Gmail address
2. Generate new App Password at https://myaccount.google.com/apppasswords
3. Update EMAIL_PASSWORD on Vercel

#### "Connection timeout"
**Cause**: Vercel's serverless functions have timeout limits
**Fix**: Already handled with connection pooling and async sending

#### "No emails in inbox"
**Cause**: Email sent but might be in spam
**Fix**: Check spam folder or Gmail's Sent folder for updates.codecatalyst@gmail.com

## Testing Email Configuration

### Method 1: Via Test Endpoint
```bash
# Test email config (GET request)
curl https://taskflow-nine-phi.vercel.app/api/test-email

# Expected response:
{
  "success": true,
  "config": {
    "EMAIL_HOST": "smtp.gmail.com",
    "EMAIL_PORT": "587",
    "EMAIL_USER": "updates.codecatalyst@gmail.com",
    "EMAIL_PASSWORD": "***SET***"
  }
}
```

### Method 2: Via User Creation
1. Login as admin: https://taskflow-nine-phi.vercel.app/login
2. Go to User Management
3. Create a test user
4. Check Vercel logs for email status
5. Check user's inbox for welcome email

## Environment Variable Checklist

Before creating users online:
- [ ] EMAIL_HOST set on Vercel
- [ ] EMAIL_PORT set on Vercel
- [ ] EMAIL_SECURE set on Vercel
- [ ] EMAIL_USER set on Vercel
- [ ] EMAIL_PASSWORD set on Vercel (Gmail App Password)
- [ ] Redeployed after adding variables
- [ ] Checked deployment logs for confirmation
- [ ] Tested user creation and received email

## Quick Reference

**Vercel Project URL**: https://vercel.com/jassalarjan-awc/taskflow
**Live App URL**: https://taskflow-nine-phi.vercel.app
**API URL**: https://taskflow-nine-phi.vercel.app/api

**Gmail Account**: updates.codecatalyst@gmail.com
**App Password**: kjuz elsu eoko tyyz (needs to be set on Vercel)

---

**Note**: Environment variables are NOT automatically synced from your local `.env` file to Vercel. You must manually add them in the Vercel dashboard for each project.
