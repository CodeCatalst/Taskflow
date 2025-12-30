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
    
    console.log('🔍 Finding tasks without workspace...\n');
    
    // Get CORE workspace
    const coreWorkspace = await Workspace.findOne({ type: 'CORE' });
    if (!coreWorkspace) {
      console.log('❌ No CORE workspace found!');
      process.exit(1);
    }
    
    console.log(`📦 CORE Workspace: ${coreWorkspace.name}`);
    console.log(`   ID: ${coreWorkspace._id}\n`);
    
    // Find tasks without workspace
    const orphanedTasks = await Task.find({
      $or: [
        { workspaceId: { $exists: false } },
        { workspaceId: null }
      ]
    }).populate('assigned_to', 'full_name email');
    
    console.log(`📋 Found ${orphanedTasks.length} tasks without workspace:\n`);
    
    if (orphanedTasks.length === 0) {
      console.log('✅ All tasks already have workspace assignments!\n');
      process.exit(0);
    }
    
    // Show first 10 tasks
    orphanedTasks.slice(0, 10).forEach((task, i) => {
      const assignee = task.assigned_to?.full_name || 'Unassigned';
      console.log(`   ${i + 1}. ${task.title}`);
      console.log(`      Assignee: ${assignee}`);
      console.log(`      Status: ${task.status}`);
    });
    
    if (orphanedTasks.length > 10) {
      console.log(`   ... and ${orphanedTasks.length - 10} more tasks`);
    }
    
    console.log(`\n🔧 Assigning all ${orphanedTasks.length} tasks to CORE workspace...\n`);
    
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
    
    console.log(`✅ Updated ${result.modifiedCount} tasks`);
    
    // Update workspace usage count
    const totalTasks = await Task.countDocuments({ workspaceId: coreWorkspace._id });
    await Workspace.updateOne(
      { _id: coreWorkspace._id },
      { $set: { 'usage.taskCount': totalTasks } }
    );
    
    console.log(`✅ CORE workspace now has ${totalTasks} total tasks\n`);
    
    console.log('✅ All tasks assigned to CORE workspace!\n');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

assignTasksToWorkspace();
