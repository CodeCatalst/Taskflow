# Community Workspace Feature Restrictions

## Overview

Community workspaces are free-tier workspaces with limited features and usage caps. This document outlines all restrictions applied to COMMUNITY workspaces compared to CORE (enterprise) workspaces.

## Feature Restrictions

### 🚫 Features NOT Available in Community Workspaces

1. **HR Module (Complete)**
   - ❌ HR Dashboard
   - ❌ Attendance Tracking (Check-in/Check-out)
   - ❌ Leave Management System
   - ❌ Leave Types Configuration
   - ❌ HR Calendar
   - ❌ Holiday Management
   - ❌ Email Center / HR Templates

2. **Advanced Features**
   - ❌ Audit Logs / Change Logs
   - ❌ Bulk User Import
   - ❌ Advanced Automation
   - ❌ Custom Branding

### ✅ Features Available in Community Workspaces

1. **Core Task Management**
   - ✅ Task Creation & Management
   - ✅ Task Assignment
   - ✅ Comments & Collaboration
   - ✅ Kanban Board View
   - ✅ Task Status Updates

2. **Team Management**
   - ✅ Teams (Limited to 3 teams)
   - ✅ Team Member Management
   - ✅ Basic User Management

3. **Basic Features**
   - ✅ Dashboard
   - ✅ Notifications
   - ✅ Calendar View
   - ✅ Basic Analytics
   - ✅ Settings

## Usage Limits

### COMMUNITY Workspace Limits

| Resource | Limit |
|----------|-------|
| **Max Users** | 10 users |
| **Max Tasks** | 100 tasks |
| **Max Teams** | 3 teams |
| **Max Storage** | 1 GB |

### CORE Workspace Limits

| Resource | Limit |
|----------|-------|
| **Max Users** | Unlimited |
| **Max Tasks** | Unlimited |
| **Max Teams** | Unlimited |
| **Max Storage** | Unlimited |

## Implementation Details

### Frontend Restrictions

#### 1. Sidebar Menu Items

The sidebar automatically hides HR features when user is in a COMMUNITY workspace:

```jsx
// Items marked with coreWorkspaceOnly: true are hidden
const hrMenuItems = [
  { path: '/hr/dashboard', icon: LayoutDashboard, label: 'HR Dashboard', 
    roles: ['admin', 'hr'], coreWorkspaceOnly: true },
  { path: '/hr/attendance', icon: Clock, label: 'Attendance', 
    roles: ['admin', 'hr'], coreWorkspaceOnly: true },
  { path: '/hr/leaves', icon: CalendarDays, label: 'Leave Management', 
    roles: ['admin', 'hr', 'member'], coreWorkspaceOnly: true },
  { path: '/hr/calendar', icon: Calendar, label: 'HR Calendar', 
    roles: ['admin', 'hr'], coreWorkspaceOnly: true },
  { path: '/hr/email-center', icon: FileText, label: 'Email Center', 
    roles: ['admin', 'hr'], coreWorkspaceOnly: true },
];

const adminMenuItems = [
  { path: '/changelog', icon: FileText, label: 'Audit Logs', 
    roles: ['admin'], coreWorkspaceOnly: true },
];
```

#### 2. Workspace Context Helpers

The WorkspaceContext provides helper methods for feature checks:

```javascript
// Check workspace type
const { isCore, isCommunity } = useWorkspace();

// Check specific features
const { hasFeature } = useWorkspace();
if (hasFeature('auditLogs')) {
  // Show audit logs feature
}

// Check limits
const { canAddUser, canAddTask, canAddTeam } = useWorkspace();
```

### Backend Restrictions

#### 1. Workspace Guards

All HR routes are protected with `requireCoreWorkspace` middleware:

```javascript
import { requireCoreWorkspace } from '../middleware/workspaceGuard.js';

// Example: All attendance routes require CORE workspace
router.get('/', authenticate, requireCoreWorkspace, async (req, res) => {
  // Only accessible from CORE workspaces
});
```

#### 2. Protected Routes

**Attendance Routes** (`/api/hr/attendance`)
- All routes protected with `requireCoreWorkspace`

**Leave Routes** (`/api/hr/leaves`)
- All routes protected with `requireCoreWorkspace`

**Leave Types Routes** (`/api/hr/leave-types`)
- All routes protected with `requireCoreWorkspace`

**Holidays Routes** (`/api/hr/holidays`)
- All routes protected with `requireCoreWorkspace`

**HR Calendar Routes** (`/api/hr/calendar`)
- All routes protected with `requireCoreWorkspace`

**Email Templates Routes** (`/api/hr/email-templates`)
- All routes protected with `requireCoreWorkspace`

**Changelog Routes** (`/api/changelog`)
- All routes protected with `requireAuditLogs` (feature-based)

#### 3. Middleware Guards

