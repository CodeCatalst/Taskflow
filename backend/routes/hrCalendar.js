import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireCoreWorkspace } from '../middleware/workspaceGuard.js';
import Attendance from '../models/Attendance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Holiday from '../models/Holiday.js';

const router = express.Router();

// Get aggregated calendar data
router.get('/', authenticate, requireCoreWorkspace, async (req, res) => {
  try {
    const { month, year, userId } = req.query;
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;

    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const targetUserId = userId || (req.user.role === 'member' ? req.user._id : null);

    // Fetch attendance
    const attendanceQuery = { 
      workspaceId, 
      date: { $gte: startDate, $lte: endDate } 
    };
    if (targetUserId) {
      attendanceQuery.userId = targetUserId;
    }

    const attendance = await Attendance.find(attendanceQuery)
      .populate('userId', 'full_name email')
      .lean();

    // Fetch approved leaves
    const leaveQuery = {
      workspaceId,
      status: 'approved',
      $or: [
        { startDate: { $gte: startDate, $lte: endDate } },
        { endDate: { $gte: startDate, $lte: endDate } },
        { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
      ]
    };
    if (targetUserId) {
      leaveQuery.userId = targetUserId;
    }

    const leaves = await LeaveRequest.find(leaveQuery)
      .populate('userId', 'full_name email')
      .populate('leaveTypeId', 'name code color')
      .lean();

    // Fetch holidays
    const holidays = await Holiday.find({
      workspaceId,
      isActive: true,
      date: { $gte: startDate, $lte: endDate }
    }).lean();

    // Format calendar events
    const events = [];

    // Add attendance events
    attendance.forEach(record => {
      events.push({
        type: 'attendance',
        date: record.date,
        status: record.status,
        workingHours: record.workingHours,
        userId: record.userId?._id,
        userName: record.userId?.full_name,
        checkIn: record.checkIn,
        checkOut: record.checkOut
      });
    });

    // Add leave events
    leaves.forEach(leave => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        events.push({
          type: 'leave',
          date: new Date(d),
          leaveType: leave.leaveTypeId?.name,
          leaveCode: leave.leaveTypeId?.code,
          color: leave.leaveTypeId?.color,
          userId: leave.userId?._id,
          userName: leave.userId?.full_name,
          reason: leave.reason
        });
      }
    });

    // Add holiday events
    holidays.forEach(holiday => {
      events.push({
        type: 'holiday',
        date: holiday.date,
        name: holiday.name,
        description: holiday.description
      });
    });

    // Sort by date
    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({ success: true, events, holidays, attendance, leaves });
  } catch (error) {
    console.error('Get calendar error:', error);
    res.status(500).json({ message: 'Failed to fetch calendar data' });
  }
});

export default router;
