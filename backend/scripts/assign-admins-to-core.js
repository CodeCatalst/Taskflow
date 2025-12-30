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
    
    console.log('🔍 Checking admin workspace assignments...\n');
    
    // Get CORE workspace
    const coreWorkspace = await Workspace.findOne({ type: 'CORE' });
    if (!coreWorkspace) {
      console.log('❌ No CORE workspace found!');
      process.exit(1);
    }
    
    console.log(`📦 CORE Workspace: ${coreWorkspace.name}`);
    console.log(`   ID: ${coreWorkspace._id}\n`);
    
    // Find system admins without workspace
    const adminsWithoutWorkspace = await User.find({
      role: 'admin',
      $or: [
        { workspaceId: { $exists: false } },
        { workspaceId: null }
      ]
    });
    
    console.log(`👤 System Admins without workspace: ${adminsWithoutWorkspace.length}`);
    adminsWithoutWorkspace.forEach(admin => {
      console.log(`   - ${admin.email} (${admin.full_name})`);
    });
    
    // Find admins with different workspace
    const adminsWithOtherWorkspace = await User.find({
      role: 'admin',
      workspaceId: { $exists: true, $ne: null, $ne: coreWorkspace._id }
    }).populate('workspaceId', 'name type');
    
    if (adminsWithOtherWorkspace.length > 0) {
      console.log(`\n👤 System Admins with different workspace: ${adminsWithOtherWorkspace.length}`);
      adminsWithOtherWorkspace.forEach(admin => {
        console.log(`   - ${admin.email} → ${admin.workspaceId?.name || 'Unknown'}`);
      });
    }
    
    const totalToUpdate = adminsWithoutWorkspace.length + adminsWithOtherWorkspace.length;
    
    if (totalToUpdate === 0) {
      console.log('\n✅ All system admins already assigned to CORE workspace!\n');
      process.exit(0);
    }
    
    console.log(`\n🔧 Assigning ${totalToUpdate} system admin(s) to CORE workspace...\n`);
    
    // Update admins without workspace
    for (const admin of adminsWithoutWorkspace) {
      await User.updateOne(
        { _id: admin._id },
        { $set: { workspaceId: coreWorkspace._id } }
      );
      console.log(`   ✅ Assigned ${admin.email} to CORE workspace`);
    }
    
    // Update admins with other workspace
    for (const admin of adminsWithOtherWorkspace) {
      await User.updateOne(
        { _id: admin._id },
        { $set: { workspaceId: coreWorkspace._id } }
      );
      console.log(`   ✅ Moved ${admin.email} to CORE workspace`);
    }
    
    // Update workspace user count
    const userCount = await User.countDocuments({ workspaceId: coreWorkspace._id });
    await Workspace.updateOne(
      { _id: coreWorkspace._id },
      { $set: { 'usage.userCount': userCount } }
    );
    
    console.log(`\n✅ All ${totalToUpdate} system admin(s) now in CORE workspace`);
    console.log(`📊 CORE workspace total users: ${userCount}\n`);
    console.log('🔐 Admins must logout and login to see the workspace change.\n');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

assignAdminsToCoreWorkspace();
