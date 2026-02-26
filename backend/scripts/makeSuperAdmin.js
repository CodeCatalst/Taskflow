import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const email = process.argv[2] || 'jassalarjansingh@gmail.com';

async function makeSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskflow');
    

    const user = await User.findOne({ email });

    if (!user) {
      
      process.exit(1);
    }

    

    // Update to system admin
    user.role = 'admin';
    user.workspaceId = null;  // System admins have no workspace
    user.team_id = null;      // System admins are not in teams
    await user.save();

    
    
    
    
    
    
    
    
    

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    
    process.exit(1);
  }
}

makeSuperAdmin();
