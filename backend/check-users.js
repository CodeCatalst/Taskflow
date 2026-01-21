import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function checkAndUpdateUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const users = await User.find({}).select('full_name email role workspaceId');
    console.log('\n👥 Users in database:');
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.full_name} (${user.email}) - Role: ${user.role} - Workspace: ${user.workspaceId || 'SYSTEM'}`);
    });

    if (users.length === 0) {
      console.log('\n❌ No users found in database');
      console.log('💡 You may need to create users first');
    } else {
      // Check if there's an admin user
      const adminUser = users.find(u => u.role === 'admin');
      if (adminUser) {
        console.log(`\n👑 Found admin user: ${adminUser.full_name} (${adminUser.email})`);

        // Ask if user wants to update a user to HR role
        console.log('\n🔧 To give HR access to a user, you can:');
        console.log('   1. Use the User Management page (if you have admin access)');
        console.log('   2. Or run this script with an email parameter to update a user');

        // For now, let's update the first non-admin user to have HR role for testing
        const nonAdminUsers = users.filter(u => u.role !== 'admin');
        if (nonAdminUsers.length > 0) {
          const userToUpdate = nonAdminUsers[0];
          console.log(`\n🔄 Updating ${userToUpdate.full_name} to HR role for testing...`);

          await User.findByIdAndUpdate(userToUpdate._id, { role: 'hr' });
          console.log(`✅ Updated ${userToUpdate.full_name} to HR role`);
          console.log(`🔑 They can now access HR Dashboard with email: ${userToUpdate.email}`);
        }
      } else {
        console.log('\n⚠️  No admin user found. You may need to create one first.');
      }
    }

    await mongoose.disconnect();
    console.log('\n🔌 Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAndUpdateUsers();