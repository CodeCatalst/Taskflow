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
    console.log('🚀 Starting Multiple Teams Migration...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users to process\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each user
    for (const user of users) {
      try {
        // Check if user already has teams array with data
        if (user.teams && user.teams.length > 0) {
          console.log(`⏭️  Skipped: ${user.full_name} (${user.email}) - already has teams array`);
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
            console.log(`✅ Migrated: ${user.full_name} (${user.email})`);
            console.log(`   - Workspace: ${workspaceType}`);
            console.log(`   - Added team_id to teams array: ${user.team_id}`);
          } else {
            // For Community Workspace, just ensure teams array is empty
            updates.teams = [];
            console.log(`✅ Migrated: ${user.full_name} (${user.email})`);
            console.log(`   - Workspace: ${workspaceType}`);
            console.log(`   - Initialized empty teams array (Community Workspace uses single team_id)`);
          }
        } else {
          // No team_id, just initialize empty teams array
          updates.teams = [];
          console.log(`✅ Migrated: ${user.full_name} (${user.email})`);
          console.log(`   - No team assignment, initialized empty teams array`);
        }

        // Apply updates
        await User.findByIdAndUpdate(user._id, updates);
        migratedCount++;
        console.log('');

      } catch (error) {
        console.error(`❌ Error processing ${user.full_name} (${user.email}):`, error.message);
        errorCount++;
        console.log('');
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully Migrated: ${migratedCount} users`);
    console.log(`⏭️  Skipped (already migrated): ${skippedCount} users`);
    console.log(`❌ Errors: ${errorCount} users`);
    console.log(`📝 Total Processed: ${users.length} users`);
    console.log('='.repeat(60) + '\n');

    // Verify migration
    console.log('🔍 Verifying migration...\n');
    const verifyUsers = await User.find({ teams: { $exists: true } });
    console.log(`✅ ${verifyUsers.length} users now have 'teams' field`);

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
    console.log(`✅ ${usersWithTeams.length} Core Workspace users with team_id now have teams array populated`);

    console.log('\n✨ Migration completed successfully!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration
migrateMultipleTeams()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
