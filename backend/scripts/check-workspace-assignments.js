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
    
    console.log('🔍 Reviewing workspace assignments...\n');
    
    // Get all users
    const allUsers = await User.find({}).populate('workspaceId', 'name type');
    
    console.log('📊 CURRENT STATE:\n');
    
    // System admins (should NOT have workspace)
    const systemAdmins = allUsers.filter(u => u.role === 'admin' && !u.workspaceId);
    console.log(`✅ System Admins (NO workspace - CORRECT): ${systemAdmins.length}`);
    systemAdmins.forEach(u => console.log(`   - ${u.email}`));
    
    // System admins incorrectly assigned to workspace
    const adminsWithWorkspace = allUsers.filter(u => u.role === 'admin' && u.workspaceId);
    if (adminsWithWorkspace.length > 0) {
      console.log(`\n❌ System Admins INCORRECTLY assigned to workspace: ${adminsWithWorkspace.length}`);
      adminsWithWorkspace.forEach(u => {
        console.log(`   - ${u.email} → ${u.workspaceId?.name || u.workspaceId} (${u.workspaceId?.type || 'UNKNOWN'})`);
      });
    }
    
    // Community admins (SHOULD have workspace)
    const communityAdmins = allUsers.filter(u => u.role === 'community_admin');
    console.log(`\n👥 Community Admins: ${communityAdmins.length}`);
    communityAdmins.forEach(u => {
      const status = u.workspaceId ? '✅' : '❌';
      console.log(`   ${status} ${u.email} → ${u.workspaceId?.name || 'NO WORKSPACE'}`);
    });
    
    // Regular users (SHOULD have workspace)
    const regularUsers = allUsers.filter(u => !['admin', 'community_admin'].includes(u.role));
    const regularWithWorkspace = regularUsers.filter(u => u.workspaceId);
    const regularWithoutWorkspace = regularUsers.filter(u => !u.workspaceId);
    
    console.log(`\n👤 Regular Users (member, hr, team_lead): ${regularUsers.length}`);
    console.log(`   ✅ With workspace: ${regularWithWorkspace.length}`);
    if (regularWithoutWorkspace.length > 0) {
      console.log(`   ❌ Without workspace: ${regularWithoutWorkspace.length}`);
      regularWithoutWorkspace.forEach(u => console.log(`      - ${u.email} (${u.role})`));
    }
    
    // Get workspace breakdown
    const workspaces = await Workspace.find({});
    console.log(`\n📦 WORKSPACES: ${workspaces.length}`);
    for (const ws of workspaces) {
      const userCount = allUsers.filter(u => u.workspaceId?._id?.toString() === ws._id.toString()).length;
      console.log(`   - ${ws.name} (${ws.type}): ${userCount} users`);
    }
    
    // Ask for confirmation to fix
    console.log('\n\n🔧 PROPOSED FIXES:\n');
    
    let fixCount = 0;
    
    if (adminsWithWorkspace.length > 0) {
      console.log(`1. Remove workspace assignment from ${adminsWithWorkspace.length} system admin(s)`);
      fixCount++;
    }
    
    if (regularWithoutWorkspace.length > 0) {
      console.log(`2. Assign ${regularWithoutWorkspace.length} regular user(s) to a workspace`);
      fixCount++;
    }
    
    if (fixCount === 0) {
      console.log('✅ No fixes needed! All assignments are correct.\n');
      process.exit(0);
    }
    
    console.log('\n⚠️  Run with --fix flag to apply these changes');
    console.log('   Example: node check-workspace-assignments.js --fix\n');
    
    // If --fix flag is provided, apply fixes
    if (process.argv.includes('--fix')) {
      console.log('\n🔧 APPLYING FIXES...\n');
      
      // Fix 1: Remove workspace from system admins
      if (adminsWithWorkspace.length > 0) {
        console.log('1. Removing workspace from system admins...');
        for (const admin of adminsWithWorkspace) {
          await User.updateOne(
            { _id: admin._id },
            { $unset: { workspaceId: 1 } }
          );
          console.log(`   ✅ Removed workspace from ${admin.email}`);
        }
      }
      
      // Fix 2: Assign regular users to workspace (if needed)
      if (regularWithoutWorkspace.length > 0) {
        console.log('\n2. Assigning regular users to workspace...');
        
        // Find or use default workspace
        let defaultWorkspace = await Workspace.findOne({ type: 'COMMUNITY' });
        
        if (!defaultWorkspace) {
          console.log('   ⚠️  No COMMUNITY workspace found. Please create one first.');
        } else {
          for (const user of regularWithoutWorkspace) {
            await User.updateOne(
              { _id: user._id },
              { $set: { workspaceId: defaultWorkspace._id } }
            );
            console.log(`   ✅ Assigned ${user.email} to ${defaultWorkspace.name}`);
          }
        }
      }
      
      console.log('\n✅ All fixes applied!\n');
    }
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

reviewAndFixWorkspaceAssignments();
