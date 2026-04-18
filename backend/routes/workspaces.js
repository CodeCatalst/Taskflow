import express from 'express';
import Workspace from '../models/Workspace.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import Team from '../models/Team.js';
import { authenticate } from '../middleware/auth.js';
import workspaceContext from '../middleware/workspaceContext.js';
import { logChange } from '../utils/changeLogService.js';

const router = express.Router();

// Admin guard middleware (allows both system admins and regular admins)
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Access denied. Administrator privileges required.' 
    });
  }
  next();
};

// Apply authentication and workspace context to all routes
router.use(authenticate);
router.use(workspaceContext);

// Get all workspaces (Admin only)
// System admins see all workspaces, workspace admins see only their own
router.get('/', requireAdmin, async (req, res) => {
  try {
    // System admins see all workspaces, workspace admins see only their own
    const workspaceQuery = req.context.isSystemAdmin ? {} : { _id: req.context.workspaceId };
    const workspaces = await Workspace.find(workspaceQuery).sort({ createdAt: -1 });
    
    // Fetch statistics for each workspace
    const workspacesWithStats = await Promise.all(
      workspaces.map(async (workspace) => {
        const [userCount, taskCount, teamCount] = await Promise.all([
          User.countDocuments({ workspaceId: workspace._id }),
          Task.countDocuments({ workspaceId: workspace._id }),
          Team.countDocuments({ workspaceId: workspace._id })
        ]);

        return {
          ...workspace.toObject(),
          stats: {
            userCount,
            taskCount,
            teamCount,
            usage: {
              users: workspace.type === 'COMMUNITY' 
                ? `${userCount}/${workspace.limits.maxUsers}` 
                : `${userCount}/Unlimited`,
              tasks: workspace.type === 'COMMUNITY' 
                ? `${taskCount}/${workspace.limits.maxTasks}` 
                : `${taskCount}/Unlimited`,
              teams: workspace.type === 'COMMUNITY' 
                ? `${teamCount}/${workspace.limits.maxTeams}` 
                : `${teamCount}/Unlimited`
            }
          }
        };
      })
    );

    res.json(workspacesWithStats);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch workspaces' });
  }
});

