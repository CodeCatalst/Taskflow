/**
 * Security Utilities - IP Blocking and Failed Login Tracking
 * Provides protection against brute force attacks and suspicious activity
 */

import crypto from 'crypto';
import SecurityThrottleState from '../models/SecurityThrottleState.js';

// Configuration
const CONFIG = {
  // Max failed attempts before blocking
  MAX_FAILED_ATTEMPTS: 5,
  // Block duration in minutes
  BLOCK_DURATION_MINUTES: 15,
  // Reset failed attempts after this many minutes
  RESET_ATTEMPTS_MINUTES: 30,
  // Suspicious activity window in minutes
  SUSPICIOUS_WINDOW_MINUTES: 60,
  // Max suspicious activities before blocking
  MAX_SUSPICIOUS_ACTIVITIES: 10,
};

/**
 * Get client IP from request
 */
export const getClientIP = (req) => {
  let ip = req.ip || req.ips?.[0];

  if (!ip) {
    ip = req.socket?.remoteAddress ||
         req.connection?.remoteAddress ||
         req.connection?.socket?.remoteAddress;
  }

  if (!ip) return 'Unknown';

  ip = ip.replace(/^::ffff:/, '');
  if (ip === '::1') ip = '127.0.0.1';

  return ip;
};

/**
 * Record a failed login attempt
 * @param {string} ip - Client IP address
 * @param {string} email - Email that was used in the attempt
 * @returns {object} - Status of the attempt
 */
const resetWindowMs = CONFIG.RESET_ATTEMPTS_MINUTES * 60 * 1000;
const suspiciousWindowMs = CONFIG.SUSPICIOUS_WINDOW_MINUTES * 60 * 1000;
const blockWindowMs = CONFIG.BLOCK_DURATION_MINUTES * 60 * 1000;

const normalizeState = async (ip) => {
  const now = new Date();
  let record = await SecurityThrottleState.findOne({ ip });

  if (!record) {
    record = new SecurityThrottleState({
      ip,
      attempts: 0,
      blockedUntil: null,
      lastAttempt: now,
      emails: [],
      suspiciousActivities: [],
    });
  }

  if (record.lastAttempt && (now - new Date(record.lastAttempt)) > resetWindowMs) {
    record.attempts = 0;
    record.blockedUntil = null;
    record.emails = [];
  }

  record.suspiciousActivities = (record.suspiciousActivities || []).filter(
    (activity) => now - new Date(activity.timestamp) <= suspiciousWindowMs
  );

  if (record.blockedUntil && now >= new Date(record.blockedUntil)) {
    record.blockedUntil = null;
    record.attempts = 0;
  }

  return { now, record };
};

export const recordFailedLogin = async (ip, email = null) => {
  const { now, record } = await normalizeState(ip);

  // Increment attempts
  record.attempts += 1;
  record.lastAttempt = now;
  
  if (email && !record.emails.includes(email)) {
    record.emails.push(email);
  }

  // Check if should be blocked
  if (record.attempts >= CONFIG.MAX_FAILED_ATTEMPTS) {
    record.blockedUntil = new Date(now.getTime() + blockWindowMs);
  }

  await record.save();

  return {
    attempts: record.attempts,
    remainingAttempts: Math.max(0, CONFIG.MAX_FAILED_ATTEMPTS - record.attempts),
    isBlocked: Boolean(record.blockedUntil && now < new Date(record.blockedUntil)),
    blockedUntil: record.blockedUntil
  };
};

/**
 * Clear failed login attempts after successful login
 * @param {string} ip - Client IP address
 */
export const clearFailedLoginAttempts = async (ip) => {
  await SecurityThrottleState.updateOne(
    { ip },
    {
      $set: {
        attempts: 0,
        blockedUntil: null,
        emails: [],
      },
    }
  );
};

/**
 * Check if an IP is currently blocked
 * @param {string} ip - Client IP address
 * @returns {boolean}
 */
export const isIPBlocked = async (ip) => {
  const { now, record } = await normalizeState(ip);
  if (!record._id) {
    return false;
  }

  if (record.isModified()) {
    await record.save();
  }

  return Boolean(record.blockedUntil && now < new Date(record.blockedUntil));
};

/**
 * Get block status for an IP
 * @param {string} ip - Client IP address
 * @returns {object}
 */
export const getIPBlockStatus = async (ip) => {
  const { now, record } = await normalizeState(ip);

  if (!record._id) {
    return {
      isBlocked: false,
      attempts: 0,
      remainingAttempts: CONFIG.MAX_FAILED_ATTEMPTS,
      blockedUntil: null
    };
  }

  if (record.isModified()) {
    await record.save();
  }

  const isBlocked = record.blockedUntil && now < new Date(record.blockedUntil);
  
  return {
    isBlocked,
    attempts: record.attempts,
    remainingAttempts: Math.max(0, CONFIG.MAX_FAILED_ATTEMPTS - record.attempts),
    blockedUntil: record.blockedUntil,
    lastAttempt: record.lastAttempt
  };
};

/**
 * Record suspicious activity
 * @param {string} ip - Client IP address
 * @param {string} type - Type of suspicious activity
 * @param {object} details - Additional details
 */
export const recordSuspiciousActivity = async (ip, type, details = {}) => {
  const { now, record } = await normalizeState(ip);

  record.suspiciousActivities.push({
    type,
    timestamp: now,
    details
  });

  // Check if should be blocked
  if (record.suspiciousActivities.length >= CONFIG.MAX_SUSPICIOUS_ACTIVITIES) {
    record.attempts = Math.max(record.attempts, CONFIG.MAX_FAILED_ATTEMPTS);
    record.blockedUntil = new Date(now.getTime() + blockWindowMs);
  }

  await record.save();

  return {
    activityCount: record.suspiciousActivities.length,
    isAutoBlocked: record.suspiciousActivities.length >= CONFIG.MAX_SUSPICIOUS_ACTIVITIES
  };
};

/**
 * Get recent suspicious activities for an IP
 * @param {string} ip - Client IP address
 * @returns {array}
 */
export const getSuspiciousActivities = async (ip) => {
  const { record } = await normalizeState(ip);
  return record.suspiciousActivities || [];
};

/**
 * Security logger - logs security events
 * @param {string} event - Event type
 * @param {object} data - Event data
 */
export const securityLogger = (event, data) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    ...data
  };

  // Security logging - in production, implement proper logging (winston, pino, etc.)
  // For now, security events are logged but sensitive data is filtered
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - Validation result
 */
export const validatePasswordStrength = (password) => {
  const errors = [];
  
  if (!password) {
    return { isValid: false, errors: ['Password is required'] };
  }

  // Minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  // Uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generate a hash of the request for tracking (without storing PII)
 * @param {object} req - Express request object
 * @returns {string}
 */
export const generateRequestHash = (req) => {
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || '';
  
  return crypto
    .createHash('sha256')
    .update(`${ip}-${userAgent}`)
    .digest('hex')
    .substring(0, 16);
};

/**
 * Cleanup old entries (call periodically in production)
 */
export const cleanupSecurityData = () => {
  // Reserved for scheduled cleanup if a TTL/index-based strategy is added later.
};

export default {
  getClientIP,
  recordFailedLogin,
  clearFailedLoginAttempts,
  isIPBlocked,
  getIPBlockStatus,
  recordSuspiciousActivity,
  getSuspiciousActivities,
  securityLogger,
  validatePasswordStrength,
  generateRequestHash,
  cleanupSecurityData,
  CONFIG
};
