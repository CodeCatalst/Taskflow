import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function fixUserWorkspaces() {
  try {
    await connectDB();
    
    console.log('\n🔧 Fixing User Workspace Assignments...\n');
    
    // Find users with workspaceId but no currentWorkspaceId
    const usersToFix = await User.find({
      workspaceId: { $exists: true, $ne: null },
      currentWorkspaceId: { $exists: false }
    });
    
    console.log(`Found ${usersToFix.length} users to fix\n`);
    
    for (const user of usersToFix) {
      user.currentWorkspaceId = user.workspaceId;
      await user.save();
      console.log(`✅ Fixed ${user.full_name} (${user.email}) - Set currentWorkspaceId to ${user.workspaceId}`);
    }
    
    // Also fix users where currentWorkspaceId is null
    const usersWithNullCurrent = await User.find({
      workspaceId: { $exists: true, $ne: null },
      currentWorkspaceId: null
    });
    
    console.log(`\nFound ${usersWithNullCurrent.length} users with null currentWorkspaceId\n`);
    
    for (const user of usersWithNullCurrent) {
      user.currentWorkspaceId = user.workspaceId;
      await user.save();
      console.log(`✅ Fixed ${user.full_name} (${user.email}) - Set currentWorkspaceId to ${user.workspaceId}`);
    }
    
    console.log('\n✨ Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixUserWorkspaces();
