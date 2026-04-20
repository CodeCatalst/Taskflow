import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { checkRole } from '../middleware/roleCheck.js';
import { requireAuditLogs } from '../middleware/workspaceGuard.js';
import { getChangeLogs, getChangeLogStats, exportChangeLogs, logChange } from '../utils/changeLogService.js';
import ChangeLog from '../models/ChangeLog.js';
import getClientIP from '../utils/getClientIP.js';
import { escapeRegex, normalizePlainText } from '../utils/requestValidation.js';

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

    // System admins (admins without workspace) can see all logs across all workspaces
    // Workspace admins can only see their workspace's logs
    let workspaceFilter = req.context.workspaceId;
    
    if (req.context.isSystemAdmin) {
      // System Admin: show all logs from all workspaces, or filter by specific workspace if provided
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
      includeAllWorkspaces: req.context.isSystemAdmin && !workspace_id  // System admins see all workspaces
    });

    res.json(result);
  } catch (error) {
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

    // System admins see all logs, workspace admins see only their workspace
    let workspaceFilter = req.context.workspaceId;
    if (req.context.isSystemAdmin) {
      // System Admin: show all logs from all workspaces
      // workspaceFilter remains null (no filter)
    } else {
      // Workspace admin: filter by their workspace
      query.workspaceId = workspaceFilter;
    }

    if (event_type) query.event_type = event_type;
    if (user_id) query.user_id = user_id;
    if (target_type) query.target_type = target_type;
    if (search) {
      const safeSearch = escapeRegex(normalizePlainText(search, 'search', { maxLength: 80 }));
      query.$or = [
        { description: { $regex: safeSearch, $options: 'i' } },
        { action: { $regex: safeSearch, $options: 'i' } }
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

    // Log the changelog clear operation
    const user_ip = getClientIP(req);
    await logChange({
      event_type: 'changelog_cleared',
      user: req.user,
      user_ip,
      target_type: 'changelog',
      action: 'Cleared changelog logs',
      description: `${req.user.full_name} cleared ${result.deletedCount} changelog record(s) older than ${days} days`,
      metadata: {
        deletedCount: result.deletedCount,
        clearMethod: 'age_based',
        daysThreshold: parseInt(days),
        cutoffDate: cutoffDate.toISOString()
      },
      workspaceId: req.context.workspaceId
    });

    res.json({
      message: `Successfully deleted logs older than ${days} days`,
      deleted_count: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing change logs', error: error.message });
  }
});

// Export audit logs to Excel (Admin only)
router.get('/export/excel', authenticate, checkRole(['admin']), async (req, res) => {
  try {
    // Extra security check
    if (!req.context.isSystemAdmin && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const xlsx = await import('xlsx');
    
    const query = {};
    if (!req.user.role === 'admin' || !req.query.all) {
      query.workspaceId = req.context.workspaceId;
    }
    
    const logs = await ChangeLog.find(query)
      .populate('user_id', 'full_name email')
      .sort({ created_at: -1 })
      .limit(10000)
      .lean();

    const logData = logs.map(log => ({
      'Timestamp': log.created_at ? new Date(log.created_at).toLocaleString() : '',
      'Event Type': log.event_type,
      'Action': log.action,
      'User': log.user_id?.full_name || '',
      'User Email': log.user_id?.email || '',
      'Target Type': log.target_type || '',
      'Target Name': log.target_name || '',
      'Description': log.description || '',
      'IP Address': log.user_ip || ''
    }));

    const worksheet = xlsx.default.utils.json_to_sheet(logData);
    const workbook = xlsx.default.utils.book_new();
    xlsx.default.utils.book_append_sheet(workbook, worksheet, 'Audit Logs');

    const buffer = xlsx.default.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-export-${Date.now()}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Export audit logs to Excel error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Export audit logs to JSON (Admin only)
router.get('/export/json', authenticate, checkRole(['admin']), async (req, res) => {
  try {
    // Extra security check
    if (!req.context.isSystemAdmin && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const query = {};
    if (req.user.role !== 'admin' || !req.query.all) {
      query.workspaceId = req.context.workspaceId;
    }
    
    const logs = await ChangeLog.find(query)
      .populate('user_id', 'full_name email')
      .sort({ created_at: -1 })
      .limit(10000)
      .lean();

    const exportData = logs.map(log => ({
      event_type: log.event_type,
      action: log.action,
      user_id: log.user_id?._id?.toString(),
      user_name: log.user_id?.full_name,
      user_email: log.user_id?.email,
      target_type: log.target_type,
      target_id: log.target_id,
      target_name: log.target_name,
      description: log.description,
      user_ip: log.user_ip,
      metadata: log.metadata,
      changes: log.changes,
      workspaceId: log.workspaceId?.toString(),
      created_at: log.created_at
    }));

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-export-${Date.now()}.json`);
    res.json(exportData);
  } catch (error) {
    console.error('Export audit logs to JSON error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
