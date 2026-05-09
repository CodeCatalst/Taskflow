import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const outputPath = path.join(__dirname, '..', 'user-list.json');

const serializeWorkspaceMemberships = (workspaces) => {
  if (!Array.isArray(workspaces)) {
    return [];
  }

  return workspaces.map((membership) => ({
    workspaceId: membership.workspaceId ? membership.workspaceId.toString() : null,
    role: membership.role || null,
    joinedAt: membership.joinedAt || null,
    isActive: Boolean(membership.isActive),
  }));
};

async function exportUsersList() {
  try {
    await connectDB();

    const users = await User.find({})
      .select('full_name email role employmentStatus workspaceId currentWorkspaceId workspaces isEmailVerified created_at updated_at')
      .lean();

    const normalizedUsers = users.map((user) => ({
      id: user._id.toString(),
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      employmentStatus: user.employmentStatus || null,
      workspaceId: user.workspaceId ? user.workspaceId.toString() : null,
      currentWorkspaceId: user.currentWorkspaceId ? user.currentWorkspaceId.toString() : null,
      workspaces: serializeWorkspaceMemberships(user.workspaces),
      isEmailVerified: Boolean(user.isEmailVerified),
      created_at: user.created_at || null,
      updated_at: user.updated_at || null,
    }));

    await fs.writeFile(outputPath, JSON.stringify(normalizedUsers, null, 2), 'utf8');

    console.log(`Exported ${normalizedUsers.length} user(s) to ${outputPath}`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to export users list:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

exportUsersList();