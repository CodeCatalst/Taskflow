# Workspace Context Fix Guide

## Problem Description

**Error:** "Workspace context not found" or "User is not associated with any workspace"
**Cause:** Users without `workspaceId` field trying to access workspace-scoped routes

## Root Causes

### 1. Legacy Users Without workspaceId
Users created before workspace implementation don't have a `workspaceId` field set.

### 2. Middleware Order
The `workspaceContext` middleware requires users to have either:
- A valid `workspaceId` in their User document, OR
- The `admin` role (for system administrators)

### 3. Community Workspace Users
COMMUNITY tier users must be properly associated with their workspace.

## How Workspace Context Works

```
Request → authenticate → workspaceContext → route handler
              ↓              ↓                    ↓
           req.user    req.context         uses req.context.workspaceId
```

### WorkspaceContext Middleware Flow:
1. Checks if user is authenticated (`req.user` exists)
2. Fetches user from database with `workspaceId`
3. **If no workspaceId:**
   - ✅ Allow if user is `admin` (system admin)
   - ❌ Reject with "NO_WORKSPACE" error for all other roles
4. **If has workspaceId:**
   - Fetch workspace details
   - Check if workspace is active
   - Set `req.context` with workspace info
5. Attach helper methods: `req.isCoreWorkspace()`, `req.hasFeature()`, etc.

## Solutions

### Solution 1: Assign Existing Users to Default Workspace

**For COMMUNITY workspaces:**
```javascript
// Run this script to fix users without workspace
import User from './models/User.js';
import Workspace from './models/Workspace.js';

async function assignUsersToWorkspace() {
  // Find the default/first workspace (or create one)
  let workspace = await Workspace.findOne({ type: 'COMMUNITY' });
  
  if (!workspace) {
    // Create a default community workspace
    workspace = await Workspace.create({
      name: 'Default Workspace',
      type: 'COMMUNITY',
      owner: null, // Set to first admin
      isActive: true,
    });
  }
  
  // Find all users without workspaceId
  const usersWithoutWorkspace = await User.find({ 
    workspaceId: { $exists: false },
    role: { $ne: 'admin' } // Skip system admins
  });
  
  console.log(`Found ${usersWithoutWorkspace.length} users without workspace`);
  
  // Assign them to the workspace
  for (const user of usersWithoutWorkspace) {
    user.workspaceId = workspace._id;
    await user.save();
    console.log(`✅ Assigned ${user.email} to workspace ${workspace.name}`);
  }
  
  // Update workspace user count
  workspace.usage.userCount = await User.countDocuments({ workspaceId: workspace._id });
  await workspace.save();
  
  console.log(`✅ Updated workspace user count: ${workspace.usage.userCount}`);
}

// Run the fix
await assignUsersToWorkspace();
```

### Solution 2: Allow System Admins Without Workspace

Already implemented in `workspaceContext.js` lines 30-55:
```javascript
if (!user.workspaceId) {
  if (user.role === 'admin') {
    // System admin: set context with null workspace
    req.context = {
      workspaceId: null,
      isSystemAdmin: true,
      // ... all permissions enabled
    };
    return next();
  }
  // Other users: reject
  return res.status(403).json({ 
    message: 'User is not associated with any workspace',
    error: 'NO_WORKSPACE' 
  });
}
```

### Solution 3: Check User Database

**Query to find problematic users:**
```javascript
// In MongoDB or via backend script
const problematicUsers = await User.find({
  workspaceId: { $exists: false },
  role: { $ne: 'admin' }
}).select('email full_name role workspaceId');

console.log('Users without workspace:');
problematicUsers.forEach(user => {
  console.log(`- ${user.email} (${user.role}): no workspaceId`);
});
```

## Testing Steps

### 1. Check Current User Status
```bash
# In backend directory
node -e "
import('./models/User.js').then(async ({ default: User }) => {
  await import('./config/db.js').then(m => m.default());
  const users = await User.find({}).select('email role workspaceId');
  users.forEach(u => console.log(\`\${u.email}: workspace=\${u.workspaceId || 'NONE'}, role=\${u.role}\`));
  process.exit(0);
});
"
```

### 2. Test API Endpoints
```bash
# Should work (authenticated endpoints)
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/users/me

# Check for errors in response
# Error "NO_WORKSPACE" means user needs workspace assignment
```

