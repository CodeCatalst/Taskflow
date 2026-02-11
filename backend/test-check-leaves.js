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
    
    console.log('\n📊 Checking Leave Requests in Database...\n');
    
    // Get all leave requests
    const allRequests = await LeaveRequest.find({})
      .populate('userId', 'full_name email role')
      .populate('workspaceId', 'name type')
      .populate('leaveTypeId', 'name code')
      .lean();
    
    console.log(`Total Leave Requests: ${allRequests.length}\n`);
    
    if (allRequests.length === 0) {
      console.log('❌ No leave requests found in database!');
    } else {
      allRequests.forEach((req, idx) => {
        console.log(`${idx + 1}. Request ID: ${req._id}`);
        console.log(`   User: ${req.userId?.full_name} (${req.userId?.email})`);
        console.log(`   Role: ${req.userId?.role}`);
        console.log(`   Workspace: ${req.workspaceId?.name} (${req.workspaceId?._id})`);
        console.log(`   Type: ${req.leaveTypeId?.name}`);
        console.log(`   Status: ${req.status}`);
        console.log(`   Dates: ${req.startDate?.toISOString().split('T')[0]} to ${req.endDate?.toISOString().split('T')[0]}`);
        console.log(`   Days: ${req.days}`);
        console.log('');
      });
    }
    
    // Get all workspaces
    console.log('\n📍 Workspaces in Database:\n');
    const workspaces = await Workspace.find({}).lean();
    workspaces.forEach((ws, idx) => {
      console.log(`${idx + 1}. ${ws.name} (${ws._id}) - Type: ${ws.type}, Active: ${ws.isActive}`);
    });
    
    // Get all users with admin/hr role
    console.log('\n👥 Admin/HR Users:\n');
    const adminHrUsers = await User.find({ role: { $in: ['admin', 'hr'] } })
      .select('full_name email role workspaceId workspaces currentWorkspaceId')
      .lean();
    
    adminHrUsers.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.full_name} (${user.email})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Legacy Workspace: ${user.workspaceId}`);
      console.log(`   Current Workspace: ${user.currentWorkspaceId}`);
      console.log(`   Multi-Workspaces: ${JSON.stringify(user.workspaces || [])}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkLeaveRequests();
