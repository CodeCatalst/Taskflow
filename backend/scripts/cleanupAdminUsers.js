import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Team from '../models/Team.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });



async function run() {
  try {
    await connectDB();

    

    // Find all admin users with team assignments
    const adminUsersWithTeams = await User.find({
      role: 'admin',
      team_id: { $ne: null, $exists: true }
    });

    if (adminUsersWithTeams.length === 0) {
      
      process.exit(0);
    }

    
    
    adminUsersWithTeams.forEach((user, index) => {
      
      
    });

    // Update all admin users to remove team assignments
    const result = await User.updateMany(
      { role: 'admin', team_id: { $ne: null } },
      { $set: { team_id: null, updated_at: new Date() } }
    );

    

    // Also check for teams named "Admin" (case-insensitive)
    
    
    const adminTeams = await Team.find({
      name: { $regex: /^admin$/i }
    });

    if (adminTeams.length > 0) {
      
      adminTeams.forEach((team, index) => {
        
      });
      
    } else {
      
    }

    
    
    
    
    

    process.exit(0);
  } catch (err) {
    
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

run();
