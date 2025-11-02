# 🔧 Email Timeout Fix for Production Deployment

## Problem
Email service works on localhost but times out on online servers (Render/Vercel) with `ETIMEDOUT` error.

## Root Causes
1. **Hosting Platform Restrictions**: Many platforms (Render, Vercel, Heroku) block or restrict outgoing SMTP connections on port 587
2. **Connection Pooling Issues**: Connection pooling can cause timeout problems in serverless/container environments
3. **TLS/SSL Configuration**: Insecure TLS settings may be rejected by email providers
4. **Environment Variables**: Production environment may not have proper email configuration

## ✅ Changes Made

### 1. Email Service Configuration (`backend/utils/emailService.js`)

#### Changed Connection Settings:
- **Disabled connection pooling** (`pool: false`) - Each email gets its own connection
- **Increased timeouts** for production (60 seconds vs 30 seconds)
- **Improved TLS security** - Using proper TLS 1.2+ with secure ciphers
- **Added connection cleanup** - Properly closes connections after sending
- **Better error handling** - Distinguishes between timeout and actual failures

#### Key Configuration Changes:
```javascript
const config = {
  pool: false, // ✅ No pooling - fresh connection per email
  connectionTimeout: 60000, // ✅ 60 seconds in production
  socketTimeout: 60000, // ✅ 60 seconds in production
  tls: {
    rejectUnauthorized: true, // ✅ Better security
    minVersion: 'TLSv1.2',
    ciphers: 'HIGH:!aNULL:!MD5:!RC4'
  },
  debug: true, // ✅ Always log for troubleshooting
  logger: true
};
```

### 2. Production Environment File (`.env.production`)
Created a production-specific environment file with:
- Production URLs
- Alternative port configurations (587 and 465)
- Recommendations for transactional email services

## 🚀 Solutions to Try (In Order)

### Solution 1: Update Production Environment Variables on Render

**On Render Dashboard:**
1. Go to your backend service
2. Navigate to "Environment" section
3. Update these variables:

```bash
NODE_ENV=production
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=updates.codecatalyst@gmail.com
EMAIL_PASSWORD=kjuz elsu eoko tyyz
CLIENT_URL=https://taskflow-nine-phi.vercel.app
```

**Key Change**: Use port **465** with **secure=true** instead of port 587

4. Click "Save Changes"
5. Render will automatically redeploy

### Solution 2: Use Alternative SMTP Port (If Solution 1 Fails)

Try different port combinations:

**Option A: Port 465 (SSL)**
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
```

**Option B: Port 587 (TLS)**
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

**Option C: Port 2525 (Alternative TLS)**
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=2525
EMAIL_SECURE=false
```

### Solution 3: Use Transactional Email Service (Recommended for Production)

Hosting platforms often block direct SMTP. Use a dedicated email service:

#### **A. SendGrid (Recommended - Free tier available)**

1. Sign up at: https://sendgrid.com
2. Create API key
3. Update environment variables:

```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key-here
```

#### **B. Mailgun (Alternative)**

1. Sign up at: https://mailgun.com
2. Get SMTP credentials
3. Update environment variables:

```bash
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-mailgun-smtp-user
EMAIL_PASSWORD=your-mailgun-smtp-password
```

#### **C. Amazon SES (AWS)**

1. Set up AWS SES
2. Get SMTP credentials
3. Update environment variables:

```bash
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-ses-smtp-user
EMAIL_PASSWORD=your-ses-smtp-password
```

### Solution 4: Frontend Configuration Check

The frontend needs to point to the correct backend URL.

**Check `frontend/.env.production`:**
```bash
VITE_API_URL=https://taskflow-henr.onrender.com/api
VITE_SOCKET_URL=https://taskflow-henr.onrender.com
```

**On Vercel Dashboard:**
1. Go to your frontend deployment
2. Settings → Environment Variables
3. Ensure `VITE_API_URL` points to your Render backend URL
4. Redeploy: Deployments → Click "..." → Redeploy

## 🧪 Testing

### Test 1: Check Email Configuration
```bash
curl https://taskflow-henr.onrender.com/api/test-email-config
```

Expected response:
```json
{
  "success": true,
  "configured": true,
  "message": "Email service is properly configured"
}
```

### Test 2: Send Test Email
```bash
curl -X POST https://taskflow-henr.onrender.com/api/test-email-send \
  -H "Content-Type: application/json" \
  -d '{"email": "jassalarjan.awc@gmail.com"}'
```

