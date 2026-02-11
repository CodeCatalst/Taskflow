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
// HR/Admin can see leave requests from ALL their workspaces
router.get('/', authenticate, requireCoreWorkspace, async (req, res) => {
  try {
    const { status, userId, workspaceId: filterWorkspaceId } = req.query;
    const workspaceId = req.context?.workspaceId || req.user.currentWorkspaceId || req.user.workspaceId;

    console.log('🔍 Leave Requests Query Debug:', {
      userRole: req.user.role,
      contextRole: req.context?.currentRole,
      workspaceId,
      allWorkspaceIds: req.context?.allWorkspaceIds,
      filterWorkspaceId,
      userId
    });

    const query = {};

    // HR and Admin see requests from ALL their workspaces
    if (['admin', 'hr'].includes(req.user.role) || ['admin', 'hr'].includes(req.context?.currentRole)) {
      // Get all workspace IDs user has HR/admin access to
      const hrWorkspaceIds = req.context?.allWorkspaceIds || [workspaceId];
      query.workspaceId = { $in: hrWorkspaceIds };
      
      // Optional: Filter by specific workspace
      if (filterWorkspaceId) {
        query.workspaceId = filterWorkspaceId;
      }
      
      // Optional: Filter by specific user
      if (userId) {
        query.userId = userId;
      }
    } else {
      // Members and team_leads see only their own requests in current workspace
      query.workspaceId = workspaceId;
      query.userId = req.user._id;
    }

    if (status) {
      query.status = status;
    }

    console.log('🔍 Final Query:', query);

    const requests = await LeaveRequest.find(query)
      .populate('userId', 'full_name email profile_picture')
      .populate('leaveTypeId', 'name code color')
      .populate('approvedBy', 'full_name email')
      .populate('workspaceId', 'name type')
      .sort({ createdAt: -1 })
      .lean();

    console.log('📊 Found Requests:', requests.length);

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
    const workspaceId = req.context?.workspaceId || req.user.currentWorkspaceId || req.user.workspaceId;

    // Validate leave type in current workspace
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

    // Send notification email to HR/Admin across ALL workspaces that have HR
    // Find all users with HR/admin role in any workspace
    const allWorkspaceIds = req.context?.allWorkspaceIds || [workspaceId];
    const hrUsers = await User.find({ 
      $or: [
        { role: { $in: ['admin', 'hr'] } },
        { 'workspaces.role': { $in: ['admin', 'hr'] } }
      ],
      'workspaces.workspaceId': { $in: allWorkspaceIds },
      'workspaces.isActive': true
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

// Bulk leave marking (HR/Admin only)
router.post('/bulk', authenticate, requireCoreWorkspace, checkRole(['admin', 'hr']), async (req, res) => {
  try {
    const { userId, leaveTypeId, startDate, endDate, reason, days, status = 'approved', timePeriod = 'full_day' } = req.body;
    const workspaceId = req.context?.workspaceId || req.user.currentWorkspaceId || req.user.workspaceId;

    // Validate user exists and belongs to the workspace
    const user = await User.findOne({
      _id: userId,
      'workspaces.workspaceId': workspaceId,
      'workspaces.isActive': true
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found or not in workspace' });
    }

    // Validate leave type in current workspace
    const leaveType = await LeaveType.findOne({ _id: leaveTypeId, workspaceId });
    if (!leaveType) {
      return res.status(404).json({ message: 'Leave type not found' });
    }

    // Check balance
    const currentYear = new Date().getFullYear();
    let balance = await LeaveBalance.findOne({
      userId,
      leaveTypeId,
      year: currentYear
    });

    // If balance doesn't exist, create it
    if (!balance) {
      balance = new LeaveBalance({
        userId,
        leaveTypeId,
        workspaceId,
        year: currentYear,
        totalQuota: leaveType.annualQuota,
        carriedForward: 0,
        used: 0,
        pending: 0
      });
      await balance.save();
    }

    if (balance.available < days) {
      return res.status(400).json({ message: 'Insufficient leave balance' });
    }

    // Create leave request with auto-approved status
    const leaveRequest = new LeaveRequest({
      userId,
      workspaceId,
      leaveTypeId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      days,
      reason,
      status,
      approvedBy: status === 'approved' ? req.user._id : null,
      approvedAt: status === 'approved' ? new Date() : null
    });

    await leaveRequest.save();

    // Update balance immediately if approved
    if (status === 'approved') {
      balance.used += days;
      balance.available -= days;
    } else {
      balance.pending += days;
    }
    await balance.save();

    // Automatically create attendance records for leave days
    if (status === 'approved') {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const attendanceRecords = [];
      
      // Loop through each day in the range
      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const currentDate = new Date(date);
        
        // Check if attendance already exists for this date
        const existingAttendance = await Attendance.findOne({
          userId,
          workspaceId,
          date: {
            $gte: new Date(currentDate.setHours(0, 0, 0, 0)),
            $lt: new Date(currentDate.setHours(23, 59, 59, 999))
          }
        });

        if (!existingAttendance) {
          // Create new attendance record marked as leave
          const attendanceRecord = new Attendance({
            userId,
            workspaceId,
            date: new Date(date),
            status: timePeriod === 'half_day' ? 'half_day' : 'leave',
            notes: `Leave: ${leaveType.name} - ${reason}`,
            markedBy: req.user._id
          });
          
          await attendanceRecord.save();
          attendanceRecords.push(attendanceRecord);
        } else {
          // Update existing attendance to leave status
          existingAttendance.status = timePeriod === 'half_day' ? 'half_day' : 'leave';
          existingAttendance.notes = `Leave: ${leaveType.name} - ${reason}`;
          existingAttendance.markedBy = req.user._id;
          await existingAttendance.save();
          attendanceRecords.push(existingAttendance);
        }
      }

      await logChange({
        userId: req.user._id,
        workspaceId,
        action: 'create',
        entity: 'leave_request',
        entityId: leaveRequest._id,
        details: { 
          leaveType: leaveType.name, 
          days, 
          startDate, 
          endDate,
          timePeriod,
          markedBy: req.user.full_name,
          markedFor: user.full_name,
          attendanceRecordsCreated: attendanceRecords.length
        },
        ipAddress: getClientIP(req)
      });

      res.status(201).json({ 
        success: true, 
        leaveRequest,
        attendanceRecordsCreated: attendanceRecords.length,
        message: `Leave marked successfully and ${attendanceRecordsCreated.length} attendance record(s) created`
      });
    } else {
      await logChange({
        userId: req.user._id,
        workspaceId,
        action: 'create',
        entity: 'leave_request',
        entityId: leaveRequest._id,
        details: { 
          leaveType: leaveType.name, 
          days, 
          startDate, 
          endDate,
          timePeriod,
          markedBy: req.user.full_name,
          markedFor: user.full_name
        },
        ipAddress: getClientIP(req)
      });

      res.status(201).json({ success: true, leaveRequest });
    }
  } catch (error) {
    console.error('Bulk leave marking error:', error);
    res.status(500).json({ message: 'Failed to mark leave' });
  }
});

// Approve/Reject leave request (HR Action-Driven)
router.patch('/:id/status', authenticate, requireCoreWorkspace, checkRole(['admin', 'hr']), async (req, res) => {
  try {
    const { status, rejectionReason, hrNotes } = req.body;
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;
    const ipAddress = getClientIP(req);

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be approved or rejected.' });
    }

    // Use HR Action Service for centralized state management
    let actionResult;
    if (status === 'approved') {
      actionResult = await HrActionService.approveLeave(req.user, req.params.id, workspaceId, ipAddress);
      
      // Update hrNotes if provided
      if (hrNotes !== undefined) {
        await LeaveRequest.findByIdAndUpdate(req.params.id, { hrNotes });
      }
    } else {
      if (!rejectionReason || rejectionReason.trim() === '') {
        return res.status(400).json({ message: 'Rejection reason is required' });
      }
      actionResult = await HrActionService.rejectLeave(req.user, req.params.id, rejectionReason, workspaceId, ipAddress);
      
      // Update hrNotes if provided
      if (hrNotes !== undefined) {
        await LeaveRequest.findByIdAndUpdate(req.params.id, { hrNotes });
      }
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

    // Members and team_leads can only view their own balance
    // HR and Admin can view anyone's balance
    if (!['admin', 'hr'].includes(req.user.role)) {
      // Convert both to strings for comparison
      if (targetUserId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
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
router.get('/balances', authenticate, requireCoreWorkspace, checkRole(['admin', 'hr']), async (req, res) => {
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

// Update HR notes for a leave request (Admin/HR only)
router.patch('/:id/notes', authenticate, requireCoreWorkspace, checkRole(['admin', 'hr']), async (req, res) => {
  try {
    const { hrNotes } = req.body;
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;

    const leaveRequest = await LeaveRequest.findOne({
      _id: req.params.id,
      workspaceId
    });

    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    leaveRequest.hrNotes = hrNotes || '';
    await leaveRequest.save();

    await logChange({
      userId: req.user._id,
      workspaceId,
      action: 'update',
      entity: 'leave_request',
      entityId: leaveRequest._id,
      details: { action: 'updated_notes' },
      ipAddress: getClientIP(req)
    });

    const updatedLeave = await LeaveRequest.findById(req.params.id)
      .populate('userId', 'full_name email profile_picture')
      .populate('leaveTypeId', 'name code color')
      .populate('approvedBy', 'full_name email');

    res.json({ success: true, leaveRequest: updatedLeave });
  } catch (error) {
    console.error('Update leave notes error:', error);
    res.status(500).json({ message: 'Failed to update leave notes' });
  }
});

// Cancel leave request (by employee, only if pending)
router.delete('/:id', authenticate, requireCoreWorkspace, async (req, res) => {
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
