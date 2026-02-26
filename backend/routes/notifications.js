import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Get user notifications
router.get('/', authenticate, async (req, res) => {
  try {
    // WORKSPACE SUPPORT: Scope by workspace and user
    const notifications = await Notification.find({ 
      user_id: req.user._id,
      workspaceId: req.context.workspaceId
    })
      .sort({ created_at: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      user_id: req.user._id,
      workspaceId: req.context.workspaceId,
      read_at: null
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark notifications as read
router.patch('/mark-read', authenticate, async (req, res) => {
  try {
    const { notificationIds } = req.body;

    if (notificationIds && notificationIds.length > 0) {
      // WORKSPACE SUPPORT: Scope by workspace and user
      await Notification.updateMany(
        { 
          _id: { $in: notificationIds }, 
          user_id: req.user._id,
          workspaceId: req.context.workspaceId
        },
        { read_at: Date.now() }
      );
    } else {
      // Mark all as read - scoped by workspace
      await Notification.updateMany(
        { 
          user_id: req.user._id, 
          workspaceId: req.context.workspaceId,
          read_at: null 
        },
        { read_at: Date.now() }
      );
    }

    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
