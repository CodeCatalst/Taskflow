import mongoose from 'mongoose';

const leaveBalanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
    index: true
  },
  leaveTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LeaveType',
    required: true
  },
  year: {
    type: Number,
    required: true,
    index: true
  },
  totalQuota: {
    type: Number,
    required: true
  },
  used: {
    type: Number,
    default: 0
  },
  pending: {
    type: Number,
    default: 0
  },
  available: {
    type: Number,
    default: 0
  },
  carriedForward: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound unique index
leaveBalanceSchema.index({ userId: 1, leaveTypeId: 1, year: 1 }, { unique: true });

// Virtual getter to always calculate available dynamically
leaveBalanceSchema.virtual('calculatedAvailable').get(function() {
  return this.totalQuota - this.used - this.pending;
});

// Calculate totalQuota and available before saving
leaveBalanceSchema.pre('save', function(next) {
  // totalQuota should always reflect: base annual quota + carried forward
  // Note: This assumes totalQuota is set correctly on creation
  // If you need to recalculate from annualQuota, populate leaveTypeId first
  
  this.available = this.totalQuota - this.used - this.pending;
  next();
});

// Ensure virtuals are included in JSON output
leaveBalanceSchema.set('toJSON', { virtuals: true });
leaveBalanceSchema.set('toObject', { virtuals: true });

// Helper method to recalculate total quota from annual quota + carried forward
leaveBalanceSchema.methods.recalculateTotalQuota = async function(annualQuota) {
  if (annualQuota === undefined) {
    // If annualQuota not provided, fetch from leaveType
    const LeaveType = mongoose.model('LeaveType');
    const leaveType = await LeaveType.findById(this.leaveTypeId);
    if (leaveType) {
      this.totalQuota = leaveType.annualQuota + (this.carriedForward || 0);
    }
  } else {
    this.totalQuota = annualQuota + (this.carriedForward || 0);
  }
  return this;
};

// Static method to apply carry forward for year-end
leaveBalanceSchema.statics.applyCarryForward = async function(userId, leaveTypeId, fromYear, toYear, maxCarryForward) {
  const oldBalance = await this.findOne({ userId, leaveTypeId, year: fromYear });
  if (!oldBalance) return null;

  // Calculate how much can be carried forward
  const availableToCarry = oldBalance.available;
  const actualCarryForward = maxCarryForward > 0 
    ? Math.min(availableToCarry, maxCarryForward) 
    : availableToCarry;

  // Find or create balance for new year
  let newBalance = await this.findOne({ userId, leaveTypeId, year: toYear });
  
  if (newBalance) {
    newBalance.carriedForward = actualCarryForward;
    // Recalculate totalQuota with carry forward
    await newBalance.recalculateTotalQuota();
    await newBalance.save();
  }

  return newBalance;
};

const LeaveBalance = mongoose.model('LeaveBalance', leaveBalanceSchema);

export default LeaveBalance;
