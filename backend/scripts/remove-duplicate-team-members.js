import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Team from '../models/Team.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function removeDuplicateTeamMembers() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const teams = await Team.find({});
    console.log(`📊 Found ${teams.length} teams to check\n`);

    let teamsFixed = 0;
    let totalDuplicatesRemoved = 0;

    for (const team of teams) {
      const memberIds = team.members.map(m => m.toString());
      const uniqueMemberIds = [...new Set(memberIds)];

      if (memberIds.length !== uniqueMemberIds.length) {
        const duplicateCount = memberIds.length - uniqueMemberIds.length;
        console.log(`⚠️  Team "${team.name}" (${team._id})`);
        console.log(`   - Had ${memberIds.length} members (${duplicateCount} duplicates)`);
        console.log(`   - Now has ${uniqueMemberIds.length} unique members`);

        // Update team with unique members only
        team.members = uniqueMemberIds;
        await team.save();

        teamsFixed++;
        totalDuplicatesRemoved += duplicateCount;
      }
    }

    console.log('\n═══════════════════════════════════════════════════');
    console.log('📋 CLEANUP SUMMARY');
    console.log('═══════════════════════════════════════════════════');
    console.log(`✅ Teams processed: ${teams.length}`);
    console.log(`🔧 Teams fixed: ${teamsFixed}`);
    console.log(`🗑️  Duplicate members removed: ${totalDuplicatesRemoved}`);
    console.log('═══════════════════════════════════════════════════\n');

    if (teamsFixed === 0) {
      console.log('✨ No duplicates found! All teams are clean.\n');
    } else {
      console.log('✨ All duplicate team members have been removed!\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

removeDuplicateTeamMembers();
