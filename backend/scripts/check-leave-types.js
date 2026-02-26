import mongoose from 'mongoose';
import LeaveType from '../models/LeaveType.js';
import Workspace from '../models/Workspace.js';

async function checkLeaveTypes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const workspaces = await Workspace.find({});
    const leaveTypes = await LeaveType.find({}).populate('workspaceId');
    // Group by workspace and name
    const grouped = {};
    leaveTypes.forEach(lt => {
      const workspaceName = lt.workspaceId?.name || 'Unknown';
      const key = `${workspaceName} - ${lt.name}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(lt._id);
    });

    Object.entries(grouped).forEach(([key, ids]) => {
      `);
      if (ids.length > 1) {
        }`);
      }
    });

    // Check for duplicates within each workspace
    const duplicates = Object.entries(grouped).filter(([_, ids]) => ids.length > 1);
    
    if (duplicates.length > 0) {
      } else {
      }

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

checkLeaveTypes();
