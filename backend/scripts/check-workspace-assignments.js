import mongoose from 'mongoose';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function reviewAndFixWorkspaceAssignments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Get all users
    const allUsers = await User.find({}).populate('workspaceId', 'name type');
    
    // System admins (should NOT have workspace)
    const systemAdmins = allUsers.filter(u => u.role === 'admin' && !u.workspaceId);
    : ${systemAdmins.length}`);
    systemAdmins.forEach(u => );
    
    // System admins incorrectly assigned to workspace
    const adminsWithWorkspace = allUsers.filter(u => u.role === 'admin' && u.workspaceId);
    if (adminsWithWorkspace.length > 0) {
      adminsWithWorkspace.forEach(u => {
        `);
      });
    }
    
    // Community admins (SHOULD have workspace)
    const communityAdmins = allUsers.filter(u => u.role === 'community_admin');
    communityAdmins.forEach(u => {
      const status = u.workspaceId ? '✅' : '❌';
      });
    
    // Regular users (SHOULD have workspace)
    const regularUsers = allUsers.filter(u => !['admin', 'community_admin'].includes(u.role));
    const regularWithWorkspace = regularUsers.filter(u => u.workspaceId);
    const regularWithoutWorkspace = regularUsers.filter(u => !u.workspaceId);
    
    : ${regularUsers.length}`);
    if (regularWithoutWorkspace.length > 0) {
      regularWithoutWorkspace.forEach(u => `));
    }
    
    // Get workspace breakdown
    const workspaces = await Workspace.find({});
    for (const ws of workspaces) {
      const userCount = allUsers.filter(u => u.workspaceId?._id?.toString() === ws._id.toString()).length;
      : ${userCount} users`);
    }
    
    // Ask for confirmation to fix
    let fixCount = 0;
    
    if (adminsWithWorkspace.length > 0) {
      `);
      fixCount++;
    }
    
    if (regularWithoutWorkspace.length > 0) {
      to a workspace`);
      fixCount++;
    }
    
    if (fixCount === 0) {
      process.exit(0);
    }
    
    // If --fix flag is provided, apply fixes
    if (process.argv.includes('--fix')) {
      // Fix 1: Remove workspace from system admins
      if (adminsWithWorkspace.length > 0) {
        for (const admin of adminsWithWorkspace) {
          await User.updateOne(
            { _id: admin._id },
            { $unset: { workspaceId: 1 } }
          );
          }
      }
      
      // Fix 2: Assign regular users to workspace (if needed)
      if (regularWithoutWorkspace.length > 0) {
        // Find or use default workspace
        let defaultWorkspace = await Workspace.findOne({ type: 'COMMUNITY' });
        
        if (!defaultWorkspace) {
          } else {
          for (const user of regularWithoutWorkspace) {
            await User.updateOne(
              { _id: user._id },
              { $set: { workspaceId: defaultWorkspace._id } }
            );
            }
        }
      }
      
      }
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    process.exit(1);
  }
}

reviewAndFixWorkspaceAssignments();
