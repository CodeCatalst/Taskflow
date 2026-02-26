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
    
    
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const users = await User.find({}).select('email role workspaceId').lean();
    
    
    let noWorkspace = 0;
    users.forEach(u => {
      const hasWorkspace = u.workspaceId ? '✅' : '❌';
      
      if (!u.workspaceId && u.role !== 'admin') noWorkspace++;
    });
    
    
    
    if (noWorkspace > 0) {
      
    }
    
    process.exit(0);
  } catch (error) {
    
    process.exit(1);
  }
}

quickCheck();
