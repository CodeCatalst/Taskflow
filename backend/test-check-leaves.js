import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import LeaveRequest from './models/LeaveRequest.js';
import LeaveType from './models/LeaveType.js';
import User from './models/User.js';
import Workspace from './models/Workspace.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function checkLeaveRequests() {
  try {
    await connectDB();
    
    // Get all leave requests
    const allRequests = await LeaveRequest.find({})
      .populate('userId', 'full_name email role')
      .populate('workspaceId', 'name type')
      .populate('leaveTypeId', 'name code')
      .lean();
    
    if (allRequests.length === 0) {
      } else {
      allRequests.forEach((req, idx) => {
        `);
        `);
        .split('T')[0]} to ${req.endDate?.toISOString().split('T')[0]}`);
        });
    }
    
    // Get all workspaces
    const workspaces = await Workspace.find({}).lean();
    workspaces.forEach((ws, idx) => {
      - Type: ${ws.type}, Active: ${ws.isActive}`);
    });
    
    // Get all users with admin/hr role
    const adminHrUsers = await User.find({ role: { $in: ['admin', 'hr'] } })
      .select('full_name email role workspaceId workspaces currentWorkspaceId')
      .lean();
    
    adminHrUsers.forEach((user, idx) => {
      `);
      }`);
      });
    
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

checkLeaveRequests();
