import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { checkRole } from '../middleware/roleCheck.js';
import { requireCoreWorkspace } from '../middleware/workspaceGuard.js';
import Holiday from '../models/Holiday.js';
import { logChange } from '../utils/changeLogService.js';
import getClientIP from '../utils/getClientIP.js';

const router = express.Router();

// Get all holidays
router.get('/', authenticate, requireCoreWorkspace, async (req, res) => {
  try {
    const { year } = req.query;
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;

    const query = { workspaceId, isActive: true };

    if (year) {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const holidays = await Holiday.find(query).sort({ date: 1 });

    res.json({ success: true, holidays });
  } catch (error) {
    console.error('Get holidays error:', error);
    res.status(500).json({ message: 'Failed to fetch holidays' });
  }
});

// Create holiday (Admin/HR only)
router.post('/', authenticate, requireCoreWorkspace, checkRole(['admin', 'hr']), async (req, res) => {
  try {
    const { name, date, isRecurring, description } = req.body;
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;

    const holiday = new Holiday({
      workspaceId,
      name,
      date: new Date(date),
      isRecurring: isRecurring || false,
      description: description || ''
    });

    await holiday.save();

    await logChange({
      userId: req.user._id,
      workspaceId,
      action: 'create',
      entity: 'holiday',
      entityId: holiday._id,
      details: { name, date },
      ipAddress: getClientIP(req)
    });

    res.status(201).json({ success: true, holiday });
  } catch (error) {
    console.error('Create holiday error:', error);
    res.status(500).json({ message: 'Failed to create holiday' });
  }
});

// Update holiday
router.put('/:id', authenticate, requireCoreWorkspace, checkRole(['admin', 'hr']), async (req, res) => {
  try {
    const { name, date, isRecurring, description, isActive } = req.body;
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;

    const holiday = await Holiday.findOne({ _id: req.params.id, workspaceId });

    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found' });
    }

    holiday.name = name || holiday.name;
    if (date) holiday.date = new Date(date);
    holiday.isRecurring = isRecurring !== undefined ? isRecurring : holiday.isRecurring;
    holiday.description = description !== undefined ? description : holiday.description;
    holiday.isActive = isActive !== undefined ? isActive : holiday.isActive;

    await holiday.save();

    await logChange({
      userId: req.user._id,
      workspaceId,
      action: 'update',
      entity: 'holiday',
      entityId: holiday._id,
      details: req.body,
      ipAddress: getClientIP(req)
    });

    res.json({ success: true, holiday });
  } catch (error) {
    console.error('Update holiday error:', error);
    res.status(500).json({ message: 'Failed to update holiday' });
  }
});

// Delete holiday
router.delete('/:id', authenticate, requireCoreWorkspace, checkRole(['admin', 'hr']), async (req, res) => {
  try {
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;

    const holiday = await Holiday.findOneAndDelete({ 
      _id: req.params.id, 
      workspaceId 
    });

    if (!holiday) {
      return res.status(404).json({ message: 'Holiday not found' });
    }

    await logChange({
      userId: req.user._id,
      workspaceId,
      action: 'delete',
      entity: 'holiday',
      entityId: holiday._id,
      details: { name: holiday.name },
      ipAddress: getClientIP(req)
    });

    res.json({ success: true, message: 'Holiday deleted' });
  } catch (error) {
    console.error('Delete holiday error:', error);
    res.status(500).json({ message: 'Failed to delete holiday' });
  }
});

export default router;
