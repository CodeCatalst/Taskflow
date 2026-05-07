import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { checkRole } from '../middleware/roleCheck.js';
import User from '../models/User.js';
import { logChange } from '../utils/changeLogService.js';

const router = express.Router();

// Get all users (Admin and HR only)
router.get('/', authenticate, checkRole(['admin', 'hr']), async (req, res) => {
  try {
    const users = await User.find().populate('team_id', 'name').select('-password');
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('team_id', 'name').select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user (Users can update themselves, admins can update anyone)
router.put('/:id', authenticate, async (req, res) => {
  try {
    // Check authorization
    const isOwner = req.user._id.toString() === req.params.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this user' });
    }

    const { full_name, email, avatar_url } = req.body;
    const updateData = {};

    if (full_name) updateData.full_name = full_name;
    if (email) updateData.email = email;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    // Only admin can change role and team
    if (isAdmin) {
      if (req.body.role) updateData.role = req.body.role;
      if (req.body.team_id !== undefined) updateData.team_id = req.body.team_id;
      if (req.body.status) updateData.status = req.body.status;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Log the change
    await logChange({
      event_type: 'user_updated',
      user: req.user,
      action: 'User profile updated',
      description: `User ${user.full_name} (${user.email}) was updated`,
      metadata: { updated_user_id: user._id, changes: updateData }
    });

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticate, checkRole(['admin']), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Log the deletion
    await logChange({
      event_type: 'user_deleted',
      user: req.user,
      action: 'User deleted',
      description: `User ${user.full_name} (${user.email}) was deleted`,
      metadata: { deleted_user_id: user._id }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
