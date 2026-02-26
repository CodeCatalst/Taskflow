import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Team from '../models/Team.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function removeDuplicateTeamMembers() {
  try {
    
    await mongoose.connect(MONGODB_URI);
    

    const teams = await Team.find({});
    

    let teamsFixed = 0;
    let totalDuplicatesRemoved = 0;

    for (const team of teams) {
      const memberIds = team.members.map(m => m.toString());
      const uniqueMemberIds = [...new Set(memberIds)];

      if (memberIds.length !== uniqueMemberIds.length) {
        const duplicateCount = memberIds.length - uniqueMemberIds.length;
        
        
        

        // Update team with unique members only
        team.members = uniqueMemberIds;
        await team.save();

        teamsFixed++;
        totalDuplicatesRemoved += duplicateCount;
      }
    }

    
    
    
    
    
    
    

    if (teamsFixed === 0) {
      
    } else {
      
    }

    process.exit(0);
  } catch (error) {
    
    process.exit(1);
  }
}

removeDuplicateTeamMembers();
