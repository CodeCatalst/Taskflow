import mongoose from 'mongoose';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import Task from '../models/Task.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function assignTasksToWorkspace() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    
    
    // Get CORE workspace
    const coreWorkspace = await Workspace.findOne({ type: 'CORE' });
    if (!coreWorkspace) {
      
      process.exit(1);
    }
    
    
    
    
    // Find tasks without workspace
    const orphanedTasks = await Task.find({
      $or: [
        { workspaceId: { $exists: false } },
        { workspaceId: null }
      ]
    }).populate('assigned_to', 'full_name email');
    
    
    
    if (orphanedTasks.length === 0) {
      
      process.exit(0);
    }
    
    // Show first 10 tasks
    orphanedTasks.slice(0, 10).forEach((task, i) => {
      const assignee = task.assigned_to?.full_name || 'Unassigned';
      
      
      
    });
    
    if (orphanedTasks.length > 10) {
      
    }
    
    
    
    // Update all orphaned tasks
    const result = await Task.updateMany(
      {
        $or: [
          { workspaceId: { $exists: false } },
          { workspaceId: null }
        ]
      },
      { $set: { workspaceId: coreWorkspace._id } }
    );
    
    
    
    // Update workspace usage count
    const totalTasks = await Task.countDocuments({ workspaceId: coreWorkspace._id });
    await Workspace.updateOne(
      { _id: coreWorkspace._id },
      { $set: { 'usage.taskCount': totalTasks } }
    );
    
    
    
    
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    
    process.exit(1);
  }
}

assignTasksToWorkspace();
