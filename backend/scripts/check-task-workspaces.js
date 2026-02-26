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
    
    // Get all workspaces
    const workspaces = await Workspace.find({});
    workspaces.forEach(ws => {
      `);
      });
    
    // Get all tasks
    const tasks = await Task.find({})
      .populate('assigned_to', 'full_name email workspaceId')
      .populate('workspaceId', 'name type');
    
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
      `);
      tasks.slice(0, 5).forEach(task => {
        const assignee = task.assigned_to?.full_name || 'Unassigned';
        const assigneeWorkspace = task.assigned_to?.workspaceId?.toString() || 'None';
        const match = assigneeWorkspace === wsId ? '✅' : '❌';
        `);
      });
      
      if (tasks.length > 5) {
        }
    }
    
    if (tasksWithoutWorkspace.length > 0) {
      tasksWithoutWorkspace.slice(0, 5).forEach(task => {
        });
    }
    
    // Check for workspace mismatches
    let mismatchCount = 0;
    const oldWorkspaceId = workspaces.find(w => w.type === 'COMMUNITY')?._id?.toString();
    const newWorkspaceId = workspaces.find(w => w.type === 'CORE')?._id?.toString();
    
    for (const task of tasks) {
      if (task.assigned_to && task.workspaceId) {
        const taskWorkspace = task.workspaceId._id.toString();
        const userWorkspace = task.assigned_to.workspaceId?.toString();
        
        if (taskWorkspace !== userWorkspace) {
          if (mismatchCount < 5) {
            `);
            }
          mismatchCount++;
        }
      }
    }
    
    if (mismatchCount > 0) {
      if (oldWorkspaceId && newWorkspaceId) {
        if (process.argv.includes('--fix')) {
          const result = await Task.updateMany(
            { workspaceId: oldWorkspaceId },
            { $set: { workspaceId: newWorkspaceId } }
          );
          
          // Update workspace usage
          const taskCount = await Task.countDocuments({ workspaceId: newWorkspaceId });
          await Workspace.updateOne(
            { _id: newWorkspaceId },
            { $set: { 'usage.taskCount': taskCount } }
          );
          
          }
      }
    } else {
      }
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    process.exit(1);
  }
}

checkTaskWorkspaces();
