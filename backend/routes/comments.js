import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Comment from '../models/Comment.js';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Get comments for a task
router.get('/:taskId/comments', authenticate, async (req, res) => {
  try {
    // WORKSPACE SUPPORT: Scope by workspace
    const comments = await Comment.find({ 
      task_id: req.params.taskId,
      workspaceId: req.context.workspaceId
    })
      .populate('author_id', 'full_name email')
      .sort({ created_at: -1 });

    res.json({ comments, count: comments.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add comment to task
router.post('/:taskId/comments', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    const taskId = req.params.taskId;

    // WORKSPACE SUPPORT: Check if task exists in same workspace
    const task = await Task.findOne({ _id: taskId, workspaceId: req.context.workspaceId });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const comment = new Comment({
      task_id: taskId,
      author_id: req.user._id,
      content,
      workspaceId: req.context.workspaceId
    });

    await comment.save();

    // Create notification for task owner if different from commenter
    if (task.assigned_to && task.assigned_to.toString() !== req.user._id.toString()) {
      await Notification.create({
        user_id: task.assigned_to,
        type: 'comment_added',
        payload: {
          task_id: taskId,
          task_title: task.title,
          comment_by: req.user.full_name
        },
        workspaceId: req.context.workspaceId
      });
    }

    const populatedComment = await Comment.findById(comment._id)
      .populate('author_id', 'full_name email');

    // Emit socket event
    if (req.app.get('io')) {
      req.app.get('io').emit('comment:added', {
        taskId,
        comment: populatedComment
      });
    }

    res.status(201).json({ message: 'Comment added', comment: populatedComment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
