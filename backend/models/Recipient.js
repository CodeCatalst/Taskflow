import mongoose from 'mongoose';

/**
 * Recipient Model
 * Lightweight abstraction for email recipients
 * Supports both TaskFlow users and external contacts
 */
const recipientSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  source: {
    type: String,
    enum: ['USER', 'EXTERNAL'],
    required: true,
    default: 'EXTERNAL'
  },
  linkedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  // Additional metadata for external recipients
  metadata: {
    phone: String,
    company: String,
    position: String,
    tags: [String]
  },
  // Email preferences
  preferences: {
    unsubscribe: {
      type: Boolean,
      default: false
    },
    categories: [{
      type: String,
      enum: ['hiring', 'interview', 'onboarding', 'engagement', 'exit', 'system']
    }]
  },
  // Tracking
  emailCount: {
    type: Number,
    default: 0
  },
  lastEmailSent: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
recipientSchema.index({ email: 1, workspaceId: 1 }, { unique: true });
recipientSchema.index({ linkedUserId: 1 });
recipientSchema.index({ source: 1, workspaceId: 1 });
recipientSchema.index({ 'preferences.unsubscribe': 1 });

/**
 * Static method to create or update recipient
 * @param {Object} data - Recipient data
 * @returns {Object} Created/updated recipient
 */
recipientSchema.statics.createOrUpdate = async function(data) {
  const { email, workspaceId, ...updateData } = data;

  return await this.findOneAndUpdate(
    { email, workspaceId },
    { ...updateData, email, workspaceId },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );
};

/**
 * Check if recipient can receive emails
 * @returns {boolean}
 */
recipientSchema.methods.canReceiveEmails = function() {
  return !this.preferences.unsubscribe;
};

/**
 * Increment email count and update last sent
 */
recipientSchema.methods.recordEmailSent = function() {
  this.emailCount += 1;
  this.lastEmailSent = new Date();
  return this.save();
};

const Recipient = mongoose.model('Recipient', recipientSchema);

export default Recipient;