import mongoose from 'mongoose';

const scheduledEmailCampaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Campaign title is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailTemplate',
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  htmlContent: {
    type: String,
    required: true
  },
  variables: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  recipients: [{
    email: { type: String, required: true },
    name: { type: String, default: '' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    variables: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} }
  }],
  scheduleType: {
    type: String,
    enum: ['once', 'recurring'],
    default: 'once'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  recurrence: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: function() { return this.scheduleType === 'recurring'; }
    },
    interval: {
      type: Number,
      default: 1,
      min: 1
    },
    endDate: Date,
    daysOfWeek: [{ type: Number, min: 0, max: 6 }], // For weekly recurrence
    dayOfMonth: { type: Number, min: 1, max: 31 } // For monthly recurrence
  },
  status: {
    type: String,
    enum: ['scheduled', 'processing', 'sent', 'failed', 'cancelled'],
    default: 'scheduled'
  },
  sentAt: Date,
  sentCount: {
    type: Number,
    default: 0
  },
  failedCount: {
    type: Number,
    default: 0
  },
  totalRecipients: {
    type: Number,
    default: 0
  },
  tags: [String], // For categorization
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
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

// Indexes for efficient queries
scheduledEmailCampaignSchema.index({ workspaceId: 1, status: 1 });
scheduledEmailCampaignSchema.index({ workspaceId: 1, scheduledDate: 1 });
scheduledEmailCampaignSchema.index({ workspaceId: 1, createdBy: 1 });
scheduledEmailCampaignSchema.index({ scheduledDate: 1, status: 1 });

// Update timestamp on save
scheduledEmailCampaignSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  this.totalRecipients = this.recipients?.length || 0;
  next();
});

const ScheduledEmailCampaign = mongoose.model('ScheduledEmailCampaign', scheduledEmailCampaignSchema);

export default ScheduledEmailCampaign;