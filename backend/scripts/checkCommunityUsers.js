import mongoose from 'mongoose';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkCommunityUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskflow');
    

    // Get all community admins
    const communityAdmins = await User.find({ role: 'community_admin' }).populate('workspaceId');
    
    
    if (communityAdmins.length === 0) {
      
    } else {
      communityAdmins.forEach(u => {
        
      });
    }

    // Get all workspaces
    
    const workspaces = await Workspace.find();
    workspaces.forEach(ws => {
      
    });

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    
    process.exit(1);
  }
}

checkCommunityUsers();