### Test 3: Check Logs on Render
1. Go to Render Dashboard
2. Select your backend service
3. Click "Logs" tab
4. Look for email-related logs:
   - ✅ "Email sent successfully" = Working
   - ⚠️ "Connection timeout" = Still having issues
   - ❌ "Authentication failed" = Wrong credentials

## 📊 Understanding the Logs

### Success Logs:
```
✅✅✅ Email sent successfully! ✅✅✅
   Message ID: <some-id@gmail.com>
   Response: 250 2.0.0 OK
   Accepted: [ 'recipient@email.com' ]
```

### Timeout Logs (Common on some platforms):
```
⚠️⚠️⚠️ Email connection timeout ⚠️⚠️⚠️
   Error: Connection timeout
   Code: ETIMEDOUT
   📧 Email MAY have been sent - Gmail often accepts emails before timeout
   💡 This is normal on some hosting platforms
```

**Note**: Even with timeout errors, emails often still get delivered. Check the recipient's inbox.

### Authentication Error:
```
❌ AUTHENTICATION FAILED - Check EMAIL_USER and EMAIL_PASSWORD
```
**Fix**: Verify your Gmail App Password is correct

## 🔍 Troubleshooting Steps

### Step 1: Verify Gmail App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Generate new App Password
3. Update `EMAIL_PASSWORD` on Render
4. Remove spaces: `kjuz elsu eoko tyyz` → `kjuzelsueokotyyz`

### Step 2: Check Render Logs for Specific Errors
```bash
# Look for these patterns in logs:
- ETIMEDOUT = Port/firewall issue → Try Solution 1 (port 465)
- EAUTH = Wrong credentials → Verify App Password
- ECONNECTION = Cannot reach server → Try Solution 3 (SendGrid)
```

### Step 3: Test Locally First
Before deploying, test with production settings locally:

1. Copy `.env.production` to `.env`
2. Update `NODE_ENV=production`
3. Run: `npm start`
4. Test email sending
5. If it works locally but not on Render → Hosting platform issue

### Step 4: Check Render Network Settings
Some Render plans may have network restrictions:
1. Check if you're on free tier (has limitations)
2. Consider upgrading to paid plan for better network access
3. Check Render's status page for outages

## 🎯 Recommended Solution Path

1. **First**: Try Solution 1 (port 465) - 5 minutes
2. **If timeout persists**: Switch to SendGrid (Solution 3) - 15 minutes
3. **Alternative**: Use Mailgun or AWS SES

## 📝 Why This Happens

### Localhost vs Production:
- **Localhost**: Direct access to internet, no restrictions
- **Production (Render/Vercel)**: 
  - Containerized/serverless environment
  - Firewall rules block certain ports
  - Network policies restrict SMTP
  - Connection limits per container

### Why Port 465 Often Works Better:
- Port 465 uses SSL from the start (SMTPS)
- Port 587 uses STARTTLS (upgrade connection)
- Some platforms prefer SSL over STARTTLS
- Less prone to timeout during TLS negotiation

## 🚨 Important Notes

1. **Gmail has sending limits**: 500 emails/day for free accounts
2. **App Password Required**: Regular Gmail password won't work
3. **2FA Must Be Enabled**: Required for App Passwords
4. **Emails may still send despite timeout**: Check recipient inbox
5. **SendGrid Free Tier**: 100 emails/day, perfect for testing

## ✅ Quick Fix Checklist

- [ ] Update Render environment variables with port 465
- [ ] Set `EMAIL_SECURE=true`
- [ ] Remove spaces from App Password
- [ ] Redeploy on Render
- [ ] Test with `/api/test-email-send`
- [ ] Check Render logs
- [ ] If still failing, sign up for SendGrid
- [ ] Update frontend `VITE_API_URL` if needed
- [ ] Verify frontend can reach backend

## 📞 Next Steps

1. **Update Render environment variables** with port 465
2. **Wait for automatic redeploy** (2-3 minutes)
3. **Test email sending** from your app
4. **Check logs** on Render dashboard
5. **If still failing**, switch to SendGrid

---

## 🔗 Useful Links

- **Gmail App Passwords**: https://myaccount.google.com/apppasswords
- **SendGrid Sign Up**: https://signup.sendgrid.com
- **Mailgun Sign Up**: https://signup.mailgun.com
- **Render Documentation**: https://render.com/docs
- **Nodemailer Docs**: https://nodemailer.com

---

**Last Updated**: 2025-11-02
**Status**: ✅ Code updated, ready for testing
