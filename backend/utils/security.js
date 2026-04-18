/**
 * Security Utilities - IP Blocking and Failed Login Tracking
 * Provides protection against brute force attacks and suspicious activity
 */

import crypto from 'crypto';

// In-memory store for failed login attempts (use Redis for production)
// Structure: { ip: { attempts: number, blockedUntil: Date, lastAttempt: Date } }
const failedLoginAttempts = new Map();

// In-memory store for suspicious activity (use Redis for production)
// Structure: { ip: { activities: [{ type, timestamp, details }] } }
const suspiciousActivity = new Map();

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
  let ip = null;

  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    ip = ips[0];
  }

  if (!ip) {
    const realIP = req.headers['x-real-ip'];
    if (realIP) ip = realIP;
  }

  if (!ip) {
    const cfIP = req.headers['cf-connecting-ip'];
    if (cfIP) ip = cfIP;
  }

  if (!ip && req.ip) ip = req.ip;

  if (!ip) {
    ip = req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
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
export const recordFailedLogin = (ip, email = null) => {
  const now = new Date();
  let record = failedLoginAttempts.get(ip);

  if (!record) {
    record = {
      attempts: 0,
      blockedUntil: null,
      lastAttempt: now,
      emails: new Set()
    };
  }

  // Reset if too much time has passed since last attempt
  const timeSinceLastAttempt = now - new Date(record.lastAttempt);
  const resetThreshold = CONFIG.RESET_ATTEMPTS_MINUTES * 60 * 1000;
  
  if (timeSinceLastAttempt > resetThreshold) {
    record.attempts = 0;
    record.blockedUntil = null;
    record.emails = new Set();
  }

  // Increment attempts
  record.attempts += 1;
  record.lastAttempt = now;
  
  if (email) {
    record.emails.add(email);
  }

  // Check if should be blocked
  if (record.attempts >= CONFIG.MAX_FAILED_ATTEMPTS) {
    record.blockedUntil = new Date(now.getTime() + CONFIG.BLOCK_DURATION_MINUTES * 60 * 1000);
  }

  failedLoginAttempts.set(ip, record);

  return {
    attempts: record.attempts,
    remainingAttempts: Math.max(0, CONFIG.MAX_FAILED_ATTEMPTS - record.attempts),
    isBlocked: isIPBlocked(ip),
    blockedUntil: record.blockedUntil
  };
};

/**
 * Clear failed login attempts after successful login
 * @param {string} ip - Client IP address
 */
export const clearFailedLoginAttempts = (ip) => {
  const record = failedLoginAttempts.get(ip);
  if (record) {
    record.attempts = 0;
    record.blockedUntil = null;
    record.emails = new Set();
    failedLoginAttempts.set(ip, record);
  }
};

/**
 * Check if an IP is currently blocked
 * @param {string} ip - Client IP address
 * @returns {boolean}
 */
export const isIPBlocked = (ip) => {
  const record = failedLoginAttempts.get(ip);
  
  if (!record) return false;
  
  if (record.blockedUntil) {
    const now = new Date();
    if (now < new Date(record.blockedUntil)) {
      return true;
    } else {
      // Block has expired, clear it
      record.blockedUntil = null;
      record.attempts = 0;
      failedLoginAttempts.set(ip, record);
    }
  }
  
  return false;
};

/**
 * Get block status for an IP
 * @param {string} ip - Client IP address
 * @returns {object}
 */
export const getIPBlockStatus = (ip) => {
  const record = failedLoginAttempts.get(ip);
  
  if (!record) {
    return {
      isBlocked: false,
      attempts: 0,
      remainingAttempts: CONFIG.MAX_FAILED_ATTEMPTS,
      blockedUntil: null
    };
  }

  const now = new Date();
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
export const recordSuspiciousActivity = (ip, type, details = {}) => {
  const now = new Date();
  let record = suspiciousActivity.get(ip);

  if (!record) {
    record = {
      activities: []
    };
  }

  // Clean old activities
  const windowStart = new Date(now.getTime() - CONFIG.SUSPICIOUS_WINDOW_MINUTES * 60 * 1000);
  record.activities = record.activities.filter(a => new Date(a.timestamp) > windowStart);

  // Add new activity
  record.activities.push({
    type,
    timestamp: now,
    details
  });

  suspiciousActivity.set(ip, record);

  // Check if should be blocked
  if (record.activities.length >= CONFIG.MAX_SUSPICIOUS_ACTIVITIES) {
    // Auto-block IP for suspicious activity
    const failRecord = failedLoginAttempts.get(ip) || {
      attempts: CONFIG.MAX_FAILED_ATTEMPTS,
      blockedUntil: new Date(now.getTime() + CONFIG.BLOCK_DURATION_MINUTES * 60 * 1000),
      lastAttempt: now,
      emails: new Set()
    };
    failedLoginAttempts.set(ip, failRecord);
  }

  return {
    activityCount: record.activities.length,
    isAutoBlocked: record.activities.length >= CONFIG.MAX_SUSPICIOUS_ACTIVITIES
  };
};

/**
 * Get recent suspicious activities for an IP
 * @param {string} ip - Client IP address
 * @returns {array}
 */
export const getSuspiciousActivities = (ip) => {
  const record = suspiciousActivity.get(ip);
  if (!record) return [];

  const windowStart = new Date(Date.now() - CONFIG.SUSPICIOUS_WINDOW_MINUTES * 60 * 1000);
  return record.activities.filter(a => new Date(a.timestamp) > windowStart);
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

  // In production, use proper logging (winston, pino, etc.)
  if (process.env.NODE_ENV === 'development') {
    console.log('[SECURITY]', JSON.stringify(logEntry));
  } else {
    // Production logging - could send to external service
    console.log('[SECURITY]', JSON.stringify({
      ...logEntry,
      // Don't log sensitive data
      password: undefined,
      token: undefined,
      newPassword: undefined
    }));
  }
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
  const now = new Date();
  
  // Clean failed login attempts
  for (const [ip, record] of failedLoginAttempts.entries()) {
    const lastAttempt = new Date(record.lastAttempt);
    const age = now - lastAttempt;
    const maxAge = CONFIG.RESET_ATTEMPTS_MINUTES * 60 * 1000 * 2; // 2x reset threshold
    
    if (age > maxAge) {
      failedLoginAttempts.delete(ip);
    }
  }

  // Clean suspicious activities
  for (const [ip, record] of suspiciousActivity.entries()) {
    const windowStart = new Date(now.getTime() - CONFIG.SUSPICIOUS_WINDOW_MINUTES * 60 * 1000);
    record.activities = record.activities.filter(a => new Date(a.timestamp) > windowStart);
    
    if (record.activities.length === 0) {
      suspiciousActivity.delete(ip);
    }
  }
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
