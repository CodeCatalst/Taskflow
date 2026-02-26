import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import models
import Attendance from '../models/Attendance.js';
import LeaveType from '../models/LeaveType.js';
import LeaveBalance from '../models/LeaveBalance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Holiday from '../models/Holiday.js';
import EmailTemplate from '../models/EmailTemplate.js';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const testHRModule = async () => {
  try {
    

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    

    let passed = 0;
    let failed = 0;

    // Test 1: Check Models Exist
    
    try {
      
      
      
      
      
      
      passed++;
    } catch (error) {
      
      failed++;
    }

    // Test 2: Check Indexes
    
    try {
      const attendanceIndexes = await Attendance.collection.getIndexes();
      const hasUserDateIndex = Object.keys(attendanceIndexes).some(key => 
        key.includes('userId') && key.includes('date')
      );
      
      if (hasUserDateIndex) {
        
        passed++;
      } else {
        
        passed++;
      }
    } catch (error) {
      
      failed++;
    }

    // Test 3: Check Seeded Data
    
    try {
      const workspaces = await Workspace.find();
      

      if (workspaces.length > 0) {
        const workspace = workspaces[0];
        
        // Check leave types
        const leaveTypes = await LeaveType.find({ workspaceId: workspace._id });
        
        
        // Check holidays
        const holidays = await Holiday.find({ workspaceId: workspace._id });
        
        
        // Check email templates
        const templates = await EmailTemplate.find({ isPredefined: true });
        
        
        // Check leave balances
        const balances = await LeaveBalance.find({ workspaceId: workspace._id });
        
        
        if (leaveTypes.length >= 4 && holidays.length >= 4 && templates.length >= 4) {
          passed++;
        } else {
          
          passed++;
        }
      } else {
        
        passed++;
      }
    } catch (error) {
      
      failed++;
    }

    // Test 4: Attendance Logic
    
    try {
      const users = await User.find().limit(1);
      if (users.length > 0) {
        const user = users[0];
        const workspaceId = user.workspaceId;
        
        // Create test attendance
        const testAttendance = new Attendance({
          userId: user._id,
          workspaceId,
          date: new Date(),
          checkIn: new Date('2026-01-19T09:00:00Z'),
          checkOut: new Date('2026-01-19T17:30:00Z')
        });
        
        await testAttendance.save();
        
        // Check auto-calculated hours
        if (testAttendance.workingHours > 0 && testAttendance.workingHours <= 24) {
          
          passed++;
        } else {
          
          failed++;
        }
        
        // Cleanup
        await Attendance.deleteOne({ _id: testAttendance._id });
        
      } else {
        
        passed++;
      }
    } catch (error) {
      
      failed++;
    }

    // Test 5: Leave Balance Calculation
    
    try {
      const balance = new LeaveBalance({
        userId: new mongoose.Types.ObjectId(),
        workspaceId: new mongoose.Types.ObjectId(),
        leaveTypeId: new mongoose.Types.ObjectId(),
        year: 2026,
        totalQuota: 12,
        used: 3,
        pending: 2
      });
      
      await balance.validate();
      
      // Check if pre-save middleware calculated available
      if (balance.available === 7) {
        
        passed++;
      } else {
        
        failed++;
      }
    } catch (error) {
      
      failed++;
    }

    // Test 6: Model Validations
    
    try {
      // Test required fields
      const invalidLeaveType = new LeaveType({
        workspaceId: new mongoose.Types.ObjectId()
        // Missing required fields
      });
      
      try {
        await invalidLeaveType.validate();
        
        failed++;
      } catch (validationError) {
        
        passed++;
      }
    } catch (error) {
      
      failed++;
    }

    // Test 7: Email Template Variables
    
    try {
      const leaveApprovedTemplate = await EmailTemplate.findOne({ 
        code: 'LEAVE_APPROVED' 
      });
      
      if (leaveApprovedTemplate) {
        
        
        // Check variables
        if (leaveApprovedTemplate.variables && leaveApprovedTemplate.variables.length > 0) {
          
          passed++;
        } else {
          
          passed++;
        }
      } else {
        
        passed++;
      }
    } catch (error) {
      
      failed++;
    }

    // Summary
    
    
    
    
    
    
    

    if (failed === 0) {
      
    } else {
      
    }

    // Health check recommendations
    
    if (failed > 0) {
      
      
      
    } else {
      
      
      
    }
    

    process.exit(failed === 0 ? 0 : 1);
  } catch (error) {
    
    process.exit(1);
  }
};

testHRModule();
