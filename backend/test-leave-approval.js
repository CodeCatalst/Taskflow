/**
 * Test script to verify leave approval/rejection functionality
 * Run this after fixing the hrActionService.js
 */

import mongoose from 'mongoose';
import User from './models/User.js';
import LeaveRequest from './models/LeaveRequest.js';
import LeaveBalance from './models/LeaveBalance.js';
import LeaveType from './models/LeaveType.js';
import HrActionService from './services/hrActionService.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskflow';

async function testLeaveApproval() {
  try {
    await mongoose.connect(MONGODB_URI);
    // Find an HR or Admin user
    const hrUser = await User.findOne({ role: { $in: ['hr', 'admin'] } });
    if (!hrUser) {
      return;
    }
    `);

    // Find a pending leave request
    const pendingLeave = await LeaveRequest.findOne({ status: 'pending' })
      .populate('userId')
      .populate('leaveTypeId');
    
    if (!pendingLeave) {
      return;
    }

    // Get current balance
    const currentYear = new Date().getFullYear();
    const balanceBefore = await LeaveBalance.findOne({
      userId: pendingLeave.userId._id,
      leaveTypeId: pendingLeave.leaveTypeId._id,
      year: currentYear
    });

    // Test approval
    const result = await HrActionService.approveLeave(
      hrUser,
      pendingLeave._id.toString(),
      hrUser.workspaceId.toString(),
      '127.0.0.1'
    );

    // Check updated leave request
    const updatedLeave = await LeaveRequest.findById(pendingLeave._id);
    // Check updated balance
    const balanceAfter = await LeaveBalance.findOne({
      userId: pendingLeave.userId._id,
      leaveTypeId: pendingLeave.leaveTypeId._id,
      year: currentYear
    });

    } catch (error) {
    } finally {
    await mongoose.disconnect();
    }
}

// Run the test
testLeaveApproval();
