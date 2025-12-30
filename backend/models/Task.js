import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'review', 'done', 'archived'],
    default: 'todo'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assigned_to: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  team_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  // WORKSPACE SUPPORT: All tasks belong to a workspace (null for system admins)
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: false,
    default: null,
    index: true
  },
  due_date: {
    type: Date,
    required: [true, 'Due date is required']
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
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

// WORKSPACE SUPPORT: Indexes for workspace-scoped queries
taskSchema.index({ workspaceId: 1, status: 1 });
taskSchema.index({ workspaceId: 1, assigned_to: 1 });
taskSchema.index({ workspaceId: 1, team_id: 1 });
taskSchema.index({ workspaceId: 1, due_date: 1 });

taskSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

export default mongoose.model('Task', taskSchema);