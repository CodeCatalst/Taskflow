# Multi-Workspace Implementation Guide

## Overview

The TaskFlow system has been upgraded from **single user single workspace** to **single user multiple workspaces**. This enhancement allows:

1. ✅ Users can belong to multiple workspaces
2. ✅ Admins can create multiple CORE workspaces
3. ✅ Users can switch between workspaces seamlessly
4. ✅ HR and Admins can access leave requests from all their workspaces
5. ✅ Cross-workspace leave management for HR panels

## Architecture Changes

### 1. User Model Updates

The User model now supports multiple workspaces:

```javascript
// NEW: Multiple workspaces support
workspaces: [{
  workspaceId: ObjectId,
  role: String, // Role in this specific workspace
  joinedAt: Date,
  isActive: Boolean
}]

// Current active workspace for session
currentWorkspaceId: ObjectId

// Legacy field (kept for backward compatibility)
workspaceId: ObjectId
```

#### Helper Methods Added

- `user.getRoleInWorkspace(workspaceId)` - Get user's role in a specific workspace
- `user.belongsToWorkspace(workspaceId)` - Check if user belongs to a workspace
- `user.addToWorkspace(workspaceId, role)` - Add user to a workspace
- `user.removeFromWorkspace(workspaceId)` - Remove user from a workspace
- `user.switchWorkspace(workspaceId)` - Switch to a different workspace

### 2. Workspace Context Middleware

Enhanced to support multi-workspace scenarios:

```javascript
// Request context now includes
req.context = {
  workspaceId: ObjectId,          // Current active workspace
  allWorkspaceIds: [ObjectId],    // All workspaces user belongs to
  currentRole: String,            // Role in current workspace
  workspaceType: String,
  workspaceName: String,
  // ... other properties
}
```

### 3. Authentication & Session Management

#### Login Response
```javascript
{
  user: { ... },
  workspace: { ... },              // Current active workspace
  workspaces: [{ ... }],           // All user workspaces (ALL workspaces for admins)
  accessToken: String,
  refreshToken: String
}
```

#### Login Flow with Workspace Selection

When a user with multiple workspaces logs in:

1. **Initial Login**: Credentials are validated and tokens are issued
2. **Workspace Selection Screen**: If user has multiple workspaces, a selection screen appears
3. **Workspace Selection**: User chooses their preferred workspace
4. **Session Initialization**: System switches to selected workspace and completes login

**Special Behavior for Admins:**
- Admins see ALL active workspaces in the system, not just assigned ones
- Admins can switch to any workspace at any time
- Admins always have admin role in all workspaces
- Visual indicator shows admin has system-wide access

For users with a single workspace, they proceed directly to the dashboard.

#### New Auth Endpoints

**Switch Workspace**
```
POST /api/auth/switch-workspace
Body: { workspaceId: String }
```

**Get All User Workspaces**
```
GET /api/auth/my-workspaces
```

**Select Workspace (After Login)**
```javascript
// Frontend method
await selectWorkspace(workspace, userData);
```

### 4. Leave Management - Cross-Workspace Access

HR and Admin users can now see leave requests from ALL their workspaces:

```javascript
// Leave requests query for HR/Admin
const hrWorkspaceIds = req.context?.allWorkspaceIds || [workspaceId];
query.workspaceId = { $in: hrWorkspaceIds };
```

#### Features:
- ✅ HR sees leave requests from all workspaces they belong to
- ✅ Optional filtering by specific workspace
- ✅ Notifications sent to HR across all relevant workspaces
- ✅ Leave requests show workspace badge

### 5. Frontend Updates

#### Workspace Context
```javascript
const { 
  workspace,           // Current workspace
  allWorkspaces,      // All user workspaces
  switchWorkspace,    // Function to switch workspace
  fetchAllWorkspaces  // Refresh workspace list
} = useWorkspace();
```

#### Workspace Switcher UI

Added to Sidebar:
- Shows current active workspace
- Dropdown list of all available workspaces
- Visual indicators (CORE vs COMMUNITY)
- Role badges for each workspace
- One-click switching with page reload

## Usage Examples

### Login with Workspace Selection

Users with multiple workspaces will see a selection screen after login:

```javascript
// Login flow
const result = await login(email, password);

if (result.requiresWorkspaceSelection) {
  // Show workspace selector
  // User selects workspace
  await selectWorkspace(selectedWorkspace, userData);
  // Navigate to dashboard
}
```

**Workspace Selector Features:**
- Visual workspace cards with icons
- Workspace type badges (CORE/COMMUNITY)
- User's role in each workspace
- One-click selection
- Responsive design

### Admin: Add User to Multiple Workspaces

```javascript
// Add user to workspace via API
POST /api/workspaces/:workspaceId/add-user
{
  userId: "user_id",
  role: "hr"  // Role for this workspace
}
```

### User: Switch Between Workspaces

```javascript
// Frontend
await switchWorkspace(workspaceId);
// Page reloads with new workspace context

// Backend
POST /api/auth/switch-workspace
{ workspaceId: "workspace_id" }
```

### HR: View Cross-Workspace Leaves

```javascript
// Get all leave requests from all HR's workspaces
GET /api/leaves

// Filter by specific workspace
GET /api/leaves?workspaceId=workspace_id

// Filter by user
GET /api/leaves?userId=user_id
```

