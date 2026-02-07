import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { checkRole } from '../middleware/roleCheck.js';
import { checkTaskLimit } from '../middleware/workspaceGuard.js';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import { logChange } from '../utils/changeLogService.js';
import getClientIP from '../utils/getClientIP.js';

const router = express.Router();

// WORKSPACE SUPPORT: All task routes are now scoped by workspace
// workspaceContext middleware is applied in server.js

// Create task
router.post('/', authenticate, checkTaskLimit, async (req, res) => {
  try {
    const { title, description, priority, assigned_to, team_id, due_date } = req.body;

    // Members can only create tasks for themselves
    // Admins, HR, and Team Leads can assign to anyone
    if (req.user.role === 'member') {
      // If assigned_to is provided and is an array, check if member is trying to assign to others
      if (assigned_to && Array.isArray(assigned_to) && assigned_to.length > 0) {
        // Check if trying to assign to someone other than themselves
        const assigningToOthers = assigned_to.some(userId => userId !== req.user._id.toString());
        if (assigningToOthers) {
          return res.status(403).json({ message: 'Members can only create tasks for themselves' });
        }
      }
    }

    const task = new Task({
      title,
      description,
      priority,
      created_by: req.user._id,
      assigned_to: assigned_to && assigned_to.length > 0 ? assigned_to : [req.user._id],
      team_id: team_id || undefined, // Fix: Use undefined instead of empty string or null if not valid
      due_date,
      workspaceId: req.context?.workspaceId || req.user.workspaceId || null  // WORKSPACE SUPPORT (fallback to user's workspace, null for system admins)
    });

    await task.save();

    // Update workspace task count (skip for system admins)
    const targetWorkspaceId = req.context?.workspaceId || req.user.workspaceId;
    if (targetWorkspaceId) {
      await Workspace.findByIdAndUpdate(
        targetWorkspaceId,
        { $inc: { 'usage.taskCount': 1 } }
      );
    }

    // Create notifications if assigned to users
    if (assigned_to && assigned_to.length > 0) {
      const notifications = assigned_to
        .filter(userId => userId.toString() !== req.user._id.toString())
        .map(userId => ({
          user_id: userId,
          type: 'task_assigned',
          message: `${req.user.full_name} assigned you a new task: "${task.title}"`,
          task_id: task._id,
          workspaceId: targetWorkspaceId,
          payload: {
            task_id: task._id,
            task_title: task.title,
            assigned_by: req.user.full_name
          }
        }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);

        // Emit socket events for both notification and task assignment
        if (req.app.get('io')) {
          assigned_to
            .filter(userId => userId.toString() !== req.user._id.toString())
            .forEach(userId => {
              // Emit notification event to specific user
              req.app.get('io').to(userId.toString()).emit('notification:new', {
                type: 'task_assigned',
                message: `New task assigned: ${task.title}`,
                task: task
              });
            });
        }
      }
    }

    const populatedTask = await Task.findById(task._id)
      .populate('created_by', 'full_name email')
      .populate('assigned_to', 'full_name email')
      .populate('team_id', 'name');

    // Log task creation
    const user_ip = getClientIP(req);
    await logChange({
      event_type: 'task_created',
      user: req.user,
      user_ip,
      target_type: 'task',
      target_id: task._id.toString(),
      target_name: task.title,
      action: 'Created task',
      description: `${req.user.full_name} created task "${task.title}"`,
      metadata: {
        priority: task.priority,
        status: task.status,
        due_date: task.due_date,
        assigned_to: assigned_to
      },
      workspaceId: req.context?.workspaceId || req.user.workspaceId
    });

    // Emit socket events for task creation (to all users) and task assignment (to specific users)
    if (req.app.get('io')) {
      req.app.get('io').emit('task:created', populatedTask);

      // Also emit task:assigned event to assigned users specifically
      if (assigned_to && assigned_to.length > 0) {
        assigned_to
          .filter(userId => userId.toString() !== req.user._id.toString())
          .forEach(userId => {
            req.app.get('io').to(userId.toString()).emit('task:assigned', {
              task: populatedTask,
              assigned_by: req.user.full_name
            });
          });
      }
    }

    res.status(201).json({ message: 'Task created', task: populatedTask });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get tasks with filters
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, priority, team, assigned_to } = req.query;

    // WORKSPACE SUPPORT: Start with workspace filter (system admins see all)
    let query = req.context.isSystemAdmin ? {} : { workspaceId: req.context.workspaceId };

    // Role-based filtering
    if (req.user.role === 'member') {
      // MULTIPLE TEAMS SUPPORT: Members see tasks from all their teams OR tasks assigned to them
      const userTeams = req.user.teams && req.user.teams.length > 0 
        ? req.user.teams.map(t => t._id || t)
        : (req.user.team_id ? [req.user.team_id] : []);
      
      query.$or = [
        { created_by: req.user._id },
        { assigned_to: req.user._id }
      ];
      
      // Also include tasks from user's teams (if they have any)
      if (userTeams.length > 0) {
        query.$or.push({ team_id: { $in: userTeams } });
      }
    } else if (req.user.role === 'team_lead') {
      // MULTIPLE TEAMS SUPPORT: Team leads see tasks from all teams they lead
      const userTeams = req.user.teams && req.user.teams.length > 0 
        ? req.user.teams.map(t => t._id || t)
        : (req.user.team_id ? [req.user.team_id] : []);
      
      if (userTeams.length > 0) {
        query.team_id = { $in: userTeams };
      } else {
        // Fallback to primary team if no teams array
        query.team_id = req.user.team_id;
      }
    }
    // HR and Admin see all tasks (within their workspace)

    // Apply filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (team) query.team_id = team;
    if (assigned_to) query.assigned_to = assigned_to;

    const tasks = await Task.find(query)
      .populate('created_by', 'full_name email')
      .populate('assigned_to', 'full_name email')
      .populate('team_id', 'name')
      .sort({ created_at: -1 });

    res.json({ tasks, count: tasks.length });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single task
router.get('/:id', authenticate, async (req, res) => {
  try {
    // WORKSPACE SUPPORT: Scope by workspace (system admins see all)
    const taskQuery = req.context.isSystemAdmin
      ? { _id: req.params.id }
      : { _id: req.params.id, workspaceId: req.context.workspaceId };
    const task = await Task.findOne(taskQuery)
      .populate('created_by', 'full_name email')
      .populate('assigned_to', 'full_name email')
      .populate('team_id', 'name');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions
    if (req.user.role === 'member') {
      const isCreator = task.created_by._id.toString() === req.user._id.toString();
      const isAssigned = task.assigned_to?.some(userId => userId.toString() === req.user._id.toString());
      
      // MULTIPLE TEAMS SUPPORT: Members can view tasks from their teams
      let isFromUserTeam = false;
      if (task.team_id) {
        const userTeams = req.user.teams && req.user.teams.length > 0 
          ? req.user.teams.map(t => (t._id || t).toString())
          : (req.user.team_id ? [req.user.team_id.toString()] : []);
        isFromUserTeam = userTeams.includes(task.team_id._id ? task.team_id._id.toString() : task.team_id.toString());
      }
      
      if (!isCreator && !isAssigned && !isFromUserTeam) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user.role === 'team_lead') {
      // MULTIPLE TEAMS SUPPORT: Team leads can view tasks from any of their teams
      if (task.team_id) {
        const userTeams = req.user.teams && req.user.teams.length > 0 
          ? req.user.teams.map(t => (t._id || t).toString())
          : (req.user.team_id ? [req.user.team_id.toString()] : []);
        const isFromUserTeam = userTeams.includes(task.team_id._id ? task.team_id._id.toString() : task.team_id.toString());
        
        if (!isFromUserTeam) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }
    }

    res.json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update task
router.patch('/:id', authenticate, async (req, res) => {
  try {
    // WORKSPACE SUPPORT: Scope by workspace (system admins can update all)
    const taskQuery = req.context.isSystemAdmin
      ? { _id: req.params.id }
      : { _id: req.params.id, workspaceId: req.context.workspaceId };
    const task = await Task.findOne(taskQuery);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions
    const isCreator = task.created_by.toString() === req.user._id.toString();
    const isAssigned = task.assigned_to?.some(userId => userId.toString() === req.user._id.toString());
    
    // MULTIPLE TEAMS SUPPORT: Team leads can edit tasks from any of their teams
    let isTeamLead = false;
    if (req.user.role === 'team_lead' && task.team_id) {
      const userTeams = req.user.teams && req.user.teams.length > 0 
        ? req.user.teams.map(t => (t._id || t).toString())
        : (req.user.team_id ? [req.user.team_id.toString()] : []);
      isTeamLead = userTeams.includes(task.team_id.toString());
    }
    
    const canEdit = ['admin', 'hr', 'community_admin'].includes(req.user.role) || isCreator || isAssigned || isTeamLead;

    if (!canEdit) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, description, status, priority, assigned_to, due_date, progress } = req.body;

    const oldStatus = task.status;
    const oldTitle = task.title;
    const oldDescription = task.description;
    const oldPriority = task.priority;
    const oldDueDate = task.due_date;
    const oldTeamId = task.team_id;
    const oldAssignedTo = task.assigned_to ? task.assigned_to.map(id => id.toString()) : [];

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (due_date !== undefined) task.due_date = due_date;
    if (progress !== undefined) task.progress = progress;

    // Only certain roles can reassign
    if (assigned_to !== undefined && ['admin', 'hr', 'team_lead', 'community_admin'].includes(req.user.role)) {
      task.assigned_to = Array.isArray(assigned_to) ? assigned_to : [];
    }

    if (req.body.team_id !== undefined) {
      task.team_id = req.body.team_id || undefined; // Fix: Handle empty string for team_id
    }

    task.updated_at = Date.now();
    await task.save();

    // Create notification for status change
    if (status && status !== oldStatus && task.assigned_to && task.assigned_to.length > 0) {
      const notifications = task.assigned_to
        .filter(userId => userId.toString() !== req.user._id.toString())
        .map(userId => ({
          user_id: userId,
          type: 'task_updated',
          message: `Task "${task.title}" status changed from ${oldStatus} to ${status}`,
          task_id: task._id,
          payload: {
            task_id: task._id,
            task_title: task.title,
            old_status: oldStatus,
            new_status: status
          }
        }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);

        // Emit socket notification for status change
        if (req.app.get('io')) {
          task.assigned_to
            .filter(userId => userId.toString() !== req.user._id.toString())
            .forEach(userId => {
              req.app.get('io').to(userId.toString()).emit('notification:new', {
                type: 'status_changed',
                message: `Task "${task.title}" status changed to ${status}`,
                task: { _id: task._id, title: task.title, status, old_status: oldStatus }
              });
            });
        }
      }
    }

    // Create notification for reassignment
    if (assigned_to !== undefined && Array.isArray(assigned_to) && ['admin', 'hr', 'team_lead', 'community_admin'].includes(req.user.role)) {
      // Find newly assigned users (not previously assigned)
      const newAssignedIds = assigned_to.map(id => id.toString());
      const newlyAssigned = newAssignedIds.filter(id => !oldAssignedTo.includes(id) && id !== req.user._id.toString());

      if (newlyAssigned.length > 0) {
        // Validate that all assigned users exist
        const assignedUsers = await User.find({ _id: { $in: newlyAssigned } });
        if (assignedUsers.length !== newlyAssigned.length) {
          return res.status(400).json({ message: 'One or more assigned users not found' });
        }

        const notifications = newlyAssigned.map(userId => ({
          user_id: userId,
          type: 'task_assigned',
          message: `${req.user.full_name} assigned you to task: "${task.title}"`,
          task_id: task._id,
          payload: {
            task_id: task._id,
            task_title: task.title,
            assigned_by: req.user.full_name
          }
        }));

        await Notification.insertMany(notifications);

        // Emit socket notification for new assignments
        if (req.app.get('io')) {
          newlyAssigned.forEach(userId => {
            req.app.get('io').to(userId).emit('notification:new', {
              type: 'task_assigned',
              message: `New task assigned: ${task.title}`,
              task: { _id: task._id, title: task.title }
            });
            req.app.get('io').to(userId).emit('task:assigned', {
              task: task,
              assigned_by: req.user.full_name
            });
          });
        }
      }
    }

    const updatedTask = await Task.findById(task._id)
      .populate('created_by', 'full_name email')
      .populate('assigned_to', 'full_name email')
      .populate('team_id', 'name');

    // Log task update
    const user_ip = getClientIP(req);
    const changes = {};

    if (oldTitle !== task.title) changes.title = { old: oldTitle, new: task.title };
    if (oldDescription !== task.description) changes.description = { old: oldDescription, new: task.description };
    if (oldStatus !== task.status) changes.status = { old: oldStatus, new: task.status };
    if (oldPriority !== task.priority) changes.priority = { old: oldPriority, new: task.priority };

    // Check for Due Date changes
    const getDatesDiff = (d1, d2) => {
      const t1 = d1 ? new Date(d1).getTime() : 0;
      const t2 = d2 ? new Date(d2).getTime() : 0;
      return t1 !== t2;
    };
    if (getDatesDiff(oldDueDate, task.due_date)) {
      changes.due_date = { old: oldDueDate, new: task.due_date };
    }

    // Check for Team changes
    if (oldTeamId?.toString() !== task.team_id?.toString()) {
      changes.team_id = { old: oldTeamId, new: task.team_id };
    }

    // Check for Assigned To changes
    const newAssignedIds = task.assigned_to.map(id => id.toString()).sort();
    const oldAssignedIds = oldAssignedTo.sort();
    const assignmentsChanged = JSON.stringify(newAssignedIds) !== JSON.stringify(oldAssignedIds);

    if (assignmentsChanged) {
      changes.assigned_to = {
        added: newAssignedIds.filter(id => !oldAssignedIds.includes(id)),
        removed: oldAssignedIds.filter(id => !newAssignedIds.includes(id))
      };
    }

    await logChange({
      event_type: status && status !== oldStatus ? 'task_status_changed' : 'task_updated',
      user: req.user,
      user_ip,
      target_type: 'task',
      target_id: task._id.toString(),
      target_name: task.title,
      action: 'Updated task',
      description: `${req.user.full_name} updated task "${task.title}"${status && status !== oldStatus ? ` (${oldStatus} → ${status})` : ''}`,
      metadata: {
        priority: task.priority,
        status: task.status,
        due_date: task.due_date
      },
      changes,
      workspaceId: req.context.workspaceId
    });

    // Emit socket event
    if (req.app.get('io')) {
      req.app.get('io').emit('task:updated', updatedTask);
    }

    res.json({ message: 'Task updated', task: updatedTask });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete task (Admin, HR, Team Lead, Community Admin only)
// Delete task
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // WORKSPACE SUPPORT: Scope by workspace (system admins can delete all)
    const taskQuery = req.context.isSystemAdmin
      ? { _id: req.params.id }
      : { _id: req.params.id, workspaceId: req.context.workspaceId };
    const task = await Task.findOne(taskQuery);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions
    const isCreator = task.created_by.toString() === req.user._id.toString();
    
    // MULTIPLE TEAMS SUPPORT: Team leads can delete tasks from any of their teams
    let isTeamLead = false;
    if (req.user.role === 'team_lead' && task.team_id) {
      const userTeams = req.user.teams && req.user.teams.length > 0 
        ? req.user.teams.map(t => (t._id || t).toString())
        : (req.user.team_id ? [req.user.team_id.toString()] : []);
      isTeamLead = userTeams.includes(task.team_id.toString());
    }
    
    const canDelete = req.context?.isSystemAdmin || ['admin', 'hr', 'community_admin'].includes(req.user.role) || isCreator || isTeamLead;

    if (!canDelete) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const taskTitle = task.title;
    const taskId = req.params.id;

    await Task.findOneAndDelete(taskQuery);

    // Update workspace task count (skip for system admins without workspace)
    if (req.context.workspaceId) {
      await Workspace.findByIdAndUpdate(
        req.context.workspaceId,
        { $inc: { 'usage.taskCount': -1 } }
      );
    }

    // Log task deletion
    const user_ip = getClientIP(req);
    await logChange({
      event_type: 'task_deleted',
      user: req.user,
      user_ip,
      target_type: 'task',
      target_id: req.params.id,
      target_name: taskTitle,
      action: 'Deleted task',
      description: `${req.user.full_name} deleted task "${taskTitle}"`,
      workspaceId: req.context.workspaceId
    });

    // Emit socket event for task deletion
    if (req.app.get('io')) {
      req.app.get('io').emit('task:deleted', { _id: taskId, title: taskTitle });
    }

    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;