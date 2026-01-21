# 🚀 Brevo Email Setup Instructions

## Current Status
✅ API key is valid, but IP address needs authorization
🔒 Add your IP `116.206.159.184` to Brevo authorized IPs

## ✅ What You Need to Do

### 1. Get Your Real Brevo API Key
1. Go to [Brevo Dashboard](https://app.brevo.com/settings/keys/api)
2. Sign in to your Brevo account (or create a free account)
3. Click **"Generate a new API key"**
4. Give it a name like "TaskFlow Production"
5. **Copy the generated key** (it starts with `xkeysib-`)

### 2. Update Your .env File
Open `backend/.env` and replace this line:
```env
BREVO_API_KEY=xkeysib-YOUR_REAL_API_KEY_HERE
```
With your actual API key:
```env
BREVO_API_KEY=xkeysib-abcdefghijklmnopqrstuvwx
```

### 3. Authorize Your IP Address (CRITICAL!)
**This is why you're getting the IP address error!**

1. Go to [Brevo Security Settings](https://app.brevo.com/security/authorised_ips)
2. Click **"Add a new IP"**
3. Add your current IP: `116.206.159.184`
4. Or check "Allow all IPs" for development (less secure but easier)

### 4. Verify Your Sender Email (Important!)
1. In Brevo dashboard, go to **Senders → Sender Addresses**
2. Add `updates.codecatalyst@gmail.com` as a sender
3. Click the verification link sent to that email
4. Wait for approval (usually instant for free accounts)

### 5. Test Your Setup
Run this command in your terminal:
```bash
cd backend
node test-brevo-email.js
```

## 🎯 Expected Result
After setting up the real API key, you should see:
```
✅ SUCCESS! Test email sent successfully!
📬 Message ID: [some-id]
🔌 Provider: brevo-smtp (or brevo-api)
```

## 🔧 Troubleshooting
If it still fails:
- **IP Address**: Make sure your IP `116.206.159.184` is authorized in Brevo
- **API Key**: Double-check your API key is correct and active
- **Sender Email**: Ensure `updates.codecatalyst@gmail.com` is verified
- **Credits**: Check if your Brevo account has email credits
- **Account**: Verify you're using the correct Brevo account

## 📧 How It Works
- The system tries **SMTP first** (more reliable)
- If SMTP fails, it **automatically falls back** to API
- Both methods use the **same API key**

Once you have the real key, your email functionality will work perfectly! 🎉
