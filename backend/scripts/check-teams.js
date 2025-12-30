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
    
    console.log('🔍 Checking teams and workspace assignments...\n');
    
    // Get CORE workspace
    const coreWorkspace = await Workspace.findOne({ type: 'CORE' });
    if (!coreWorkspace) {
      console.log('❌ No CORE workspace found!');
      process.exit(1);
    }
    
    console.log(`📦 CORE Workspace: ${coreWorkspace.name}`);
    console.log(`   ID: ${coreWorkspace._id}\n`);
    
    // Get all teams
    const allTeams = await Team.find({})
      .populate('workspaceId', 'name type')
      .populate('hr_id', 'full_name email')
      .populate('lead_id', 'full_name email')
      .populate('members', 'full_name email');
    
    console.log(`👥 Total teams in database: ${allTeams.length}\n`);
    
    // Teams with workspace
    const teamsWithWorkspace = allTeams.filter(t => t.workspaceId);
    const teamsWithoutWorkspace = allTeams.filter(t => !t.workspaceId);
    
    console.log(`✅ Teams with workspace: ${teamsWithWorkspace.length}`);
    teamsWithWorkspace.forEach(team => {
      console.log(`   - ${team.name} → ${team.workspaceId?.name || 'Unknown'} (${team.members?.length || 0} members)`);
    });
    
    if (teamsWithoutWorkspace.length > 0) {
      console.log(`\n❌ Teams without workspace: ${teamsWithoutWorkspace.length}`);
      teamsWithoutWorkspace.forEach(team => {
        console.log(`   - ${team.name} (${team.members?.length || 0} members)`);
      });
    }
    
    // Check if teams are in CORE workspace
    const teamsInCore = allTeams.filter(t => t.workspaceId?._id?.toString() === coreWorkspace._id.toString());
    const teamsInOtherWorkspace = allTeams.filter(t => t.workspaceId && t.workspaceId._id?.toString() !== coreWorkspace._id.toString());
    
    console.log(`\n📊 Teams in CORE workspace: ${teamsInCore.length}`);
    if (teamsInOtherWorkspace.length > 0) {
      console.log(`⚠️  Teams in other workspaces: ${teamsInOtherWorkspace.length}`);
      teamsInOtherWorkspace.forEach(team => {
        console.log(`   - ${team.name} → ${team.workspaceId?.name}`);
      });
    }
    
    // Propose fix
    const needsFix = teamsWithoutWorkspace.length + teamsInOtherWorkspace.length;
    
    if (needsFix > 0) {
      console.log(`\n🔧 PROPOSED FIX:`);
      console.log(`   Assign ${needsFix} team(s) to CORE workspace`);
      console.log('\n   Run with --fix flag to apply changes');
      console.log('   Example: node check-teams.js --fix\n');
      
      if (process.argv.includes('--fix')) {
        console.log('\n🔧 FIXING TEAM ASSIGNMENTS...\n');
        
        // Fix teams without workspace
        for (const team of teamsWithoutWorkspace) {
          await Team.updateOne(
            { _id: team._id },
            { $set: { workspaceId: coreWorkspace._id } }
          );
          console.log(`   ✅ Assigned ${team.name} to CORE workspace`);
        }
        
        // Fix teams in other workspaces
        for (const team of teamsInOtherWorkspace) {
          await Team.updateOne(
            { _id: team._id },
            { $set: { workspaceId: coreWorkspace._id } }
          );
          console.log(`   ✅ Moved ${team.name} to CORE workspace`);
        }
        
        // Update workspace team count
        const teamCount = await Team.countDocuments({ workspaceId: coreWorkspace._id });
        await Workspace.updateOne(
          { _id: coreWorkspace._id },
          { $set: { 'usage.teamCount': teamCount } }
        );
        
        console.log(`\n✅ All teams now in CORE workspace`);
        console.log(`📊 CORE workspace team count: ${teamCount}\n`);
      }
    } else {
      console.log('\n✅ All teams correctly assigned to CORE workspace!\n');
    }
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkTeams();
