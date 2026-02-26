import mongoose from 'mongoose';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import connectDB from '../config/db.js';

async function checkWorkspaceStatus() {
  try {
    await connectDB();
    
    );
    
    // 1. Check all users
    const allUsers = await User.find({}).select('email role workspaceId');
    // 2. Users without workspace
    const noWorkspace = allUsers.filter(u => !u.workspaceId && u.role !== 'admin');
    : ${noWorkspace.length}`);
    if (noWorkspace.length > 0) {
      noWorkspace.forEach(u => {
        - NO WORKSPACE`);
      });
    }
    
    // 3. System admins
    const systemAdmins = allUsers.filter(u => !u.workspaceId && u.role === 'admin');
    : ${systemAdmins.length}`);
    systemAdmins.forEach(u => {
      });
    
    // 4. All workspaces
    const workspaces = await Workspace.find({});
    for (const ws of workspaces) {
      const wsUsers = allUsers.filter(u => u.workspaceId?.toString() === ws._id.toString());
      if (wsUsers.length > 0) {
        wsUsers.forEach(u => {
          `);
        });
      }
    }
    
    // 5. Summary
    );
    if (noWorkspace.length > 0) {
      } else {
      if (workspaces.length === 0) {
        }
    }
    
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

checkWorkspaceStatus();
