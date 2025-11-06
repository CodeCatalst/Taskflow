import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { checkRole } from '../middleware/roleCheck.js';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { logChange } from '../utils/changeLogService.js';

const router = express.Router();

// Create task
router.post('/', authenticate, async (req, res) => {
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
      team_id: team_id || req.user.team_id,
      due_date
    });

    await task.save();

    // Create notifications if assigned to users
    if (assigned_to && assigned_to.length > 0) {
      const notifications = assigned_to
        .filter(userId => userId.toString() !== req.user._id.toString())
        .map(userId => ({
          user_id: userId,
          type: 'task_assigned',
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
    const user_ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
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
      }
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
    let query = {};

    // Role-based filtering
    if (req.user.role === 'member') {
      // Members only see their own tasks
      query.$or = [
        { created_by: req.user._id },
        { assigned_to: req.user._id }
      ];
    } else if (req.user.role === 'team_lead') {
      // Team leads see their team's tasks
      query.team_id = req.user.team_id;
    }
    // HR and Admin see all tasks

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
    const task = await Task.findById(req.params.id)
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
      if (!isCreator && !isAssigned) {
        return res.status(403).json({ message: 'Access denied' });
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
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions
    const isCreator = task.created_by.toString() === req.user._id.toString();
    const isAssigned = task.assigned_to?.some(userId => userId.toString() === req.user._id.toString());
    const canEdit = ['admin', 'hr', 'team_lead'].includes(req.user.role) || isCreator || isAssigned;

    if (!canEdit) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, description, status, priority, assigned_to, due_date, progress } = req.body;
    
    const oldStatus = task.status;

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (status) task.status = status;
    if (priority) task.priority = priority;
    if (due_date !== undefined) task.due_date = due_date;
    if (progress !== undefined) task.progress = progress;
    
    // Only certain roles can reassign
    if (assigned_to && ['admin', 'hr', 'team_lead'].includes(req.user.role)) {
      task.assigned_to = assigned_to;
    }

    task.updated_at = Date.now();
    await task.save();

    // Create notification for status change
    if (status && status !== oldStatus && task.assigned_to && task.assigned_to.length > 0) {
      const notifications = task.assigned_to
        .filter(userId => userId.toString() !== req.user._id.toString())
        .map(userId => ({
          user_id: userId,
          type: 'status_changed',
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
    if (assigned_to && Array.isArray(assigned_to)) {
      // Find newly assigned users (not previously assigned)
      const oldAssignedIds = task.assigned_to ? task.assigned_to.map(id => id.toString()) : [];
      const newAssignedIds = assigned_to.map(id => id.toString());
      const newlyAssigned = newAssignedIds.filter(id => !oldAssignedIds.includes(id) && id !== req.user._id.toString());

      if (newlyAssigned.length > 0) {
        // Validate that all assigned users exist
        const assignedUsers = await User.find({ _id: { $in: newlyAssigned } });
        if (assignedUsers.length !== newlyAssigned.length) {
          return res.status(400).json({ message: 'One or more assigned users not found' });
        }

        const notifications = newlyAssigned.map(userId => ({
          user_id: userId,
          type: 'task_assigned',
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
    const user_ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const changes = {};
    if (status && status !== oldStatus) {
      changes.status = { old: oldStatus, new: status };
    }
    if (title && title !== task.title) changes.title = title;
    if (priority) changes.priority = priority;
    
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
      changes
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

// Delete task (Admin, HR, Team Lead only)
router.delete('/:id', authenticate, checkRole(['admin', 'hr', 'team_lead']), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const taskTitle = task.title;
    const taskId = req.params.id;
    await Task.findByIdAndDelete(req.params.id);

    // Log task deletion
    const user_ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    await logChange({
      event_type: 'task_deleted',
      user: req.user,
      user_ip,
      target_type: 'task',
      target_id: req.params.id,
      target_name: taskTitle,
      action: 'Deleted task',
      description: `${req.user.full_name} deleted task "${taskTitle}"`
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