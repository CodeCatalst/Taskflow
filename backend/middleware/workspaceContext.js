import User from '../models/User.js';
import Workspace from '../models/Workspace.js';

/**
 * Workspace Context Middleware
 * 
 * Resolves the user's current workspace and attaches workspace context to req.context
 * This ensures all queries are automatically scoped to the user's active workspace
 * 
 * MULTI-WORKSPACE SUPPORT:
 * - Users can belong to multiple workspaces
 * - req.context.workspaceId contains the current active workspace
 * - HR/Admin users can access leave requests across all their workspaces
 * 
 * Must be used AFTER authentication middleware (auth.js)
 */
const workspaceContext = async (req, res, next) => {
  try {
    // Skip workspace resolution for public endpoints
    if (!req.user || !req.user._id) {
      return next();
    }

    // User is already fetched in auth middleware, use it directly
    const user = req.user;

    if (!user) {
      return res.status(401).json({ 
        message: 'User not found',
        error: 'INVALID_USER' 
      });
    }

    // Check for workspace override in header (for workspace switching)
    const requestedWorkspaceId = req.headers['x-workspace-id'];
    
    let activeWorkspaceId = requestedWorkspaceId || user.currentWorkspaceId || user.workspaceId;
    
    // If user has no workspace set
    if (!activeWorkspaceId) {
      // ADMIN PRIVILEGE: Admins can exist without workspace (system-wide access)
      if (user.role === 'admin') {
        req.context = {
          workspaceId: null,
          workspaceType: 'SYSTEM',
          workspaceName: 'System Administrator',
          workspace: null,
          isSystemAdmin: true,
          allWorkspaceIds: [],
          user: {
            id: user._id,
            email: user.email,
            role: user.role,
            full_name: user.full_name,
          },
        };
        
        // System admins have all privileges
        req.isCoreWorkspace = () => true;
        req.isCommunityWorkspace = () => false;
        req.hasFeature = () => true;
        req.canAddUser = () => true;
        req.canAddTask = () => true;
        req.canAddTeam = () => true;
        
        return next();
      }
      
      // Check if user has any workspaces in the new multi-workspace array
      if (user.workspaces && user.workspaces.length > 0) {
        const firstActiveWorkspace = user.workspaces.find(ws => ws.isActive);
        if (firstActiveWorkspace) {
          activeWorkspaceId = firstActiveWorkspace.workspaceId;
          // Update user's current workspace
          user.currentWorkspaceId = activeWorkspaceId;
          await user.save();
        } else {
          return res.status(403).json({ 
            message: 'User has no active workspaces. Please contact support.',
            error: 'NO_ACTIVE_WORKSPACE' 
          });
        }
      } else {
        return res.status(403).json({ 
          message: 'User is not associated with any workspace. Please contact support.',
          error: 'NO_WORKSPACE' 
        });
      }
    }
    
    // Validate that user belongs to the requested workspace
    // Admins can access any workspace
    if (requestedWorkspaceId && user.role !== 'admin' && !user.belongsToWorkspace(requestedWorkspaceId)) {
      return res.status(403).json({
        message: 'You do not have access to this workspace',
        error: 'WORKSPACE_ACCESS_DENIED'
      });
    }

    // Fetch the active workspace
    let workspace = await Workspace.findById(activeWorkspaceId)
      .select('name type isActive settings limits usage')
      .lean();
    
    if (!workspace) {
      return res.status(403).json({ 
        message: 'Workspace not found',
        error: 'INVALID_WORKSPACE' 
      });
    }

    // Check workspace active status
    if (!workspace.isActive) {
      return res.status(403).json({ 
        message: 'Your workspace has been deactivated. Please contact support.',
        error: 'WORKSPACE_INACTIVE',
        workspaceId: workspace._id
      });
    }
    
    // Get all workspace IDs user belongs to (for cross-workspace queries like HR leave management)
    // Support both new multi-workspace array and legacy single workspace field
    let allWorkspaceIds;
    if (user.workspaces && user.workspaces.length > 0) {
      allWorkspaceIds = user.workspaces
        .filter(ws => ws.isActive)
        .map(ws => ws.workspaceId);
    } else {
      // Fallback to legacy workspace field(s)
      allWorkspaceIds = [activeWorkspaceId];
    }
    
    // Get role in current workspace
    const roleInWorkspace = user.getRoleInWorkspace(activeWorkspaceId) || user.role;

    // Attach workspace context to request
    req.context = {
      workspaceId: workspace._id,
      workspaceType: workspace.type,
      workspaceName: workspace.name,
      workspace: workspace, // Full workspace object for feature checks
      isSystemAdmin: false,
      allWorkspaceIds: allWorkspaceIds, // All workspaces user belongs to
      currentRole: roleInWorkspace, // Role in current workspace
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
      },
    };

    // Helper methods for easy access
    req.isCoreWorkspace = () => workspace.type === 'CORE';
    req.isCommunityWorkspace = () => workspace.type === 'COMMUNITY';
    req.hasFeature = (featureName) => workspace.settings?.features?.[featureName] === true;
    req.canAddUser = () => {
      if (workspace.type === 'CORE' || !workspace.limits?.maxUsers) return true;
      return workspace.usage?.userCount < workspace.limits.maxUsers;
    };
    req.canAddTask = () => {
      if (workspace.type === 'CORE' || !workspace.limits?.maxTasks) return true;
      return workspace.usage?.taskCount < workspace.limits.maxTasks;
    };
    req.canAddTeam = () => {
      if (workspace.type === 'CORE' || !workspace.limits?.maxTeams) return true;
      return workspace.usage?.teamCount < workspace.limits.maxTeams;
    };

    next();
  } catch (error) {
    console.error('Workspace context middleware error:', error);
    res.status(500).json({ 
      message: 'Failed to resolve workspace context',
      error: error.message 
    });
  }
};

export default workspaceContext;
