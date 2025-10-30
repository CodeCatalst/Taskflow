import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Get user notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const notifications = await Notification.find({ user_id: req.user._id })
      .sort({ created_at: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      user_id: req.user._id,
      read_at: null
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark notifications as read
router.patch('/mark-read', authenticate, async (req, res) => {
  try {
    const { notificationIds } = req.body;

    if (notificationIds && notificationIds.length > 0) {
      await Notification.updateMany(
        { _id: { $in: notificationIds }, user_id: req.user._id },
        { read_at: Date.now() }
      );
    } else {
      // Mark all as read
      await Notification.updateMany(
        { user_id: req.user._id, read_at: null },
        { read_at: Date.now() }
      );
    }

    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;