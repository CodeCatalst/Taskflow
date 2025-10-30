# 🌐 TaskFlow - Access Guide

## ✅ Application Status

**Both servers are RUNNING and managed by Supervisor!**

- ✅ Backend API: Running on port 5000
- ✅ Frontend UI: Running on port 3000
- ✅ MongoDB: Running on port 27017
- ✅ Socket.IO: Configured and ready

## 🔗 How to Access

### In Emergent Platform:

Since you're running in the Emergent cloud environment, the application should be accessible through the platform's preview feature.

**Look for:**
- 🌐 **Preview button** in the Emergent interface
- 📱 **Port 3000** for the frontend application
- 🔌 **Port 5000** for the backend API

The frontend is now configured to accept connections from any host (0.0.0.0:3000), making it accessible through the cloud environment.

### Local Testing (if applicable):
If you're running locally:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- API: http://localhost:5000/api

## 🧪 Test the Backend API

```bash
# Health check
curl http://localhost:5000/api/health

# Register a test user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test Admin",
    "email": "admin@taskflow.com",
    "password": "admin123",
    "role": "admin"
  }'
```

## 🔧 Server Management

The application is now managed by Supervisor, which ensures both services stay running:

```bash
# Check status
sudo supervisorctl status

# Restart services
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
sudo supervisorctl restart all

# View logs
sudo supervisorctl tail backend
sudo supervisorctl tail frontend

# Or use log files directly
tail -f /var/log/supervisor/backend.out.log
tail -f /var/log/supervisor/frontend.out.log
```

## ⚠️ Important: MongoDB Configuration

Before you can use the application fully, you still need to configure MongoDB Atlas:

**Steps:**
1. Go to: https://cloud.mongodb.com/
2. Navigate to: **Network Access**
3. Click: **"Add IP Address"**
4. Select: **"Allow Access from Anywhere" (0.0.0.0/0)**
5. Wait: 1-2 minutes for changes to propagate

**Why?** Without this, all database operations will fail. The servers will run, but you won't be able to:
- Register users
- Login
- Create tasks
- Store any data

See `MONGODB_SETUP.md` for detailed instructions.

## 🎯 First Steps After Access

1. **Open the preview** (port 3000)
2. **Click "Register here"**
3. **Create an admin account:**
   - Full Name: Admin User
   - Email: admin@taskflow.com  
   - Password: admin123
   - Role: Admin
4. **Start exploring!**

## 📊 What You Can Do

Once you access the application:

### Dashboard
- View task statistics
- See recent tasks
- Quick access buttons

### Tasks Page
- Create new tasks
- Filter by status and priority
- Assign tasks to team members
- Add comments
- Update status

### Teams Page (Admin/HR only)
- Create teams
- Add/remove members
- Assign team leads

### Real-time Features
- Open in multiple tabs/browsers
- Create/update tasks
- See instant updates across all sessions
- Receive notifications

## 🚨 Troubleshooting

### "No preview available"
- Make sure port 3000 is configured in your preview settings
- Try refreshing the preview
- Check if frontend service is running: `supervisorctl status frontend`

### "Cannot connect to backend"
- Check backend status: `supervisorctl status backend`
- View backend logs: `tail -f /var/log/supervisor/backend.out.log`
- Verify port 5000 is accessible

### "Database operations fail"
- ⚠️ **Configure MongoDB Atlas IP whitelist** (see above)
- This is the most common issue
- Check backend logs for MongoDB connection errors

### Services not running
```bash
# Restart all services
sudo supervisorctl restart all

# Check status
sudo supervisorctl status
```

## 📞 Quick Commands

```bash
# Check if services are running
supervisorctl status

# Test backend
curl http://localhost:5000/api/health

# Test frontend
curl http://localhost:3000

# View all logs
tail -f /var/log/supervisor/*.log

# Restart everything
supervisorctl restart all
```

## 🎉 You're All Set!

Your TaskFlow application is fully deployed and running!

**Next step:** Configure MongoDB Atlas, then start using the application through the preview!

---

**Need help?** Check the other documentation files:
- `README.md` - Complete overview
- `MONGODB_SETUP.md` - Database configuration
- `PROJECT_STRUCTURE.md` - Architecture details
- `IMPLEMENTATION_COMPLETE.md` - Feature checklist
