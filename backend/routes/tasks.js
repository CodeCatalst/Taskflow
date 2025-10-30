import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { checkRole } from '../middleware/roleCheck.js';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Create task
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, priority, assigned_to, team_id, due_date } = req.body;

    // Members can only create tasks for themselves
    if (req.user.role === 'member') {
      if (assigned_to && assigned_to !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Members can only create tasks for themselves' });
      }
    }

    const task = new Task({
      title,
      description,
      priority,
      created_by: req.user._id,
      assigned_to: assigned_to || req.user._id,
      team_id: team_id || req.user.team_id,
      due_date
    });

    await task.save();

    // Create notification if assigned to someone else
    if (assigned_to && assigned_to !== req.user._id.toString()) {
      await Notification.create({
        user_id: assigned_to,
        type: 'task_assigned',
        payload: {
          task_id: task._id,
          task_title: task.title,
          assigned_by: req.user.full_name
        }
      });

      // Emit socket event
      if (req.app.get('io')) {
        req.app.get('io').to(assigned_to).emit('notification:new', {
          type: 'task_assigned',
          message: `New task assigned: ${task.title}`
        });
      }
    }

    const populatedTask = await Task.findById(task._id)
      .populate('created_by', 'full_name email')
      .populate('assigned_to', 'full_name email')
      .populate('team_id', 'name');

    // Emit socket event for task creation
    if (req.app.get('io')) {
      req.app.get('io').emit('task:created', populatedTask);
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
      if (task.created_by._id.toString() !== req.user._id.toString() &&
          task.assigned_to?._id.toString() !== req.user._id.toString()) {
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
    const isAssigned = task.assigned_to?.toString() === req.user._id.toString();
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
    if (status && status !== oldStatus && task.assigned_to) {
      await Notification.create({
        user_id: task.assigned_to,
        type: 'status_changed',
        payload: {
          task_id: task._id,
          task_title: task.title,
          old_status: oldStatus,
          new_status: status
        }
      });
    }

    const updatedTask = await Task.findById(task._id)
      .populate('created_by', 'full_name email')
      .populate('assigned_to', 'full_name email')
      .populate('team_id', 'name');

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

    await Task.findByIdAndDelete(req.params.id);

    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;