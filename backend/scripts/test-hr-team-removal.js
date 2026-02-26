import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Team from '../models/Team.js';

dotenv.config();

async function testRemovalLogic() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const hrTeam = await Team.findById('69541fbba997f1bdbe5d8e88')
      .populate('hr_id lead_id members');

    `);
    `);
    hrTeam.members.forEach((member, idx) => {
      const isHR = hrTeam.hr_id._id.toString() === member._id.toString();
      const isLead = hrTeam.lead_id._id.toString() === member._id.toString();
      const canRemove = !isHR && !isLead;
      const status = canRemove ? '✅ CAN REMOVE' : '🔒 CANNOT REMOVE';
      const role = isHR && isLead ? '(HR & Lead)' : isHR ? '(HR)' : isLead ? '(Lead)' : '';
      
      });

    const removableMembers = hrTeam.members.filter(m => 
      m._id.toString() !== hrTeam.hr_id._id.toString() && 
      m._id.toString() !== hrTeam.lead_id._id.toString()
    );
    
    removableMembers.forEach(m => );
    
    const protectedMembers = hrTeam.members.filter(m => 
      m._id.toString() === hrTeam.hr_id._id.toString() || 
      m._id.toString() === hrTeam.lead_id._id.toString()
    );
    
    protectedMembers.forEach(m => {
      const isHR = hrTeam.hr_id._id.toString() === m._id.toString();
      const isLead = hrTeam.lead_id._id.toString() === m._id.toString();
      const role = isHR && isLead ? 'HR & Lead' : isHR ? 'HR' : 'Lead';
      `);
    });

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

testRemovalLogic();
