import mongoose from 'mongoose';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function fixWorkspaceContext() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('🔍 Checking for users without workspace...\n');
    
    // Find users without workspace (exclude system admins)
    const usersWithoutWorkspace = await User.find({
      $or: [
        { workspaceId: { $exists: false } },
        { workspaceId: null }
      ],
      role: { $ne: 'admin' }
    });
    
    if (usersWithoutWorkspace.length === 0) {
      console.log('✅ All users have workspaces assigned!');
      process.exit(0);
    }
    
    console.log(`⚠️  Found ${usersWithoutWorkspace.length} users without workspace:`);
    usersWithoutWorkspace.forEach(u => {
      console.log(`   - ${u.email} (${u.role})`);
    });
    
    // Find or create default workspace
    let workspace = await Workspace.findOne({ type: 'COMMUNITY' });
    
    if (!workspace) {
      console.log('\n📦 Creating default COMMUNITY workspace...');
      
      // Find first admin to be owner
      const adminUser = await User.findOne({ role: 'admin' });
      
      workspace = await Workspace.create({
        name: 'Default Community Workspace',
        type: 'COMMUNITY',
        owner: adminUser?._id,
        isActive: true,
        settings: {
          features: {
            auditLogs: false,
            advancedAnalytics: false,
            bulkImport: false,
            customFields: false,
            apiAccess: false
          }
        },
        limits: {
          maxUsers: 10,
          maxTeams: 3,
          maxTasks: 100,
          maxStorage: 1073741824 // 1GB
        },
        usage: {
          userCount: 0,
          teamCount: 0,
          taskCount: 0,
          storageUsed: 0
        }
      });
      
      console.log(`✅ Created workspace: ${workspace.name} (${workspace._id})`);
    } else {
      console.log(`\n📦 Using existing workspace: ${workspace.name} (${workspace._id})`);
    }
    
    // Assign all users to this workspace
    console.log('\n🔧 Assigning users to workspace...');
    for (const user of usersWithoutWorkspace) {
      user.workspaceId = workspace._id;
      await user.save();
      console.log(`   ✅ ${user.email}`);
    }
    
    // Update workspace usage count
    const totalUsers = await User.countDocuments({ 
      workspaceId: workspace._id 
    });
    workspace.usage.userCount = totalUsers;
    await workspace.save();
    
    console.log(`\n✅ Fixed ${usersWithoutWorkspace.length} users`);
    console.log(`✅ Workspace now has ${totalUsers} total users`);
    console.log(`\n🎉 All done! You can now restart your backend server.`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixWorkspaceContext();
