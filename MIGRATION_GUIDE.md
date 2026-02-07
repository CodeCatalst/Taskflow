# Multiple Teams Migration Guide

This guide explains how to migrate your existing database to support the new multiple teams feature.

## 🎯 What Changed?

### Before
- Users could only belong to **one team** (via `team_id` field)
- Changing teams would overwrite the previous team assignment

### After
- **Core Workspace** users can belong to **multiple teams** (via `teams` array)
- **Community Workspace** users still use single team (`team_id` only)
- Maintains backward compatibility with existing `team_id` field

## 📋 Prerequisites

Before running the migration:

1. ✅ **Backup your database**
   ```bash
   # MongoDB Atlas: Use built-in backup feature
   # Or export your database
   mongodump --uri="your_mongodb_uri" --out=./backup
   ```

2. ✅ **Update your code** (already done)
   - User model now includes `teams` array
   - Team routes updated to handle multiple teams
   - HR permissions updated

3. ✅ **Verify environment variables**
   - Ensure `MONGODB_URI` is set correctly in your `.env` file

## 🚀 Migration Steps

### Step 1: Run the Migration Script

The migration script will:
- Add `teams` array field to all existing users
- Migrate existing `team_id` to `teams` array (for Core Workspace users)
- Leave Community Workspace users with empty `teams` array

```bash
# Navigate to backend directory
cd backend

# Run migration script
node scripts/migrate-multiple-teams.js
```

**Expected Output:**
```
🚀 Starting Multiple Teams Migration...
✅ Connected to MongoDB

📊 Found 25 users to process

✅ Migrated: John Doe (john@example.com)
   - Workspace: CORE
   - Added team_id to teams array: 507f1f77bcf86cd799439011

✅ Migrated: Jane Smith (jane@example.com)
   - Workspace: COMMUNITY
   - Initialized empty teams array (Community Workspace uses single team_id)

============================================================
📊 MIGRATION SUMMARY
============================================================
✅ Successfully Migrated: 25 users
⏭️  Skipped (already migrated): 0 users
❌ Errors: 0 users
📝 Total Processed: 25 users
============================================================

🔍 Verifying migration...
✅ 25 users now have 'teams' field
✅ 15 Core Workspace users with team_id now have teams array populated

✨ Migration completed successfully!
```

### Step 2: Verify the Migration

Run the verification script to ensure everything is correct:

```bash
node scripts/verify-teams-migration.js
```

**Expected Output:**
```
🔍 Starting Multiple Teams Migration Verification...

======================================================================
VERIFICATION REPORT
======================================================================

1️⃣  TEAMS FIELD PRESENCE
----------------------------------------------------------------------
   Total Users: 25
   Users with 'teams' field: 25
   Users without 'teams' field: 0
   ✅ All users have teams field

2️⃣  CORE WORKSPACE ANALYSIS
----------------------------------------------------------------------
   Core Workspaces Found: 2

   📦 Workspace: TechCorp
      Total Users: 15
      Users with team_id: 15
      Users with teams array: 15
      Consistent users (team_id in teams): 15
      ✅ All users have consistent team data

...

🎉 Migration verification PASSED! System is ready for multiple teams.
```

### Step 3: Deploy to Production

Once migration is verified locally:

1. **Deploy the updated code** to your production environment
2. **Run the migration script** on production database:
   ```bash
   # On your production server
   node backend/scripts/migrate-multiple-teams.js
   ```
3. **Verify** the production migration:
   ```bash
   node backend/scripts/verify-teams-migration.js
   ```

## 🔍 Post-Migration Checks

### Manual Verification

1. **Check a Core Workspace user:**
   ```javascript
   // In MongoDB shell or Compass
   db.users.findOne({ 
     workspaceId: ObjectId("your_core_workspace_id") 
   })
   // Should have: team_id AND teams array with at least one team
   ```

2. **Check a Community Workspace user:**
   ```javascript
   db.users.findOne({ 
     workspaceId: ObjectId("your_community_workspace_id") 
   })
   // Should have: team_id (if assigned) AND empty teams array
   ```

### Test in Application

1. **Login as Admin/HR** in a Core Workspace
2. **Try adding a user to multiple teams:**
   - Go to Teams section
   - Select a team
   - Add a user who's already in another team
   - User should now be in both teams
3. **Verify user can be removed** from one team without affecting other teams

## 🎨 New Features Available

After successful migration, these features are now available:

### For Core Workspace:
- ✅ Users can belong to multiple teams simultaneously
- ✅ Users maintain a "primary" team (`team_id`) for backward compatibility
- ✅ Removing from one team doesn't remove from all teams
- ✅ Team lead can see members from their specific team

### For All Workspaces:
- ✅ HR can delete users (previously Admin only)
- ✅ HR can delete teams (previously Admin only)
- ✅ Proper cleanup when deleting users (removed from all teams)

## 🐛 Troubleshooting

### Issue: Migration script fails with "teams already exists"
**Solution:** This is fine if you've already run the migration. Check the verification script output.

### Issue: Some users don't have teams array
**Solution:** Run the migration script again - it will process only missing users.

### Issue: Inconsistent data after migration
**Solution:** 
1. Check verification output for specific issues
2. Manually fix inconsistencies:
   ```javascript
   // If user.team_id exists but not in teams array
   db.users.updateOne(
     { _id: ObjectId("user_id") },
     { $addToSet: { teams: ObjectId("team_id") } }
   )
   ```

### Issue: Community Workspace users have teams array populated
**Solution:** This won't break anything, but to clean up:
```javascript
// Clear teams array for Community Workspace users
db.users.updateMany(
  { workspaceId: ObjectId("community_workspace_id") },
  { $set: { teams: [] } }
)
```

## 📊 Database Schema Reference

### User Schema (After Migration)

```javascript
{
  _id: ObjectId("..."),
  full_name: "John Doe",
  email: "john@example.com",
  role: "member",
  
  // Single team (backward compatibility + primary team)
  team_id: ObjectId("team1_id"),
  
  // Multiple teams (new - Core Workspace only)
  teams: [
    ObjectId("team1_id"),
    ObjectId("team2_id"),
    ObjectId("team3_id")
  ],
  
  workspaceId: ObjectId("workspace_id"),
  // ... other fields
}
```

## 🔄 Rollback (If Needed)

If you need to rollback the migration:

```javascript
// Remove teams field from all users
db.users.updateMany(
  {},
  { $unset: { teams: "" } }
)
```

Then redeploy the previous version of your code.

## 📞 Support

If you encounter issues during migration:
1. Check the logs from migration and verification scripts
2. Review MongoDB logs for any errors
3. Ensure your MongoDB version supports array operations (4.0+)
4. Verify network connectivity to MongoDB

## ✅ Migration Checklist

- [ ] Database backup completed
- [ ] Migration script run successfully
- [ ] Verification script shows all checks passed
- [ ] Manual spot checks completed
- [ ] Application testing performed
- [ ] Production deployment planned
- [ ] Team notified of new features

---

**Important:** Always test in a development/staging environment before running on production data!
