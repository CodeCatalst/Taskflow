import mongoose from 'mongoose';

const emailTemplateSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    default: null  // null means global template
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  subject: {
    type: String,
    required: true
  },
  htmlContent: {
    type: String,
    required: true
  },
  variables: [{
    name: String,
    description: String,
    example: String
  }],
  category: {
    type: String,
    enum: ['leave', 'attendance', 'system', 'custom', 'hiring', 'interview', 'onboarding', 'engagement', 'exit'],
    default: 'custom'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPredefined: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

emailTemplateSchema.index({ workspaceId: 1, code: 1 });

const EmailTemplate = mongoose.model('EmailTemplate', emailTemplateSchema);

export default EmailTemplate;
