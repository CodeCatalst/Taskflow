/**
 * Migration Script: Migrate Existing Data to Workspace Model
 * 
 * This script:
 * 1. Creates a default CORE workspace
 * 2. Assigns all existing users to the CORE workspace
 * 3. Assigns all existing tasks, teams, notifications, and changelogs to the CORE workspace
 * 4. Updates usage statistics
 * 
 * Run this script ONCE after deploying the workspace feature
 * 
 * Usage: node backend/scripts/migrateToWorkspaces.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import models
import User from '../models/User.js';
import Task from '../models/Task.js';
import Team from '../models/Team.js';
import Notification from '../models/Notification.js';
import ChangeLog from '../models/ChangeLog.js';
import Workspace from '../models/Workspace.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskflow';

async function migrateToWorkspaces() {
  try {
    

    // Connect to MongoDB
    
    await mongoose.connect(MONGODB_URI);
    

    // Check if CORE workspace already exists
    let coreWorkspace = await Workspace.findOne({ type: 'CORE' });
    
    if (coreWorkspace) {
      
      
      
    } else {
      // Find the first admin user to be the workspace owner
      const adminUser = await User.findOne({ role: 'admin' }).sort({ created_at: 1 });
      
      if (!adminUser) {
        
        
        process.exit(1);
      }

      
      

      // Create CORE workspace
      coreWorkspace = new Workspace({
        name: process.env.COMPANY_NAME || 'TaskFlow Enterprise',
        type: 'CORE',
        owner: adminUser._id,
        isActive: true,
        // CORE workspace settings are automatically set by pre-save hook
      });

      await coreWorkspace.save();
      
      
      
      
      
    }

    const workspaceId = coreWorkspace._id;

    // Migrate Users
    
    const usersWithoutWorkspace = await User.countDocuments({ 
      workspaceId: { $exists: false } 
    });
    
    if (usersWithoutWorkspace > 0) {
      const userResult = await User.updateMany(
        { workspaceId: { $exists: false } },
        { $set: { workspaceId: workspaceId } }
      );
      
    } else {
      
    }
    
    const totalUsers = await User.countDocuments({ workspaceId: workspaceId });
    

    // Migrate Tasks
    
    const tasksWithoutWorkspace = await Task.countDocuments({ 
      workspaceId: { $exists: false } 
    });
    
    if (tasksWithoutWorkspace > 0) {
      const taskResult = await Task.updateMany(
        { workspaceId: { $exists: false } },
        { $set: { workspaceId: workspaceId } }
      );
      
    } else {
      
    }
    
    const totalTasks = await Task.countDocuments({ workspaceId: workspaceId });
    

    // Migrate Teams
    
    const teamsWithoutWorkspace = await Team.countDocuments({ 
      workspaceId: { $exists: false } 
    });
    
    if (teamsWithoutWorkspace > 0) {
      const teamResult = await Team.updateMany(
        { workspaceId: { $exists: false } },
        { $set: { workspaceId: workspaceId } }
      );
      
    } else {
      
    }
    
    const totalTeams = await Team.countDocuments({ workspaceId: workspaceId });
    

    // Migrate Notifications
    
    const notificationsWithoutWorkspace = await Notification.countDocuments({ 
      workspaceId: { $exists: false } 
    });
    
    if (notificationsWithoutWorkspace > 0) {
      const notificationResult = await Notification.updateMany(
        { workspaceId: { $exists: false } },
        { $set: { workspaceId: workspaceId } }
      );
      
    } else {
      
    }
    
    const totalNotifications = await Notification.countDocuments({ workspaceId: workspaceId });
    

    // Migrate ChangeLogs
    
    const changeLogsWithoutWorkspace = await ChangeLog.countDocuments({ 
      workspaceId: { $exists: false } 
    });
    
    if (changeLogsWithoutWorkspace > 0) {
      const changeLogResult = await ChangeLog.updateMany(
        { workspaceId: { $exists: false } },
        { $set: { workspaceId: workspaceId } }
      );
      
    } else {
      
    }
    
    const totalChangeLogs = await ChangeLog.countDocuments({ workspaceId: workspaceId });
    

    // Update workspace usage statistics
    
    coreWorkspace.usage = {
      userCount: totalUsers,
      taskCount: totalTasks,
      teamCount: totalTeams,
    };
    await coreWorkspace.save();
    

    // Summary
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    

  } catch (error) {
    
    
    
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    
  }
}

// Run migration




migrateToWorkspaces();