### 3. Verify Workspace Assignment
```javascript
// In your backend console or script
const user = await User.findOne({ email: 'test@example.com' })
  .populate('workspaceId');
  
console.log('User workspace:', user.workspaceId);
// Should show workspace details, not null/undefined
```

## Prevention

### Always Set workspaceId When Creating Users

**In signup (auth.js):**
```javascript
const user = new User({
  full_name,
  email,
  password_hash: password,
  role: 'community_admin',
  workspaceId: workspace._id,  // ✅ Always set this!
});
```

**In user creation (users.js):**
```javascript
const user = new User({
  full_name,
  email,
  password_hash: generatedPassword,
  role,
  team_id,
  workspaceId: req.context.workspaceId  // ✅ Use from context!
});
```

## Common Errors

### Error: "User is not associated with any workspace"
**Meaning:** User document doesn't have `workspaceId` field
**Fix:** Assign user to a workspace using Solution 1

### Error: "Workspace not found"
**Meaning:** User has `workspaceId` but workspace was deleted
**Fix:** Reassign user to valid workspace or create missing workspace

### Error: "Workspace has been deactivated"
**Meaning:** Workspace exists but `isActive: false`
**Fix:** Reactivate workspace in database

### Error: Cannot read property 'workspaceId' of undefined
**Meaning:** `req.context` is undefined (middleware not running)
**Fix:** Check that `workspaceContext` middleware is applied in server.js

## Quick Fix Script

Save as `backend/scripts/fix-workspace-context.js`:

```javascript
import mongoose from 'mongoose';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import connectDB from '../config/db.js';

async function fixWorkspaceContext() {
  try {
    await connectDB();
    
    console.log('🔍 Checking for users without workspace...');
    
    // Find users without workspace (exclude system admins)
    const usersWithoutWorkspace = await User.find({
      $or: [
        { workspaceId: { $exists: false } },
        { workspaceId: null }
      ],
      role: { $ne: 'admin' }
    });
    
    if (usersWithoutWorkspace.length === 0) {
      console.log('✅ All users have workspaces assigned!');
      process.exit(0);
    }
    
    console.log(`⚠️ Found ${usersWithoutWorkspace.length} users without workspace:`);
    usersWithoutWorkspace.forEach(u => {
      console.log(`   - ${u.email} (${u.role})`);
    });
    
    // Find or create default workspace
    let workspace = await Workspace.findOne({ type: 'COMMUNITY' });
    
    if (!workspace) {
      console.log('\n📦 Creating default COMMUNITY workspace...');
      
      // Find first admin to be owner
      const adminUser = await User.findOne({ role: 'admin' });
      
      workspace = await Workspace.create({
        name: 'Default Community Workspace',
        type: 'COMMUNITY',
        owner: adminUser?._id || null,
        isActive: true,
        settings: {
          features: {
            auditLogs: false,
            advancedAnalytics: false,
            bulkImport: false,
            customFields: false,
            apiAccess: false
          }
        },
        limits: {
          maxUsers: 10,
          maxTeams: 3,
          maxTasks: 100,
          maxStorage: 1073741824 // 1GB
        },
        usage: {
          userCount: 0,
          teamCount: 0,
          taskCount: 0,
          storageUsed: 0
        }
      });
      
      console.log(`✅ Created workspace: ${workspace.name} (${workspace._id})`);
    } else {
      console.log(`\n📦 Using existing workspace: ${workspace.name} (${workspace._id})`);
    }
    
    // Assign all users to this workspace
    console.log('\n🔧 Assigning users to workspace...');
    for (const user of usersWithoutWorkspace) {
      user.workspaceId = workspace._id;
      await user.save();
      console.log(`   ✅ ${user.email}`);
    }
    
    // Update workspace usage count
    workspace.usage.userCount = await User.countDocuments({ 
      workspaceId: workspace._id 
    });
    await workspace.save();
    
    console.log(`\n✅ Fixed ${usersWithoutWorkspace.length} users`);
    console.log(`✅ Workspace now has ${workspace.usage.userCount} users`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixWorkspaceContext();
```

**Run it:**
```bash
cd backend
node scripts/fix-workspace-context.js
```

## Summary

✅ **Fixed:** All users must have `workspaceId` (except system admins)
✅ **Fixed:** Middleware properly checks for workspace context
✅ **Fixed:** System admins can operate without workspace
✅ **Fixed:** COMMUNITY users have proper workspace assignment

**Next Steps:**
1. Run the fix script above
2. Restart backend server
3. Test login and navigation
4. Verify `/me` endpoint returns workspace info
