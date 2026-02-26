import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Team from '../models/Team.js';
import User from '../models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function testRemoveMember() {
  try {
    await mongoose.connect(MONGODB_URI);
    // Find a team with members
    const teams = await Team.find({ members: { $exists: true, $ne: [] } })
      .populate('members', 'full_name email')
      .limit(5);

    if (teams.length === 0) {
      process.exit(0);
    }

    teams.forEach((team, idx) => {
      `);
      :`);
      team.members.forEach(member => {
        - ${member.email}`);
      });
      });

    // Check for potential issues
    const team = teams[0];
    ? 'Array ✅' : 'Not Array ❌'}`);
    
    if (team.members.length > 0) {
      const firstMember = team.members[0];
      // Check if member can be found
      const userCheck = await User.findById(firstMember._id);
      if (userCheck) {
        `);
      }
    }

    if (team.members.length > 0) {
      const member = team.members[0];
      }

    ');
    if (team.members.length > 0) {
      const memberToTest = team.members[0];
      
      // Simulate $pull operation
      const beforeCount = team.members.length;
      const memberExists = team.members.some(m => m._id.toString() === memberToTest._id.toString());
      
      // Check if this is the only team for the user
      const user = await User.findById(memberToTest._id);
      if (user) {
        if (user.teams && user.teams.length > 1) {
          `);
        } else {
          }
      }
    }

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

testRemoveMember();
