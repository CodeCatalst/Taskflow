import ChangeLog from '../models/ChangeLog.js';

/**
 * Create a change log entry
 * WORKSPACE SUPPORT: Now accepts workspaceId parameter
 */
export const logChange = async (params) => {
  try {
    // Handle both parameter patterns
    let logData = {};

    if (params.event_type) {
      // Direct event_type pattern (used in auth.js, users.js, etc.)
      logData = {
        event_type: params.event_type,
        user_id: params.user?._id,
        user_email: params.user?.email,
        user_name: params.user?.full_name,
        user_role: params.user?.role,
        user_ip: params.user_ip,
        target_type: params.target_type,
        target_id: params.target_id,
        target_name: params.target_name,
        action: params.action,
        description: params.description,
        metadata: params.metadata || {},
        changes: params.changes || {},
        workspaceId: params.workspaceId
      };
    } else {
      // Alternative pattern (used in attendance.js, leaves.js, etc.)
      const { userId, workspaceId, action, entity, entityId, details, ipAddress } = params;

      // Map entity to event_type
      const eventTypeMap = {
        attendance: 'user_action',
        leave_request: 'leave_action',
        leave_type: 'leave_type_action',
        holiday: 'holiday_action',
        email_template: 'email_action',
        user: 'user_action',
        task: 'task_action',
        workspace: 'workspace_action'
      };

      logData = {
        event_type: eventTypeMap[entity] || 'system_event',
        user_id: userId,
        user_ip: ipAddress,
        target_type: entity,
        target_id: entityId,
        action: action,
        description: `${action} ${entity}: ${JSON.stringify(details || {})}`,
        metadata: details || {},
        workspaceId: workspaceId
      };
    }

    const logEntry = new ChangeLog(logData);

    await logEntry.save();
    return logEntry;
  } catch (error) {
    console.error('Error creating change log:', error);
    // Don't throw error to prevent disrupting main operations
    return null;
  }
};

/**
 * Get change logs with filters and pagination
 * WORKSPACE SUPPORT: Now requires workspaceId parameter (or includeAllWorkspaces for system admins)
 */
export const getChangeLogs = async ({
  page = 1,
  limit = 50,
  event_type,
  user_id,
  target_type,
  start_date,
  end_date,
  search,
  workspaceId,
  includeAllWorkspaces = false  // For system admins to view all logs
}) => {
  try {
    // WORKSPACE SUPPORT: Start with workspace filter (unless viewing all)
    const query = {};
    
    if (!includeAllWorkspaces) {
      query.workspaceId = workspaceId;
    }

    if (event_type) {
      query.event_type = event_type;
    }

    if (user_id) {
      query.user_id = user_id;
    }

    if (target_type) {
      query.target_type = target_type;
    }

    if (start_date || end_date) {
      query.created_at = {};
      if (start_date) {
        query.created_at.$gte = new Date(start_date);
      }
      if (end_date) {
        query.created_at.$lte = new Date(end_date);
      }
    }

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { user_email: { $regex: search, $options: 'i' } },
        { user_name: { $regex: search, $options: 'i' } },
        { target_name: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ChangeLog.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user_id', 'full_name email role')
        .lean(),
      ChangeLog.countDocuments(query)
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Error fetching change logs:', error);
    throw error;
  }
};

/**
 * Get change log statistics
 */
export const getChangeLogStats = async ({ start_date, end_date }) => {
  try {
    const query = {};
    
    if (start_date || end_date) {
      query.created_at = {};
      if (start_date) {
        query.created_at.$gte = new Date(start_date);
      }
      if (end_date) {
        query.created_at.$lte = new Date(end_date);
      }
    }

    const stats = await ChangeLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$event_type',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const userActivity = await ChangeLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$user_id',
          user_name: { $first: '$user_name' },
          user_email: { $first: '$user_email' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    const total = await ChangeLog.countDocuments(query);

    return {
      total,
      by_event_type: stats,
      top_users: userActivity
    };
  } catch (error) {
    console.error('Error fetching change log stats:', error);
    throw error;
  }
};

/**
 * Export change logs to CSV format
 */
export const exportChangeLogs = async (query) => {
  try {
    const logs = await ChangeLog.find(query)
      .sort({ created_at: -1 })
      .populate('user_id', 'full_name email role')
      .lean();

    return logs;
  } catch (error) {
    console.error('Error exporting change logs:', error);
    throw error;
  }
};