// Get workspace statistics summary (Admin only) - MUST BE BEFORE /:id
router.get('/stats/summary', requireAdmin, async (req, res) => {
  try {
    // System admins see all stats, workspace admins see only their workspace stats
    const workspaceFilter = req.context.isSystemAdmin ? {} : { _id: req.context.workspaceId };
    
    const [
      totalWorkspaces,
      activeWorkspaces,
      coreWorkspaces,
      communityWorkspaces,
      totalUsers,
      totalTasks,
      totalTeams
    ] = await Promise.all([
      Workspace.countDocuments(workspaceFilter),
      Workspace.countDocuments({ ...workspaceFilter, isActive: true }),
      Workspace.countDocuments({ ...workspaceFilter, type: 'CORE' }),
      Workspace.countDocuments({ ...workspaceFilter, type: 'COMMUNITY' }),
      User.countDocuments(req.context.isSystemAdmin ? { workspaceId: { $ne: null } } : { workspaceId: req.context.workspaceId }),
      Task.countDocuments(req.context.isSystemAdmin ? {} : { workspaceId: req.context.workspaceId }),
      Team.countDocuments(req.context.isSystemAdmin ? {} : { workspaceId: req.context.workspaceId })
    ]);

    res.json({
      totalWorkspaces,
      activeWorkspaces,
      inactiveWorkspaces: totalWorkspaces - activeWorkspaces,
      coreWorkspaces,
      communityWorkspaces,
      totalUsers,
      totalTasks,
      totalTeams
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch workspace statistics' });
  }
});

// Get single workspace details (Admin only)
// System admins can view any workspace, workspace admins can only view their own
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const requestedWorkspaceId = req.params.id;
    
    // Workspace admins can only view their own workspace
    if (!req.context.isSystemAdmin && requestedWorkspaceId !== req.context.workspaceId?.toString()) {
      return res.status(403).json({ message: 'You can only view your own workspace' });
    }
    
    const workspace = await Workspace.findById(requestedWorkspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Fetch detailed statistics
    const [userCount, taskCount, teamCount, adminCount, users] = await Promise.all([
      User.countDocuments({ workspaceId: workspace._id }),
      Task.countDocuments({ workspaceId: workspace._id }),
      Team.countDocuments({ workspaceId: workspace._id }),
      User.countDocuments({ workspaceId: workspace._id, role: 'admin' }),
      User.find({ workspaceId: workspace._id }).select('fullName email role createdAt')
    ]);

    const completedTasks = await Task.countDocuments({ 
      workspaceId: workspace._id, 
      status: 'Done' 
    });

    res.json({
      ...workspace.toObject(),
      stats: {
        userCount,
        taskCount,
        teamCount,
        adminCount,
        completedTasks,
        completionRate: taskCount > 0 ? ((completedTasks / taskCount) * 100).toFixed(1) : 0,
        usage: {
          users: workspace.type === 'COMMUNITY' 
            ? `${userCount}/${workspace.limits.maxUsers}` 
            : `${userCount}/Unlimited`,
          tasks: workspace.type === 'COMMUNITY' 
            ? `${taskCount}/${workspace.limits.maxTasks}` 
            : `${taskCount}/Unlimited`,
          teams: workspace.type === 'COMMUNITY' 
            ? `${teamCount}/${workspace.limits.maxTeams}` 
            : `${teamCount}/Unlimited`
        }
      },
      users
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch workspace details' });
  }
});

// Create new workspace - Allow any authenticated user to create their own workspace
// Note: This route bypasses workspaceContext middleware which is handled in the middleware itself
router.post('/', async (req, res) => {
  try {
    // Allow any authenticated user to create a workspace
    // They will become the owner/admin of the new workspace
    
    const { name, type } = req.body;

    // Validation
    if (!name || !type) {
      return res.status(400).json({ 
        message: 'Workspace name and type are required' 
      });
    }

    if (!['CORE', 'COMMUNITY'].includes(type)) {
      return res.status(400).json({ 
        message: 'Workspace type must be CORE or COMMUNITY' 
      });
    }

    // Check if workspace name already exists
    const existingWorkspace = await Workspace.findOne({ name });
    if (existingWorkspace) {
      return res.status(400).json({ 
        message: 'A workspace with this name already exists' 
      });
    }

    // The authenticated user who creates the workspace becomes its owner
    // Use req.user directly - it's set by the authenticate middleware
    const currentUserId = req.user._id;
    const currentUser = await User.findById(currentUserId);
    
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent users who already have a workspace from creating a new one
    // (they should use switch-workspace instead)
    if (currentUser.workspaceId && currentUser.workspaces && currentUser.workspaces.length > 0) {
      return res.status(400).json({ 
        message: 'You already have a workspace. Use the workspace switcher to create a new one or contact support.' 
      });
    }
    
    // Determine the role for the new workspace
    const workspaceRole = type === 'COMMUNITY' ? 'community_admin' : 'admin';
    
    // Create workspace with the current user as owner
    const workspace = new Workspace({
      name,
      type,
      owner: currentUserId,
      settings: {
        features: type === 'CORE' 
          ? ['analytics', 'reports', 'changelog', 'automation', 'teams']
          : ['teams']
      },
      limits: type === 'COMMUNITY' 
        ? { maxUsers: 10, maxTasks: 100, maxTeams: 3 }
        : { maxUsers: -1, maxTasks: -1, maxTeams: -1 }
    });

    await workspace.save();

    // Add the creator to the workspace as admin - using the method that handles duplicates properly
    // Update user's role based on workspace type (but preserve higher roles)
    if (type === 'COMMUNITY') {
      currentUser.role = 'community_admin';
    } else if (currentUser.role === 'member') {
      currentUser.role = 'admin';
    }
    
    // Add workspace to user's workspaces array using the helper method
    // This method handles existing entries properly
    try {
      await currentUser.addToWorkspace(workspace._id, workspaceRole);
    } catch (workspaceError) {
      // If addToWorkspace fails (e.g., user already in workspace), continue with the rest
      console.error('Error adding user to workspace:', workspaceError.message);
    }
    
    // Also update legacy field if not already set
    if (!currentUser.workspaceId) {
      currentUser.workspaceId = workspace._id;
    }
    if (!currentUser.currentWorkspaceId) {
      currentUser.currentWorkspaceId = workspace._id;
    }
    await currentUser.save();

    // Log workspace creation
    await logChange({
      event_type: 'workspace_action',
      user: req.user,
      target_type: 'Workspace',
      target_id: workspace._id,
      target_name: workspace.name,
      action: 'create',
      description: `Created ${workspace.type} workspace: ${workspace.name}`,
      metadata: { workspaceType: workspace.type },
      changes: { after: workspace.toObject() },
      workspaceId: null // System-level action, no workspace
    });

    res.status(201).json({
      message: 'Workspace created successfully',
      workspace
    });
  } catch (error) {
    console.error('Workspace creation error:', error);
    res.status(500).json({ message: 'Failed to create workspace', error: error.message });
  }
});

// Update workspace settings (Admin only)
// System admins can update any workspace, workspace admins can only update their own
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const requestedWorkspaceId = req.params.id;
    
    // Workspace admins can only update their own workspace
    if (!req.context.isSystemAdmin && requestedWorkspaceId !== req.context.workspaceId?.toString()) {
      return res.status(403).json({ message: 'You can only update your own workspace' });
    }
    
    const { name, type, settings, limits } = req.body;

    const workspace = await Workspace.findById(requestedWorkspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const oldWorkspace = workspace.toObject();

    // Update fields
    if (name) workspace.name = name;
    if (type && ['CORE', 'COMMUNITY'].includes(type)) {
      workspace.type = type;
      
      // Update default limits and features based on type
      if (type === 'COMMUNITY') {
        workspace.limits = limits || { maxUsers: 10, maxTasks: 100, maxTeams: 3 };
        workspace.settings.features = ['teams'];
      } else {
        workspace.limits = { maxUsers: -1, maxTasks: -1, maxTeams: -1 };
        workspace.settings.features = ['analytics', 'reports', 'changelog', 'automation', 'teams'];
      }
    }

    if (settings) {
      workspace.settings = { ...workspace.settings, ...settings };
    }

    if (limits && workspace.type === 'COMMUNITY') {
      workspace.limits = { ...workspace.limits, ...limits };
    }

    await workspace.save();

    // Log workspace update
    await logChange({
      event_type: 'workspace_action',
      user: req.user,
      target_type: 'Workspace',
      target_id: workspace._id,
      target_name: workspace.name,
      action: 'update',
      description: `Updated workspace: ${workspace.name}`,
      changes: { before: oldWorkspace, after: workspace.toObject() },
      workspaceId: null // System-level action
    });

    res.json({
      message: 'Workspace updated successfully',
      workspace
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update workspace' });
  }
});

// Delete own workspace and account (Community Admin only)
router.delete('/my-workspace/delete', authenticate, async (req, res) => {
  try {
    // Only community admins can delete their own workspace
    if (req.user.role !== 'community_admin') {
      return res.status(403).json({ 
        message: 'Only community workspace admins can delete their workspace' 
      });
    }

    const workspace = await Workspace.findById(req.user.workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Verify user is the owner of the workspace
    if (!workspace.owner.equals(req.user._id)) {
      return res.status(403).json({ 
        message: 'You can only delete workspaces you created' 
      });
    }

    // Only allow deletion of COMMUNITY workspaces
    if (workspace.type !== 'COMMUNITY') {
      return res.status(403).json({ 
        message: 'Only community workspaces can be self-deleted. Contact support for enterprise workspaces.' 
      });
    }

    // Get counts for logging
    const [userCount, taskCount, teamCount] = await Promise.all([
      User.countDocuments({ workspaceId: workspace._id }),
      Task.countDocuments({ workspaceId: workspace._id }),
      Team.countDocuments({ workspaceId: workspace._id })
    ]);


    // Log workspace deletion BEFORE deleting (so we can still log it)
    await logChange({
      event_type: 'workspace_action',
      user: req.user,
      target_type: 'Workspace',
      target_id: workspace._id,
      target_name: workspace.name,
      action: 'delete',
      description: `Community admin ${req.user.full_name} deleted their workspace: ${workspace.name} (${userCount} users, ${taskCount} tasks, ${teamCount} teams)`,
      changes: { before: workspace.toObject() },
      metadata: { 
        userCount, 
        taskCount, 
        teamCount,
        selfDeleted: true,
        workspaceType: 'COMMUNITY'
      },
      workspaceId: workspace._id
    });

    // CASCADE DELETE: Delete all workspace data including users and changelog
    const ChangeLog = (await import('../models/ChangeLog.js')).default;
    await Promise.all([
      User.deleteMany({ workspaceId: workspace._id }),
      Task.deleteMany({ workspaceId: workspace._id }),
      Team.deleteMany({ workspaceId: workspace._id }),
      ChangeLog.deleteMany({ workspaceId: workspace._id })
    ]);


    await workspace.deleteOne();

    res.json({ 
      message: 'Your workspace, account, and all associated data have been permanently deleted',
      deleted: {
        workspace: workspace.name,
        users: userCount,
        tasks: taskCount,
        teams: teamCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete workspace. Please try again or contact support.' });
  }
});

// Delete workspace (System Admin only - workspace deletion is a system-level action)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    // Only system admins can delete workspaces
    if (!req.context.isSystemAdmin) {
      return res.status(403).json({ message: 'Only system administrators can delete workspaces' });
    }
    
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Get counts for logging
    const [userCount, taskCount, teamCount] = await Promise.all([
      User.countDocuments({ workspaceId: workspace._id }),
      Task.countDocuments({ workspaceId: workspace._id }),
      Team.countDocuments({ workspaceId: workspace._id })
    ]);


    // CASCADE DELETE: Delete all workspace data including users
    await Promise.all([
      User.deleteMany({ workspaceId: workspace._id }),
      Task.deleteMany({ workspaceId: workspace._id }),
      Team.deleteMany({ workspaceId: workspace._id })
    ]);


    const oldWorkspace = workspace.toObject();
    await workspace.deleteOne();

    // Log workspace deletion
    await logChange({
      event_type: 'workspace_action',
      user: req.user,
      target_type: 'Workspace',
      target_id: oldWorkspace._id,
      target_name: oldWorkspace.name,
      action: 'delete',
      description: `Deleted workspace: ${oldWorkspace.name} (${userCount} users, ${taskCount} tasks, ${teamCount} teams)`,
      changes: { before: oldWorkspace },
      metadata: { userCount, taskCount, teamCount },
      workspaceId: null // System-level action
    });

    res.json({ 
      message: 'Workspace and all associated data deleted successfully',
      deleted: {
        users: userCount,
        tasks: taskCount,
        teams: teamCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete workspace' });
  }
});

// Toggle workspace activation status (System Admin only)
router.patch('/:id/toggle-status', requireAdmin, async (req, res) => {
  try {
    // Only system admins can toggle workspace status
    if (!req.context.isSystemAdmin) {
      return res.status(403).json({ message: 'Only system administrators can toggle workspace status' });
    }
    
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const oldStatus = workspace.isActive;
    workspace.isActive = !workspace.isActive;
    await workspace.save();


    // Log status change
    await logChange({
      event_type: 'workspace_action',
      user: req.user,
      target_type: 'Workspace',
      target_id: workspace._id,
      target_name: workspace.name,
      action: 'status_change',
      description: `${workspace.isActive ? 'Activated' : 'Deactivated'} workspace: ${workspace.name}`,
      changes: { 
        before: { isActive: oldStatus }, 
        after: { isActive: workspace.isActive } 
      },
      workspaceId: null // System-level action
    });

    res.json({
      message: `Workspace ${workspace.isActive ? 'activated' : 'deactivated'} successfully. Users must log out and log back in for changes to take effect.`,
      workspace,
      note: 'Existing user sessions must be refreshed (logout/login) to see this change.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle workspace status' });
  }
});


// Get users of a specific workspace (Admin only)
// System admins can view any workspace users, workspace admins can only view their own
router.get('/:id/users', requireAdmin, async (req, res) => {
  try {
    const requestedWorkspaceId = req.params.id;
    
    // Workspace admins can only view their own workspace users
    if (!req.context.isSystemAdmin && requestedWorkspaceId !== req.context.workspaceId?.toString()) {
      return res.status(403).json({ message: 'You can only view users in your own workspace' });
    }
    
    const workspace = await Workspace.findById(requestedWorkspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    // Find users with this workspace in their workspaces array OR legacy workspaceId
    const users = await User.find({
      $or: [
        { workspaceId: workspace._id },
        { 'workspaces.workspaceId': workspace._id, 'workspaces.isActive': true }
      ]
    })
      .select('-password_hash')
      .populate('team_id', 'name')
      .populate('teams', 'name')
      .sort({ created_at: -1 });
    
    res.json({ workspace: { id: workspace._id, name: workspace.name, type: workspace.type }, users, count: users.length });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Add user to workspace (Admin only)
// System admins can add users to any workspace, workspace admins can only add to their own
router.post('/:id/add-user', requireAdmin, async (req, res) => {
  try {
    const requestedWorkspaceId = req.params.id;
    
    // Workspace admins can only add users to their own workspace
    if (!req.context.isSystemAdmin && requestedWorkspaceId !== req.context.workspaceId?.toString()) {
      return res.status(403).json({ message: 'You can only add users to your own workspace' });
    }
    
    const { userId, role } = req.body;
    
    if (!userId || !role) {
      return res.status(400).json({ message: 'User ID and role are required' });
    }
    
    const workspace = await Workspace.findById(requestedWorkspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user already belongs to this workspace
    if (user.belongsToWorkspace(workspace._id)) {
      return res.status(400).json({ message: 'User already belongs to this workspace' });
    }
    
    // Add user to workspace
    await user.addToWorkspace(workspace._id, role);
    
    // Update workspace usage
    workspace.usage.userCount = await User.countDocuments({
      $or: [
        { workspaceId: workspace._id },
        { 'workspaces.workspaceId': workspace._id, 'workspaces.isActive': true }
      ]
    });
    await workspace.save();
    
    // Log change
    await logChange({
      userId: req.user._id,
      workspaceId: workspace._id,
      action: 'add_user_to_workspace',
      entity: 'workspace',
      entityId: workspace._id,
      details: { 
        addedUser: user.email,
        addedUserName: user.full_name,
        role
      },
      ipAddress: req.ip
    });
    
    res.json({ 
      success: true, 
      message: `User ${user.full_name} added to workspace ${workspace.name}`,
      user: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add user to workspace' });
  }
});

// Remove user from workspace (Admin only)
// System admins can remove users from any workspace, workspace admins can only remove from their own
router.post('/:id/remove-user', requireAdmin, async (req, res) => {
  try {
    const requestedWorkspaceId = req.params.id;
    
    // Workspace admins can only remove users from their own workspace
    if (!req.context.isSystemAdmin && requestedWorkspaceId !== req.context.workspaceId?.toString()) {
      return res.status(403).json({ message: 'You can only remove users from your own workspace' });
    }
    
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const workspace = await Workspace.findById(requestedWorkspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove user from workspace
    await user.removeFromWorkspace(workspace._id);
    
    // Update workspace usage
    workspace.usage.userCount = await User.countDocuments({
      $or: [
        { workspaceId: workspace._id },
        { 'workspaces.workspaceId': workspace._id, 'workspaces.isActive': true }
      ]
    });
    await workspace.save();
    
    // Log change
    await logChange({
      userId: req.user._id,
      workspaceId: workspace._id,
      action: 'remove_user_from_workspace',
      entity: 'workspace',
      entityId: workspace._id,
      details: { 
        removedUser: user.email,
        removedUserName: user.full_name
      },
      ipAddress: req.ip
    });
    
    res.json({ 
      success: true, 
      message: `User ${user.full_name} removed from workspace ${workspace.name}`
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove user from workspace' });
  }
});

// Get tasks of a specific workspace (Admin only)
// System admins can view any workspace tasks, workspace admins can only view their own
router.get('/:id/tasks', requireAdmin, async (req, res) => {
  try {
    const requestedWorkspaceId = req.params.id;
    
    // Workspace admins can only view their own workspace tasks
    if (!req.context.isSystemAdmin && requestedWorkspaceId !== req.context.workspaceId?.toString()) {
      return res.status(403).json({ message: 'You can only view tasks in your own workspace' });
    }
    
    const workspace = await Workspace.findById(requestedWorkspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    const tasks = await Task.find({ workspaceId: workspace._id }).populate('created_by', 'full_name email').populate('assigned_to', 'full_name email').populate('team_id', 'name').sort({ created_at: -1 }).limit(100);
    res.json({ workspace: { id: workspace._id, name: workspace.name, type: workspace.type }, tasks, count: tasks.length, total: await Task.countDocuments({ workspaceId: workspace._id }) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
});

// Get teams of a specific workspace (Admin only)
// System admins can view any workspace teams, workspace admins can only view their own
router.get('/:id/teams', requireAdmin, async (req, res) => {
  try {
    const requestedWorkspaceId = req.params.id;
    
    // Workspace admins can only view their own workspace teams
    if (!req.context.isSystemAdmin && requestedWorkspaceId !== req.context.workspaceId?.toString()) {
      return res.status(403).json({ message: 'You can only view teams in your own workspace' });
    }
    
    const workspace = await Workspace.findById(requestedWorkspaceId);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    const teams = await Team.find({ workspaceId: workspace._id }).populate('hr_id', 'full_name email').populate('lead_id', 'full_name email').populate('members', 'full_name email role').sort({ created_at: -1 });
    res.json({ workspace: { id: workspace._id, name: workspace.name, type: workspace.type }, teams, count: teams.length });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch teams' });
  }
});

export default router;
