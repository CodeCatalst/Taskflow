import express from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { logChange } from '../utils/changeLogService.js';
import { authenticate } from '../middleware/auth.js';
import getClientIP from '../utils/getClientIP.js';
import { sendVerificationEmail, sendPasswordResetLink } from '../utils/emailService.js';

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

// WORKSPACE SUPPORT: Community workspace registration
// Creates a new COMMUNITY workspace with an admin user
router.post('/register-community', [
  body('workspace_name').trim().notEmpty().withMessage('Workspace name is required'),
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { workspace_name, full_name, email, password } = req.body;

    // Check if user with this email already exists (across all workspaces)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'A user with this email already exists' 
      });
    }

    // Create temporary user ID for workspace creation
    const tempUserId = new mongoose.Types.ObjectId();

    // Create COMMUNITY workspace
    const workspace = new Workspace({
      name: workspace_name,
      type: 'COMMUNITY',
      owner: tempUserId,
      isActive: true,
      // Default COMMUNITY settings and limits are set by pre-save hook
    });

    await workspace.save();

    // Generate 6-digit verification code
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create community admin user for this workspace (NOT VERIFIED YET)
    const user = new User({
      _id: tempUserId,
      full_name,
      email,
      password_hash: password, // Will be hashed by pre-save hook
      role: 'community_admin',
      workspaceId: workspace._id,
      team_id: null,
      isEmailVerified: false,
      verificationToken: verificationCode,
      verificationTokenExpiry: verificationExpiry,
    });

    await user.save();

    // Update workspace usage
    workspace.usage.userCount = 1;
    await workspace.save();

    // Send verification email (async, doesn't block response)
    await sendVerificationEmail(full_name, email, verificationCode, password, workspace_name);

    // Log workspace creation
    await logChange({
      event_type: 'system_event',
      user: user,
      user_ip: getClientIP(req),
      action: 'Community workspace created',
      description: `New COMMUNITY workspace "${workspace_name}" created by ${full_name} - awaiting email verification`,
      metadata: {
        workspaceId: workspace._id,
        workspaceType: 'COMMUNITY',
        workspaceName: workspace_name,
        emailVerificationRequired: true,
      },
      workspaceId: workspace._id,
    });

    res.status(201).json({
      message: 'Community workspace created! Please check your email to verify your account.',
      requiresVerification: true,
      email: email,
      workspace: {
        id: workspace._id,
        name: workspace.name,
        type: workspace.type,
      },
    });
  } catch (error) {
    console.error('Community registration error:', error);
    res.status(500).json({ 
      message: 'Failed to create community workspace', 
      error: error.message 
    });
  }
});