## Migration from Single Workspace

### Automatic Migration on Save

The User model includes a pre-save hook that automatically migrates users:

```javascript
// If user has workspaceId but no workspaces array
if (this.isNew && this.workspaceId && (!this.workspaces || this.workspaces.length === 0)) {
  this.workspaces = [{
    workspaceId: this.workspaceId,
    role: this.role,
    joinedAt: new Date(),
    isActive: true
  }];
  this.currentWorkspaceId = this.workspaceId;
}
```

### Manual Migration Script

Run the migration script for existing users:

```bash
node backend/scripts/migrate-to-multi-workspace.js
```

This script:
- Finds all users with workspaceId but no workspaces array
- Converts single workspace to workspaces array format
- Sets currentWorkspaceId
- Preserves all existing data

## API Changes Summary

### New Routes

| Method | Endpoint | Description |
|--------|-----elector

Located in: `frontend/src/components/WorkspaceSelector.jsx`

**Purpose**: Displayed after login when user has multiple workspaces

Features:
- Clean, card-based workspace selection UI
- Workspace avatars with gradient backgrounds
- Type and role badges
- Loading states during selection
- Responsive layout
- Dark/light theme support

**Props**:
- `workspaces`: Array of workspace objects
- `onSelect`: Callback function when workspace is selected
- `userEmail`: User's email for display

### Workspace S-----|-------------|
| POST | `/api/auth/switch-workspace` | Switch user's active workspace |
| GET | `/api/auth/my-workspaces` | Get all user workspaces |
| POST | `/api/workspaces/:id/add-user` | Add user to workspace (Admin) |
| POST | `/api/workspaces/:id/remove-user` | Remove user from workspace (Admin) |

### Modified Routes

| Endpoint | Changes |
|----------|---------|
| `/api/leaves` | Returns leaves from all HR workspaces |
| `/api/auth/login` | Returns `workspaces` array |
| `/api/workspaces/:id/users` | Supports multi-workspace queries |

### Request Headers

New optional header for workspace-specific requests:
```
x-workspace-id: workspace_id
```

## Frontend Components

### Workspace Switcher

Located in: `frontend/src/components/Sidebar.jsx`

Features:
- Current workspace display with badge
- Dropdown with all available workspaces
- Visual workspace type indicators (CORE/COMMUNITY)
- Role display for each workspace
- Checkmark for current workspace

### Context Providers

**WorkspaceContext** (`frontend/src/context/WorkspaceContext.jsx`)
- Manages current workspace state
- Stores all user workspaces
- Provides switching functionality
- Workspace feature checks

## Database Indexes

Updated indexes for performance:

```javascript
userSchema.index({ 'workspaces.workspaceId': 1 });
userSchema.index({ currentWorkspaceId: 1 });
userSchema.index({ email: 1 }, { unique: true });
```

## Security Considerations

1. **Workspace Access Validation**: All workspace operations validate user membership
2. **Role-Based Access**: Role is workspace-specific
3. **Cross-Workspace Queries**: Limited to HR/Admin for leave management
4. **Audit Logging**: All workspace switches and user additions are logged

## Testing

### Test Scenarios

1. ✅ User login with multiple workspaces
2. ✅ Workspace switching
3. ✅ HR viewing cross-workspace leaves
4. ✅ Admin adding user to workspace
5. ✅ Admin removing user from workspace
6. ✅ User accessing only their assigned workspaces
7. ✅ Legacy single workspace users still work

### Test User Creation

```javascript
// Create user in multiple workspaces
const user = await User.findById(userId);
await user.addToWorkspace(workspace1Id, 'hr');
await user.addToWorkspace(workspace2Id, 'member');
```

## Backward Compatibility

The system maintains backward compatibility:

1. ✅ Legacy `workspaceId` field still works
2. ✅ Auto-migration on user save
3. ✅ Existing queries still functional
4. ✅ No breaking changes to existing endpoints

## Performance Optimizations

1. **Workspace data cached in localStorage**
2. **Lazy loading of workspace lists**
3. **Indexed queries for multi-workspace access**
4. **Efficient population of workspace data**

## Future Enhancements

- [ ] Workspace invitation system
- [ ] Workspace transfer/handover
- [ ] Cross-workspace task assignment
- [ ] Workspace activity feed
- [ ] Bulk user workspace management UI
- [ ] Workspace-specific permissions matrix

## Troubleshooting

### User can't see workspace switcher
- Check if user has multiple workspaces in `user.workspaces` array
- Verify `allWorkspaces` is populated in WorkspaceContext

### Leave requests not showing
- Verify HR/Admin role in workspace
- Check `req.context.allWorkspaceIds` includes expected workspaces
- Ensure leave requests have `workspaceId` populated

### Workspace switch not working
- Check user belongs to target workspace
- Verify token is valid
- Check console for error messages
- Ensure migration script has run

## Support & Documentation

For issues or questions:
1. Check this README
2. Review code comments in modified files
3. Check migration script output
4. Review audit logs for workspace operations

---

**Version**: 1.0.0  
**Last Updated**: February 11, 2026  
**Author**: TaskFlow Development Team
