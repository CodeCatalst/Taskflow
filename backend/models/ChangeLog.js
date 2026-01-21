import mongoose from 'mongoose';

const changeLogSchema = new mongoose.Schema({
  event_type: {
    type: String,
    required: true,
    enum: [
      'user_login',
      'user_logout',
      'user_created',
      'user_updated',
      'user_deleted',
      'task_created',
      'task_updated',
      'task_deleted',
      'task_status_changed',
      'task_assigned',
      'task_unassigned',
      'team_created',
      'team_updated',
      'team_deleted',
      'team_member_added',
      'team_member_removed',
      'report_generated',
      'automation_triggered',
      'notification_sent',
      'comment_added',
      'comment_updated',
      'comment_deleted',
      'bulk_import',
      'password_reset_request',
      'password_reset',
      'system_event'
    ]
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  user_email: {
    type: String,
    required: false
  },
  user_name: {
    type: String,
    required: false
  },
  user_role: {
    type: String,
    required: false
  },
  user_ip: {
    type: String,
    required: false
  },
  target_type: {
    type: String,
    enum: ['task', 'user', 'team', 'report', 'comment', 'system', 'notification', 'automation', 'email'],
    required: false
  },
  target_id: {
    type: String,
    required: false
  },
  target_name: {
    type: String,
    required: false
  },
  action: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  changes: {
    type: Object,
    default: {}
  },
  // WORKSPACE SUPPORT: All audit logs belong to a workspace (null for system admins)
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: false,
    default: null,
    index: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// Index for faster queries
changeLogSchema.index({ created_at: -1 });
changeLogSchema.index({ event_type: 1 });
changeLogSchema.index({ user_id: 1 });
changeLogSchema.index({ target_type: 1, target_id: 1 });
// WORKSPACE SUPPORT: Workspace-scoped indexes
changeLogSchema.index({ workspaceId: 1, created_at: -1 });
changeLogSchema.index({ workspaceId: 1, event_type: 1 });

export default mongoose.model('ChangeLog', changeLogSchema);
