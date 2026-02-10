import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Team from '../models/Team.js';
import User from '../models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function testRemoveMember() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find a team with members
    const teams = await Team.find({ members: { $exists: true, $ne: [] } })
      .populate('members', 'full_name email')
      .limit(5);

    if (teams.length === 0) {
      console.log('⚠️  No teams with members found!');
      process.exit(0);
    }

    console.log('📊 Teams with members:\n');
    teams.forEach((team, idx) => {
      console.log(`${idx + 1}. Team: "${team.name}" (${team._id})`);
      console.log(`   Members (${team.members.length}):`);
      team.members.forEach(member => {
        console.log(`   - ${member.full_name} (${member._id}) - ${member.email}`);
      });
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════');
    console.log('🔍 DIAGNOSIS INFORMATION');
    console.log('═══════════════════════════════════════════════════\n');

    // Check for potential issues
    const team = teams[0];
    console.log(`Analyzing team: "${team.name}"`);
    console.log(`- Team ID: ${team._id}`);
    console.log(`- Members array length: ${team.members.length}`);
    console.log(`- Members array type: ${Array.isArray(team.members) ? 'Array ✅' : 'Not Array ❌'}`);
    
    if (team.members.length > 0) {
      const firstMember = team.members[0];
      console.log(`\nFirst member details:`);
      console.log(`- ID: ${firstMember._id}`);
      console.log(`- ID type: ${typeof firstMember._id}`);
      console.log(`- Name: ${firstMember.full_name}`);
      
      // Check if member can be found
      const userCheck = await User.findById(firstMember._id);
      console.log(`- User exists in DB: ${userCheck ? '✅ Yes' : '❌ No'}`);
      if (userCheck) {
        console.log(`- User team_id: ${userCheck.team_id}`);
        console.log(`- User teams: ${userCheck.teams?.length || 0} team(s)`);
      }
    }

    console.log('\n═══════════════════════════════════════════════════');
    console.log('💡 HOW TO TEST REMOVE MEMBER');
    console.log('═══════════════════════════════════════════════════\n');

    if (team.members.length > 0) {
      const member = team.members[0];
      console.log('Using the team and member shown above:');
      console.log(`\n1. In frontend, navigate to Teams page`);
      console.log(`2. Find team: "${team.name}"`);
      console.log(`3. Click remove button for: "${member.full_name}"`);
      console.log(`4. Confirm removal`);
      console.log(`\nOR use API directly:`);
      console.log(`\nDELETE /api/teams/${team._id}/members/${member._id}`);
      console.log(`\nOr run this curl command:`);
      console.log(`curl -X DELETE http://localhost:5000/api/teams/${team._id}/members/${member._id} \\`);
      console.log(`  -H "Authorization: Bearer YOUR_TOKEN_HERE"\n`);
    }

    console.log('═══════════════════════════════════════════════════');
    console.log('🔧 MANUAL REMOVAL TEST (DRY RUN)');
    console.log('═══════════════════════════════════════════════════\n');

    if (team.members.length > 0) {
      const memberToTest = team.members[0];
      
      console.log(`Testing removal of: ${memberToTest.full_name}`);
      console.log(`From team: ${team.name}\n`);
      
      // Simulate $pull operation
      const beforeCount = team.members.length;
      const memberExists = team.members.some(m => m._id.toString() === memberToTest._id.toString());
      
      console.log(`✓ Member exists in team: ${memberExists ? 'Yes' : 'No'}`);
      console.log(`✓ Current member count: ${beforeCount}`);
      console.log(`✓ After removal, count would be: ${beforeCount - 1}`);
      
      // Check if this is the only team for the user
      const user = await User.findById(memberToTest._id);
      if (user) {
        console.log(`\nUser's team assignment:`);
        console.log(`- Current team_id: ${user.team_id || 'None'}`);
        console.log(`- Total teams: ${user.teams?.length || 0}`);
        if (user.teams && user.teams.length > 1) {
          console.log(`- After removal, user would still be in ${user.teams.length - 1} team(s)`);
        } else {
          console.log(`- After removal, user would have no teams`);
        }
      }
    }

    console.log('\n✨ Script completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testRemoveMember();
