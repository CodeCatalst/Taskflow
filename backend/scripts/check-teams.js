import mongoose from 'mongoose';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import Team from '../models/Team.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function checkTeams() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Get CORE workspace
    const coreWorkspace = await Workspace.findOne({ type: 'CORE' });
    if (!coreWorkspace) {
      process.exit(1);
    }
    
    // Get all teams
    const allTeams = await Team.find({})
      .populate('workspaceId', 'name type')
      .populate('hr_id', 'full_name email')
      .populate('lead_id', 'full_name email')
      .populate('members', 'full_name email');
    
    // Teams with workspace
    const teamsWithWorkspace = allTeams.filter(t => t.workspaceId);
    const teamsWithoutWorkspace = allTeams.filter(t => !t.workspaceId);
    
    teamsWithWorkspace.forEach(team => {
      `);
    });
    
    if (teamsWithoutWorkspace.length > 0) {
      teamsWithoutWorkspace.forEach(team => {
        `);
      });
    }
    
    // Check if teams are in CORE workspace
    const teamsInCore = allTeams.filter(t => t.workspaceId?._id?.toString() === coreWorkspace._id.toString());
    const teamsInOtherWorkspace = allTeams.filter(t => t.workspaceId && t.workspaceId._id?.toString() !== coreWorkspace._id.toString());
    
    if (teamsInOtherWorkspace.length > 0) {
      teamsInOtherWorkspace.forEach(team => {
        });
    }
    
    // Propose fix
    const needsFix = teamsWithoutWorkspace.length + teamsInOtherWorkspace.length;
    
    if (needsFix > 0) {
      to CORE workspace`);
      if (process.argv.includes('--fix')) {
        // Fix teams without workspace
        for (const team of teamsWithoutWorkspace) {
          await Team.updateOne(
            { _id: team._id },
            { $set: { workspaceId: coreWorkspace._id } }
          );
          }
        
        // Fix teams in other workspaces
        for (const team of teamsInOtherWorkspace) {
          await Team.updateOne(
            { _id: team._id },
            { $set: { workspaceId: coreWorkspace._id } }
          );
          }
        
        // Update workspace team count
        const teamCount = await Team.countDocuments({ workspaceId: coreWorkspace._id });
        await Workspace.updateOne(
          { _id: coreWorkspace._id },
          { $set: { 'usage.teamCount': teamCount } }
        );
        
        }
    } else {
      }
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    process.exit(1);
  }
}

checkTeams();
