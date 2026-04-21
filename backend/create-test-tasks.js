import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Task from './models/Task.js';
import User from './models/User.js';
import Workspace from './models/Workspace.js';

dotenv.config();

const createTestTasks = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get first workspace
    const workspace = await Workspace.findOne();
    if (!workspace) {
      console.log('No workspace found');
      return;
    }

    // Get first user
    const user = await User.findOne();
    if (!user) {
      console.log('No user found');
      return;
    }

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // Create test tasks with various due dates
    const testTasks = [
      {
        title: 'Task due today',
        description: 'This task should trigger today notification',
        due_date: new Date(today.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
        status: 'todo',
        priority: 'high',
        assigned_to: [user._id],
        created_by: user._id,
        workspaceId: workspace._id
      },
      {
        title: 'Task due tomorrow',
        description: 'This task should trigger tomorrow notification',
        due_date: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
        status: 'todo',
        priority: 'medium',
        assigned_to: [user._id],
        created_by: user._id,
        workspaceId: workspace._id
      },
      {
        title: 'Urgent task due today',
        description: 'This is an urgent task due today',
        due_date: new Date(today.getTime() + 4 * 60 * 60 * 1000), // 4 hours from now
        status: 'in_progress',
        priority: 'urgent',
        assigned_to: [user._id],
        created_by: user._id,
        workspaceId: workspace._id
      },
      {
        title: 'Task due in 2 days',
        description: 'This task is due in 2 days',
        due_date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        status: 'todo',
        priority: 'low',
        assigned_to: [user._id],
        created_by: user._id,
        workspaceId: workspace._id
      }
    ];

    console.log('Creating test tasks...');
    for (const taskData of testTasks) {
      const task = new Task({
        ...taskData,
        updated_at: new Date()
      });
      await task.save();
      console.log(`Created task: "${task.title}" - Due: ${task.due_date.toLocaleString()}`);
    }

    console.log('\nTest tasks created successfully!');
    console.log('Now run the email automations to test notifications.');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error creating test tasks:', error);
    process.exit(1);
  }
};

createTestTasks();