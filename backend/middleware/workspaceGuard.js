/**
 * Workspace Guard Middleware
 * 
 * Blocks COMMUNITY workspaces from accessing restricted CORE-only features:
 * - Bulk user import
 * - Audit logs (ChangeLog)
 * - Advanced email automation/schedulers
 * 
 * Usage: Apply this middleware to routes that should be CORE-only
 * Must be used AFTER workspaceContext middleware
 */

/**
 * Middleware to ensure only CORE workspaces can access the route
 * System admins and workspace admins bypass this check
 */
export const requireCoreWorkspace = (req, res, next) => {
  // System admins and workspace admins can access CORE features
  if (req.context?.isSystemAdmin || req.user?.role === 'admin' || req.user?.role === 'community_admin') {
    return next();
  }

  if (!req.context || !req.context.workspaceType) {
    return res.status(403).json({
      message: 'Workspace context not found',
      error: 'NO_WORKSPACE_CONTEXT'
    });
  }

  if (req.context.workspaceType !== 'CORE') {
    return res.status(403).json({
      message: 'This feature is only available for CORE workspaces',
      error: 'CORE_ONLY_FEATURE',
      feature: 'CORE workspace required'
    });
  }

  next();
};

/**
 * Middleware to ensure workspace has a specific feature enabled
 * @param {string} featureName - Name of the feature to check (e.g., 'bulkUserImport', 'auditLogs')
 */
export const requireFeature = (featureName) => {
  return (req, res, next) => {
    // System admins and workspace admins have all features enabled
    if (req.context?.isSystemAdmin || req.user?.role === 'admin' || req.user?.role === 'community_admin') {
      return next();
    }

    if (!req.context || !req.context.workspace) {
      return res.status(403).json({
        message: 'Workspace context not found',
        error: 'NO_WORKSPACE_CONTEXT'
      });
    }

    if (!req.hasFeature(featureName)) {
      return res.status(403).json({
        message: `This feature is not available in your workspace`,
        error: 'FEATURE_NOT_AVAILABLE',
        feature: featureName,
        workspaceType: req.context.workspaceType
      });
    }

    next();
  };
};

/**
 * Middleware to check if workspace can add more users
 * Admins and system admins bypass this check
 */
export const checkUserLimit = (req, res, next) => {
  // System admins and workspace admins can bypass limits
  if (req.context?.isSystemAdmin || req.user?.role === 'admin' || req.user?.role === 'community_admin') {
    return next();
  }

  if (!req.context || !req.context.workspace) {
    return res.status(403).json({
      message: 'Workspace context not found',
      error: 'NO_WORKSPACE_CONTEXT'
    });
  }

  if (!req.canAddUser()) {
    const maxUsers = req.context.workspace.limits?.maxUsers || 0;
    return res.status(403).json({
      message: `User limit reached. Your workspace is limited to ${maxUsers} users.`,
      error: 'USER_LIMIT_REACHED',
      limit: maxUsers,
      current: req.context.workspace.usage?.userCount || 0
    });
  }

  next();
};

/**
 * Middleware to check if workspace can add more tasks
 * Admins and system admins bypass this check
 */
export const checkTaskLimit = (req, res, next) => {
  // System admins and workspace admins can bypass limits
  if (req.context?.isSystemAdmin || req.user?.role === 'admin' || req.user?.role === 'community_admin') {
    return next();
  }

  if (!req.context || !req.context.workspace) {
    return res.status(403).json({
      message: 'Workspace context not found',
      error: 'NO_WORKSPACE_CONTEXT'
    });
  }

  if (!req.canAddTask()) {
    const maxTasks = req.context.workspace.limits?.maxTasks || 0;
    return res.status(403).json({
      message: `Task limit reached. Your workspace is limited to ${maxTasks} tasks.`,
      error: 'TASK_LIMIT_REACHED',
      limit: maxTasks,
      current: req.context.workspace.usage?.taskCount || 0
    });
  }

  next();
};

/**
 * Middleware to check if workspace can add more teams
 * Admins and system admins bypass this check
 */
export const checkTeamLimit = (req, res, next) => {
  // System admins and workspace admins can bypass limits
  if (req.context?.isSystemAdmin || req.user?.role === 'admin' || req.user?.role === 'community_admin') {
    return next();
  }

  if (!req.context || !req.context.workspace) {
    return res.status(403).json({
      message: 'Workspace context not found',
      error: 'NO_WORKSPACE_CONTEXT'
    });
  }

  if (!req.canAddTeam()) {
    const maxTeams = req.context.workspace.limits?.maxTeams || 0;
    return res.status(403).json({
      message: `Team limit reached. Your workspace is limited to ${maxTeams} teams.`,
      error: 'TEAM_LIMIT_REACHED',
      limit: maxTeams,
      current: req.context.workspace.usage?.teamCount || 0
    });
  }

  next();
};

/**
 * Combined middleware for bulk user import
 * Requires CORE workspace AND bulkUserImport feature
 * System admins and workspace admins bypass restrictions
 */
export const requireBulkImport = [
  (req, res, next) => {
    // Allow admins and system admins to bypass
    if (req.context?.isSystemAdmin || req.user?.role === 'admin') {
      return next();
    }
    
    if (req.user && req.user.role === 'community_admin') {
      // Community admins can use bulk import (they're admins)
      return next();
    }
    next();
  },
  requireFeature('bulkUserImport'),
];

/**
 * Combined middleware for audit logs
 * Requires CORE workspace AND auditLogs feature
 * System admins and workspace admins bypass restrictions
 */
export const requireAuditLogs = [
  (req, res, next) => {
    // Allow admins and system admins to bypass
    if (req.context?.isSystemAdmin || req.user?.role === 'admin') {
      return next();
    }
    
    if (req.user && req.user.role === 'community_admin') {
      // Community admins can access audit logs (they're admins)
      return next();
    }
    next();
  },
  requireFeature('auditLogs'),
];

/**
 * Combined middleware for advanced automation
 * Requires CORE workspace AND advancedAutomation feature
 */
export const requireAdvancedAutomation = [
  requireFeature('advancedAutomation'),
];

export default {
  requireCoreWorkspace,
  requireFeature,
  checkUserLimit,
  checkTaskLimit,
  checkTeamLimit,
  requireBulkImport,
  requireAuditLogs,
  requireAdvancedAutomation,
};
