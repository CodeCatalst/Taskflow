# 🚀 **Render Deployment Guide for Email Automation**

## **Step 1: Deploy Backend to Render**

### **Environment Variables for Render:**
```bash
PORT=10000
MONGODB_URI=mongodb+srv://your-connection-string
JWT_SECRET=your-jwt-secret
REFRESH_SECRET=your-refresh-secret
CLIENT_URL=https://your-frontend.vercel.app
NODE_ENV=production

# Email Configuration
BREVO_API_KEY=your-brevo-api-key
BREVO_LOGIN_EMAIL=your-brevo-login@gmail.com
EMAIL_FROM=your-brevo-login@gmail.com
EMAIL_FROM_NAME=TaskFlow

# Cron Job API Key (Generate a secure random key)
CRON_API_KEY=your-secure-random-api-key-here
```

## **Step 2: Set Up External Cron Jobs**

### **Using Cron-Job.org (Free & Recommended)**

1. **Sign up at [cron-job.org](https://cron-job.org)**
2. **Create the following cron jobs:**

#### **Daily Admin Reports & Today Notifications (8:00 AM)**
```
Title: Daily Admin Reports & Today Notifications
URL: https://your-render-app.onrender.com/api/automation/trigger-daily-reports
Method: POST
Headers:
  x-api-key: your-secure-cron-api-key-here
Schedule: 0 8 * * *
```

#### **Today Due Notifications (Alternative - if you want separate)**
```
Title: Today Due Notifications
URL: https://your-render-app.onrender.com/api/automation/trigger-today-notifications
Method: POST
Headers:
  x-api-key: your-secure-cron-api-key-here
Schedule: 0 8 * * *
```

#### **Tomorrow Due Notifications (6:00 PM)**
```
Title: Tomorrow Due Notifications
URL: https://your-render-app.onrender.com/api/automation/trigger-tomorrow-notifications
Method: POST
Headers:
  x-api-key: your-secure-cron-api-key-here
Schedule: 0 18 * * *
```

#### **Overdue Task Reminders (9:00 AM)**
```
Title: Overdue Task Reminders
URL: https://your-render-app.onrender.com/api/automation/trigger-overdue-reminders
Method: POST
Headers:
  x-api-key: your-secure-cron-api-key-here
Schedule: 0 9 * * *
```

#### **Overdue Escalation Reminders (10:00 AM)**
```
Title: Overdue Escalation Reminders
URL: https://your-render-app.onrender.com/api/automation/trigger-escalation-reminders
Method: POST
Headers:
  x-api-key: your-secure-cron-api-key-here
Schedule: 0 10 * * *
```

#### **Weekly Admin Reports (Monday 8:00 AM)**
```
Title: Weekly Admin Reports
URL: https://your-render-app.onrender.com/api/automation/trigger-weekly-reports
Method: POST
Headers:
  x-api-key: your-secure-cron-api-key-here
Schedule: 0 8 * * 1
```

#### **Scheduled Campaign Processing (Every 5 minutes)**
```
Title: Process Scheduled Campaigns
URL: https://your-render-app.onrender.com/api/automation/trigger-scheduled-campaigns
Method: POST
Headers:
  x-api-key: your-secure-cron-api-key-here
Schedule: */5 * * * *
```

## **Step 3: Generate Secure API Key**

### **For Linux/Mac:**
```bash
openssl rand -hex 32
```

### **For Windows (PowerShell):**
```powershell
[System.Web.Security.Membership]::GeneratePassword(64, 8)
```

### **Or use an online generator:**
- [Random Key Generator](https://randomkeygen.com/)
- [UUID Generator](https://www.uuidgenerator.net/)

## **Step 4: Test Your Setup**

### **Test Individual Automations:**
```bash
# Test daily reports
curl -X POST https://your-render-app.onrender.com/api/automation/trigger-daily-reports \
  -H "x-api-key: your-secure-cron-api-key-here"

# Test notifications
curl -X POST https://your-render-app.onrender.com/api/automation/trigger-today-notifications \
  -H "x-api-key: your-secure-cron-api-key-here"
```

### **Check Automation Health:**
```bash
curl https://your-render-app.onrender.com/api/automation/health
curl https://your-render-app.onrender.com/api/automation/status \
  -H "x-api-key: your-secure-cron-api-key-here"
```

## **Step 5: Monitor & Troubleshoot**

### **Check Render Logs:**
- Go to your Render dashboard
- View application logs
- Look for cron trigger messages: `🔄 Cron trigger: [automation-name]`

### **Check Cron-Job.org Logs:**
- Login to cron-job.org
- View execution history for each job
- Check response codes and execution times

### **Common Issues:**

1. **403 Unauthorized**: Check your `CRON_API_KEY` matches between Render env vars and cron headers
2. **Timeout**: Render has 30-second timeout for requests - ensure automations complete within this
3. **Database Connection**: Ensure MongoDB Atlas allows connections from Render's IP ranges

## **Step 6: Frontend Access**

### **Available Pages:**
- **Email Automation Dashboard**: `/email-automation` (view status, manual triggers for admins)
- **Scheduled Campaigns**: `/scheduled-campaigns` (manage bulk campaigns)
- **Email Preferences**: `/email-preferences` (user notification settings)

## **📋 Cron Schedule Reference**

| Automation | Schedule | Cron Expression |
|------------|----------|-----------------|
| Daily Admin Reports | 8:00 AM daily | `0 8 * * *` |
| Today Notifications | 8:00 AM daily | `0 8 * * *` |
| Tomorrow Notifications | 6:00 PM daily | `0 18 * * *` |
| Overdue Reminders | 9:00 AM daily | `0 9 * * *` |
| Escalation Reminders | 10:00 AM daily | `0 10 * * *` |
| Weekly Reports | Monday 8:00 AM | `0 8 * * 1` |
| Campaign Processing | Every 5 minutes | `*/5 * * * *` |

## **🔒 Security Notes**

- Keep your `CRON_API_KEY` secure and don't commit it to version control
- Use HTTPS for all cron job URLs
- Regularly rotate your API key
- Monitor cron-job.org access logs

## **💡 Pro Tips**

1. **Test in Staging First**: Set up a staging Render app before production
2. **Monitor Email Delivery**: Check Brevo dashboard for sent emails
3. **Set Up Alerts**: Configure notifications for failed automation runs
4. **Timezone Awareness**: Cron jobs run in UTC - adjust schedules accordingly

## **🎯 Success Indicators**

✅ **All cron jobs show green status in cron-job.org**
✅ **Render logs show successful automation triggers**
✅ **Emails are being delivered (check Brevo dashboard)**
✅ **Frontend dashboard shows automation activity**
✅ **Users receive notifications at expected times**

**Your email automation is now production-ready on Render! 🚀**