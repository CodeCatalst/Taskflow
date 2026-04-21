import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireCoreWorkspace } from '../middleware/workspaceGuard.js';
import EmailNotificationPreferences from '../models/EmailNotificationPreferences.js';
import { logChange } from '../utils/changeLogService.js';
import getClientIP from '../utils/getClientIP.js';

const router = express.Router();

// Get user's notification preferences
router.get('/', authenticate, requireCoreWorkspace, async (req, res) => {
  try {
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;
    const userId = req.user._id;

    let preferences = await EmailNotificationPreferences.findOne({
      userId,
      workspaceId
    });

    // If no preferences exist, create default ones
    if (!preferences) {
      preferences = new EmailNotificationPreferences({
        userId,
        workspaceId,
        dueDateReminders: {
          enabled: true,
          tomorrowReminders: true,
          todayReminders: true,
          overdueEscalation: true
        },
        taskNotifications: {
          enabled: true,
          assignmentNotifications: true,
          statusUpdateNotifications: true,
          commentNotifications: true
        },
        adminReports: {
          enabled: req.user.role === 'admin' || req.user.role === 'hr',
          dailyReports: true,
          weeklyReports: true
        },
        emailFrequency: 'immediate',
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00'
        }
      });

      await preferences.save();
    }

    res.json({ success: true, preferences });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notification preferences' });
  }
});

// Update user's notification preferences
router.put('/', authenticate, requireCoreWorkspace, async (req, res) => {
  try {
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;
    const userId = req.user._id;
    const updateData = req.body;

    // Validate the data structure
    const allowedFields = [
      'dueDateReminders',
      'taskNotifications',
      'adminReports',
      'emailFrequency',
      'quietHours'
    ];

    const filteredData = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredData[key] = updateData[key];
      }
    });

    // Only allow admin reports for admins/HR
    if (filteredData.adminReports && !(req.user.role === 'admin' || req.user.role === 'hr')) {
      filteredData.adminReports.enabled = false;
    }

    const preferences = await EmailNotificationPreferences.findOneAndUpdate(
      { userId, workspaceId },
      { ...filteredData, updated_at: Date.now() },
      { new: true, upsert: true }
    );

    await logChange({
      userId: req.user._id,
      workspaceId,
      action: 'update',
      entity: 'email_notification_preferences',
      entityId: preferences._id,
      details: { updatedFields: Object.keys(filteredData) },
      ipAddress: getClientIP(req)
    });

    res.json({ success: true, preferences });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update notification preferences' });
  }
});

// Reset preferences to defaults
router.post('/reset', authenticate, requireCoreWorkspace, async (req, res) => {
  try {
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;
    const userId = req.user._id;

    const defaultPreferences = {
      dueDateReminders: {
        enabled: true,
        tomorrowReminders: true,
        todayReminders: true,
        overdueEscalation: true
      },
      taskNotifications: {
        enabled: true,
        assignmentNotifications: true,
        statusUpdateNotifications: true,
        commentNotifications: true
      },
      adminReports: {
        enabled: req.user.role === 'admin' || req.user.role === 'hr',
        dailyReports: true,
        weeklyReports: true
      },
      emailFrequency: 'immediate',
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00'
      }
    };

    const preferences = await EmailNotificationPreferences.findOneAndUpdate(
      { userId, workspaceId },
      { ...defaultPreferences, updated_at: Date.now() },
      { new: true, upsert: true }
    );

    await logChange({
      userId: req.user._id,
      workspaceId,
      action: 'reset',
      entity: 'email_notification_preferences',
      entityId: preferences._id,
      details: { action: 'reset_to_defaults' },
      ipAddress: getClientIP(req)
    });

    res.json({ success: true, preferences, message: 'Preferences reset to defaults' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset notification preferences' });
  }
});

export default router;