**requireCoreWorkspace**
- Blocks COMMUNITY workspaces from accessing the route
- System admins (role: 'admin') bypass this check
- Community admins in COMMUNITY workspaces are blocked

**requireFeature(featureName)**
- Checks if workspace has a specific feature enabled
- Features: `bulkUserImport`, `auditLogs`, `advancedAutomation`, `customBranding`
- System admins bypass this check

**Limit Checks**
- `checkUserLimit` - Enforces max users
- `checkTaskLimit` - Enforces max tasks
- `checkTeamLimit` - Enforces max teams
- System admins bypass limit checks
- Community admins must respect limits

### Database Schema

#### Workspace Model Features

```javascript
settings: {
  features: {
    bulkUserImport: Boolean,      // false for COMMUNITY
    auditLogs: Boolean,            // false for COMMUNITY
    advancedAutomation: Boolean,   // false for COMMUNITY
    customBranding: Boolean,       // false for COMMUNITY
  }
},
limits: {
  maxUsers: Number,      // 10 for COMMUNITY, null for CORE
  maxTasks: Number,      // 100 for COMMUNITY, null for CORE
  maxTeams: Number,      // 3 for COMMUNITY, null for CORE
  maxStorageGB: Number,  // 1 for COMMUNITY, null for CORE
}
```

## Role-Based Access

### System Admin (role: 'admin')
- ✅ Can access ALL workspaces
- ✅ Can access ALL features regardless of workspace type
- ✅ Bypasses all limits
- ✅ Can switch to any workspace

### Community Admin (role: 'community_admin')
- ✅ Can access their COMMUNITY workspace
- ❌ Respects workspace type restrictions (no HR features in COMMUNITY)
- ❌ Must respect workspace limits
- ✅ Can manage users in their workspace (within limits)

### HR Role (role: 'hr')
- ✅ Can access HR features in CORE workspaces
- ❌ Cannot access HR features in COMMUNITY workspaces
- ✅ Can see leave requests across all their workspaces (if CORE)

### Team Lead (role: 'team_lead')
- ✅ Basic task management
- ✅ Team management
- ❌ No HR access

### Member (role: 'member')
- ✅ Task management
- ✅ Can view own tasks
- ❌ Limited permissions

## Error Responses

When a COMMUNITY workspace tries to access restricted features:

```json
{
  "message": "This feature is only available for CORE workspaces",
  "error": "CORE_ONLY_FEATURE",
  "feature": "CORE workspace required"
}
```

When a feature is not available:

```json
{
  "message": "This feature is not available in your workspace",
  "error": "FEATURE_NOT_AVAILABLE",
  "feature": "auditLogs",
  "workspaceType": "COMMUNITY"
}
```

When limit is reached:

```json
{
  "message": "User limit reached. Your workspace is limited to 10 users.",
  "error": "USER_LIMIT_REACHED",
  "limit": 10,
  "current": 10
}
```

## Upgrade Path

Community workspace users can upgrade to CORE workspace by:
1. Contacting system administrator
2. System admin can change workspace type in Workspace Management
3. All features and limits are automatically updated

## Testing

### Frontend Testing
1. Create/switch to a COMMUNITY workspace
2. Verify HR menu items are hidden in sidebar
3. Verify Audit Logs are hidden
4. Attempt direct navigation to `/hr/dashboard` - should be blocked

### Backend Testing
1. Authenticate as user in COMMUNITY workspace
2. Try accessing `/api/hr/leaves` - should return 403 CORE_ONLY_FEATURE
3. Try accessing `/api/changelog` - should return 403 FEATURE_NOT_AVAILABLE
4. Add users up to limit (10) - should succeed
5. Try adding 11th user - should return 403 USER_LIMIT_REACHED

## Files Modified

### Backend
- `backend/middleware/workspaceGuard.js` - Fixed guard logic to restrict community_admin
- `backend/routes/attendance.js` - Added requireCoreWorkspace to all routes
- `backend/routes/leaves.js` - Added requireCoreWorkspace to all routes
- `backend/routes/leaveTypes.js` - Added requireCoreWorkspace to all routes
- `backend/routes/holidays.js` - Added requireCoreWorkspace to all routes
- `backend/routes/emailTemplates.js` - Added requireCoreWorkspace to all routes
- `backend/routes/hrCalendar.js` - Already had requireCoreWorkspace
- `backend/routes/changelog.js` - Already had requireAuditLogs

### Frontend
- `frontend/src/components/Sidebar.jsx` - Added coreWorkspaceOnly flag to Audit Logs
- `frontend/src/context/WorkspaceContext.jsx` - Already had helper methods

## Summary

✅ **COMMUNITY workspaces** are designed for small teams with basic task management needs
✅ **CORE workspaces** provide enterprise-grade features including full HR module
✅ **All restrictions are enforced** at both frontend (UI) and backend (API) levels
✅ **System admins** have unrestricted access for administrative purposes
✅ **Community admins** must respect workspace limitations
