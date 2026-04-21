import mongoose from 'mongoose';

const emailNotificationPreferencesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  dueDateReminders: {
    enabled: { type: Boolean, default: true },
    tomorrowReminders: { type: Boolean, default: true },
    todayReminders: { type: Boolean, default: true },
    overdueEscalation: { type: Boolean, default: true }
  },
  taskNotifications: {
    enabled: { type: Boolean, default: true },
    assignmentNotifications: { type: Boolean, default: true },
    statusUpdateNotifications: { type: Boolean, default: true },
    commentNotifications: { type: Boolean, default: true }
  },
  adminReports: {
    enabled: { type: Boolean, default: false }, // Only for admins
    dailyReports: { type: Boolean, default: true },
    weeklyReports: { type: Boolean, default: true }
  },
  emailFrequency: {
    type: String,
    enum: ['immediate', 'daily', 'weekly'],
    default: 'immediate'
  },
  quietHours: {
    enabled: { type: Boolean, default: false },
    startTime: { type: String, default: '22:00' }, // 24-hour format
    endTime: { type: String, default: '08:00' }
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

// Index for efficient queries
emailNotificationPreferencesSchema.index({ userId: 1, workspaceId: 1 });
emailNotificationPreferencesSchema.index({ workspaceId: 1 });

// Update timestamp on save
emailNotificationPreferencesSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

const EmailNotificationPreferences = mongoose.model('EmailNotificationPreferences', emailNotificationPreferencesSchema);

export default EmailNotificationPreferences;