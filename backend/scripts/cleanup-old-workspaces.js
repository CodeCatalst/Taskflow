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
    
    
    
    // Find COMMUNITY workspaces
    const communityWorkspaces = await Workspace.find({ type: 'COMMUNITY' });
    
    if (communityWorkspaces.length === 0) {
      
      process.exit(0);
    }
    
    
    communityWorkspaces.forEach(ws => {
      
      
      
    });
    
    
    
    
    
    
    if (process.argv.includes('--confirm')) {
      
      
      for (const ws of communityWorkspaces) {
        await Workspace.deleteOne({ _id: ws._id });
        
      }
      
      
    }
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    
    process.exit(1);
  }
}

cleanupOldWorkspaces();
