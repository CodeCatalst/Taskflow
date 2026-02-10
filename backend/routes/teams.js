import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { checkRole } from '../middleware/roleCheck.js';
import { checkTeamLimit } from '../middleware/workspaceGuard.js';
import Team from '../models/Team.js';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';

const router = express.Router();

// Create team (HR, Admin & Community Admin)
router.post('/', authenticate, checkRole(['admin', 'hr', 'community_admin']), checkTeamLimit, async (req, res) => {
  try {
    const { name, hr_id, lead_id, members } = req.body;

    // Special validation for "Admin" team - only admins allowed
    const isAdminTeam = name && name.toLowerCase() === 'admin';
    
    if (isAdminTeam) {
      // Admin team should not have HR assigned
      return res.status(400).json({ 
        message: 'Admin team is reserved for super users only. Please use a different team name or create teams without HR designation for admin users.',
        hint: 'Admin users do not need to be part of a team structure'
      });
    }

    // COMMUNITY WORKSPACE: Simplified team creation
    // Community admins can create teams without strict HR/Lead role requirements
    const isCommunityWorkspace = req.context.workspaceType === 'COMMUNITY';
    
    // WORKSPACE SUPPORT: Verify HR and Lead exist in workspace (if provided)
    let hr = null;
    let lead = null;
    
    if (hr_id) {
      hr = await User.findOne({ 
        _id: hr_id, 
        workspaceId: req.context.workspaceId 
      });
      if (!hr) {
        return res.status(400).json({ message: 'HR user not found' });
      }
      // For CORE workspaces, enforce HR role. For COMMUNITY, allow any user
      if (!isCommunityWorkspace && hr.role !== 'hr' && hr.role !== 'admin') {
        return res.status(400).json({ message: 'Selected HR user must have HR or Admin role' });
      }
    }
    
    if (lead_id) {
      lead = await User.findOne({ 
        _id: lead_id, 
        workspaceId: req.context.workspaceId 
      });
      if (!lead) {
        return res.status(400).json({ message: 'Team Lead not found' });
      }
      // For CORE workspaces, enforce team_lead role. For COMMUNITY, allow any user
      if (!isCommunityWorkspace && !['team_lead', 'admin'].includes(lead.role)) {
        return res.status(400).json({ message: 'Selected team lead must have Team Lead or Admin role' });
      }
    }

    // For community workspaces, if no HR/Lead specified, use the community admin as both
    const finalHrId = hr_id || (isCommunityWorkspace ? req.user._id : null);
    const finalLeadId = lead_id || (isCommunityWorkspace ? req.user._id : null);

    // Validate required fields for CORE workspaces
    if (!isCommunityWorkspace && (!finalHrId || !finalLeadId)) {
      return res.status(400).json({ message: 'HR and Team Lead are required for CORE workspaces' });
    }

    const team = new Team({
      name,
      hr_id: finalHrId,
      lead_id: finalLeadId,
      members: members || [],
      workspaceId: req.context.workspaceId  // WORKSPACE SUPPORT
    });

    await team.save();

    // Update workspace team count
    await Workspace.findByIdAndUpdate(
      req.context.workspaceId,
      { $inc: { 'usage.teamCount': 1 } }
    );

    // MULTIPLE TEAMS SUPPORT: For Core Workspace, add to teams array; maintain team_id for backward compatibility
    const isCoreWorkspace = req.context.workspaceType === 'CORE';
    
    // Update team lead's team_id (if lead exists)
    if (finalLeadId) {
      const updateData = isCoreWorkspace 
        ? { team_id: team._id, $addToSet: { teams: team._id } }
        : { team_id: team._id };
      await User.findByIdAndUpdate(finalLeadId, updateData);
    }

    // Update members' team assignments
    if (members && members.length > 0) {
      const updateData = isCoreWorkspace
        ? { team_id: team._id, $addToSet: { teams: team._id } }
        : { team_id: team._id };
      await User.updateMany(
        { _id: { $in: members } },
        updateData
      );
    }

    const populatedTeam = await Team.findById(team._id)
      .populate('hr_id', 'full_name email')
      .populate('lead_id', 'full_name email')
      .populate('members', 'full_name email role');

    // Emit socket event for team creation
    if (req.app.get('io')) {
      req.app.get('io').emit('team:created', populatedTeam);
    }

    res.status(201).json({ message: 'Team created', team: populatedTeam });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all teams (HR & Admin)
router.get('/', authenticate, checkRole(['admin', 'hr', 'team_lead', 'community_admin']), async (req, res) => {
  try {
    // WORKSPACE SUPPORT: Start with workspace filter
    let query = { workspaceId: req.context.workspaceId };
    
    // Team leads can only see their own team
    if (req.user.role === 'team_lead') {
      query.lead_id = req.user._id;
    }

    const teams = await Team.find(query)
      .populate('hr_id', 'full_name email')
      .populate('lead_id', 'full_name email')
      .populate('members', 'full_name email role')
      .sort({ pinned: -1, priority: -1, created_at: -1 }); // Pinned first, then by priority, then by creation date

    res.json({ teams, count: teams.length });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single team
router.get('/:id', authenticate, async (req, res) => {
  try {
    // WORKSPACE SUPPORT: Scope by workspace
    const team = await Team.findOne({ _id: req.params.id, workspaceId: req.context.workspaceId })
      .populate('hr_id', 'full_name email')
      .populate('lead_id', 'full_name email')
      .populate('members', 'full_name email role');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.json({ team });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update team (HR, Admin & Community Admin)
router.patch('/:id', authenticate, checkRole(['admin', 'hr', 'community_admin']), async (req, res) => {
  try {
    const { name, lead_id } = req.body;
    const updates = {};

    // Check if trying to rename to "Admin"
    if (name && name.toLowerCase() === 'admin') {
      return res.status(400).json({ 
        message: 'Admin team name is reserved for super users only',
        hint: 'Please choose a different team name'
      });
    }

    if (name) updates.name = name;
    if (lead_id) {
      // WORKSPACE SUPPORT: Verify lead exists in same workspace
      const lead = await User.findOne({ _id: lead_id, workspaceId: req.context.workspaceId });
      if (!lead) {
        return res.status(400).json({ message: 'Team lead not found' });
      }
      
      // For CORE workspaces, enforce role. For COMMUNITY, allow any user
      const isCommunityWorkspace = req.context.workspaceType === 'COMMUNITY';
      if (!isCommunityWorkspace && !['team_lead', 'admin'].includes(lead.role)) {
        return res.status(400).json({ message: 'Selected user must have Team Lead or Admin role' });
      }
      
      updates.lead_id = lead_id;
    }

    // WORKSPACE SUPPORT: Update team scoped by workspace
    const team = await Team.findOneAndUpdate(
      { _id: req.params.id, workspaceId: req.context.workspaceId },
      updates,
      { new: true }
    ).populate('hr_id lead_id members');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Emit socket event for team update
    if (req.app.get('io')) {
      req.app.get('io').emit('team:updated', team);
    }

    res.json({ message: 'Team updated', team });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle team pin status (Admin, HR & Community Admin)
router.patch('/:id/pin', authenticate, checkRole(['admin', 'hr', 'community_admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // WORKSPACE SUPPORT: Scope by workspace
    const team = await Team.findOne({ _id: id, workspaceId: req.context.workspaceId });
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Toggle pinned status
    team.pinned = !team.pinned;
    
    // If pinning, set priority higher than all other teams in workspace
    if (team.pinned) {
      const maxPriority = await Team.findOne({ workspaceId: req.context.workspaceId }).sort({ priority: -1 }).select('priority');
      team.priority = maxPriority ? maxPriority.priority + 1 : 1;
    }

    await team.save();

    const updatedTeam = await Team.findOne({ _id: id, workspaceId: req.context.workspaceId })
      .populate('hr_id', 'full_name email')
      .populate('lead_id', 'full_name email')
      .populate('members', 'full_name email role');

    res.json({ 
      message: team.pinned ? 'Team pinned' : 'Team unpinned', 
      team: updatedTeam 
    });
  } catch (error) {
    console.error('Toggle pin error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update team priority (Admin, HR & Community Admin)
router.patch('/:id/priority', authenticate, checkRole(['admin', 'hr', 'community_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    if (typeof priority !== 'number') {
      return res.status(400).json({ message: 'Priority must be a number' });
    }

    // WORKSPACE SUPPORT: Update priority scoped by workspace
    const team = await Team.findOneAndUpdate(
      { _id: id, workspaceId: req.context.workspaceId },
      { priority },
      { new: true }
    ).populate('hr_id lead_id members');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.json({ message: 'Team priority updated', team });
  } catch (error) {
    console.error('Update priority error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reorder teams (Admin, HR & Community Admin)
router.post('/reorder', authenticate, checkRole(['admin', 'hr', 'community_admin']), async (req, res) => {
  try {
    const { teamOrder } = req.body; // Array of { id, priority }

    if (!Array.isArray(teamOrder)) {
      return res.status(400).json({ message: 'teamOrder must be an array' });
    }

    // WORKSPACE SUPPORT: Update priorities in bulk scoped by workspace
    const bulkOps = teamOrder.map((item, index) => ({
      updateOne: {
        filter: { _id: item.id, workspaceId: req.context.workspaceId },
        update: { priority: teamOrder.length - index }
      }
    }));

    await Team.bulkWrite(bulkOps);

    res.json({ message: 'Teams reordered successfully' });
  } catch (error) {
    console.error('Reorder teams error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add member to team (Admin, HR & Community Admin)
router.post('/:id/members', authenticate, checkRole(['admin', 'hr', 'community_admin']), async (req, res) => {
  try {
    const { userId } = req.body;
    const teamId = req.params.id;

    // WORKSPACE SUPPORT: Verify user exists in same workspace
    const user = await User.findOne({ _id: userId, workspaceId: req.context.workspaceId });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // WORKSPACE SUPPORT: Verify team exists in workspace
    const team = await Team.findOne({ _id: teamId, workspaceId: req.context.workspaceId });
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if already a member
    if (team.members.includes(userId)) {
      return res.status(400).json({ message: 'User already in team' });
    }

    // Add to team using $addToSet to prevent duplicates
    await Team.findByIdAndUpdate(teamId, {
      $addToSet: { members: userId }
    });

    // MULTIPLE TEAMS SUPPORT: For Core Workspace, add to teams array; Community uses single team_id
    const isCoreWorkspace = req.context.workspaceType === 'CORE';
    const updateData = isCoreWorkspace
      ? { team_id: teamId, $addToSet: { teams: teamId } }
      : { team_id: teamId };
    
    await User.findOneAndUpdate(
      { _id: userId, workspaceId: req.context.workspaceId },
      updateData
    );

    const updatedTeam = await Team.findOne({ _id: teamId, workspaceId: req.context.workspaceId })
      .populate('hr_id lead_id members');

    res.json({ message: 'Member added to team', team: updatedTeam });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add multiple members to team (Admin, HR & Community Admin)
router.post('/:id/members/bulk', authenticate, checkRole(['admin', 'hr', 'community_admin']), async (req, res) => {
  try {
    const { userIds } = req.body;
    const teamId = req.params.id;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'User IDs array is required' });
    }

    // WORKSPACE SUPPORT: Verify team exists in workspace
    const team = await Team.findOne({ _id: teamId, workspaceId: req.context.workspaceId });
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const results = {
      added: [],
      skipped: [],
      failed: []
    };

    for (const userId of userIds) {
      try {
        // WORKSPACE SUPPORT: Verify user exists in same workspace
        const user = await User.findOne({ _id: userId, workspaceId: req.context.workspaceId });
        if (!user) {
          results.failed.push({ userId, reason: 'User not found' });
          continue;
        }

        // Check if already a member
        if (team.members.includes(userId)) {
          results.skipped.push({ userId, name: user.full_name, reason: 'Already a member' });
          continue;
        }

        // Add to team - will be saved with $addToSet after loop
        if (!team.members.includes(userId)) {
          team.members.push(userId);
        }
        
        // MULTIPLE TEAMS SUPPORT: For Core Workspace, add to teams array
        const isCoreWorkspace = req.context.workspaceType === 'CORE';
        const updateData = isCoreWorkspace
          ? { team_id: teamId, $addToSet: { teams: teamId } }
          : { team_id: teamId };
        
        await User.findOneAndUpdate(
          { _id: userId, workspaceId: req.context.workspaceId },
          updateData
        );

        results.added.push({ userId, name: user.full_name });
      } catch (error) {
        results.failed.push({ userId, reason: error.message });
      }
    }

    // Save team with $addToSet to prevent any duplicate members
    await Team.findByIdAndUpdate(teamId, {
      $addToSet: { members: { $each: team.members } }
    });

    const updatedTeam = await Team.findOne({ _id: teamId, workspaceId: req.context.workspaceId })
      .populate('hr_id lead_id members');

    res.json({ 
      message: `Added ${results.added.length} member(s) to team`,
      results,
      team: updatedTeam 
    });
  } catch (error) {
    console.error('Bulk add members error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove member from team (Admin, HR & Community Admin)
// This route MUST come before DELETE /:id to avoid route conflict
router.delete('/:id/members/:userId', authenticate, checkRole(['admin', 'hr', 'community_admin']), async (req, res) => {
  try {
    const { id, userId } = req.params;

    console.log(`[REMOVE MEMBER] Request received - Team: ${id}, User: ${userId}, Workspace: ${req.context.workspaceId}`);

    // WORKSPACE SUPPORT: Verify team exists in workspace
    const team = await Team.findOne({ _id: id, workspaceId: req.context.workspaceId });
    if (!team) {
      console.log(`[REMOVE MEMBER] Team not found: ${id}`);
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is actually a member
    if (!team.members.some(m => m.toString() === userId)) {
      console.log(`[REMOVE MEMBER] User ${userId} is not a member of team ${id}`);
      return res.status(400).json({ message: 'User is not a member of this team' });
    }

    // Prevent removing HR or Team Lead from their own team
    const isHR = team.hr_id && team.hr_id.toString() === userId;
    const isLead = team.lead_id && team.lead_id.toString() === userId;
    
    if (isHR || isLead) {
      const role = isHR && isLead ? 'HR and Team Lead' : isHR ? 'HR' : 'Team Lead';
      console.log(`[REMOVE MEMBER] Cannot remove ${role} from their own team`);
      return res.status(400).json({ 
        message: `Cannot remove the ${role} from their own team. Please reassign the ${role} role first.` 
      });
    }

    console.log(`[REMOVE MEMBER] Removing user ${userId} from team ${team.name}`);

    // Remove from team using $pull for consistency and atomicity
    const result = await Team.findByIdAndUpdate(id, {
      $pull: { members: userId }
    });

    if (!result) {
      console.log(`[REMOVE MEMBER] Failed to update team ${id}`);
      return res.status(500).json({ message: 'Failed to remove member from team' });
    }

    console.log(`[REMOVE MEMBER] Successfully removed from team array`);

    console.log(`[REMOVE MEMBER] Successfully removed from team array`);

    // MULTIPLE TEAMS SUPPORT: For Core Workspace, remove from teams array and update team_id
    const isCoreWorkspace = req.context.workspaceType === 'CORE';
    const user = await User.findOne({ _id: userId, workspaceId: req.context.workspaceId });
    
    if (!user) {
      console.log(`[REMOVE MEMBER] Warning: User ${userId} not found, but member removed from team`);
    } else {
      console.log(`[REMOVE MEMBER] Updating user ${user.full_name}'s team assignments`);
    }
    
    if (isCoreWorkspace && user) {
      // Remove this team from teams array
      await User.findOneAndUpdate(
        { _id: userId, workspaceId: req.context.workspaceId },
        { $pull: { teams: id } }
      );
      console.log(`[REMOVE MEMBER] Removed team from user's teams array`);
      
      // Update team_id: set to another team if user has other teams, else null
      const updatedUser = await User.findOne({ _id: userId, workspaceId: req.context.workspaceId });
      const newTeamId = updatedUser.teams && updatedUser.teams.length > 0 
        ? updatedUser.teams[0] 
        : null;
      
      await User.findOneAndUpdate(
        { _id: userId, workspaceId: req.context.workspaceId },
        { team_id: newTeamId }
      );
      console.log(`[REMOVE MEMBER] Updated user team_id to: ${newTeamId || 'null'}`);
    } else if (user) {
      // Community Workspace: just set team_id to null
      await User.findOneAndUpdate(
        { _id: userId, workspaceId: req.context.workspaceId },
        { team_id: null }
      );
      console.log(`[REMOVE MEMBER] Set user team_id to null (Community workspace)`);
    }

    const updatedTeam = await Team.findOne({ _id: id, workspaceId: req.context.workspaceId })
      .populate('hr_id lead_id members');

    console.log(`[REMOVE MEMBER] ✅ Success! Team ${updatedTeam.name} now has ${updatedTeam.members.length} members`);
    res.json({ message: 'Member removed from team', team: updatedTeam });
  } catch (error) {
    console.error('[REMOVE MEMBER] ❌ Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete team (Admin, HR & Community Admin)
// This route MUST come after DELETE /:id/members/:userId to avoid route conflict
router.delete('/:id', authenticate, checkRole(['admin', 'hr', 'community_admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // WORKSPACE SUPPORT: Verify team exists in workspace
    const team = await Team.findOne({ _id: id, workspaceId: req.context.workspaceId });
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Get team name for response
    const teamName = team.name;

    // MULTIPLE TEAMS SUPPORT: Handle team removal based on workspace type
    const isCoreWorkspace = req.context.workspaceType === 'CORE';
    
    if (isCoreWorkspace) {
      // For Core Workspace: remove team from teams array and update team_id if needed
      const usersInTeam = await User.find({ 
        teams: id, 
        workspaceId: req.context.workspaceId 
      });
      
      for (const user of usersInTeam) {
        // Remove this team from teams array
        await User.findByIdAndUpdate(user._id, {
          $pull: { teams: id },
          updated_at: new Date()
        });
        
        // Update team_id if this was the user's primary team
        const updatedUser = await User.findById(user._id);
        if (updatedUser.team_id && updatedUser.team_id.toString() === id.toString()) {
          const newTeamId = updatedUser.teams && updatedUser.teams.length > 0
            ? updatedUser.teams[0]
            : null;
          await User.findByIdAndUpdate(user._id, { team_id: newTeamId });
        }
      }
    } else {
      // For Community Workspace: just set team_id to null
      await User.updateMany(
        { team_id: id, workspaceId: req.context.workspaceId },
        { $set: { team_id: null, updated_at: new Date() } }
      );
    }

    // Delete the team
    await Team.findOneAndDelete({ _id: id, workspaceId: req.context.workspaceId });

    // WORKSPACE SUPPORT: Decrement team usage count
    await Workspace.findByIdAndUpdate(req.context.workspaceId, {
      $inc: { 'usage.teams': -1 }
    });

    // Emit socket event for team deletion
    if (req.app.get('io')) {
      req.app.get('io').emit('team:deleted', { _id: id, name: teamName });
    }

    res.json({ 
      message: 'Team deleted successfully',
      team: { 
        id: id, 
        name: teamName,
        usersAffected: team.members.length + 1 // members + lead
      }
    });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Bulk delete all teams (Admin, HR & Community Admin)
router.delete('/bulk/all', authenticate, checkRole(['admin', 'hr', 'community_admin']), async (req, res) => {
  try {
    // Get all teams in current workspace
    const teams = await Team.find({ workspaceId: req.context.workspaceId });
    
    if (teams.length === 0) {
      return res.status(404).json({ message: 'No teams found to delete' });
    }

    const teamIds = teams.map(t => t._id);
    const teamCount = teams.length;

    // MULTIPLE TEAMS SUPPORT: Handle team removal based on workspace type
    const isCoreWorkspace = req.context.workspaceType === 'CORE';
    
    if (isCoreWorkspace) {
      // For Core Workspace: remove all teams from teams array and clear team_id
      await User.updateMany(
        { workspaceId: req.context.workspaceId },
        { 
          $set: { team_id: null, teams: [], updated_at: new Date() }
        }
      );
    } else {
      // For Community Workspace: just set team_id to null
      await User.updateMany(
        { team_id: { $in: teamIds }, workspaceId: req.context.workspaceId },
        { $set: { team_id: null, updated_at: new Date() } }
      );
    }

    // Delete all teams in this workspace
    await Team.deleteMany({ workspaceId: req.context.workspaceId });

    // Update workspace team count to 0
    await Workspace.findByIdAndUpdate(req.context.workspaceId, {
      $set: { 'usage.teams': 0 }
    });

    // Emit socket event for bulk deletion
    if (req.app.get('io')) {
      req.app.get('io').to(`workspace:${req.context.workspaceId}`).emit('team:bulk-deleted', {
        count: teamCount,
        workspaceId: req.context.workspaceId
      });
    }

    res.json({ 
      message: `Successfully deleted ${teamCount} team(s)`,
      count: teamCount
    });
  } catch (error) {
    console.error('Bulk delete teams error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

