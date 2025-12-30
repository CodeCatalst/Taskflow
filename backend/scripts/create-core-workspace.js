import mongoose from 'mongoose';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import Task from '../models/Task.js';
import Team from '../models/Team.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function createCoreWorkspace() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('🔍 Checking current workspace setup...\n');
    
    // Check for existing workspaces
    const existingWorkspaces = await Workspace.find({});
    console.log(`📦 Found ${existingWorkspaces.length} existing workspace(s):`);
    existingWorkspaces.forEach(ws => {
      console.log(`   - ${ws.name} (${ws.type}) - ID: ${ws._id}`);
    });
    
    // Check for existing CORE workspace
    const existingCore = await Workspace.findOne({ type: 'CORE' });
    if (existingCore) {
      console.log(`\n⚠️  CORE workspace already exists: ${existingCore.name}`);
      console.log('Exiting without changes.\n');
      process.exit(0);
    }
    
    // Get all users (excluding system admins)
    const usersToAssign = await User.find({ 
      role: { $ne: 'admin' } 
    }).populate('workspaceId', 'name type');
    
    console.log(`\n👥 Found ${usersToAssign.length} users to assign to CORE workspace`);
    
    // Find first admin as owner
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('\n❌ No system admin found. Cannot create workspace without owner.');
      process.exit(1);
    }
    
    console.log(`\n📝 Creating CORE workspace...`);
    console.log(`   Owner: ${adminUser.email}`);
    
    // Create CORE workspace with enterprise features
    const coreWorkspace = await Workspace.create({
      name: 'Core Team Workspace',
      type: 'CORE',
      owner: adminUser._id,
      isActive: true,
      settings: {
        features: {
          auditLogs: true,
          advancedAnalytics: true,
          bulkImport: true,
          customFields: true,
          apiAccess: true
        }
      },
      limits: {
        maxUsers: 1000,
        maxTeams: 100,
        maxTasks: 100000,
        maxStorage: 107374182400 // 100GB
      },
      usage: {
        userCount: 0,
        teamCount: 0,
        taskCount: 0,
        storageUsed: 0
      }
    });
    
    console.log(`✅ Created CORE workspace: ${coreWorkspace.name}`);
    console.log(`   ID: ${coreWorkspace._id}`);
    console.log(`   Type: ${coreWorkspace.type}`);
    
    // Assign all users to new CORE workspace
    console.log(`\n🔧 Assigning ${usersToAssign.length} users to CORE workspace...`);
    
    let assignedCount = 0;
    for (const user of usersToAssign) {
      const oldWorkspace = user.workspaceId?.name || 'None';
      await User.updateOne(
        { _id: user._id },
        { $set: { workspaceId: coreWorkspace._id } }
      );
      console.log(`   ✅ ${user.email} (${user.role}) - moved from "${oldWorkspace}"`);
      assignedCount++;
    }
    
    console.log(`\n✅ Successfully assigned ${assignedCount} users to CORE workspace`);
    
    // Update tasks
    console.log(`\n🔧 Updating tasks...`);
    const taskUpdateResult = await Task.updateMany(
      { workspaceId: { $ne: null } },
      { $set: { workspaceId: coreWorkspace._id } }
    );
    console.log(`   ✅ Updated ${taskUpdateResult.modifiedCount} tasks`);
    
    // Update teams
    console.log(`\n🔧 Updating teams...`);
    const teamUpdateResult = await Team.updateMany(
      { workspaceId: { $ne: null } },
      { $set: { workspaceId: coreWorkspace._id } }
    );
    console.log(`   ✅ Updated ${teamUpdateResult.modifiedCount} teams`);
    
    // Update workspace usage counts
    const userCount = await User.countDocuments({ workspaceId: coreWorkspace._id });
    const taskCount = await Task.countDocuments({ workspaceId: coreWorkspace._id });
    const teamCount = await Team.countDocuments({ workspaceId: coreWorkspace._id });
    
    await Workspace.updateOne(
      { _id: coreWorkspace._id },
      { 
        $set: { 
          'usage.userCount': userCount,
          'usage.taskCount': taskCount,
          'usage.teamCount': teamCount
        } 
      }
    );
    
    console.log(`\n📊 CORE Workspace Usage:`);
    console.log(`   Users: ${userCount}`);
    console.log(`   Tasks: ${taskCount}`);
    console.log(`   Teams: ${teamCount}`);
    
    // Ask about deleting old workspaces
    const oldWorkspaces = await Workspace.find({ 
      type: 'COMMUNITY',
      _id: { $ne: coreWorkspace._id }
    });
    
    if (oldWorkspaces.length > 0) {
      console.log(`\n⚠️  Old COMMUNITY workspace(s) found:`);
      oldWorkspaces.forEach(ws => {
        console.log(`   - ${ws.name} (ID: ${ws._id})`);
      });
      console.log(`\n   Run with --cleanup flag to delete old workspaces`);
      console.log(`   Example: node create-core-workspace.js --cleanup`);
      
      if (process.argv.includes('--cleanup')) {
        console.log(`\n🗑️  Deleting old workspaces...`);
        for (const ws of oldWorkspaces) {
          await Workspace.deleteOne({ _id: ws._id });
          console.log(`   ✅ Deleted: ${ws.name}`);
        }
      }
    }
    
    console.log('\n✅ CORE workspace setup complete!\n');
    console.log('🔐 Users must log out and log back in to see the new workspace.\n');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createCoreWorkspace();
