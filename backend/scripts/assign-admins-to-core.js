import mongoose from 'mongoose';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function assignAdminsToCoreWorkspace() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    
    
    // Get CORE workspace
    const coreWorkspace = await Workspace.findOne({ type: 'CORE' });
    if (!coreWorkspace) {
      
      process.exit(1);
    }
    
    
    
    
    // Find system admins without workspace
    const adminsWithoutWorkspace = await User.find({
      role: 'admin',
      $or: [
        { workspaceId: { $exists: false } },
        { workspaceId: null }
      ]
    });
    
    
    adminsWithoutWorkspace.forEach(admin => {
      
    });
    
    // Find admins with different workspace
    const adminsWithOtherWorkspace = await User.find({
      role: 'admin',
      workspaceId: { $exists: true, $ne: null, $ne: coreWorkspace._id }
    }).populate('workspaceId', 'name type');
    
    if (adminsWithOtherWorkspace.length > 0) {
      
      adminsWithOtherWorkspace.forEach(admin => {
        
      });
    }
    
    const totalToUpdate = adminsWithoutWorkspace.length + adminsWithOtherWorkspace.length;
    
    if (totalToUpdate === 0) {
      
      process.exit(0);
    }
    
    
    
    // Update admins without workspace
    for (const admin of adminsWithoutWorkspace) {
      await User.updateOne(
        { _id: admin._id },
        { $set: { workspaceId: coreWorkspace._id } }
      );
      
    }
    
    // Update admins with other workspace
    for (const admin of adminsWithOtherWorkspace) {
      await User.updateOne(
        { _id: admin._id },
        { $set: { workspaceId: coreWorkspace._id } }
      );
      
    }
    
    // Update workspace user count
    const userCount = await User.countDocuments({ workspaceId: coreWorkspace._id });
    await Workspace.updateOne(
      { _id: coreWorkspace._id },
      { $set: { 'usage.userCount': userCount } }
    );
    
    
    
    
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    
    process.exit(1);
  }
}

assignAdminsToCoreWorkspace();
