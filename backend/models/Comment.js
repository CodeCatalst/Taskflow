import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  task_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: [true, 'Task ID is required']
  },
  author_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author ID is required']
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Comment', commentSchema);