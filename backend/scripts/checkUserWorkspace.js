import mongoose from 'mongoose';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkUserWorkspace() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    

    // Get email from command line argument
    const email = process.argv[2];
    
    if (!email) {
      
      process.exit(1);
    }

    const user = await User.findOne({ email })
      .populate('workspaceId', 'name type owner isActive');

    if (!user) {
      
      process.exit(1);
    }

    
    
    
    
    
    
    
    if (user.workspaceId) {
      
      
      
      
      
      
    } else {
      
    }

    await mongoose.disconnect();
  } catch (error) {
    
    process.exit(1);
  }
}

checkUserWorkspace();
