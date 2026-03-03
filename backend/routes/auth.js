import express from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { logChange } from '../utils/changeLogService.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const validateRegistration = [
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const validateLogin = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

// Public registration is disabled
// Users can only be created by Admin or HR through the user management system
router.post('/register', (req, res) => {
  res.status(403).json({ 
    message: 'Public registration is disabled. Please contact your administrator to create an account.' 
  });
});

// Login
router.post('/login', validateLogin, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Service temporarily unavailable' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Prepare login audit payload (non-blocking)
    const user_ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const loginAuditPayload = {
      event_type: 'user_login',
      user: user,
      user_ip,
      action: 'User logged in',
      description: `${user.full_name} (${user.email}) logged in successfully`,
      metadata: {
        role: user.role,
        team_id: user.team_id
      }
    };

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        team_id: user.team_id
      },
      accessToken,
      refreshToken
    });

    // Log login event without blocking response
    logChange(loginAuditPayload).catch((logError) => {
      console.error('Login audit log error:', logError);
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Service temporarily unavailable' });
    }

    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Get user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout
router.post('/logout', authenticate, async (req, res) => {
  // Log logout event
  const user_ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  await logChange({
    event_type: 'user_logout',
    user: req.user,
    user_ip,
    action: 'User logged out',
    description: `${req.user.full_name} (${req.user.email}) logged out`
  });

  // In a production app, you might want to blacklist the token
  res.json({ message: 'Logged out successfully' });
});

export default router;