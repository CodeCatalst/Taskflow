import mongoose from 'mongoose';
import Workspace from '../models/Workspace.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function cleanupOldWorkspaces() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('🔍 Finding old workspaces to clean up...\n');
    
    // Find COMMUNITY workspaces
    const communityWorkspaces = await Workspace.find({ type: 'COMMUNITY' });
    
    if (communityWorkspaces.length === 0) {
      console.log('✅ No COMMUNITY workspaces to clean up!\n');
      process.exit(0);
    }
    
    console.log(`🗑️  Found ${communityWorkspaces.length} COMMUNITY workspace(s) to delete:\n`);
    communityWorkspaces.forEach(ws => {
      console.log(`   - ${ws.name} (${ws.type})`);
      console.log(`     ID: ${ws._id}`);
      console.log(`     Usage: ${ws.usage?.userCount || 0} users, ${ws.usage?.taskCount || 0} tasks\n`);
    });
    
    console.log('⚠️  WARNING: This will permanently delete these workspaces!');
    console.log('    All users and tasks should already be moved to CORE workspace.\n');
    console.log('    Run with --confirm flag to proceed');
    console.log('    Example: node cleanup-old-workspaces.js --confirm\n');
    
    if (process.argv.includes('--confirm')) {
      console.log('🗑️  DELETING OLD WORKSPACES...\n');
      
      for (const ws of communityWorkspaces) {
        await Workspace.deleteOne({ _id: ws._id });
        console.log(`   ✅ Deleted: ${ws.name}`);
      }
      
      console.log('\n✅ Cleanup complete!\n');
    }
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupOldWorkspaces();
