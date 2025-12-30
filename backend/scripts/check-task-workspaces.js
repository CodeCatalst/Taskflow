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

async function checkTaskWorkspaces() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('🔍 Checking task and user workspace assignments...\n');
    
    // Get all workspaces
    const workspaces = await Workspace.find({});
    console.log('📦 WORKSPACES:\n');
    workspaces.forEach(ws => {
      console.log(`   ${ws.name} (${ws.type})`);
      console.log(`   ID: ${ws._id}`);
      console.log(`   Active: ${ws.isActive ? '✅' : '❌'}\n`);
    });
    
    // Get all tasks
    const tasks = await Task.find({})
      .populate('assigned_to', 'full_name email workspaceId')
      .populate('workspaceId', 'name type');
    
    console.log(`📋 TASKS: ${tasks.length} total\n`);
    
    // Group tasks by workspace
    const tasksByWorkspace = {};
    const tasksWithoutWorkspace = [];
    
    for (const task of tasks) {
      if (task.workspaceId) {
        const wsId = task.workspaceId._id.toString();
        if (!tasksByWorkspace[wsId]) {
          tasksByWorkspace[wsId] = {
            workspace: task.workspaceId,
            tasks: []
          };
        }
        tasksByWorkspace[wsId].tasks.push(task);
      } else {
        tasksWithoutWorkspace.push(task);
      }
    }
    
    // Display tasks by workspace
    for (const wsId in tasksByWorkspace) {
      const { workspace, tasks } = tasksByWorkspace[wsId];
      console.log(`\n📦 Workspace: ${workspace.name} (${workspace.type})`);
      console.log(`   ID: ${wsId}`);
      console.log(`   Tasks: ${tasks.length}\n`);
      
      tasks.slice(0, 5).forEach(task => {
        const assignee = task.assigned_to?.full_name || 'Unassigned';
        const assigneeWorkspace = task.assigned_to?.workspaceId?.toString() || 'None';
        const match = assigneeWorkspace === wsId ? '✅' : '❌';
        console.log(`   ${match} ${task.title}`);
        console.log(`      Assignee: ${assignee} (Workspace match: ${match})`);
      });
      
      if (tasks.length > 5) {
        console.log(`   ... and ${tasks.length - 5} more tasks`);
      }
    }
    
    if (tasksWithoutWorkspace.length > 0) {
      console.log(`\n⚠️  Tasks without workspace: ${tasksWithoutWorkspace.length}`);
      tasksWithoutWorkspace.slice(0, 5).forEach(task => {
        console.log(`   - ${task.title}`);
      });
    }
    
    // Check for workspace mismatches
    console.log('\n\n🔍 CHECKING FOR MISMATCHES:\n');
    
    let mismatchCount = 0;
    const oldWorkspaceId = workspaces.find(w => w.type === 'COMMUNITY')?._id?.toString();
    const newWorkspaceId = workspaces.find(w => w.type === 'CORE')?._id?.toString();
    
    for (const task of tasks) {
      if (task.assigned_to && task.workspaceId) {
        const taskWorkspace = task.workspaceId._id.toString();
        const userWorkspace = task.assigned_to.workspaceId?.toString();
        
        if (taskWorkspace !== userWorkspace) {
          if (mismatchCount < 5) {
            console.log(`❌ MISMATCH: "${task.title}"`);
            console.log(`   Task in: ${task.workspaceId.name} (${taskWorkspace})`);
            console.log(`   User in: ${userWorkspace || 'No workspace'}`);
            console.log(`   User: ${task.assigned_to.email}\n`);
          }
          mismatchCount++;
        }
      }
    }
    
    if (mismatchCount > 0) {
      console.log(`\n⚠️  Found ${mismatchCount} task-user workspace mismatches!`);
      
      if (oldWorkspaceId && newWorkspaceId) {
        console.log('\n🔧 PROPOSED FIX:');
        console.log(`   Move all tasks from old workspace to new CORE workspace`);
        console.log(`   Old: ${oldWorkspaceId}`);
        console.log(`   New: ${newWorkspaceId}`);
        console.log('\n   Run with --fix flag to apply this change');
        console.log('   Example: node check-task-workspaces.js --fix\n');
        
        if (process.argv.includes('--fix')) {
          console.log('\n🔧 FIXING WORKSPACE MISMATCHES...\n');
          
          const result = await Task.updateMany(
            { workspaceId: oldWorkspaceId },
            { $set: { workspaceId: newWorkspaceId } }
          );
          
          console.log(`✅ Updated ${result.modifiedCount} tasks to CORE workspace`);
          
          // Update workspace usage
          const taskCount = await Task.countDocuments({ workspaceId: newWorkspaceId });
          await Workspace.updateOne(
            { _id: newWorkspaceId },
            { $set: { 'usage.taskCount': taskCount } }
          );
          
          console.log(`✅ Updated workspace usage count: ${taskCount} tasks\n`);
        }
      }
    } else {
      console.log('✅ No mismatches found! All tasks and users are in matching workspaces.\n');
    }
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkTaskWorkspaces();
