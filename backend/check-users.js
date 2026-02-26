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
    const users = await User.find({}).select('full_name email role workspaceId');
    users.forEach((user, index) => {
      - Role: ${user.role} - Workspace: ${user.workspaceId || 'SYSTEM'}`);
    });

    if (users.length === 0) {
      } else {
      // Check if there's an admin user
      const adminUser = users.find(u => u.role === 'admin');
      if (adminUser) {
        `);

        // Ask if user wants to update a user to HR role
        ');
        // For now, let's update the first non-admin user to have HR role for testing
        const nonAdminUsers = users.filter(u => u.role !== 'admin');
        if (nonAdminUsers.length > 0) {
          const userToUpdate = nonAdminUsers[0];
          await User.findByIdAndUpdate(userToUpdate._id, { role: 'hr' });
          }
      } else {
        }
    }

    await mongoose.disconnect();
    } catch (error) {
    }
}

checkAndUpdateUsers();