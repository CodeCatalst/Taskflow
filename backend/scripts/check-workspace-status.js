import mongoose from 'mongoose';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import connectDB from '../config/db.js';

async function checkWorkspaceStatus() {
  try {
    await connectDB();
    
    console.log('\n📊 WORKSPACE STATUS CHECK\n');
    console.log('='.repeat(60));
    
    // 1. Check all users
    const allUsers = await User.find({}).select('email role workspaceId');
    console.log(`\n👥 Total Users: ${allUsers.length}`);
    
    // 2. Users without workspace
    const noWorkspace = allUsers.filter(u => !u.workspaceId && u.role !== 'admin');
    console.log(`\n⚠️  Users WITHOUT workspace (non-admin): ${noWorkspace.length}`);
    if (noWorkspace.length > 0) {
      noWorkspace.forEach(u => {
        console.log(`   ❌ ${u.email} (${u.role}) - NO WORKSPACE`);
      });
    }
    
    // 3. System admins
    const systemAdmins = allUsers.filter(u => !u.workspaceId && u.role === 'admin');
    console.log(`\n👑 System Admins (no workspace needed): ${systemAdmins.length}`);
    systemAdmins.forEach(u => {
      console.log(`   ✅ ${u.email}`);
    });
    
    // 4. All workspaces
    const workspaces = await Workspace.find({});
    console.log(`\n📦 Total Workspaces: ${workspaces.length}`);
    
    for (const ws of workspaces) {
      const wsUsers = allUsers.filter(u => u.workspaceId?.toString() === ws._id.toString());
      console.log(`\n   Workspace: ${ws.name}`);
      console.log(`   Type: ${ws.type}`);
      console.log(`   Active: ${ws.isActive}`);
      console.log(`   Users: ${wsUsers.length}`);
      console.log(`   Usage: ${ws.usage?.userCount || 0} users, ${ws.usage?.taskCount || 0} tasks, ${ws.usage?.teamCount || 0} teams`);
      
      if (wsUsers.length > 0) {
        console.log(`   Members:`);
        wsUsers.forEach(u => {
          console.log(`     - ${u.email} (${u.role})`);
        });
      }
    }
    
    // 5. Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📋 SUMMARY\n');
    
    if (noWorkspace.length > 0) {
      console.log(`❌ PROBLEM FOUND: ${noWorkspace.length} users need workspace assignment`);
      console.log(`\n🔧 FIX: Run this command:`);
      console.log(`   node scripts/fix-workspace-context.js\n`);
    } else {
      console.log(`✅ All users properly configured!`);
      if (workspaces.length === 0) {
        console.log(`⚠️  No workspaces found - users will be created without workspace`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

checkWorkspaceStatus();
