import mongoose from 'mongoose';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import Task from '../models/Task.js';
import Team from '../models/Team.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function createCoreWorkspace() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    
    
    // Check for existing workspaces
    const existingWorkspaces = await Workspace.find({});
    
    existingWorkspaces.forEach(ws => {
      
    });
    
    // Check for existing CORE workspace
    const existingCore = await Workspace.findOne({ type: 'CORE' });
    if (existingCore) {
      
      
      process.exit(0);
    }
    
    // Get all users (excluding system admins)
    const usersToAssign = await User.find({ 
      role: { $ne: 'admin' } 
    }).populate('workspaceId', 'name type');
    
    
    
    // Find first admin as owner
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      
      process.exit(1);
    }
    
    
    
    
    // Create CORE workspace with enterprise features
    const coreWorkspace = await Workspace.create({
      name: 'Core Team Workspace',
      type: 'CORE',
      owner: adminUser._id,
      isActive: true,
      settings: {
        features: {
          auditLogs: true,
          advancedAnalytics: true,
          bulkImport: true,
          customFields: true,
          apiAccess: true
        }
      },
      limits: {
        maxUsers: 1000,
        maxTeams: 100,
        maxTasks: 100000,
        maxStorage: 107374182400 // 100GB
      },
      usage: {
        userCount: 0,
        teamCount: 0,
        taskCount: 0,
        storageUsed: 0
      }
    });
    
    
    
    
    
    // Assign all users to new CORE workspace
    
    
    let assignedCount = 0;
    for (const user of usersToAssign) {
      const oldWorkspace = user.workspaceId?.name || 'None';
      await User.updateOne(
        { _id: user._id },
        { $set: { workspaceId: coreWorkspace._id } }
      );
      
      assignedCount++;
    }
    
    
    
    // Update tasks
    
    const taskUpdateResult = await Task.updateMany(
      { workspaceId: { $ne: null } },
      { $set: { workspaceId: coreWorkspace._id } }
    );
    
    
    // Update teams
    
    const teamUpdateResult = await Team.updateMany(
      { workspaceId: { $ne: null } },
      { $set: { workspaceId: coreWorkspace._id } }
    );
    
    
    // Update workspace usage counts
    const userCount = await User.countDocuments({ workspaceId: coreWorkspace._id });
    const taskCount = await Task.countDocuments({ workspaceId: coreWorkspace._id });
    const teamCount = await Team.countDocuments({ workspaceId: coreWorkspace._id });
    
    await Workspace.updateOne(
      { _id: coreWorkspace._id },
      { 
        $set: { 
          'usage.userCount': userCount,
          'usage.taskCount': taskCount,
          'usage.teamCount': teamCount
        } 
      }
    );
    
    
    
    
    
    
    // Ask about deleting old workspaces
    const oldWorkspaces = await Workspace.find({ 
      type: 'COMMUNITY',
      _id: { $ne: coreWorkspace._id }
    });
    
    if (oldWorkspaces.length > 0) {
      
      oldWorkspaces.forEach(ws => {
        
      });
      
      
      
      if (process.argv.includes('--cleanup')) {
        
        for (const ws of oldWorkspaces) {
          await Workspace.deleteOne({ _id: ws._id });
          
        }
      }
    }
    
    
    
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    
    process.exit(1);
  }
}

createCoreWorkspace();
