import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../config/db.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function restoreDivyBajpai() {
  try {
    await connectDB();

    const email = 'divybajpai25@gmail.com';
    const existing = await User.findOne({ email });

    if (existing) {
      console.log(`User already exists: ${existing.full_name} <${existing.email}> (${existing.role})`);
      process.exit(0);
    }

    const user = await User.create({
      full_name: 'Divy Bajpai',
      email,
      password_hash: 'TempPass123!',
      role: 'admin',
      employmentStatus: 'ACTIVE',
      workspaceId: null,
      currentWorkspaceId: '6953e4fa9d54cd8f9172a596',
      workspaces: [],
      isEmailVerified: false,
    });

    console.log(`Restored user: ${user.full_name} <${user.email}> (${user.role})`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to restore Divy Bajpai:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

restoreDivyBajpai();