import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.js';
import { checkRole } from '../middleware/roleCheck.js';
import User from '../models/User.js';
import Team from '../models/Team.js';
import { sendCredentialEmail, sendPasswordResetEmail } from '../utils/emailService.js';
import { logChange } from '../utils/changeLogService.js';
import multer from 'multer';
import xlsx from 'xlsx';

const router = express.Router();

// Configure multer for file uploads (memory storage)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/json'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel (.xlsx, .xls) and JSON files are allowed.'));
    }
  }
});

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

// Get users for team lead - returns team members + the team lead themselves
router.get('/team-members', authenticate, checkRole(['team_lead']), async (req, res) => {
  try {
    // Find the team where the user is the team lead
    const team = await Team.findOne({ lead_id: req.user._id }).populate('members', '-password_hash');
    
    if (!team) {
      return res.json({ users: [], count: 0 });
    }

    // Get all team members
    let users = team.members || [];
    
    // Add the team lead to the list if not already included
    const teamLeadIncluded = users.some(member => member._id.toString() === req.user._id.toString());
    if (!teamLeadIncluded) {
      const teamLead = await User.findById(req.user._id).select('-password_hash').populate('team_id');
      if (teamLead) {
        users = [teamLead, ...users];
      }
    }

    res.json({ users, count: users.length });
  } catch (error) {
    console.error('Get team members error:', error);
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
        // Email result handled silently
      })
      .catch((error) => {
        console.error('❌ Email error:', error.message);
      });

    // Get user response immediately
    const userResponse = await User.findById(user._id)
      .select('-password_hash')
      .populate('team_id');

    // Log user creation
    const user_ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    await logChange({
      event_type: 'user_created',
      user: req.user,
      user_ip,
      target_type: 'user',
      target_id: user._id.toString(),
      target_name: full_name,
      action: 'Created user',
      description: `${req.user.full_name} created user account for ${full_name} (${email}) with role ${role}`,
      metadata: {
        email,
        role,
        team_id
      }
    });

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

// Bulk delete users (Admin only) - MUST be before /:id routes
router.post('/bulk-delete', authenticate, checkRole(['admin']), async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'User IDs array is required' });
    }

    // Filter out the current user's ID to prevent self-deletion
    const idsToDelete = userIds.filter(id => id !== req.user._id.toString());

    if (idsToDelete.length === 0) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const result = await User.deleteMany({ _id: { $in: idsToDelete } });

    res.json({ 
      message: `Successfully deleted ${result.deletedCount} user(s)`,
      deletedCount: result.deletedCount,
      attempted: idsToDelete.length
    });
  } catch (error) {
    console.error('Bulk delete users error:', error);
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
        // Email result handled silently
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

// ========== BULK IMPORT ENDPOINTS ==========

// Bulk import users from JSON
router.post('/bulk-import/json', authenticate, checkRole(['admin', 'hr']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Parse JSON file
    let usersData;
    try {
      const jsonContent = req.file.buffer.toString('utf-8');
      usersData = JSON.parse(jsonContent);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid JSON file format', error: error.message });
    }

    // Validate that it's an array
    if (!Array.isArray(usersData)) {
      return res.status(400).json({ message: 'JSON file must contain an array of users' });
    }

    const results = await processBulkUsers(usersData, req.user);
    
    res.json({
      message: 'Bulk import completed',
      ...results
    });
  } catch (error) {
    console.error('Bulk import JSON error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Bulk import users from Excel
router.post('/bulk-import/excel', authenticate, checkRole(['admin', 'hr']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Parse Excel file
    let usersData;
    try {
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      usersData = xlsx.utils.sheet_to_json(worksheet);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid Excel file format', error: error.message });
    }

    if (usersData.length === 0) {
      return res.status(400).json({ message: 'Excel file is empty' });
    }

    const results = await processBulkUsers(usersData, req.user);
    
    res.json({
      message: 'Bulk import completed',
      ...results
    });
  } catch (error) {
    console.error('Bulk import Excel error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to process bulk users
async function processBulkUsers(usersData, currentUser) {
  const results = {
    total: usersData.length,
    successful: [],
    failed: [],
    teamsCreated: []
  };

  for (let i = 0; i < usersData.length; i++) {
    const userData = usersData[i];
    const rowNumber = i + 1;

    try {
      // Validate required fields
      if (!userData.full_name || !userData.email || !userData.password) {
        results.failed.push({
          row: rowNumber,
          email: userData.email || 'N/A',
          reason: 'Missing required fields (full_name, email, password)'
        });
        continue;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        results.failed.push({
          row: rowNumber,
          email: userData.email,
          reason: 'Invalid email format'
        });
        continue;
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        results.failed.push({
          row: rowNumber,
          email: userData.email,
          reason: 'User with this email already exists'
        });
        continue;
      }

      // Validate and set role
      const validRoles = ['admin', 'hr', 'team_lead', 'member'];
      const role = userData.role ? userData.role.toLowerCase() : 'member';
      if (!validRoles.includes(role)) {
        results.failed.push({
          row: rowNumber,
          email: userData.email,
          reason: `Invalid role. Must be one of: ${validRoles.join(', ')}`
        });
        continue;
      }

      // Handle team assignment
      let teamId = null;
      if (userData.team || userData.team_name) {
        const teamName = userData.team || userData.team_name;
        
        // Try to find existing team
        let team = await Team.findOne({ name: teamName });
        
        // If team doesn't exist, create it with the importing user as both lead and HR
        if (!team) {
          team = new Team({
            name: teamName,
            description: `Auto-created during bulk user import`,
            hr_id: currentUser._id, // Set importing admin/HR as HR
            lead_id: currentUser._id, // Set importing admin/HR as team lead temporarily
            members: []
          });
          await team.save();
          
          results.teamsCreated.push({
            name: teamName,
            id: team._id
          });
        }
        
        teamId = team._id;
      }

      // Create user
      const newUser = new User({
        full_name: userData.full_name,
        email: userData.email.toLowerCase(),
        password_hash: userData.password,
        role: role,
        team_id: teamId
      });

      await newUser.save();

      // If user was assigned to a team, add them to team's members
      if (teamId) {
        await Team.findByIdAndUpdate(
          teamId,
          { $addToSet: { members: newUser._id } },
          { new: true }
        );
      }

      // Try to send credential email (don't fail import if email fails)
      try {
        await sendCredentialEmail(userData.email, userData.password);
      } catch (emailError) {
        console.error(`Failed to send email to ${userData.email}:`, emailError);
      }

      results.successful.push({
        row: rowNumber,
        email: userData.email,
        full_name: userData.full_name,
        role: role,
        team: userData.team || userData.team_name || 'None'
      });

    } catch (error) {
      results.failed.push({
        row: rowNumber,
        email: userData.email || 'N/A',
        reason: error.message
      });
    }
  }

  return results;
}

// Download sample Excel template
router.get('/bulk-import/template', authenticate, checkRole(['admin', 'hr']), (req, res) => {
  try {
    // Create sample data
    const sampleData = [
      {
        full_name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        role: 'member',
        team: 'Development'
      },
      {
        full_name: 'Jane Smith',
        email: 'jane.smith@example.com',
        password: 'password456',
        role: 'team_lead',
        team: 'Design'
      },
      {
        full_name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        password: 'password789',
        role: 'hr',
        team: 'Human Resources'
      }
    ];

    // Create workbook
    const worksheet = xlsx.utils.json_to_sheet(sampleData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Users');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 20 },  // full_name
      { wch: 30 },  // email
      { wch: 15 },  // password
      { wch: 12 },  // role
      { wch: 20 }   // team
    ];

    // Generate buffer
    const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Send file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=user_import_template.xlsx');
    res.send(excelBuffer);
  } catch (error) {
    console.error('Template download error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Download sample JSON template
router.get('/bulk-import/template-json', authenticate, checkRole(['admin', 'hr']), (req, res) => {
  try {
    const sampleData = [
      {
        full_name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        role: 'member',
        team: 'Development'
      },
      {
        full_name: 'Jane Smith',
        email: 'jane.smith@example.com',
        password: 'password456',
        role: 'team_lead',
        team: 'Design'
      },
      {
        full_name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        password: 'password789',
        role: 'hr',
        team: 'Human Resources'
      }
    ];

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=user_import_template.json');
    res.json(sampleData);
  } catch (error) {
    console.error('JSON template download error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;