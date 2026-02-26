/**
 * Migration Script: Single Workspace to Multi-Workspace
 * 
 * This script migrates existing users from single workspace model to multi-workspace model
 * - Converts workspaceId to workspaces array
 * - Sets currentWorkspaceId
 * - Preserves existing workspace associations
 * 
 * Run: node backend/scripts/migrate-to-multi-workspace.js
 */

import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function migrateToMultiWorkspace() {
  try {
    

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    

    // Find all users with workspaceId but no workspaces array
    const usersToMigrate = await User.find({
      workspaceId: { $exists: true, $ne: null },
      $or: [
        { workspaces: { $exists: false } },
        { workspaces: { $size: 0 } }
      ]
    });

    

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const user of usersToMigrate) {
      try {
        
        
        

        // Create workspaces array from existing workspaceId
        user.workspaces = [{
          workspaceId: user.workspaceId,
          role: user.role,
          joinedAt: user.created_at || new Date(),
          isActive: true
        }];

        // Set current workspace
        user.currentWorkspaceId = user.workspaceId;

        // Save user
        await user.save();

        
        migratedCount++;

      } catch (error) {
        
        errorCount++;
      }
    }

    
    
    
    
    
    
    
    

    if (errorCount > 0) {
      
    } else {
      
    }

    

  } catch (error) {
    
  } finally {
    await mongoose.disconnect();
    
    process.exit(0);
  }
}

// Run migration
migrateToMultiWorkspace();
