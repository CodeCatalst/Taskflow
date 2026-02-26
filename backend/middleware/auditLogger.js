import { logChange } from '../utils/changeLogService.js';
import getClientIP from '../utils/getClientIP.js';

/**
 * Middleware to automatically log API requests
 */
export const auditLogger = (options = {}) => {
  const {
    event_type,
    action,
    target_type,
    skip_logging = false
  } = options;

  return async (req, res, next) => {
    if (skip_logging) {
      return next();
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to log after response
    res.json = function(data) {
      // Only log successful requests (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const user_ip = getClientIP(req);

        // Build log entry
        const logData = {
          event_type: event_type || getEventTypeFromMethod(req.method),
          user: req.user,
          user_ip,
          target_type,
          action: action || `${req.method} ${req.path}`,
          description: buildDescription(req, data),
          metadata: {
            method: req.method,
            path: req.path,
            query: req.query,
            status_code: res.statusCode
          }
        };

        // Extract target info from response or params
        if (data && data._id) {
          logData.target_id = data._id;
        } else if (req.params.id) {
          logData.target_id = req.params.id;
        }

        if (data && (data.title || data.name || data.full_name)) {
          logData.target_name = data.title || data.name || data.full_name;
        }

        // Log asynchronously without blocking response
        logChange(logData).catch(err => {
        });
      }

      // Call original json method
      return originalJson(data);
    };

    next();
  };
};

/**
 * Get event type based on HTTP method
 */
const getEventTypeFromMethod = (method) => {
  switch (method) {
    case 'POST': return 'system_event';
    case 'PUT':
    case 'PATCH': return 'system_event';
    case 'DELETE': return 'system_event';
    default: return 'system_event';
  }
};

/**
 * Build human-readable description
 */
const buildDescription = (req, data) => {
  const user = req.user?.full_name || 'User';
  const method = req.method;
  const path = req.path;

  if (path.includes('/login')) {
    return `${user} logged in`;
  }
  if (path.includes('/logout')) {
    return `${user} logged out`;
  }
  if (path.includes('/tasks')) {
    if (method === 'POST') return `${user} created a task`;
    if (method === 'PUT' || method === 'PATCH') return `${user} updated a task`;
    if (method === 'DELETE') return `${user} deleted a task`;
  }
  if (path.includes('/users')) {
    if (method === 'POST') return `${user} created a user account`;
    if (method === 'PUT' || method === 'PATCH') return `${user} updated a user account`;
    if (method === 'DELETE') return `${user} deleted a user account`;
  }
  if (path.includes('/teams')) {
    if (method === 'POST') return `${user} created a team`;
    if (method === 'PUT' || method === 'PATCH') return `${user} updated a team`;
    if (method === 'DELETE') return `${user} deleted a team`;
  }
  if (path.includes('/comments')) {
    if (method === 'POST') return `${user} added a comment`;
    if (method === 'PUT' || method === 'PATCH') return `${user} updated a comment`;
    if (method === 'DELETE') return `${user} deleted a comment`;
  }
  if (path.includes('/reports')) {
    return `${user} generated a report`;
  }

  return `${user} performed ${method} on ${path}`;
};

/**
 * Log specific events manually
 */
export const logEvent = async (req, options) => {
  try {
    const user_ip = getClientIP(req);
    
    await logChange({
      ...options,
      user: req.user,
      user_ip
    });
  } catch (error) {
  }
};
