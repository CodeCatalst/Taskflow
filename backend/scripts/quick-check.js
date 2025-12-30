import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function quickCheck() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const users = await User.find({}).select('email role workspaceId').lean();
    
    console.log('📊 User Status:\n');
    let noWorkspace = 0;
    users.forEach(u => {
      const hasWorkspace = u.workspaceId ? '✅' : '❌';
      console.log(`${hasWorkspace} ${u.email} (${u.role}) - workspace: ${u.workspaceId || 'NONE'}`);
      if (!u.workspaceId && u.role !== 'admin') noWorkspace++;
    });
    
    console.log(`\n⚠️  Users without workspace: ${noWorkspace}`);
    
    if (noWorkspace > 0) {
      console.log('\n🔧 FIX: Run "node scripts/fix-workspace-context.js"');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

quickCheck();
