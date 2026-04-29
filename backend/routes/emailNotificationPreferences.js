import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireCoreWorkspace } from '../middleware/workspaceGuard.js';
import EmailNotificationPreferences from '../models/EmailNotificationPreferences.js';
import { logChange } from '../utils/changeLogService.js';
import getClientIP from '../utils/getClientIP.js';
import { emitUserEvent } from '../utils/socketEvents.js';

const router = express.Router();

const getEffectiveRole = (req) => req.context?.isSystemAdmin ? 'admin' : (req.context?.currentRole || req.user.role);

// Get user's notification preferences
router.get('/', authenticate, async (req, res) => {
  try {
    const workspaceId = req.user.workspaceId;
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
          enabled: getEffectiveRole(req) === 'admin' || getEffectiveRole(req) === 'hr',
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
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ message: 'Failed to fetch notification preferences', error: error.message });
  }
});

// Update user's notification preferences
router.put('/', authenticate, async (req, res) => {
  try {
    const workspaceId = req.user.workspaceId;
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
    if (filteredData.adminReports && !(getEffectiveRole(req) === 'admin' || getEffectiveRole(req) === 'hr')) {
      filteredData.adminReports.enabled = false;
    }

    const preferences = await EmailNotificationPreferences.findOneAndUpdate(
      { userId, workspaceId },
      { $set: { ...filteredData, updated_at: Date.now() } },
      { new: true, upsert: true }
    );

    // Fire-and-forget: notify the user's session and log the change without blocking the response
    try {
      emitUserEvent(req, userId, 'notification_preferences_updated', {
        preferences,
        workspaceId
      });
    } catch (err) {
      console.error('Socket event error:', err);
    }

    // Use a non-blocking call for logging
    logChange({
      userId: req.user._id,
      workspaceId,
      action: 'update',
      entity: 'email_notification_preferences',
      entityId: preferences._id,
      details: { updatedFields: Object.keys(filteredData) },
      ipAddress: getClientIP(req)
    }).catch(err => {
      console.error('Audit log error:', err);
    });

    res.json({ success: true, preferences });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ message: 'Failed to update notification preferences', error: error.message });
  }
});

// Reset preferences to defaults
router.post('/reset', authenticate, async (req, res) => {
  try {
    const workspaceId = req.user.workspaceId;
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
      { $set: { ...defaultPreferences, updated_at: Date.now() } },
      { new: true, upsert: true }
    );

    // Fire-and-forget: notify the user's session and log the change without blocking the response
    try {
      emitUserEvent(req, userId, 'notification_preferences_updated', {
        preferences,
        workspaceId
      });
    } catch (err) {
      console.error('Socket event error:', err);
    }

    // Use a non-blocking call for logging
    logChange({
      userId: req.user._id,
      workspaceId,
      action: 'reset',
      entity: 'email_notification_preferences',
      entityId: preferences._id,
      details: { action: 'reset_to_defaults' },
      ipAddress: getClientIP(req)
    }).catch(err => {
      console.error('Audit log error:', err);
    });

    res.json({ success: true, preferences, message: 'Preferences reset to defaults' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset notification preferences' });
  }
});

export default router;