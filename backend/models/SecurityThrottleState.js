import mongoose from 'mongoose';

const suspiciousActivitySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, { _id: false });

const securityThrottleStateSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  blockedUntil: {
    type: Date,
    default: null,
  },
  lastAttempt: {
    type: Date,
    default: null,
  },
  emails: {
    type: [String],
    default: [],
  },
  suspiciousActivities: {
    type: [suspiciousActivitySchema],
    default: [],
  },
}, {
  timestamps: true,
});

export default mongoose.model('SecurityThrottleState', securityThrottleStateSchema);
