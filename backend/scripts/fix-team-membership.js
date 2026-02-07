import mongoose from 'mongoose';
import User from '../models/User.js';
import Team from '../models/Team.js';
import Workspace from '../models/Workspace.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Fix Team Membership Script
 * 
 * This script fixes inconsistencies between:
 * - Team.members array (who the team thinks are members)
 * - User.teams array (what teams the user thinks they belong to)
 * - User.team_id (user's primary team)
 */

async function fixTeamMembership() {
  try {
    console.log('🔧 Starting Team Membership Fix...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const teams = await Team.find({}).populate('members', '_id full_name email teams team_id');
    console.log(`📊 Found ${teams.length} teams to process\n`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const team of teams) {
      console.log(`\n🔍 Processing Team: ${team.name}`);
      console.log(`   Team ID: ${team._id}`);
      console.log(`   Members in team.members: ${team.members.length}`);

      // Get workspace type
      const workspace = await Workspace.findById(team.workspaceId);
      const isCoreWorkspace = workspace && workspace.type === 'CORE';
      
      console.log(`   Workspace: ${workspace?.name || 'Unknown'} (${workspace?.type || 'Unknown'})`);

      let addedToUsers = 0;
      let alreadyConsistent = 0;

      // For each member in the team
      for (const member of team.members) {
        const userId = member._id;
        
        if (isCoreWorkspace) {
          // In Core Workspace, check if user has this team in their teams array
          const hasTeamInArray = member.teams && member.teams.some(t => t.toString() === team._id.toString());
          
          if (!hasTeamInArray) {
            // Add team to user's teams array
            await User.findByIdAndUpdate(userId, {
              $addToSet: { teams: team._id }
            });
            console.log(`   ✅ Added team to ${member.full_name}'s teams array`);
            addedToUsers++;
            
            // If user has no team_id, set this as their primary team
            if (!member.team_id) {
              await User.findByIdAndUpdate(userId, {
                team_id: team._id
              });
              console.log(`   ✅ Set as primary team for ${member.full_name}`);
            }
          } else {
            alreadyConsistent++;
          }
        } else {
          // Community Workspace - just verify team_id
          alreadyConsistent++;
        }
      }

      if (addedToUsers > 0) {
        console.log(`   📝 Fixed ${addedToUsers} member(s)`);
        fixedCount++;
      } else {
        console.log(`   ✅ All ${alreadyConsistent} member(s) already consistent`);
        skippedCount++;
      }
    }

    // Also check for users who have teams in their array but aren't in the team's members
    console.log('\n\n🔍 Checking reverse consistency (users.teams → team.members)...\n');
    
    const usersWithTeams = await User.find({ 
      teams: { $exists: true, $ne: [] } 
    }).populate('teams', '_id name members');

    let reverseFixedCount = 0;

    for (const user of usersWithTeams) {
      for (const team of user.teams) {
        // Check if user is in team's members array
        const isInTeamMembers = team.members && team.members.some(m => m.toString() === user._id.toString());
        
        if (!isInTeamMembers) {
          // Add user to team's members array
          await Team.findByIdAndUpdate(team._id, {
            $addToSet: { members: user._id }
          });
          console.log(`   ✅ Added ${user.full_name} to team "${team.name}" members`);
          reverseFixedCount++;
        }
      }
    }

    if (reverseFixedCount > 0) {
      console.log(`\n   📝 Fixed ${reverseFixedCount} reverse inconsistency(ies)`);
    } else {
      console.log(`\n   ✅ No reverse inconsistencies found`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 FIX SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Teams with fixes applied: ${fixedCount}`);
    console.log(`⏭️  Teams already consistent: ${skippedCount}`);
    console.log(`🔄 Reverse fixes applied: ${reverseFixedCount}`);
    console.log(`📝 Total Teams Processed: ${teams.length}`);
    console.log('='.repeat(60) + '\n');

    console.log('✨ Fix completed successfully!\n');

  } catch (error) {
    console.error('❌ Fix failed:', error);
    throw error;
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run fix
fixTeamMembership()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fix failed:', error);
    process.exit(1);
  });
