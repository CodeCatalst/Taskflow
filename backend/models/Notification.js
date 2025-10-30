import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  type: {
    type: String,
    enum: ['task_assigned', 'comment_added', 'status_changed', 'task_due'],
    required: true
  },
  payload: {
    type: Object,
    default: {}
  },
  read_at: {
    type: Date,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Notification', notificationSchema);