import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import mongoose from 'mongoose';

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
      req.context = {
        workspaceId: null,
        workspaceType: 'NONE',
        workspaceName: null,
        workspace: null,
        isSystemAdmin: false,
        allWorkspaceIds: [],
        user: null,
      };
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

    // Validate workspace ID format if provided (prevents injection attacks)
    if (requestedWorkspaceId && !mongoose.Types.ObjectId.isValid(requestedWorkspaceId)) {
      return res.status(400).json({
        message: 'Invalid workspace ID format',
        error: 'INVALID_WORKSPACE_ID'
      });
    }

    const getWorkspaceIdValue = (value) => value?._id || value;
    const normalizeWorkspaceId = (value) => {
      const workspaceId = getWorkspaceIdValue(value);
      return workspaceId ? workspaceId.toString() : null;
    };
    const toObjectId = (value) => {
      if (!value) return null;
      const rawValue = getWorkspaceIdValue(value);
      return mongoose.Types.ObjectId.isValid(rawValue)
        ? new mongoose.Types.ObjectId(rawValue)
        : null;
    };
    const getDefaultCoreWorkspace = async () => {
      return Workspace.findOne({ type: 'CORE', isActive: true })
        .select('name type isActive settings limits usage')
        .lean();
    };
    const ensureUserWorkspaceAssignment = async (workspaceIdValue) => {
      const workspaceObjectId = toObjectId(workspaceIdValue);
      if (!workspaceObjectId) {
        return;
      }

      const workspaceIdString = workspaceObjectId.toString();
      let needsUpdate = false;

      if (normalizeWorkspaceId(user.workspaceId) !== workspaceIdString) {
        user.workspaceId = workspaceObjectId;
        needsUpdate = true;
      }

      if (normalizeWorkspaceId(user.currentWorkspaceId) !== workspaceIdString) {
        user.currentWorkspaceId = workspaceObjectId;
        needsUpdate = true;
      }

      const currentMemberships = Array.isArray(user.workspaces) ? user.workspaces : [];
      const membershipIndex = currentMemberships.findIndex(
        ws => normalizeWorkspaceId(ws.workspaceId) === workspaceIdString
      );

      if (membershipIndex === -1) {
        currentMemberships.push({
          workspaceId: workspaceObjectId,
          role: user.role,
          joinedAt: new Date(),
          isActive: true,
        });
        user.workspaces = currentMemberships;
        needsUpdate = true;
      } else if (!currentMemberships[membershipIndex].isActive) {
        currentMemberships[membershipIndex].isActive = true;
        currentMemberships[membershipIndex].role = currentMemberships[membershipIndex].role || user.role;
        user.workspaces = currentMemberships;
        needsUpdate = true;
      }

      if (needsUpdate) {
        // Do not call user.save() here: auth middleware intentionally excludes password_hash,
        // and saving a partially-selected document can fail validation.
        await User.updateOne(
          { _id: user._id },
          {
            $set: {
              workspaceId: workspaceObjectId,
              currentWorkspaceId: workspaceObjectId,
              workspaces: currentMemberships,
            },
          }
        );
      }
    };

    let activeWorkspaceId = requestedWorkspaceId || getWorkspaceIdValue(user.currentWorkspaceId) || getWorkspaceIdValue(user.workspaceId);

    // If user has no workspace set
    if (!activeWorkspaceId) {
      // ALL USERS: Prefer the default CORE workspace when available
      const defaultCoreWorkspace = await getDefaultCoreWorkspace();

      if (defaultCoreWorkspace) {
        activeWorkspaceId = defaultCoreWorkspace._id;
        await ensureUserWorkspaceAssignment(defaultCoreWorkspace._id);
      } else if (user.role !== 'admin') {
        // If no core workspace exists and user isn't an admin, they must have some workspace
        if (user.workspaces && user.workspaces.length > 0) {
          const firstActiveWorkspace = user.workspaces.find(ws => ws.isActive);
          if (firstActiveWorkspace) {
            activeWorkspaceId = getWorkspaceIdValue(firstActiveWorkspace.workspaceId);
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
    }

    // For admins who might still have activeWorkspaceId = null (e.g. no default core workspace)
    if (!activeWorkspaceId && user.role === 'admin') {
        req.context = {
          isSystemAdmin: true,
          allWorkspaceIds: [],
          manageableWorkspaceIds: [],
          currentRole: 'admin',
          user: {
            id: user._id,
            email: user.email,
            role: user.role,
            full_name: user.full_name,
          },
          workspaceId: null,
          workspaceType: 'SYSTEM',
          workspaceName: 'System Administrator',
          workspace: null,
        };
        req.isCoreWorkspace = () => true;
        req.isCommunityWorkspace = () => false;
        req.hasFeature = () => true;
        req.canAddUser = () => true;
        req.canAddTask = () => true;
        req.canAddTeam = () => true;
        return next();
    }

    // Final check for non-admins who still don't have an activeWorkspaceId
    if (!activeWorkspaceId) {
        return res.status(403).json({
            message: 'Your account is not associated with any active workspace.',
            error: 'NO_ACTIVE_WORKSPACE'
        });
    }

    // Validate that user belongs to the requested workspace
    if (requestedWorkspaceId && user.role !== 'admin' && !user.belongsToWorkspace(requestedWorkspaceId)) {
      return res.status(403).json({
        message: 'You do not have access to this workspace',
        error: 'WORKSPACE_ACCESS_DENIED'
      });
    }

    // Fetch the active workspace
    let workspace = await Workspace.findById(getWorkspaceIdValue(activeWorkspaceId))
      .select('name type isActive settings limits usage')
      .lean();

    if (!workspace || !workspace.isActive) {
      const defaultCoreWorkspace = await getDefaultCoreWorkspace();
      if (defaultCoreWorkspace) {
        activeWorkspaceId = defaultCoreWorkspace._id;
        workspace = defaultCoreWorkspace;
        await ensureUserWorkspaceAssignment(defaultCoreWorkspace._id);
      }
    }

    if (!workspace) {
      return res.status(403).json({
        message: 'Workspace not found',
        error: 'INVALID_WORKSPACE'
      });
    }

    if (!workspace.isActive) {
      return res.status(403).json({
        message: 'Your workspace has been deactivated. Please contact support.',
        error: 'WORKSPACE_INACTIVE',
        workspaceId: workspace._id
      });
    }

    let allWorkspaceIds;
    let manageableWorkspaceIds;
    if (user.workspaces && user.workspaces.length > 0) {
      allWorkspaceIds = user.workspaces
        .filter(ws => ws.isActive)
        .map(ws => ws.workspaceId);
      manageableWorkspaceIds = user.workspaces
        .filter(ws => ws.isActive && ['admin', 'hr', 'community_admin'].includes(ws.role))
        .map(ws => ws.workspaceId);
    } else {
      allWorkspaceIds = [activeWorkspaceId];
      manageableWorkspaceIds = ['admin', 'hr', 'community_admin'].includes(user.role)
        ? [activeWorkspaceId]
        : [];
    }

    const roleInWorkspace = user.getRoleInWorkspace(activeWorkspaceId) || user.role;

    req.context = {
      workspaceId: workspace._id,
      workspaceType: workspace.type,
      workspaceName: workspace.name,
      workspace: workspace,
      isSystemAdmin: false,
      allWorkspaceIds: allWorkspaceIds,
      manageableWorkspaceIds,
      currentRole: roleInWorkspace,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
      },
    };
    req.currentRole = roleInWorkspace;
    req.hasWorkspaceRole = (...roles) => roles.includes(roleInWorkspace);

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
    res.status(500).json({
      message: 'Failed to resolve workspace context',
      error: error.message
    });
  }
};

export default workspaceContext;
