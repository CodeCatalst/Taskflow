import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { checkRole } from '../middleware/roleCheck.js';
import User from '../models/User.js';
import { sendCredentialEmail, sendPasswordResetEmail } from '../utils/emailService.js';

const router = express.Router();

// Validation middleware for user creation
const validateUserCreation = [
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'hr', 'team_lead', 'member']).withMessage('Invalid role')
];

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password_hash')
      .populate('team_id');
    
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update current user profile
router.patch('/me', authenticate, async (req, res) => {
  try {
    const { full_name } = req.body;
    const updates = {};

    if (full_name) updates.full_name = full_name;
    updates.updated_at = Date.now();

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true }
    ).select('-password_hash');

    res.json({ message: 'Profile updated', user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Change password (authenticated users only)
router.post('/me/change-password', authenticate, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // Validate input
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Both old and new passwords are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // Get user with password hash
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify old password
    const isPasswordValid = await user.comparePassword(oldPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password_hash = newPassword;
    user.updated_at = Date.now();
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users (Admin & HR only)
router.get('/', authenticate, checkRole(['admin', 'hr']), async (req, res) => {
  try {
    const users = await User.find()
      .select('-password_hash')
      .populate('team_id')
      .sort({ created_at: -1 });

    res.json({ users, count: users.length });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single user by ID (Admin & HR only)
router.get('/:id', authenticate, checkRole(['admin', 'hr']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password_hash')
      .populate('team_id');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new user (Admin & HR only)
router.post('/', authenticate, checkRole(['admin', 'hr']), validateUserCreation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { full_name, email, password, role, team_id } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Admin users should not be assigned to teams
    if (role === 'admin' && team_id) {
      return res.status(400).json({ 
        message: 'Admin users cannot be assigned to teams',
        hint: 'Admin users are super users and work across all teams'
      });
    }

    // Create user
    const user = new User({
      full_name,
      email,
      password_hash: password,
      role: role || 'member',
      team_id: (role === 'admin') ? null : (team_id || null)
    });

    await user.save();

    console.log('📧 Queuing credential email for:', email);

    // Send credential email with timeout (non-blocking)
    // Don't wait more than 10 seconds for email
    const emailPromise = Promise.race([
      sendCredentialEmail(full_name, email, password),
      new Promise((resolve) => 
        setTimeout(() => resolve({ 
          success: false, 
          status: 'timeout', 
          error: 'Email sending timeout - will retry in background' 
        }), 10000)
      )
    ]);

    // Send email in background and respond immediately
    let emailSent = false;
    emailPromise
      .then((emailResult) => {
        if (emailResult.success) {
          console.log('✅ Email sent successfully to:', email);
        } else {
          console.warn('⚠️ Email failed to send:', emailResult.error);
        }
      })
      .catch((error) => {
        console.error('❌ Email error:', error.message);
      });

    // Get user response immediately
    const userResponse = await User.findById(user._id)
      .select('-password_hash')
      .populate('team_id');

    // Respond immediately without waiting for email
    res.status(201).json({
      message: 'User created successfully. Credentials will be sent via email.',
      user: userResponse,
      emailQueued: true
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user (Admin & HR only)
router.put('/:id', authenticate, checkRole(['admin', 'hr']), async (req, res) => {
  try {
    const { full_name, email, role, team_id } = req.body;
    const { id } = req.params;

    // Validate role if provided
    if (role && !['admin', 'hr', 'team_lead', 'member'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if email is being changed and if it's already taken
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Admin users should not be assigned to teams
    if (role === 'admin' && team_id) {
      return res.status(400).json({ 
        message: 'Admin users cannot be assigned to teams',
        hint: 'Admin users are super users and work across all teams'
      });
    }

    // If changing to admin role, remove team assignment
    const currentUser = await User.findById(id);
    if (role === 'admin' && currentUser) {
      team_id = null;
    }

    const updates = {
      updated_at: Date.now()
    };

    if (full_name) updates.full_name = full_name;
    if (email) updates.email = email;
    if (role) {
      updates.role = role;
      // Automatically remove team if upgrading to admin
      if (role === 'admin') {
        updates.team_id = null;
      }
    }
    if (team_id !== undefined && role !== 'admin') updates.team_id = team_id;

    const user = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).select('-password_hash').populate('team_id');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticate, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully', user: { id: user._id, email: user.email } });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reset user password (Admin & HR only)
router.patch('/:id/password', authenticate, checkRole(['admin', 'hr']), async (req, res) => {
  try {
    const { password } = req.body;
    const { id } = req.params;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password_hash = password;
    user.updated_at = Date.now();
    await user.save();

    // Send password reset email (non-blocking, fire and forget)
    sendPasswordResetEmail(user.full_name, user.email, password)
      .then((emailResult) => {
        if (emailResult.success) {
          console.log('✅ Password reset email sent to:', user.email);
        } else {
          console.warn('⚠️ Password reset email failed:', emailResult.error);
        }
      })
      .catch((error) => {
        console.error('❌ Password reset email error:', error.message);
      });

    res.json({ 
      message: 'Password reset successfully. New credentials will be sent via email.',
      emailQueued: true
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user role (Admin & HR only)
router.patch('/:id/role', authenticate, checkRole(['admin', 'hr']), async (req, res) => {
  try {
    const { role } = req.body;
    const { id } = req.params;

    if (!['admin', 'hr', 'team_lead', 'member'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role, updated_at: Date.now() },
      { new: true }
    ).select('-password_hash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User role updated', user });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;