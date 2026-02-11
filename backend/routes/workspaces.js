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
router.get('/', requireAdmin, async (req, res) => {
  try {
    const workspaces = await Workspace.find().sort({ createdAt: -1 });
    
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
    console.error('Error fetching workspaces:', error);
    res.status(500).json({ message: 'Failed to fetch workspaces' });
  }
});

// Get workspace statistics summary (Admin only) - MUST BE BEFORE /:id
router.get('/stats/summary', requireAdmin, async (req, res) => {
  try {
    const [
      totalWorkspaces,
      activeWorkspaces,
      coreWorkspaces,
      communityWorkspaces,
      totalUsers,
      totalTasks,
      totalTeams
    ] = await Promise.all([
      Workspace.countDocuments(),
      Workspace.countDocuments({ isActive: true }),
      Workspace.countDocuments({ type: 'CORE' }),
      Workspace.countDocuments({ type: 'COMMUNITY' }),
      User.countDocuments({ workspaceId: { $ne: null } }),
      Task.countDocuments(),
      Team.countDocuments()
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
    console.error('Error fetching workspace stats:', error);
    res.status(500).json({ message: 'Failed to fetch workspace statistics' });
  }
});

// Get single workspace details (Admin only)
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
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
    console.error('Error fetching workspace:', error);
    res.status(500).json({ message: 'Failed to fetch workspace details' });
  }
});

// Create new workspace (Admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, type, ownerEmail } = req.body;
    console.log('📝 Creating workspace:', { name, type, ownerEmail });

    // Validation
    if (!name || !type) {
      console.log('❌ Validation failed: Missing name or type');
      return res.status(400).json({ 
        message: 'Workspace name and type are required' 
      });
    }

    if (!['CORE', 'COMMUNITY'].includes(type)) {
      console.log('❌ Validation failed: Invalid type:', type);
      return res.status(400).json({ 
        message: 'Workspace type must be CORE or COMMUNITY' 
      });
    }

    // Check if workspace name already exists
    const existingWorkspace = await Workspace.findOne({ name });
    if (existingWorkspace) {
      console.log('❌ Workspace already exists:', name);
      return res.status(400).json({ 
        message: 'A workspace with this name already exists' 
      });
    }

    // Find owner if email provided
    let ownerId = null;
    if (ownerEmail) {
      const owner = await User.findOne({ email: ownerEmail });
      if (owner) {
        ownerId = owner._id;
      }
    }

    // Create workspace
    const workspace = new Workspace({
      name,
      type,
      owner: ownerId,
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
    console.log('✅ Workspace saved to database:', workspace._id);

    // If owner email provided, assign workspace to owner
    if (ownerId) {
      const owner = await User.findById(ownerId);
      if (owner) {
        owner.workspaceId = workspace._id;
        if (owner.role === 'member') {
          owner.role = 'admin';
        }
        await owner.save();
        console.log('✅ Owner assigned:', owner.email);
      }
    }

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

    console.log('✅ Workspace created successfully:', workspace.name);
    res.status(201).json({
      message: 'Workspace created successfully',
      workspace
    });
  } catch (error) {
    console.error('Error creating workspace:', error);
    res.status(500).json({ message: 'Failed to create workspace' });
  }
});

// Update workspace settings (Admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { name, type, settings, limits } = req.body;
    console.log('📝 Updating workspace:', req.params.id, { name, type });

    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      console.log('❌ Workspace not found:', req.params.id);
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
    console.log('✅ Workspace updated in database:', workspace._id);

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
    console.error('Error updating workspace:', error);
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

    console.log(`🗑️  Community admin deleting workspace "${workspace.name}" with ${userCount} users, ${taskCount} tasks, ${teamCount} teams`);

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

    console.log(`✅ Deleted ${userCount} users, ${taskCount} tasks, ${teamCount} teams, and all changelog entries`);

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
    console.error('Error deleting workspace:', error);
    res.status(500).json({ message: 'Failed to delete workspace. Please try again or contact support.' });
  }
});

// Delete workspace (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    console.log('🗑️ Deleting workspace:', req.params.id);
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      console.log('❌ Workspace not found:', req.params.id);
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Get counts for logging
    const [userCount, taskCount, teamCount] = await Promise.all([
      User.countDocuments({ workspaceId: workspace._id }),
      Task.countDocuments({ workspaceId: workspace._id }),
      Team.countDocuments({ workspaceId: workspace._id })
    ]);

    console.log(`🗑️  Deleting workspace "${workspace.name}" with ${userCount} users, ${taskCount} tasks, ${teamCount} teams`);

    // CASCADE DELETE: Delete all workspace data including users
    await Promise.all([
      User.deleteMany({ workspaceId: workspace._id }),
      Task.deleteMany({ workspaceId: workspace._id }),
      Team.deleteMany({ workspaceId: workspace._id })
    ]);

    console.log(`✅ Deleted ${userCount} users, ${taskCount} tasks, ${teamCount} teams`);

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
    console.error('Error deleting workspace:', error);
    res.status(500).json({ message: 'Failed to delete workspace' });
  }
});

// Toggle workspace activation status (Admin only)
router.patch('/:id/toggle-status', requireAdmin, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    const oldStatus = workspace.isActive;
    workspace.isActive = !workspace.isActive;
    await workspace.save();

    console.log(`✓ Workspace "${workspace.name}" status changed from ${oldStatus} to ${workspace.isActive}`);

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
    console.error('Error toggling workspace status:', error);
    res.status(500).json({ message: 'Failed to toggle workspace status' });
  }
});


// Get users of a specific workspace (Admin only)
router.get('/:id/users', requireAdmin, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
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
    console.error('Error fetching workspace users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Add user to workspace (Admin only)
router.post('/:id/add-user', requireAdmin, async (req, res) => {
  try {
    const { userId, role } = req.body;
    
    if (!userId || !role) {
      return res.status(400).json({ message: 'User ID and role are required' });
    }
    
    const workspace = await Workspace.findById(req.params.id);
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
    console.error('Error adding user to workspace:', error);
    res.status(500).json({ message: 'Failed to add user to workspace' });
  }
});

// Remove user from workspace (Admin only)
router.post('/:id/remove-user', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const workspace = await Workspace.findById(req.params.id);
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
    console.error('Error removing user from workspace:', error);
    res.status(500).json({ message: 'Failed to remove user from workspace' });
  }
});

// Get tasks of a specific workspace (System Admin only)
// Get workspace tasks (Admin only)
router.get('/:id/tasks', requireAdmin, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    const tasks = await Task.find({ workspaceId: workspace._id }).populate('created_by', 'full_name email').populate('assigned_to', 'full_name email').populate('team_id', 'name').sort({ created_at: -1 }).limit(100);
    res.json({ workspace: { id: workspace._id, name: workspace.name, type: workspace.type }, tasks, count: tasks.length, total: await Task.countDocuments({ workspaceId: workspace._id }) });
  } catch (error) {
    console.error('Error fetching workspace tasks:', error);
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
});

// Get teams of a specific workspace (System Admin only)
// Get workspace teams (Admin only)
router.get('/:id/teams', requireAdmin, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    const teams = await Team.find({ workspaceId: workspace._id }).populate('hr_id', 'full_name email').populate('lead_id', 'full_name email').populate('members', 'full_name email role').sort({ created_at: -1 });
    res.json({ workspace: { id: workspace._id, name: workspace.name, type: workspace.type }, teams, count: teams.length });
  } catch (error) {
    console.error('Error fetching workspace teams:', error);
    res.status(500).json({ message: 'Failed to fetch teams' });
  }
});

export default router;
