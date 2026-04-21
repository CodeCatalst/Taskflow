import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { checkRole } from '../middleware/roleCheck.js';
import { triggerDailyAdminReports, triggerTodayDueNotifications, triggerTomorrowDueNotifications, triggerOverdueReminders, triggerOverdueEscalationReminders, triggerWeeklyReports, triggerProcessScheduledCampaigns } from '../utils/scheduler.js';

const router = express.Router();

// Middleware for cron job authentication (API key based)
const cronAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  if (apiKey === process.env.CRON_API_KEY) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized - Invalid API key' });
};

// Cron job trigger endpoints (secured with API key)
router.post('/trigger-daily-reports', cronAuth, async (req, res) => {
  try {
    console.log('🔄 Cron trigger: Daily Admin Reports');
    await triggerDailyAdminReports();
    res.json({
      success: true,
      message: 'Daily admin reports triggered successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cron trigger failed - Daily Reports:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/trigger-today-notifications', cronAuth, async (req, res) => {
  try {
    console.log('🔄 Cron trigger: Today Due Notifications');
    await triggerTodayDueNotifications();
    res.json({
      success: true,
      message: 'Today due notifications triggered successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cron trigger failed - Today Notifications:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/trigger-tomorrow-notifications', cronAuth, async (req, res) => {
  try {
    console.log('🔄 Cron trigger: Tomorrow Due Notifications');
    await triggerTomorrowDueNotifications();
    res.json({
      success: true,
      message: 'Tomorrow due notifications triggered successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cron trigger failed - Tomorrow Notifications:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/trigger-overdue-reminders', cronAuth, async (req, res) => {
  try {
    console.log('🔄 Cron trigger: Overdue Task Reminders');
    await triggerOverdueReminders();
    res.json({
      success: true,
      message: 'Overdue task reminders triggered successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cron trigger failed - Overdue Reminders:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/trigger-escalation-reminders', cronAuth, async (req, res) => {
  try {
    console.log('🔄 Cron trigger: Overdue Escalation Reminders');
    await triggerOverdueEscalationReminders();
    res.json({
      success: true,
      message: 'Overdue escalation reminders triggered successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cron trigger failed - Escalation Reminders:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/trigger-weekly-reports', cronAuth, async (req, res) => {
  try {
    console.log('🔄 Cron trigger: Weekly Admin Reports');
    await triggerWeeklyReports();
    res.json({
      success: true,
      message: 'Weekly admin reports triggered successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cron trigger failed - Weekly Reports:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/trigger-scheduled-campaigns', cronAuth, async (req, res) => {
  try {
    console.log('🔄 Cron trigger: Scheduled Campaign Processing');
    await triggerProcessScheduledCampaigns();
    res.json({
      success: true,
      message: 'Scheduled campaigns processed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cron trigger failed - Scheduled Campaigns:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Manual trigger endpoints (for admins - requires authentication)
router.post('/manual/daily-reports', authenticate, checkRole(['admin']), async (req, res) => {
  try {
    console.log('👤 Manual trigger: Daily Admin Reports by', req.user.full_name);
    await triggerDailyAdminReports();
    res.json({
      success: true,
      message: 'Daily admin reports triggered manually',
      triggered_by: req.user.full_name,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/manual/today-notifications', authenticate, checkRole(['admin']), async (req, res) => {
  try {
    console.log('👤 Manual trigger: Today Due Notifications by', req.user.full_name);
    await triggerTodayDueNotifications();
    res.json({
      success: true,
      message: 'Today due notifications triggered manually',
      triggered_by: req.user.full_name,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint for cron services
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'TaskFlow Email Automation',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Get automation status (for monitoring)
router.get('/status', cronAuth, async (req, res) => {
  try {
    // You can add more detailed status information here
    const status = {
      service: 'TaskFlow Email Automation',
      status: 'operational',
      timestamp: new Date().toISOString(),
      automations: {
        daily_reports: 'scheduled',
        due_notifications: 'scheduled',
        weekly_reports: 'scheduled',
        scheduled_campaigns: 'active'
      }
    };
    res.json(status);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;