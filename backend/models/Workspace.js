import mongoose from 'mongoose';

/**
 * Workspace Model
 * 
 * Represents a workspace that can be either CORE (enterprise) or COMMUNITY (free tier)
 * Each workspace has isolated data and specific feature limitations
 */
const workspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  type: {
    type: String,
    enum: ['CORE', 'COMMUNITY'],
    required: true,
    default: 'COMMUNITY',
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null,
  },
  settings: {
    // General workspace settings
    allowPublicRegistration: {
      type: Boolean,
      default: false,
    },
    sessionTimeout: {
      type: Number,
      default: 30, // minutes
    },
    // Email settings
    enableEmailNotifications: {
      type: Boolean,
      default: true,
    },
    // Feature flags
    features: {
      bulkUserImport: {
        type: Boolean,
        default: false, // Only CORE workspaces get this
      },
      auditLogs: {
        type: Boolean,
        default: false, // Only CORE workspaces get this
      },
      advancedAutomation: {
        type: Boolean,
        default: false, // Only CORE workspaces get this
      },
      customBranding: {
        type: Boolean,
        default: false,
      },
    },
  },
  limits: {
    // Usage limits for COMMUNITY workspaces
    maxUsers: {
      type: Number,
      default: null, // null = unlimited (for CORE)
    },
    maxTasks: {
      type: Number,
      default: null, // null = unlimited (for CORE)
    },
    maxTeams: {
      type: Number,
      default: null, // null = unlimited (for CORE)
    },
    maxStorageGB: {
      type: Number,
      default: null, // null = unlimited (for CORE)
    },
  },
  // Current usage stats (for limit enforcement)
  usage: {
    userCount: {
      type: Number,
      default: 0,
    },
    taskCount: {
      type: Number,
      default: 0,
    },
    teamCount: {
      type: Number,
      default: 0,
    },
  },
  // Status
  isActive: {
    type: Boolean,
    default: true,
  },
  // Trial/subscription info (for future use)
  subscription: {
    planType: {
      type: String,
      enum: ['TRIAL', 'FREE', 'PRO', 'ENTERPRISE'],
      default: 'FREE',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null, // null = no expiry
    },
  },
}, {
  timestamps: true,
});

// Index for efficient queries
workspaceSchema.index({ type: 1, isActive: 1 });
workspaceSchema.index({ owner: 1 });

// Pre-save hook to set default features based on workspace type
workspaceSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('type')) {
    if (this.type === 'CORE') {
      // CORE workspaces get all features
      this.settings.features.bulkUserImport = true;
      this.settings.features.auditLogs = true;
      this.settings.features.advancedAutomation = true;
      this.settings.features.customBranding = true;
      
      // No limits for CORE workspaces
      this.limits.maxUsers = null;
      this.limits.maxTasks = null;
      this.limits.maxTeams = null;
      this.limits.maxStorageGB = null;
      
      this.subscription.planType = 'ENTERPRISE';
    } else if (this.type === 'COMMUNITY') {
      // COMMUNITY workspaces have limited features
      this.settings.features.bulkUserImport = false;
      this.settings.features.auditLogs = false;
      this.settings.features.advancedAutomation = false;
      this.settings.features.customBranding = false;
      
      // Set limits for COMMUNITY workspaces
      this.limits.maxUsers = 10;
      this.limits.maxTasks = 100;
      this.limits.maxTeams = 3;
      this.limits.maxStorageGB = 1;
      
      this.subscription.planType = 'FREE';
    }
  }
  next();
});

// Instance methods
workspaceSchema.methods.canAddUser = function() {
  if (this.type === 'CORE' || this.limits.maxUsers === null) {
    return true;
  }
  return this.usage.userCount < this.limits.maxUsers;
};

workspaceSchema.methods.canAddTask = function() {
  if (this.type === 'CORE' || this.limits.maxTasks === null) {
    return true;
  }
  return this.usage.taskCount < this.limits.maxTasks;
};

workspaceSchema.methods.canAddTeam = function() {
  if (this.type === 'CORE' || this.limits.maxTeams === null) {
    return true;
  }
  return this.usage.teamCount < this.limits.maxTeams;
};

workspaceSchema.methods.hasFeature = function(featureName) {
  return this.settings.features[featureName] === true;
};

workspaceSchema.methods.isCoreWorkspace = function() {
  return this.type === 'CORE';
};

workspaceSchema.methods.isCommunityWorkspace = function() {
  return this.type === 'COMMUNITY';
};

// Static methods
workspaceSchema.statics.getCoreWorkspace = async function() {
  return this.findOne({ type: 'CORE', isActive: true });
};

export default mongoose.model('Workspace', workspaceSchema);
