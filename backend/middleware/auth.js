import { verifyAccessToken } from '../utils/jwt.js';
import User from '../models/User.js';
import { securityLogger } from '../utils/security.js';
import mongoose from 'mongoose';

// Get client IP from request
const getClientIP = (req) => {
  let ip = null;
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    ip = forwardedFor.split(',')[0].trim();
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
    ip = req.connection?.remoteAddress || req.socket?.remoteAddress;
  }
  if (!ip) return 'Unknown';
  ip = ip.replace(/^::ffff:/, '');
  if (ip === '::1') ip = '127.0.0.1';
  return ip;
};

export const authenticate = async (req, res, next) => {
  try {
    // Get client IP for logging and validation
    const clientIP = getClientIP(req);
    
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Log missing token attempt
      securityLogger('missing_token', {
        ip: clientIP,
        path: req.path,
        method: req.method
      });
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = verifyAccessToken(token);
    
    if (!decoded) {
      // Log invalid token attempt
      securityLogger('invalid_token', {
        ip: clientIP,
        path: req.path,
        method: req.method
      });
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Get user from database with team and workspace populated
    const user = await User.findById(decoded.userId)
      .select('-password_hash')
      .populate('team_id', 'name description')
      .populate('workspaceId', 'name type isActive settings limits usage');
    
    if (!user) {
      // Log user not found
      securityLogger('user_not_found', {
        ip: clientIP,
        userId: decoded.userId,
        path: req.path
      });
      return res.status(401).json({ message: 'User not found' });
    }

    // Check if user's account is still active
    if (user.employmentStatus === 'INACTIVE') {
      securityLogger('inactive_user_access', {
        ip: clientIP,
        userId: user._id,
        email: user.email
      });
      return res.status(403).json({ message: 'Account is inactive' });
    }

    // Attach user and IP to request
    req.user = user;
    req.clientIP = clientIP;
    
    next();
  } catch (error) {
    securityLogger('auth_error', {
      error: error.message,
      path: req.path
    });
    res.status(401).json({ message: 'Authentication failed' });
  }
};
