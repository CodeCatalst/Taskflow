import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Team from '../models/Team.js';

dotenv.config();

async function testRemovalLogic() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const hrTeam = await Team.findById('69541fbba997f1bdbe5d8e88')
      .populate('hr_id lead_id members');

    console.log('═══════════════════════════════════════════════════');
    console.log('🔍 HR TEAM MEMBER REMOVAL ANALYSIS');
    console.log('═══════════════════════════════════════════════════\n');
    
    console.log(`Team: ${hrTeam.name}`);
    console.log(`HR: ${hrTeam.hr_id.full_name} (${hrTeam.hr_id._id})`);
    console.log(`Lead: ${hrTeam.lead_id.full_name} (${hrTeam.lead_id._id})`);
    console.log(`\nMembers:`);

    hrTeam.members.forEach((member, idx) => {
      const isHR = hrTeam.hr_id._id.toString() === member._id.toString();
      const isLead = hrTeam.lead_id._id.toString() === member._id.toString();
      const canRemove = !isHR && !isLead;
      const status = canRemove ? '✅ CAN REMOVE' : '🔒 CANNOT REMOVE';
      const role = isHR && isLead ? '(HR & Lead)' : isHR ? '(HR)' : isLead ? '(Lead)' : '';
      
      console.log(`${idx + 1}. ${member.full_name} ${role}`);
      console.log(`   ID: ${member._id}`);
      console.log(`   Status: ${status}`);
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════');
    console.log('📋 SUMMARY');
    console.log('═══════════════════════════════════════════════════\n');
    
    const removableMembers = hrTeam.members.filter(m => 
      m._id.toString() !== hrTeam.hr_id._id.toString() && 
      m._id.toString() !== hrTeam.lead_id._id.toString()
    );
    
    console.log(`✅ Removable members: ${removableMembers.length}`);
    removableMembers.forEach(m => console.log(`   - ${m.full_name}`));
    
    const protectedMembers = hrTeam.members.filter(m => 
      m._id.toString() === hrTeam.hr_id._id.toString() || 
      m._id.toString() === hrTeam.lead_id._id.toString()
    );
    
    console.log(`\n🔒 Protected members: ${protectedMembers.length}`);
    protectedMembers.forEach(m => {
      const isHR = hrTeam.hr_id._id.toString() === m._id.toString();
      const isLead = hrTeam.lead_id._id.toString() === m._id.toString();
      const role = isHR && isLead ? 'HR & Lead' : isHR ? 'HR' : 'Lead';
      console.log(`   - ${m.full_name} (${role})`);
    });

    console.log('\n✨ Analysis complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testRemovalLogic();
