# Quick Fix: Workspace Context Issues

## Issues Fixed

### 1. JSX Syntax Error ✅
**File:** `frontend/src/components/landing/LandingNav.jsx` (line 39)
**Problem:** Duplicate closing bracket `>`
**Status:** ✅ FIXED

### 2. Workspace Context Problems 🔧

## Problem: "Workspace context not found"

**Root Cause:** Users without `workspaceId` field cannot access workspace-scoped routes.

## Diagnosis Steps

### Step 1: Check Current Status
```bash
cd backend
node scripts/check-workspace-status.js
```

This will show:
- ✅ Users properly assigned to workspaces
- ❌ Users without workspace (problem!)
- 📦 Available workspaces
- 👑 System admins (don't need workspace)

### Step 2: Review Output
Look for:
```
⚠️  Users WITHOUT workspace (non-admin): X
   ❌ user@example.com (role) - NO WORKSPACE
```

## Fix Steps

### Quick Fix (Automatic)
```bash
cd backend
node scripts/fix-workspace-context.js
```

This script will:
1. Find all users without `workspaceId`
2. Create a default COMMUNITY workspace (if none exists)
3. Assign all users to that workspace
4. Update workspace usage counts

### Manual Fix (Database)
If you prefer manual fix via MongoDB:

```javascript
// 1. Find users without workspace
db.users.find({ 
  workspaceId: { $exists: false }, 
  role: { $ne: 'admin' } 
})

// 2. Get workspace ID
db.workspaces.findOne({ type: 'COMMUNITY' })

// 3. Assign users to workspace
db.users.updateMany(
  { workspaceId: { $exists: false }, role: { $ne: 'admin' } },
  { $set: { workspaceId: ObjectId('YOUR_WORKSPACE_ID_HERE') } }
)

// 4. Update workspace user count
db.workspaces.updateOne(
  { _id: ObjectId('YOUR_WORKSPACE_ID_HERE') },
  { $set: { 'usage.userCount': NEW_COUNT } }
)
```

## Verification

After running the fix:

### 1. Check Status Again
```bash
node scripts/check-workspace-status.js
```

Should show:
```
✅ All users properly configured!
```

### 2. Test Login
1. Login to your app
2. Navigate to any page (Dashboard, Tasks, etc.)
3. Should work without "workspace not found" errors

### 3. Check API Response
Test the `/me` endpoint:
```bash
# Login first to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'

# Use the token
curl http://localhost:5000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Should return user with workspace info:
```json
{
  "user": {
    "_id": "...",
    "email": "...",
    "workspaceId": "...",  // ← Should NOT be null/undefined
    "role": "..."
  }
}
```

## Common Scenarios

### Scenario 1: Fresh Database
**Symptom:** No users, no workspaces
**Solution:** Use signup to create first workspace + admin user

### Scenario 2: Legacy Users
**Symptom:** Users exist from before workspace feature
**Solution:** Run `fix-workspace-context.js` script

### Scenario 3: System Admin Access
**Symptom:** Admin user needs cross-workspace access
**Solution:** Admin users don't need `workspaceId` - this is intentional

### Scenario 4: Multiple Workspaces
**Symptom:** Users in different workspaces
**Solution:** Each user should have ONE `workspaceId` pointing to their workspace

## Prevention

### Always Set workspaceId When Creating Users

**1. During Signup (auth.js):**
```javascript
// Creates workspace + user together
const workspace = await Workspace.create({...});
const user = await User.create({
  ...otherFields,
  workspaceId: workspace._id  // ✅
});
```

**2. When Admin Creates User (users.js):**
```javascript
const user = new User({
  ...otherFields,
  workspaceId: req.context.workspaceId  // ✅ From middleware
});
```

**3. Bulk Import (users.js):**
```javascript
users.push({
  ...userData,
  workspaceId: req.context.workspaceId  // ✅
});
```

## Files Changed

### Backend
- ✅ `backend/scripts/check-workspace-status.js` - NEW: Diagnostic script
- ✅ `backend/scripts/fix-workspace-context.js` - NEW: Auto-fix script

### Frontend
- ✅ `frontend/src/components/landing/LandingNav.jsx` - Fixed JSX error

### Documentation
- ✅ `WORKSPACE_CONTEXT_FIX.md` - Complete guide
- ✅ `WORKSPACE_CONTEXT_QUICK_FIX.md` - This file

## Next Steps

1. **Run diagnostic:** `node scripts/check-workspace-status.js`
2. **If problems found:** `node scripts/fix-workspace-context.js`
3. **Restart backend:** Stop and restart your server
4. **Test login:** Verify users can access the app
5. **Check audit logs:** Should now be working (from previous fix)

## Troubleshooting

### Error: "Cannot find module"
**Fix:** Make sure you're in the `backend` directory
```bash
cd backend
node scripts/check-workspace-status.js
```

### Error: "Connection refused"
**Fix:** Check your `.env` file has correct MongoDB connection string
```env
MONGODB_URI=mongodb://localhost:27017/taskflow
```

### Error: "Workspace has been deactivated"
**Fix:** Reactivate workspace in database
```javascript
db.workspaces.updateOne(
  { _id: ObjectId('WORKSPACE_ID') },
  { $set: { isActive: true } }
)
```

### Still getting errors after fix?
1. Clear browser cache and localStorage
2. Get new access token (login again)
3. Check backend logs for specific errors
4. Verify `req.context` is set in middleware logs

## Support

If issues persist:
1. Check `backend/middleware/workspaceContext.js` is loaded
2. Verify `server.js` applies middleware: `app.use('/api/users', authenticate, workspaceContext, userRoutes)`
3. Check User model schema has `workspaceId` field
4. Ensure all users have valid MongoDB ObjectId for `workspaceId`

---

**Quick Commands:**
```bash
# Check status
cd backend && node scripts/check-workspace-status.js

# Fix issues  
cd backend && node scripts/fix-workspace-context.js

# Restart server
# Ctrl+C to stop, then: npm start
```
