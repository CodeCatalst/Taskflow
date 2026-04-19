import { verifyAccessToken, isTokenBlacklisted } from '../utils/jwt.js';
import User from '../models/User.js';
import { getClientIP, securityLogger } from '../utils/security.js';
import mongoose from 'mongoose';

export const authenticate = async (req, res, next) => {
  try {
    // Get client IP for logging and validation
    const clientIP = getClientIP(req);
    
    // Get token from cookie or header (support both)
    let token = req.cookies?.accessToken;
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }
    
    if (!token) {
      securityLogger('missing_token', {
        ip: clientIP,
        path: req.path,
        method: req.method
      });
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify token with IP binding in production
    const decoded = verifyAccessToken(token, clientIP);

    if (!decoded) {
      securityLogger('invalid_token', {
        ip: clientIP,
        path: req.path,
        method: req.method
      });
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Check token blacklist
    if (decoded.jti && await isTokenBlacklisted(decoded.jti)) {
      securityLogger('blacklisted_token', {
        ip: clientIP,
        jti: decoded.jti,
        path: req.path
      });
      return res.status(401).json({ message: 'Token has been revoked' });
    }

    // Get user from database with team and workspace populated
    const user = await User.findById(decoded.userId)
      .select('-password_hash')
      .populate('team_id', 'name description')
      .populate('workspaceId', 'name type isActive settings limits usage');
    
    if (!user) {
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
    req.tokenJti = decoded.jti;
    req.tokenExp = decoded.exp ? new Date(decoded.exp * 1000) : null;
    
    next();
  } catch (error) {
    securityLogger('auth_error', {
      error: error.message,
      path: req.path
    });
    res.status(401).json({ message: 'Authentication failed' });
  }
};
