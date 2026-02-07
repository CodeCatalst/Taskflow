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
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: false,  // Not required - admins can exist without workspace
    index: true
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
userSchema.index({ workspaceId: 1, email: 1 }, { unique: true });
userSchema.index({ workspaceId: 1, role: 1 });

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

export default mongoose.model('User', userSchema);