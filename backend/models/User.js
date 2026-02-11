import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  full_name: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password_hash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  profile_picture: {
    type: String,
    default: null  // Will store base64 data URL or null
  },
  role: {
    type: String,
    enum: ['admin', 'hr', 'team_lead', 'member', 'community_admin'],
    default: 'member'
  },
  employmentStatus: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'ON_NOTICE', 'EXITED'],
    default: 'ACTIVE'
  },
  team_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  // MULTIPLE TEAMS SUPPORT: Users in Core Workspace can be part of multiple teams
  teams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }],
  // WORKSPACE SUPPORT: All users belong to a workspace (optional for admins)
  // Legacy single workspace field (deprecated, kept for backward compatibility)
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: false,  // Not required - admins can exist without workspace
    index: true
  },
  // NEW: Multiple workspaces support
  workspaces: [{
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'hr', 'team_lead', 'member', 'community_admin'],
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  // Current active workspace for session
  currentWorkspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: false
  },
  // EMAIL VERIFICATION: For community user registration
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    default: null
  },
  verificationTokenExpiry: {
    type: Date,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpiry: {
    type: Date,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// WORKSPACE SUPPORT: Compound index for workspace-scoped queries
userSchema.index({ workspaceId: 1, email: 1 });
userSchema.index({ 'workspaces.workspaceId': 1 });
userSchema.index({ currentWorkspaceId: 1 });
userSchema.index({ email: 1 }, { unique: true });

// Pre-save hook: Sync legacy workspaceId with workspaces array
userSchema.pre('save', function(next) {
  // If this is a new document with workspaceId but no workspaces array
  if (this.isNew && this.workspaceId && (!this.workspaces || this.workspaces.length === 0)) {
    this.workspaces = [{
      workspaceId: this.workspaceId,
      role: this.role,
      joinedAt: new Date(),
      isActive: true
    }];
    this.currentWorkspaceId = this.workspaceId;
  }
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password_hash')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password_hash = await bcrypt.hash(this.password_hash, salt);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password_hash);
};

// Helper method: Get role in specific workspace
userSchema.methods.getRoleInWorkspace = function(workspaceId) {
  const workspace = this.workspaces.find(
    ws => ws.workspaceId.toString() === workspaceId.toString()
  );
  return workspace ? workspace.role : null;
};

// Helper method: Check if user belongs to workspace
userSchema.methods.belongsToWorkspace = function(workspaceId) {
  return this.workspaces.some(
    ws => ws.workspaceId.toString() === workspaceId.toString() && ws.isActive
  );
};

// Helper method: Add user to workspace
userSchema.methods.addToWorkspace = async function(workspaceId, role) {
  // Check if already in workspace
  const existing = this.workspaces.find(
    ws => ws.workspaceId.toString() === workspaceId.toString()
  );
  
  if (existing) {
    existing.role = role;
    existing.isActive = true;
  } else {
    this.workspaces.push({
      workspaceId,
      role,
      joinedAt: new Date(),
      isActive: true
    });
  }
  
  // Set as current workspace if no current workspace set
  if (!this.currentWorkspaceId) {
    this.currentWorkspaceId = workspaceId;
  }
  
  await this.save();
};

// Helper method: Remove user from workspace
userSchema.methods.removeFromWorkspace = async function(workspaceId) {
  const workspace = this.workspaces.find(
    ws => ws.workspaceId.toString() === workspaceId.toString()
  );
  
  if (workspace) {
    workspace.isActive = false;
  }
  
  // If current workspace was removed, switch to another
  if (this.currentWorkspaceId?.toString() === workspaceId.toString()) {
    const activeWorkspace = this.workspaces.find(ws => ws.isActive);
    this.currentWorkspaceId = activeWorkspace ? activeWorkspace.workspaceId : null;
  }
  
  await this.save();
};

// Helper method: Switch workspace
userSchema.methods.switchWorkspace = async function(workspaceId) {
  if (!this.belongsToWorkspace(workspaceId)) {
    throw new Error('User does not belong to this workspace');
  }
  
  this.currentWorkspaceId = workspaceId;
  await this.save();
};

export default mongoose.model('User', userSchema);