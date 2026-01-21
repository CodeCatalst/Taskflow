import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { checkRole } from '../middleware/roleCheck.js';
import { requireCoreWorkspace } from '../middleware/workspaceGuard.js';
import LeaveRequest from '../models/LeaveRequest.js';
import LeaveBalance from '../models/LeaveBalance.js';
import LeaveType from '../models/LeaveType.js';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import { logChange } from '../utils/changeLogService.js';
import getClientIP from '../utils/getClientIP.js';
import HrActionService from '../services/hrActionService.js';
import HrEventService from '../services/hrEventService.js';

const router = express.Router();

// Get all leave requests (filtered by status/user)
router.get('/', authenticate, requireCoreWorkspace, async (req, res) => {
  try {
    const { status, userId } = req.query;
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;

    const query = { workspaceId };

    // Members see only their own requests
    if (req.user.role === 'member') {
      query.userId = req.user._id;
    } else if (userId) {
      query.userId = userId;
    }

    if (status) {
      query.status = status;
    }

    const requests = await LeaveRequest.find(query)
      .populate('userId', 'full_name email profile_picture')
      .populate('leaveTypeId', 'name code color')
      .populate('approvedBy', 'full_name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, requests });
  } catch (error) {
    console.error('Get leave requests error:', error);
    res.status(500).json({ message: 'Failed to fetch leave requests' });
  }
});

// Create leave request
router.post('/', authenticate, requireCoreWorkspace, async (req, res) => {
  try {
    const { leaveTypeId, startDate, endDate, reason, days } = req.body;
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;

    // Validate leave type
    const leaveType = await LeaveType.findOne({ _id: leaveTypeId, workspaceId });
    if (!leaveType) {
      return res.status(404).json({ message: 'Leave type not found' });
    }

    // Check balance
    const currentYear = new Date().getFullYear();
    const balance = await LeaveBalance.findOne({
      userId: req.user._id,
      leaveTypeId,
      year: currentYear
    });

    if (!balance || balance.available < days) {
      return res.status(400).json({ message: 'Insufficient leave balance' });
    }

    // Create request
    const leaveRequest = new LeaveRequest({
      userId: req.user._id,
      workspaceId,
      leaveTypeId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      days,
      reason
    });

    await leaveRequest.save();

    // Update pending balance
    balance.pending += days;
    await balance.save();

    await logChange({
      userId: req.user._id,
      workspaceId,
      action: 'create',
      entity: 'leave_request',
      entityId: leaveRequest._id,
      details: { leaveType: leaveType.name, days, startDate, endDate },
      ipAddress: getClientIP(req)
    });

    // Send notification email to HR/Admin
    const hrUsers = await User.find({ 
      workspaceId, 
      role: { $in: ['admin', 'hr'] } 
    }).select('email full_name');

    // Log notification (email sending would go here)
    for (const hr of hrUsers) {
      console.log(`📧 [Email Queue] Leave request notification to ${hr.email}`);
      console.log(`   Employee: ${req.user.full_name}`);
      console.log(`   Leave Type: ${leaveType.name}`);
      console.log(`   Duration: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`);
    }

    res.status(201).json({ success: true, leaveRequest });
  } catch (error) {
    console.error('Create leave request error:', error);
    res.status(500).json({ message: 'Failed to create leave request' });
  }
});

// Approve/Reject leave request (HR Action-Driven)
router.patch('/:id/status', authenticate, checkRole(['admin', 'hr']), requireCoreWorkspace, async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;
    const ipAddress = getClientIP(req);

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be approved or rejected.' });
    }

    // Use HR Action Service for centralized state management
    let actionResult;
    if (status === 'approved') {
      actionResult = await HrActionService.approveLeave(req.user, req.params.id, workspaceId, ipAddress);
    } else {
      if (!rejectionReason || rejectionReason.trim() === '') {
        return res.status(400).json({ message: 'Rejection reason is required' });
      }
      actionResult = await HrActionService.rejectLeave(req.user, req.params.id, rejectionReason, workspaceId, ipAddress);
    }

    // Handle HR event for email dispatch
    await HrEventService.handleEvent(actionResult.event, actionResult.data, workspaceId);

    // Fetch updated leave request for response
    const updatedLeave = await LeaveRequest.findById(req.params.id)
      .populate('userId', 'full_name email profile_picture')
      .populate('leaveTypeId', 'name code color')
      .populate('approvedBy', 'full_name email');

    res.json({ success: true, leaveRequest: updatedLeave });
  } catch (error) {
    console.error('HR leave action error:', error);
    res.status(500).json({ message: error.message || 'Failed to process leave action' });
  }
});

// Get leave balance for a user
router.get('/balance/:userId?', authenticate, requireCoreWorkspace, async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.user._id;
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;

    // Members can only view their own balance
    if (req.user.role === 'member' && targetUserId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const currentYear = new Date().getFullYear();

    const balances = await LeaveBalance.find({
      userId: targetUserId,
      workspaceId,
      year: currentYear
    }).populate('leaveTypeId', 'name code color annualQuota');

    res.json({ success: true, balances });
  } catch (error) {
    console.error('Get leave balance error:', error);
    res.status(500).json({ message: 'Failed to fetch leave balance' });
  }
});

// Get all leave balances (for HR/Admin)
router.get('/balances', authenticate, checkRole(['admin', 'hr']), requireCoreWorkspace, async (req, res) => {
  try {
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;
    const currentYear = new Date().getFullYear();

    const balances = await LeaveBalance.find({
      workspaceId,
      year: currentYear
    })
    .populate('userId', 'full_name email profile_picture')
    .populate('leaveTypeId', 'name code color annualQuota')
    .sort({ 'userId.full_name': 1 });

    res.json({ success: true, balances });
  } catch (error) {
    console.error('Get all leave balances error:', error);
    res.status(500).json({ message: 'Failed to fetch leave balances' });
  }
});

// Cancel leave request (by employee, only if pending)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;

    const leaveRequest = await LeaveRequest.findOne({
      _id: req.params.id,
      workspaceId,
      userId: req.user._id
    });

    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (leaveRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot cancel processed request' });
    }

    // Restore pending balance
    const currentYear = new Date().getFullYear();
    const balance = await LeaveBalance.findOne({
      userId: req.user._id,
      leaveTypeId: leaveRequest.leaveTypeId,
      year: currentYear
    });

    if (balance) {
      balance.pending -= leaveRequest.days;
      await balance.save();
    }

    leaveRequest.status = 'cancelled';
    await leaveRequest.save();

    await logChange({
      userId: req.user._id,
      workspaceId,
      action: 'delete',
      entity: 'leave_request',
      entityId: leaveRequest._id,
      details: { action: 'cancelled' },
      ipAddress: getClientIP(req)
    });

    res.json({ success: true, message: 'Leave request cancelled' });
  } catch (error) {
    console.error('Cancel leave request error:', error);
    res.status(500).json({ message: 'Failed to cancel leave request' });
  }
});

export default router;
