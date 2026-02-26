import mongoose from 'mongoose';
import User from '../models/User.js';
import Team from '../models/Team.js';
import Workspace from '../models/Workspace.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Verification Script: Multiple Teams Migration
 * 
 * This script verifies the multiple teams migration:
 * 1. Checks if all users have 'teams' field
 * 2. Validates data consistency between team_id and teams array
 * 3. Checks team membership consistency
 */

async function verifyTeamsMigration() {
  try {
    

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    

    
    
    

    // 1. Check if all users have teams field
    const totalUsers = await User.countDocuments();
    const usersWithTeamsField = await User.countDocuments({ teams: { $exists: true } });
    
    
    
    
    
    
    if (totalUsers === usersWithTeamsField) {
      
    } else {
      
    }

    // 2. Check Core Workspace users
    const coreWorkspaces = await Workspace.find({ type: 'CORE' });
    
    
    

    for (const workspace of coreWorkspaces) {
      
      const workspaceUsers = await User.find({ workspaceId: workspace._id });
      const usersWithTeamId = workspaceUsers.filter(u => u.team_id !== null && u.team_id !== undefined);
      const usersWithTeamsArray = workspaceUsers.filter(u => u.teams && u.teams.length > 0);
      const consistentUsers = workspaceUsers.filter(u => {
        if (!u.team_id) return !u.teams || u.teams.length === 0;
        return u.teams && u.teams.includes(u.team_id.toString());
      });

      
      
      
      
      
      if (consistentUsers.length === workspaceUsers.length) {
        
      } else {
        
      }
    }

    // 3. Check Community Workspace users
    const communityWorkspaces = await Workspace.find({ type: 'COMMUNITY' });
    
    
    

    for (const workspace of communityWorkspaces) {
      
      const workspaceUsers = await User.find({ workspaceId: workspace._id });
      const usersWithTeamId = workspaceUsers.filter(u => u.team_id !== null && u.team_id !== undefined);
      const usersWithEmptyTeams = workspaceUsers.filter(u => !u.teams || u.teams.length === 0);

      
      
      
      
      if (usersWithEmptyTeams.length === workspaceUsers.length) {
        
      } else {
        
      }
    }

    // 4. Check team membership consistency
    
    
    
    const teams = await Team.find({}).populate('members', 'full_name email teams team_id');
    let consistentTeams = 0;
    let inconsistentTeams = 0;

    for (const team of teams) {
      const workspace = await Workspace.findById(team.workspaceId);
      const isCoreWorkspace = workspace && workspace.type === 'CORE';
      
      let allMembersConsistent = true;
      
      for (const member of team.members) {
        if (isCoreWorkspace) {
          // In Core Workspace, member should have this team in their teams array
          const hasTeamInArray = member.teams && member.teams.some(t => t.toString() === team._id.toString());
          if (!hasTeamInArray) {
            allMembersConsistent = false;
            break;
          }
        }
      }

      if (allMembersConsistent) {
        consistentTeams++;
      } else {
        inconsistentTeams++;
        
      }
    }

    
    
    
    
    if (inconsistentTeams === 0) {
      
    } else {
      
    }

    // 5. Check for users with multiple teams (Core Workspace only)
    
    
    
    const usersWithMultipleTeams = await User.aggregate([
      {
        $lookup: {
          from: 'workspaces',
          localField: 'workspaceId',
          foreignField: '_id',
          as: 'workspace'
        }
      },
      { $unwind: { path: '$workspace', preserveNullAndEmptyArrays: true } },
      { $match: { 'workspace.type': 'CORE' } },
      {
        $project: {
          full_name: 1,
          email: 1,
          teamsCount: { $size: { $ifNull: ['$teams', []] } }
        }
      },
      { $match: { teamsCount: { $gt: 1 } } }
    ]);

    
    
    if (usersWithMultipleTeams.length > 0) {
      
      usersWithMultipleTeams.forEach(user => {
        
      });
      
    } else {
      
    }

    // Final summary
    
    
    
    
    const allChecks = [
      totalUsers === usersWithTeamsField,
      inconsistentTeams === 0
    ];
    
    const passedChecks = allChecks.filter(check => check).length;
    const totalChecks = allChecks.length;

    
    
    if (passedChecks === totalChecks) {
      
    } else {
      
    }

  } catch (error) {
    
    throw error;
  } finally {
    // Close connection
    await mongoose.connection.close();
    
  }
}

// Run verification
verifyTeamsMigration()
  .then(() => {
    
    process.exit(0);
  })
  .catch((error) => {
    
    process.exit(1);
  });
