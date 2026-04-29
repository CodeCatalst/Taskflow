import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { checkRole } from '../middleware/roleCheck.js';
import { checkTeamLimit } from '../middleware/workspaceGuard.js';
import Team from '../models/Team.js';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import { logChange } from '../utils/changeLogService.js';
import getClientIP from '../utils/getClientIP.js';
import { normalizeObjectIdArray, requireObjectId } from '../utils/requestValidation.js';
import { emitWorkspaceEvent } from '../utils/socketEvents.js';

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

    emitWorkspaceEvent(req, 'team:created', populatedTeam);

    res.status(201).json({ message: 'Team created', team: populatedTeam });
  } catch (error) {
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

    emitWorkspaceEvent(req, 'team:updated', team);

    res.json({ message: 'Team updated', team });
  } catch (error) {
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reorder teams (Admin, HR & Community Admin)
router.post('/reorder', authenticate, checkRole(['admin', 'hr', 'community_admin']), async (req, res) => {
  try {
    const { teamOrder } = req.body; // Array of { id, priority }

    if (!Array.isArray(teamOrder) || teamOrder.length === 0 || teamOrder.length > 200) {
      return res.status(400).json({ message: 'teamOrder must be an array' });
    }

    // WORKSPACE SUPPORT: Update priorities in bulk scoped by workspace
    const bulkOps = teamOrder.map((item, index) => {
      const teamId = requireObjectId(item?.id, 'team ID');
      return {
        updateOne: {
          filter: { _id: teamId, workspaceId: req.context.workspaceId },
          update: { priority: teamOrder.length - index }
        }
      };
    });

    await Team.bulkWrite(bulkOps);

    res.json({ message: 'Teams reordered successfully' });
  } catch (error) {
    const statusCode = error.message.includes('team ID') ? 400 : 500;
    res.status(statusCode).json({ message: statusCode === 400 ? error.message : 'Server error', error: error.message });
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
    await Team.findOneAndUpdate(
      { _id: teamId, workspaceId: req.context.workspaceId },
      { $addToSet: { members: userId } },
      { new: true }
    );

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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add multiple members to team (Admin, HR & Community Admin)
router.post('/:id/members/bulk', authenticate, checkRole(['admin', 'hr', 'community_admin']), async (req, res) => {
  try {
    const userIds = normalizeObjectIdArray(req.body.userIds, 'userIds', { maxItems: 500 });
    const teamId = req.params.id;
    requireObjectId(teamId, 'team ID');

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
    const statusCode = error.message.includes('userIds') || error.message.includes('team ID') || error.message.includes('Invalid')
      ? 400
      : 500;
    res.status(statusCode).json({ message: statusCode === 400 ? error.message : 'Server error', error: error.message });
  }
});

// Remove member from team (Admin, HR & Community Admin)
// This route MUST come before DELETE /:id to avoid route conflict
router.delete('/:id/members/:userId', authenticate, checkRole(['admin', 'hr', 'community_admin']), async (req, res) => {
  try {
    const { id, userId } = req.params;

    // Validate MongoDB ObjectIDs
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid team ID format' });
    }
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    // WORKSPACE SUPPORT: Verify team exists in workspace
    const team = await Team.findOne({ _id: id, workspaceId: req.context.workspaceId });
    if (!team) {
      return res.status(404).json({ message: 'Team not found in your workspace' });
    }

    // Check if user is actually a member (compare both ways to handle ObjectId vs string)
    const isMember = team.members.some(m => 
      m.toString() === userId || m === userId || m._id?.toString() === userId
    );
    
    if (!isMember) {
      return res.status(400).json({ 
        message: 'User is not a member of this team',
        debug: `Team has ${team.members.length} members`
      });
    }

    // Prevent removing HR or Team Lead from their own team
    const isHR = team.hr_id && (team.hr_id.toString() === userId || team.hr_id._id?.toString() === userId);
    const isLead = team.lead_id && (team.lead_id.toString() === userId || team.lead_id._id?.toString() === userId);
    
    if (isHR || isLead) {
      const role = isHR && isLead ? 'HR and Team Lead' : isHR ? 'HR' : 'Team Lead';
      return res.status(400).json({ 
        message: `Cannot remove the ${role} from their own team. Please reassign the ${role} role first.` 
      });
    }

    // Get user details for logging before removal
    const removedUser = await User.findOne({ _id: userId, workspaceId: req.context.workspaceId }).select('full_name email');
    const removedUserName = removedUser ? removedUser.full_name : 'Unknown';
    const removedUserEmail = removedUser ? removedUser.email : 'Unknown';

    // Remove from team using $pull with workspace scoping for consistency
    const result = await Team.findOneAndUpdate(
      { _id: id, workspaceId: req.context.workspaceId },
      { $pull: { members: userId } },
      { new: true }
    );

    if (!result) {
      return res.status(500).json({ message: 'Failed to remove member from team' });
    }

    // MULTIPLE TEAMS SUPPORT: For Core Workspace, remove from teams array and update team_id
    const isCoreWorkspace = req.context.workspaceType === 'CORE';
    const user = await User.findOne({ _id: userId, workspaceId: req.context.workspaceId });
    
    if (isCoreWorkspace && user) {
      // Remove this team from teams array
      await User.findOneAndUpdate(
        { _id: userId, workspaceId: req.context.workspaceId },
        { $pull: { teams: id } }
      );
      
      // Update team_id: set to another team if user has other teams, else null
      const updatedUser = await User.findOne({ _id: userId, workspaceId: req.context.workspaceId });
      const newTeamId = updatedUser.teams && updatedUser.teams.length > 0 
        ? updatedUser.teams[0] 
        : null;
      
      await User.findOneAndUpdate(
        { _id: userId, workspaceId: req.context.workspaceId },
        { team_id: newTeamId }
      );
    } else if (user) {
      // Community Workspace: just set team_id to null
      await User.findOneAndUpdate(
        { _id: userId, workspaceId: req.context.workspaceId },
        { team_id: null }
      );
    }

    const updatedTeam = await Team.findOne({ _id: id, workspaceId: req.context.workspaceId })
      .populate('hr_id', 'full_name email')
      .populate('lead_id', 'full_name email')
      .populate('members', 'full_name email role');

    emitWorkspaceEvent(req, 'team:updated', updatedTeam);

    // Log team member removal
    const user_ip = getClientIP(req);
    await logChange({
      event_type: 'team_member_removed',
      user: req.user,
      user_ip,
      target_type: 'team',
      target_id: id,
      target_name: team.name,
      action: 'Removed team member',
      description: `${req.user.full_name} removed ${removedUserName} from team "${team.name}"`,
      metadata: {
        removedMemberName: removedUserName,
        removedMemberEmail: removedUserEmail,
        teamName: team.name,
        workspaceId: req.context.workspaceId
      },
      workspaceId: req.context.workspaceId
    });

    res.json({ 
      message: 'Member removed from team successfully', 
      team: updatedTeam 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Server error while removing member', 
      error: error.message 
    });
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

    emitWorkspaceEvent(req, 'team:deleted', { _id: id, name: teamName });

    // Log team deletion
    const user_ip = getClientIP(req);
    await logChange({
      event_type: 'team_deleted',
      user: req.user,
      user_ip,
      target_type: 'team',
      target_id: id,
      target_name: teamName,
      action: 'Deleted team',
      description: `${req.user.full_name} deleted team "${teamName}"`,
      metadata: {
        memberCount: team.members.length,
        workspaceId: req.context.workspaceId,
        workspaceName: req.context.workspaceName
      },
      workspaceId: req.context.workspaceId
    });

    res.json({ 
      message: 'Team deleted successfully',
      team: { 
        id: id, 
        name: teamName,
        usersAffected: team.members.length + 1 // members + lead
      }
    });
  } catch (error) {
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

    emitWorkspaceEvent(req, 'team:bulk-deleted', {
      count: teamCount,
      workspaceId: req.context.workspaceId
    });

    // Log bulk team deletion
    const user_ip = getClientIP(req);
    await logChange({
      event_type: 'team_bulk_deleted',
      user: req.user,
      user_ip,
      target_type: 'team',
      target_id: teamIds.map(id => id.toString()),
      target_name: `Bulk delete: ${teamCount} teams`,
      action: 'Bulk deleted teams',
      description: `${req.user.full_name} deleted ${teamCount} team(s) in bulk`,
      metadata: {
        deletedTeamIds: teamIds.map(id => id.toString()),
        deletedTeamCount: teamCount,
        teamNames: teams.map(t => t.name),
        workspaceId: req.context.workspaceId
      },
      workspaceId: req.context.workspaceId
    });

    res.json({ 
      message: `Successfully deleted ${teamCount} team(s)`,
      count: teamCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

