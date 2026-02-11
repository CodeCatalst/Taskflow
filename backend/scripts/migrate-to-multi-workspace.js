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
    console.log('🔄 Starting migration to multi-workspace model...\n');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all users with workspaceId but no workspaces array
    const usersToMigrate = await User.find({
      workspaceId: { $exists: true, $ne: null },
      $or: [
        { workspaces: { $exists: false } },
        { workspaces: { $size: 0 } }
      ]
    });

    console.log(`📊 Found ${usersToMigrate.length} users to migrate\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const user of usersToMigrate) {
      try {
        console.log(`Migrating user: ${user.email} (${user.full_name})`);
        console.log(`  Current workspace: ${user.workspaceId}`);
        console.log(`  Role: ${user.role}`);

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

        console.log(`  ✅ Migrated successfully\n`);
        migratedCount++;

      } catch (error) {
        console.error(`  ❌ Error migrating user ${user.email}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total users processed: ${usersToMigrate.length}`);
    console.log(`✅ Successfully migrated: ${migratedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(60) + '\n');

    if (errorCount > 0) {
      console.log('⚠️  Some users failed to migrate. Please review the errors above.');
    } else {
      console.log('🎉 All users migrated successfully!');
    }

    console.log('\n✨ Migration completed!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run migration
migrateToMultiWorkspace();
