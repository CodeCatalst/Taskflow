import mongoose from 'mongoose';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Migration Script: Add Multiple Teams Support
 * 
 * This script migrates existing users to support multiple teams:
 * 1. Adds 'teams' array field to all users
 * 2. Migrates existing team_id to teams array (if team_id exists)
 * 3. Maintains team_id for backward compatibility
 */

async function migrateMultipleTeams() {
  try {
    

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    

    // Get all users
    const users = await User.find({});
    

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each user
    for (const user of users) {
      try {
        // Check if user already has teams array with data
        if (user.teams && user.teams.length > 0) {
          
          skippedCount++;
          continue;
        }

        // Get workspace type to determine migration strategy
        let workspaceType = 'CORE'; // Default
        if (user.workspaceId) {
          const workspace = await Workspace.findById(user.workspaceId);
          if (workspace) {
            workspaceType = workspace.type;
          }
        }

        // Prepare update
        const updates = {};
        
        // If user has a team_id and it's not already in teams array
        if (user.team_id) {
          // For Core Workspace, add team_id to teams array
          if (workspaceType === 'CORE') {
            updates.teams = [user.team_id];
            
            
            
          } else {
            // For Community Workspace, just ensure teams array is empty
            updates.teams = [];
            
            
            
          }
        } else {
          // No team_id, just initialize empty teams array
          updates.teams = [];
          
          
        }

        // Apply updates
        await User.findByIdAndUpdate(user._id, updates);
        migratedCount++;
        

      } catch (error) {
        
        errorCount++;
        
      }
    }

    // Summary
    
    
    
    
    
    
    
    

    // Verify migration
    
    const verifyUsers = await User.find({ teams: { $exists: true } });
    

    const coreWorkspaceUsers = await User.aggregate([
      {
        $lookup: {
          from: 'workspaces',
          localField: 'workspaceId',
          foreignField: '_id',
          as: 'workspace'
        }
      },
      { $unwind: { path: '$workspace', preserveNullAndEmptyArrays: true } },
      { $match: { 'workspace.type': 'CORE', team_id: { $ne: null } } }
    ]);

    const usersWithTeams = coreWorkspaceUsers.filter(u => u.teams && u.teams.length > 0);
    

    

  } catch (error) {
    
    throw error;
  } finally {
    // Close connection
    await mongoose.connection.close();
    
  }
}

// Run migration
migrateMultipleTeams()
  .then(() => {
    
    process.exit(0);
  })
  .catch((error) => {
    
    process.exit(1);
  });
