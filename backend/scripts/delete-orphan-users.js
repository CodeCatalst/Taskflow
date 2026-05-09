import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const hasActiveWorkspace = (user) => {
  if (user.workspaceId) {
    return true;
  }

  if (user.currentWorkspaceId) {
    return true;
  }

  if (!Array.isArray(user.workspaces) || user.workspaces.length === 0) {
    return false;
  }

  return user.workspaces.some((membership) => membership?.isActive);
};

async function deleteOrphanUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const candidates = await User.find({ role: { $ne: 'admin' } })
      .select('full_name email role workspaceId currentWorkspaceId workspaces')
      .lean();

    const orphanUsers = candidates.filter((user) => !hasActiveWorkspace(user));

    if (orphanUsers.length === 0) {
      console.log('No orphan users found.');
      process.exit(0);
    }

    console.log(`Found ${orphanUsers.length} orphan user(s) without any workspace assignment:`);
    orphanUsers.forEach((user) => {
      console.log(`- ${user.full_name} <${user.email}> (${user.role})`);
    });

    const shouldDelete = process.argv.includes('--confirm');
    if (!shouldDelete) {
      console.log('Dry run only. Re-run with --confirm to delete these users.');
      process.exit(0);
    }

    const deletedUserIds = orphanUsers.map((user) => user._id);
    const result = await User.deleteMany({ _id: { $in: deletedUserIds } });

    console.log(`Deleted ${result.deletedCount} orphan user(s).`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to delete orphan users:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

deleteOrphanUsers();