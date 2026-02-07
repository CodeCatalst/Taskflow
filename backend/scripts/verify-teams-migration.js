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
    console.log('🔍 Starting Multiple Teams Migration Verification...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('='.repeat(70));
    console.log('VERIFICATION REPORT');
    console.log('='.repeat(70) + '\n');

    // 1. Check if all users have teams field
    const totalUsers = await User.countDocuments();
    const usersWithTeamsField = await User.countDocuments({ teams: { $exists: true } });
    
    console.log('1️⃣  TEAMS FIELD PRESENCE');
    console.log('-'.repeat(70));
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Users with 'teams' field: ${usersWithTeamsField}`);
    console.log(`   Users without 'teams' field: ${totalUsers - usersWithTeamsField}`);
    if (totalUsers === usersWithTeamsField) {
      console.log('   ✅ All users have teams field\n');
    } else {
      console.log('   ⚠️  Some users are missing teams field\n');
    }

    // 2. Check Core Workspace users
    const coreWorkspaces = await Workspace.find({ type: 'CORE' });
    console.log('2️⃣  CORE WORKSPACE ANALYSIS');
    console.log('-'.repeat(70));
    console.log(`   Core Workspaces Found: ${coreWorkspaces.length}\n`);

    for (const workspace of coreWorkspaces) {
      console.log(`   📦 Workspace: ${workspace.name}`);
      const workspaceUsers = await User.find({ workspaceId: workspace._id });
      const usersWithTeamId = workspaceUsers.filter(u => u.team_id !== null && u.team_id !== undefined);
      const usersWithTeamsArray = workspaceUsers.filter(u => u.teams && u.teams.length > 0);
      const consistentUsers = workspaceUsers.filter(u => {
        if (!u.team_id) return !u.teams || u.teams.length === 0;
        return u.teams && u.teams.includes(u.team_id.toString());
      });

      console.log(`      Total Users: ${workspaceUsers.length}`);
      console.log(`      Users with team_id: ${usersWithTeamId.length}`);
      console.log(`      Users with teams array: ${usersWithTeamsArray.length}`);
      console.log(`      Consistent users (team_id in teams): ${consistentUsers.length}`);
      
      if (consistentUsers.length === workspaceUsers.length) {
        console.log('      ✅ All users have consistent team data\n');
      } else {
        console.log('      ⚠️  Some users have inconsistent team data\n');
      }
    }

    // 3. Check Community Workspace users
    const communityWorkspaces = await Workspace.find({ type: 'COMMUNITY' });
    console.log('3️⃣  COMMUNITY WORKSPACE ANALYSIS');
    console.log('-'.repeat(70));
    console.log(`   Community Workspaces Found: ${communityWorkspaces.length}\n`);

    for (const workspace of communityWorkspaces) {
      console.log(`   📦 Workspace: ${workspace.name}`);
      const workspaceUsers = await User.find({ workspaceId: workspace._id });
      const usersWithTeamId = workspaceUsers.filter(u => u.team_id !== null && u.team_id !== undefined);
      const usersWithEmptyTeams = workspaceUsers.filter(u => !u.teams || u.teams.length === 0);

      console.log(`      Total Users: ${workspaceUsers.length}`);
      console.log(`      Users with team_id: ${usersWithTeamId.length}`);
      console.log(`      Users with empty teams array: ${usersWithEmptyTeams.length}`);
      
      if (usersWithEmptyTeams.length === workspaceUsers.length) {
        console.log('      ✅ Community workspace properly configured (teams array empty)\n');
      } else {
        console.log('      ℹ️  Some users have teams array populated (acceptable for Core)\n');
      }
    }

    // 4. Check team membership consistency
    console.log('4️⃣  TEAM MEMBERSHIP CONSISTENCY');
    console.log('-'.repeat(70));
    
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
        console.log(`   ⚠️  Team "${team.name}" has inconsistent member data`);
      }
    }

    console.log(`   Total Teams: ${teams.length}`);
    console.log(`   Consistent Teams: ${consistentTeams}`);
    console.log(`   Inconsistent Teams: ${inconsistentTeams}`);
    
    if (inconsistentTeams === 0) {
      console.log('   ✅ All teams have consistent membership data\n');
    } else {
      console.log('   ⚠️  Some teams have inconsistent membership data\n');
    }

    // 5. Check for users with multiple teams (Core Workspace only)
    console.log('5️⃣  MULTIPLE TEAMS USAGE');
    console.log('-'.repeat(70));
    
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

    console.log(`   Users in multiple teams: ${usersWithMultipleTeams.length}`);
    
    if (usersWithMultipleTeams.length > 0) {
      console.log('   ℹ️  Multiple teams feature is being used:\n');
      usersWithMultipleTeams.forEach(user => {
        console.log(`      - ${user.full_name} (${user.email}): ${user.teamsCount} teams`);
      });
      console.log('');
    } else {
      console.log('   ℹ️  No users currently in multiple teams (feature available)\n');
    }

    // Final summary
    console.log('='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));
    
    const allChecks = [
      totalUsers === usersWithTeamsField,
      inconsistentTeams === 0
    ];
    
    const passedChecks = allChecks.filter(check => check).length;
    const totalChecks = allChecks.length;

    console.log(`✅ Passed Checks: ${passedChecks}/${totalChecks}`);
    
    if (passedChecks === totalChecks) {
      console.log('🎉 Migration verification PASSED! System is ready for multiple teams.\n');
    } else {
      console.log('⚠️  Some checks failed. Please review the details above.\n');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run verification
verifyTeamsMigration()
  .then(() => {
    console.log('✅ Verification complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