// Login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user with team and workspace populated
    const user = await User.findOne({ email })
      .populate('team_id', 'name description')
      .populate('teams', 'name')
      .populate('workspaceId', 'name type settings');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is deactivated
    if (user.employmentStatus === 'INACTIVE') {
      return res.status(403).json({
        message: 'Your account has been deactivated. Please contact your administrator for assistance.',
        accountDeactivated: true
      });
    }

    // Check if email is verified (only for community admins)
    if (user.role === 'community_admin' && !user.isEmailVerified) {
      return res.status(403).json({
        message: 'Please verify your email address before logging in. Check your inbox for the verification code.',
        requiresVerification: true,
        email: user.email
      });
    }

    // SYSTEM ADMIN: Admins and community_admins can have special handling
    // Regular users must have workspace
    let activeWorkspaceId = user.currentWorkspaceId || user.workspaceId;
    let activeWorkspace = null;
    
    // Multi-workspace support: Check user's workspaces array
    if (!activeWorkspaceId && user.workspaces && user.workspaces.length > 0) {
      const firstActive = user.workspaces.find(ws => ws.isActive);
      if (firstActive) {
        activeWorkspaceId = firstActive.workspaceId;
        user.currentWorkspaceId = activeWorkspaceId;
        await user.save();
      }
    }
    
    if (!activeWorkspaceId) {
      if (user.role !== 'admin' && user.role !== 'community_admin') {
        return res.status(403).json({ 
          message: 'Your account is not associated with any workspace. Please contact support.' 
        });
      }
      // Admin without workspace = system admin, continue login
      // Community admin without workspace = edge case, allow login
    } else {
      // Populate workspace if it's an ObjectId
      if (!user.workspaceId || typeof user.workspaceId === 'string') {
        activeWorkspace = await Workspace.findById(activeWorkspaceId);
      } else {
        activeWorkspace = user.workspaceId;
      }
      
      // Check if workspace is active (default to true if not set)
      if (activeWorkspace && activeWorkspace.isActive === false) {
        return res.status(403).json({ 
          message: 'Your workspace has been deactivated. Please contact support.',
          workspaceId: activeWorkspace._id,
          workspaceName: activeWorkspace.name
        });
      }
    }
    
    // Get all user workspaces for multi-workspace support
    const allWorkspaces = [];
    
    // ADMIN/SUPER ADMIN: Get all workspaces
    if (user.role === 'admin') {
      const allAvailableWorkspaces = await Workspace.find({ isActive: true })
        .select('name type settings.features')
        .lean();
      
      for (const wsData of allAvailableWorkspaces) {
        allWorkspaces.push({
          id: wsData._id,
          name: wsData.name,
          type: wsData.type,
          role: 'admin', // Admin role in all workspaces
          features: wsData.settings?.features || {}
        });
      }
    } else if (user.workspaces && user.workspaces.length > 0) {
      // Regular users: Get their assigned workspaces
      for (const ws of user.workspaces) {
        if (ws.isActive) {
          const wsData = await Workspace.findById(ws.workspaceId).select('name type settings.features').lean();
          if (wsData) {
            allWorkspaces.push({
              id: wsData._id,
              name: wsData.name,
              type: wsData.type,
              role: ws.role,
              features: wsData.settings?.features || {}
            });
          }
        }
      }
    } else if (activeWorkspace) {
      // Legacy single workspace support
      allWorkspaces.push({
        id: activeWorkspace._id,
        name: activeWorkspace.name,
        type: activeWorkspace.type,
        role: user.role,
        features: activeWorkspace.settings?.features || {}
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Log login event
    const user_ip = getClientIP(req);
    await logChange({
      event_type: 'user_login',
      user: user,
      user_ip,
      action: 'User logged in',
      description: `${user.full_name} (${user.email}) logged in successfully`,
      metadata: {
        role: user.role,
        team_id: user.team_id,
        currentWorkspaceId: activeWorkspaceId || null,
        workspaceType: activeWorkspace?.type || 'SYSTEM',
        isSystemAdmin: !activeWorkspaceId && user.role === 'admin',
        totalWorkspaces: allWorkspaces.length
      },
      workspaceId: activeWorkspaceId || null,
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        profile_picture: user.profile_picture || null,
        team_id: user.team_id,
        workspaceId: activeWorkspaceId || null,
        currentWorkspaceId: activeWorkspaceId || null,
        isSystemAdmin: !activeWorkspaceId && user.role === 'admin'
      },
      workspace: activeWorkspace ? {
        id: activeWorkspace._id,
        name: activeWorkspace.name,
        type: activeWorkspace.type,
        features: activeWorkspace.settings?.features || {},
      } : null,  // null for system admins
      workspaces: allWorkspaces, // All workspaces user has access to
      isSystemAdmin: !activeWorkspaceId && user.role === 'admin',
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Get user with team and workspace populated
    const user = await User.findById(decoded.userId)
      .populate('team_id', 'name description')
      .populate('teams', 'name')
      .populate('workspaceId', 'name type settings');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // SYSTEM ADMIN: Check workspace status only for non-admin users
    if (user.workspaceId) {
      if (!user.workspaceId.isActive) {
        return res.status(403).json({ 
          message: 'Workspace is not available' 
        });
      }
    } else if (user.role !== 'admin') {
      // Non-admin without workspace should not be allowed
      return res.status(403).json({ 
        message: 'Workspace is not available' 
      });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    res.json({
      user: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        team_id: user.team_id,
        workspaceId: user.workspaceId?._id || null
      },
      workspace: user.workspaceId ? {
        id: user.workspaceId._id,
        name: user.workspaceId.name,
        type: user.workspaceId.type,
        features: user.workspaceId.settings?.features || {},
      } : null,
      isSystemAdmin: !user.workspaceId && user.role === 'admin',
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify email with code
router.post('/verify-email', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('code').trim().notEmpty().withMessage('Verification code is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, code } = req.body;

    // Find user
    const user = await User.findOne({ email })
      .populate('workspaceId', 'name type');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified. You can now login.' });
    }

    // Check if verification code matches
    if (user.verificationToken !== code) {
      return res.status(400).json({ message: 'Invalid verification code. Please check your email and try again.' });
    }

    // Check if code has expired
    if (!user.verificationTokenExpiry || user.verificationTokenExpiry < new Date()) {
      return res.status(400).json({ 
        message: 'Verification code has expired. Please request a new one.',
        codeExpired: true 
      });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    // Log verification event
    await logChange({
      event_type: 'system_event',
      user: user,
      user_ip: getClientIP(req),
      action: 'Email verified',
      description: `${user.full_name} (${user.email}) verified their email address`,
      metadata: {
        role: user.role,
        workspaceId: user.workspaceId?._id || null,
        workspaceName: user.workspaceId?.name || null,
      },
      workspaceId: user.workspaceId?._id || null,
    });

    res.status(200).json({
      message: 'Email verified successfully! You can now login.',
      verified: true,
      user: {
        email: user.email,
        full_name: user.full_name,
      },
      workspace: user.workspaceId ? {
        name: user.workspaceId.name,
        type: user.workspaceId.type,
      } : null
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ 
      message: 'Failed to verify email', 
      error: error.message 
    });
  }
});

// Resend verification email
router.post('/resend-verification', [
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email })
      .populate('workspaceId', 'name');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified. You can now login.' });
    }

    // Generate new verification code
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.verificationToken = verificationCode;
    user.verificationTokenExpiry = verificationExpiry;
    await user.save();

    // Get temporary password from request or use placeholder
    const tempPassword = req.body.password || '******';

    // Send new verification email
    await sendVerificationEmail(
      user.full_name, 
      user.email, 
      verificationCode, 
      tempPassword, 
      user.workspaceId?.name || 'TaskFlow'
    );

    res.status(200).json({
      message: 'Verification email resent successfully. Please check your inbox.',
      email: user.email
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ 
      message: 'Failed to resend verification email', 
      error: error.message 
    });
  }
});

// Logout
router.post('/logout', authenticate, async (req, res) => {
  // Log logout event
  const user_ip = getClientIP(req);
  await logChange({
    event_type: 'user_logout',
    user: req.user,
    user_ip,
    action: 'User logged out',
    description: `${req.user.full_name} (${req.user.email}) logged out`,
    workspaceId: req.user.workspaceId?._id || null
  });

  // In a production app, you might want to blacklist the token
  res.json({ message: 'Logged out successfully' });
});

// Forgot Password - Send reset link
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ 
        message: 'If an account exists with that email, a password reset code has been sent.' 
      });
    }

    // Generate 6-digit reset token
    const resetToken = crypto.randomInt(100000, 999999).toString();
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    console.log('🔐 Password reset requested for:', user.email);
    console.log('   Generated token:', resetToken);
    console.log('   Token expires:', resetExpiry);

    // Save token to user (updates existing token if any)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetExpiry;
    await user.save();

    console.log('✅ Token saved to database');

    // Send reset email
    await sendPasswordResetLink(user.full_name, user.email, resetToken);

    console.log('📧 Reset email sent to:', user.email);

    // Log password reset request
    const user_ip = getClientIP(req);
    await logChange({
      event_type: 'password_reset_request',
      user: user,
      user_ip,
      action: 'Password reset requested',
      description: `Password reset requested for ${user.email}`,
      workspaceId: user.workspaceId
    });

    res.json({ 
      message: 'If an account exists with that email, a password reset code has been sent.' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// Reset Password - Verify token and set new password
router.post('/reset-password', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, token, newPassword } = req.body;

    console.log('🔐 Password reset attempt');
    console.log('   Email:', email);
    console.log('   Token received:', token);

    // Find user with valid token and email
    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() }
    });

    console.log('   User found:', user ? `${user.email} (${user._id})` : 'NO USER FOUND');
    if (user) {
      console.log('   Stored token:', user.resetPasswordToken);
      console.log('   Token expires:', user.resetPasswordExpiry);
      console.log('   Current time:', new Date());
    }

    if (!user) {
      console.log('❌ Invalid or expired token');
      return res.status(400).json({ 
        message: 'Invalid or expired reset code. Please request a new password reset.' 
      });
    }

    // Update password
    user.password_hash = newPassword; // Will be hashed by pre-save hook
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;
    await user.save();

    console.log('✅ Password reset successful for:', user.email);

    // Log password reset
    const user_ip = getClientIP(req);
    await logChange({
      event_type: 'password_reset',
      user: user,
      user_ip,
      action: 'Password reset completed',
      description: `Password successfully reset for ${user.email}`,
      workspaceId: user.workspaceId
    });

    res.json({ message: 'Password reset successfully. You can now login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// Switch Workspace - Change user's current active workspace
router.post('/switch-workspace', authenticate, async (req, res) => {
  try {
    const { workspaceId } = req.body;
    
    console.log('Switch workspace request:', {
      userId: req.user._id,
      userRole: req.user.role,
      requestedWorkspace: workspaceId
    });
    
    if (!workspaceId) {
      return res.status(400).json({ message: 'Workspace ID is required' });
    }
    
    // Verify workspace exists
    const workspace = await Workspace.findById(workspaceId)
      .select('name type settings.features limits usage')
      .lean();
    
    if (!workspace) {
      console.log('Workspace not found:', workspaceId);
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    console.log('Workspace found:', workspace.name);
    
    // Admins can access any workspace, regular users need to belong to it
    if (req.user.role !== 'admin' && !req.user.belongsToWorkspace(workspaceId)) {
      console.log('Access denied: User does not belong to workspace');
      return res.status(403).json({ 
        message: 'You do not have access to this workspace' 
      });
    }
    
    // Get current workspace before switching (for logging)
    const fromWorkspaceId = req.user.currentWorkspaceId;
    
    // Switch workspace (update currentWorkspaceId)
    if (req.user.role === 'admin' || req.user.belongsToWorkspace(workspaceId)) {
      req.user.currentWorkspaceId = workspaceId;
      await req.user.save();
      console.log('Workspace switched successfully from', fromWorkspaceId, 'to', workspaceId);
    }
    
    // Get role in new workspace (admin always has admin role)
    const roleInWorkspace = req.user.role === 'admin' ? 'admin' : req.user.getRoleInWorkspace(workspaceId);
    
    // Log workspace switch
    await logChange({
      userId: req.user._id,
      workspaceId,
      action: 'switch_workspace',
      entity: 'workspace',
      entityId: workspaceId,
      details: { 
        fromWorkspace: fromWorkspaceId,
        toWorkspace: workspaceId,
        workspaceName: workspace.name
      },
      ipAddress: getClientIP(req)
    });
    
    res.json({
      message: 'Workspace switched successfully',
      workspace: {
        id: workspace._id,
        name: workspace.name,
        type: workspace.type,
        features: workspace.settings?.features || {},
        role: roleInWorkspace
      }
    });
  } catch (error) {
    console.error('Switch workspace error:', error);
    res.status(500).json({ message: 'Failed to switch workspace' });
  }
});

// Get all user workspaces
router.get('/my-workspaces', authenticate, async (req, res) => {
  try {
    const workspaces = [];
    
    // ADMIN/SUPER ADMIN: Get all workspaces
    if (req.user.role === 'admin') {
      const allAvailableWorkspaces = await Workspace.find({ isActive: true })
        .select('name type settings.features limits usage')
        .lean();
      
      for (const wsData of allAvailableWorkspaces) {
        workspaces.push({
          id: wsData._id,
          name: wsData.name,
          type: wsData.type,
          role: 'admin',
          joinedAt: wsData.createdAt,
          isCurrent: wsData._id.toString() === req.user.currentWorkspaceId?.toString(),
          features: wsData.settings?.features || {},
          usage: wsData.usage
        });
      }
    } else if (req.user.workspaces && req.user.workspaces.length > 0) {
      // Regular users: Get their assigned workspaces
      for (const ws of req.user.workspaces) {
        if (ws.isActive) {
          const wsData = await Workspace.findById(ws.workspaceId)
            .select('name type settings.features limits usage')
            .lean();
          
          if (wsData) {
            workspaces.push({
              id: wsData._id,
              name: wsData.name,
              type: wsData.type,
              role: ws.role,
              joinedAt: ws.joinedAt,
              isCurrent: wsData._id.toString() === req.user.currentWorkspaceId?.toString(),
              features: wsData.settings?.features || {},
              usage: wsData.usage
            });
          }
        }
      }
    }
    
    res.json({ 
      success: true, 
      workspaces,
      currentWorkspaceId: req.user.currentWorkspaceId
    });
  } catch (error) {
    console.error('Get workspaces error:', error);
    res.status(500).json({ message: 'Failed to fetch workspaces' });
  }
});

export default router;