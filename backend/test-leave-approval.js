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
    console.log('✅ Connected to MongoDB');

    // Find an HR or Admin user
    const hrUser = await User.findOne({ role: { $in: ['hr', 'admin'] } });
    if (!hrUser) {
      console.log('❌ No HR or Admin user found in the database');
      return;
    }
    console.log(`✅ Found HR/Admin user: ${hrUser.full_name} (${hrUser.role})`);

    // Find a pending leave request
    const pendingLeave = await LeaveRequest.findOne({ status: 'pending' })
      .populate('userId')
      .populate('leaveTypeId');
    
    if (!pendingLeave) {
      console.log('⚠️  No pending leave requests found to test');
      return;
    }

    console.log(`\n📋 Testing with leave request:`);
    console.log(`   Employee: ${pendingLeave.userId.full_name}`);
    console.log(`   Leave Type: ${pendingLeave.leaveTypeId.name}`);
    console.log(`   Days: ${pendingLeave.days}`);
    console.log(`   Status: ${pendingLeave.status}`);

    // Get current balance
    const currentYear = new Date().getFullYear();
    const balanceBefore = await LeaveBalance.findOne({
      userId: pendingLeave.userId._id,
      leaveTypeId: pendingLeave.leaveTypeId._id,
      year: currentYear
    });

    console.log(`\n📊 Balance BEFORE approval:`);
    console.log(`   Total: ${balanceBefore?.total || 0}`);
    console.log(`   Used: ${balanceBefore?.used || 0}`);
    console.log(`   Available: ${balanceBefore?.available || 0}`);
    console.log(`   Pending: ${balanceBefore?.pending || 0}`);

    // Test approval
    console.log(`\n🔄 Approving leave request...`);
    const result = await HrActionService.approveLeave(
      hrUser,
      pendingLeave._id.toString(),
      hrUser.workspaceId.toString(),
      '127.0.0.1'
    );

    console.log(`✅ Leave approved successfully!`);
    console.log(`   Event: ${result.event}`);

    // Check updated leave request
    const updatedLeave = await LeaveRequest.findById(pendingLeave._id);
    console.log(`\n📝 Leave request AFTER approval:`);
    console.log(`   Status: ${updatedLeave.status}`);
    console.log(`   Approved By: ${updatedLeave.approvedBy}`);
    console.log(`   Approved At: ${updatedLeave.approvedAt}`);

    // Check updated balance
    const balanceAfter = await LeaveBalance.findOne({
      userId: pendingLeave.userId._id,
      leaveTypeId: pendingLeave.leaveTypeId._id,
      year: currentYear
    });

    console.log(`\n📊 Balance AFTER approval:`);
    console.log(`   Total: ${balanceAfter?.total || 0}`);
    console.log(`   Used: ${balanceAfter?.used || 0}`);
    console.log(`   Available: ${balanceAfter?.available || 0}`);
    console.log(`   Pending: ${balanceAfter?.pending || 0}`);

    console.log(`\n✅ Test completed successfully!`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the test
testLeaveApproval();
