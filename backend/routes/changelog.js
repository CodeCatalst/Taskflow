import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { checkRole } from '../middleware/roleCheck.js';
import { requireAuditLogs } from '../middleware/workspaceGuard.js';
import { getChangeLogs, getChangeLogStats, exportChangeLogs } from '../utils/changeLogService.js';
import ChangeLog from '../models/ChangeLog.js';

const router = express.Router();

// WORKSPACE SUPPORT: All changelog routes require auditLogs feature (CORE only)
router.use(requireAuditLogs);

/**
 * @route   GET /api/changelog
 * @desc    Get change logs with filters and pagination (Admin only)
 * @access  Private (Admin + CORE workspace OR System Admin)
 */
router.get('/', authenticate, checkRole(['admin']), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      event_type,
      user_id,
      target_type,
      start_date,
      end_date,
      search,
      workspace_id  // Allow system admins to filter by specific workspace
    } = req.query;

    // Admins (role: 'admin') can see all logs across all workspaces
    // Community admins can only see their workspace's logs
    let workspaceFilter = req.context.workspaceId;
    
    if (req.user.role === 'admin') {
      // Admin: show all logs from all workspaces, or filter by specific workspace if provided
      workspaceFilter = workspace_id || null;  // null means all workspaces
    }

    const result = await getChangeLogs({
      page: parseInt(page),
      limit: parseInt(limit),
      event_type,
      user_id,
      target_type,
      start_date,
      end_date,
      search,
      workspaceId: workspaceFilter,
      includeAllWorkspaces: req.user.role === 'admin' && !workspace_id  // Admins see all workspaces
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching change logs:', error);
    res.status(500).json({ message: 'Error fetching change logs', error: error.message });
  }
});

/**
 * @route   GET /api/changelog/stats
 * @desc    Get change log statistics (Admin only)
 * @access  Private (Admin)
 */
router.get('/stats', authenticate, checkRole(['admin']), async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    // Admins see stats from all workspaces
    const stats = await getChangeLogStats({ start_date, end_date });

    res.json(stats);
  } catch (error) {
    console.error('Error fetching change log stats:', error);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

/**
 * @route   GET /api/changelog/export
 * @desc    Export change logs to CSV (Admin only)
 * @access  Private (Admin)
 */
router.get('/export', authenticate, checkRole(['admin']), async (req, res) => {
  try {
    const {
      event_type,
      user_id,
      target_type,
      start_date,
      end_date,
      search
    } = req.query;

    const query = {};

    // Admins see logs from all workspaces (no workspaceId filter)
    if (event_type) query.event_type = event_type;
    if (user_id) query.user_id = user_id;
    if (target_type) query.target_type = target_type;
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } }
      ];
    }
    if (start_date || end_date) {
      query.created_at = {};
      if (start_date) query.created_at.$gte = new Date(start_date);
      if (end_date) query.created_at.$lte = new Date(end_date);
    }

    const logs = await exportChangeLogs(query);

    // Convert to CSV
    const csvHeader = 'Timestamp,Event Type,User,Email,Role,IP Address,Action,Target Type,Target Name,Description\n';
    const csvRows = logs.map(log => {
      return [
        new Date(log.created_at).toISOString(),
        log.event_type,
        log.user_name || 'System',
        log.user_email || 'N/A',
        log.user_role || 'N/A',
        log.user_ip || 'N/A',
        log.action,
        log.target_type || 'N/A',
        log.target_name || 'N/A',
        `"${(log.description || '').replace(/"/g, '""')}"`
      ].join(',');
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=changelog-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting change logs:', error);
    res.status(500).json({ message: 'Error exporting change logs', error: error.message });
  }
});

/**
 * @route   GET /api/changelog/event-types
 * @desc    Get all available event types (Admin only)
 * @access  Private (Admin)
 */
router.get('/event-types', authenticate, checkRole(['admin']), async (req, res) => {
  try {
    const eventTypes = [
      'user_login',
      'user_logout',
      'user_created',
      'user_updated',
      'user_deleted',
      'task_created',
      'task_updated',
      'task_deleted',
      'task_status_changed',
      'task_assigned',
      'task_unassigned',
      'team_created',
      'team_updated',
      'team_deleted',
      'team_member_added',
      'team_member_removed',
      'report_generated',
      'automation_triggered',
      'notification_sent',
      'comment_added',
      'comment_updated',
      'comment_deleted',
      'bulk_import',
      'system_event'
    ];

    res.json(eventTypes);
  } catch (error) {
    console.error('Error fetching event types:', error);
    res.status(500).json({ message: 'Error fetching event types', error: error.message });
  }
});

/**
 * @route   DELETE /api/changelog/clear
 * @desc    Clear old change logs (Admin only)
 * @access  Private (Admin)
 */
router.delete('/clear', authenticate, checkRole(['admin']), async (req, res) => {
  try {
    const { days = 90 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const result = await ChangeLog.deleteMany({
      created_at: { $lt: cutoffDate }
    });

    res.json({
      message: `Successfully deleted logs older than ${days} days`,
      deleted_count: result.deletedCount
    });
  } catch (error) {
    console.error('Error clearing change logs:', error);
    res.status(500).json({ message: 'Error clearing change logs', error: error.message });
  }
});

export default router;
