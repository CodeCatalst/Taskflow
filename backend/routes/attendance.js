import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { checkRole } from '../middleware/roleCheck.js';
import { requireCoreWorkspace } from '../middleware/workspaceGuard.js';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import { logChange } from '../utils/changeLogService.js';
import getClientIP from '../utils/getClientIP.js';

const router = express.Router();

// Get attendance records (filtered by month/user)
router.get('/', authenticate, requireCoreWorkspace, async (req, res) => {
  try {
    const { month, year, userId } = req.query;
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;

    if (!workspaceId) {
      return res.status(400).json({ message: 'Workspace context required' });
    }

    const query = { workspaceId };

    // HR/Admin can view all; members can view only their own
    if (req.user.role === 'member') {
      query.userId = req.user._id;
    } else if (userId) {
      query.userId = userId;
    }

    // Filter by month/year
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const records = await Attendance.find(query)
      .populate('userId', 'full_name email profile_picture')
      .populate('overrideBy', 'full_name email')
      .sort({ date: -1 })
      .lean();

    res.json({ success: true, records });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Failed to fetch attendance records' });
  }
});

// Check-in
router.post('/checkin', authenticate, requireCoreWorkspace, async (req, res) => {
  try {
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in
    let attendance = await Attendance.findOne({
      userId: req.user._id,
      workspaceId,
      date: today
    });

    if (attendance && attendance.checkIn) {
      return res.status(400).json({ message: 'Already checked in today' });
    }

    if (!attendance) {
      attendance = new Attendance({
        userId: req.user._id,
        workspaceId,
        date: today
      });
    }

    attendance.checkIn = new Date();
    attendance.status = 'present';
    await attendance.save();

    await logChange({
      userId: req.user._id,
      workspaceId,
      action: 'create',
      entity: 'attendance',
      entityId: attendance._id,
      details: { action: 'check-in', time: attendance.checkIn },
      ipAddress: getClientIP(req)
    });

    res.json({ success: true, attendance });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ message: 'Failed to check in' });
  }
});

// Check-out
router.post('/checkout', authenticate, requireCoreWorkspace, async (req, res) => {
  try {
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      userId: req.user._id,
      workspaceId,
      date: today
    });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ message: 'No check-in found for today' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ message: 'Already checked out today' });
    }

    attendance.checkOut = new Date();
    await attendance.save();

    await logChange({
      userId: req.user._id,
      workspaceId,
      action: 'update',
      entity: 'attendance',
      entityId: attendance._id,
      details: { action: 'check-out', time: attendance.checkOut, hours: attendance.workingHours },
      ipAddress: getClientIP(req)
    });

    res.json({ success: true, attendance });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ message: 'Failed to check out' });
  }
});

// Admin/HR: Mark attendance for any user
router.post('/mark', authenticate, requireCoreWorkspace, checkRole(['admin', 'hr']), async (req, res) => {
  try {
    const { userId, date, status, checkIn, checkOut, notes } = req.body;
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;

    if (!userId || !date || !status) {
      return res.status(400).json({ message: 'userId, date, and status are required' });
    }

    // Verify user exists in workspace
    const targetUser = await User.findOne({ _id: userId, workspaceId });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found in workspace' });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if attendance already exists
    let attendance = await Attendance.findOne({
      userId,
      workspaceId,
      date: attendanceDate
    });

    if (attendance) {
      // Update existing
      attendance.status = status;
      if (checkIn) attendance.checkIn = new Date(checkIn);
      if (checkOut) attendance.checkOut = new Date(checkOut);
      attendance.notes = notes || attendance.notes;
      attendance.isOverride = true;
      attendance.overrideBy = req.user._id;
    } else {
      // Create new
      attendance = new Attendance({
        userId,
        workspaceId,
        date: attendanceDate,
        status,
        checkIn: checkIn ? new Date(checkIn) : (status === 'present' ? new Date() : null),
        checkOut: checkOut ? new Date(checkOut) : null,
        notes,
        isOverride: true,
        overrideBy: req.user._id
      });
    }

    await attendance.save();

    await logChange({
      userId: req.user._id,
      workspaceId,
      action: attendance.isNew ? 'create' : 'update',
      entity: 'attendance',
      entityId: attendance._id,
      details: { action: 'mark-attendance', targetUser: userId, status, date },
      ipAddress: getClientIP(req)
    });

    res.json({ success: true, attendance });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ message: 'Failed to mark attendance' });
  }
});

// Admin: Override attendance
router.put('/:id', authenticate, requireCoreWorkspace, checkRole(['admin', 'hr']), async (req, res) => {
  try {
    const { status, checkIn, checkOut, notes } = req.body;
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;

    const attendance = await Attendance.findOne({
      _id: req.params.id,
      workspaceId
    });

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    attendance.status = status || attendance.status;
    if (checkIn) attendance.checkIn = new Date(checkIn);
    if (checkOut) attendance.checkOut = new Date(checkOut);
    attendance.notes = notes || attendance.notes;
    attendance.isOverride = true;
    attendance.overrideBy = req.user._id;

    await attendance.save();

    await logChange({
      userId: req.user._id,
      workspaceId,
      action: 'update',
      entity: 'attendance',
      entityId: attendance._id,
      details: { action: 'admin-override', status, notes },
      ipAddress: getClientIP(req)
    });

    res.json({ success: true, attendance });
  } catch (error) {
    console.error('Override attendance error:', error);
    res.status(500).json({ message: 'Failed to override attendance' });
  }
});

// Get attendance summary for a user
router.get('/summary/:userId?', authenticate, requireCoreWorkspace, async (req, res) => {
  try {
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;
    const targetUserId = req.params.userId || req.user._id;

    // Members can only view their own summary
    if (req.user.role === 'member' && targetUserId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { month, year } = req.query;
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    const records = await Attendance.find({
      userId: targetUserId,
      workspaceId,
      date: { $gte: startDate, $lte: endDate }
    });

    const summary = {
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      halfDay: records.filter(r => r.status === 'half_day').length,
      leave: records.filter(r => r.status === 'leave').length,
      totalHours: records.reduce((sum, r) => sum + r.workingHours, 0)
    };

    res.json({ success: true, summary, records });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ message: 'Failed to fetch summary' });
  }
});

export default router;
