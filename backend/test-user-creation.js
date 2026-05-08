import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';
import Workspace from './models/Workspace.js';

dotenv.config();

async function run() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');
    
    // Create admin user
    const admin = new User({
      full_name: 'Test Admin',
      email: 'admin@test.com',
      password_hash: 'AdminPassword123!',
      role: 'admin'
    });
    await admin.save();
    console.log('Admin user created:', admin._id);
    
    // Create a workspace
    const workspace = new Workspace({
      name: 'Test Workspace',
      type: 'CORE',
      isActive: true,
      owner_id: admin._id,
      limits: {
        maxUsers: 10,
        maxTasks: 100,
        maxTeams: 10
      },
      usage: {
        userCount: 0,
        taskCount: 0,
        teamCount: 0
      }
    });
    await workspace.save();
    console.log('Workspace created:', workspace._id);
    
    // Update admin to have the workspace
    admin.workspaceId = workspace._id;
    await admin.save();
    console.log('Admin associated with workspace');
    
    // Try to create a test user
    const newUser = new User({
      full_name: 'Test User',
      email: 'user@test.com',
      password_hash: 'UserPassword123!',
      role: 'member',
      workspaceId: workspace._id
    });
    await newUser.save();
    console.log('Test user created successfully:', newUser._id);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
