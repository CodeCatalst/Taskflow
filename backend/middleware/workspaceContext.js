import User from '../models/User.js';
import Workspace from '../models/Workspace.js';

/**
 * Workspace Context Middleware
 * 
 * Resolves the user's workspace and attaches workspace context to req.context
 * This ensures all queries are automatically scoped to the user's workspace
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

    if (!user.workspaceId) {
      // ADMIN PRIVILEGE: Admins can exist without workspace (system-wide access)
      if (user.role === 'admin') {
        req.context = {
          workspaceId: null,
          workspaceType: 'SYSTEM',
          workspaceName: 'System Administrator',
          workspace: null,
          isSystemAdmin: true,
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
      
      return res.status(403).json({ 
        message: 'User is not associated with any workspace. Please contact support.',
        error: 'NO_WORKSPACE' 
      });
    }

    // Use workspace already populated in auth middleware
    let workspace = user.workspaceId;
    
    // If workspace wasn't populated (shouldn't happen), fetch it
    if (!workspace || typeof workspace === 'string') {
      workspace = await Workspace.findById(user.workspaceId)
        .select('name type isActive settings limits usage')
        .lean();
      
      if (!workspace) {
        return res.status(403).json({ 
          message: 'Workspace not found',
          error: 'INVALID_WORKSPACE' 
        });
      }
    }

    // Check workspace active status
    if (!workspace.isActive) {
      return res.status(403).json({ 
        message: 'Your workspace has been deactivated. Please contact support.',
        error: 'WORKSPACE_INACTIVE',
        workspaceId: workspace._id
      });
    }

    // Attach workspace context to request
    req.context = {
      workspaceId: workspace._id,
      workspaceType: workspace.type,
      workspaceName: workspace.name,
      workspace: workspace, // Full workspace object for feature checks
      isSystemAdmin: false,
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
