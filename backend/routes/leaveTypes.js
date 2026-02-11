import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { checkRole } from '../middleware/roleCheck.js';
import { requireCoreWorkspace } from '../middleware/workspaceGuard.js';
import LeaveType from '../models/LeaveType.js';
import LeaveBalance from '../models/LeaveBalance.js';
import User from '../models/User.js';
import { logChange } from '../utils/changeLogService.js';
import getClientIP from '../utils/getClientIP.js';

const router = express.Router();

// Get all leave types
router.get('/', authenticate, requireCoreWorkspace, async (req, res) => {
  try {
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;

    const leaveTypes = await LeaveType.find({ 
      workspaceId, 
      isActive: true 
    }).sort({ name: 1 });

    res.json({ success: true, leaveTypes });
  } catch (error) {
    console.error('Get leave types error:', error);
    res.status(500).json({ message: 'Failed to fetch leave types' });
  }
});

// Create leave type (Admin/HR only)
router.post('/', authenticate, requireCoreWorkspace, checkRole(['admin', 'hr']), async (req, res) => {
  try {
    const { name, code, annualQuota, carryForward, maxCarryForward, color, description } = req.body;
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;

    const leaveType = new LeaveType({
      workspaceId,
      name,
      code: code.toUpperCase(),
      annualQuota,
      carryForward: carryForward || false,
      maxCarryForward: maxCarryForward || 0,
      color: color || '#3b82f6',
      description: description || ''
    });

    await leaveType.save();

    // Initialize balances for all users in workspace
    const users = await User.find({ workspaceId }).select('_id');
    const currentYear = new Date().getFullYear();

    const balancePromises = users.map(user =>
      LeaveBalance.create({
        userId: user._id,
        workspaceId,
        leaveTypeId: leaveType._id,
        year: currentYear,
        totalQuota: annualQuota,  // Initially equals annualQuota (no carry forward yet)
        carriedForward: 0  // No carried forward for new leave type
      })
    );

    await Promise.all(balancePromises);

    await logChange({
      userId: req.user._id,
      workspaceId,
      action: 'create',
      entity: 'leave_type',
      entityId: leaveType._id,
      details: { name, code, annualQuota },
      ipAddress: getClientIP(req)
    });

    res.status(201).json({ success: true, leaveType });
  } catch (error) {
    console.error('Create leave type error:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Leave type code already exists' });
    } else {
      res.status(500).json({ message: 'Failed to create leave type' });
    }
  }
});

// Update leave type
router.put('/:id', authenticate, requireCoreWorkspace, checkRole(['admin', 'hr']), async (req, res) => {
  try {
    const { name, annualQuota, carryForward, maxCarryForward, color, description, isActive, updateExistingBalances } = req.body;
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;

    const leaveType = await LeaveType.findOne({ _id: req.params.id, workspaceId });

    if (!leaveType) {
      return res.status(404).json({ message: 'Leave type not found' });
    }

    const oldQuota = leaveType.annualQuota;
    const newQuota = annualQuota !== undefined ? annualQuota : leaveType.annualQuota;
    const quotaChanged = oldQuota !== newQuota;

    leaveType.name = name || leaveType.name;
    leaveType.annualQuota = newQuota;
    leaveType.carryForward = carryForward !== undefined ? carryForward : leaveType.carryForward;
    leaveType.maxCarryForward = maxCarryForward !== undefined ? maxCarryForward : leaveType.maxCarryForward;
    leaveType.color = color || leaveType.color;
    leaveType.description = description !== undefined ? description : leaveType.description;
    leaveType.isActive = isActive !== undefined ? isActive : leaveType.isActive;

    await leaveType.save();

    // Optionally update existing user balances if quota changed
    let updatedBalancesCount = 0;
    if (quotaChanged && updateExistingBalances === true) {
      const currentYear = new Date().getFullYear();
      const balances = await LeaveBalance.find({
        workspaceId,
        leaveTypeId: leaveType._id,
        year: currentYear
      });

      const quotaDifference = newQuota - oldQuota;
      
      for (const balance of balances) {
        balance.totalQuota = newQuota;
        // Adjust available by the difference, but don't go negative
        // available = totalQuota - used - pending (calculated by pre-save hook)
        await balance.save();
        updatedBalancesCount++;
      }
    }

    await logChange({
      userId: req.user._id,
      workspaceId,
      action: 'update',
      entity: 'leave_type',
      entityId: leaveType._id,
      details: { 
        ...req.body, 
        quotaChanged,
        updatedBalancesCount 
      },
      ipAddress: getClientIP(req)
    });

    res.json({ 
      success: true, 
      leaveType,
      updatedBalancesCount: quotaChanged && updateExistingBalances ? updatedBalancesCount : 0
    });
  } catch (error) {
    console.error('Update leave type error:', error);
    res.status(500).json({ message: 'Failed to update leave type' });
  }
});

// Delete leave type (soft delete)
router.delete('/:id', authenticate, requireCoreWorkspace, checkRole(['admin', 'hr']), async (req, res) => {
  try {
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;

    const leaveType = await LeaveType.findOne({ _id: req.params.id, workspaceId });

    if (!leaveType) {
      return res.status(404).json({ message: 'Leave type not found' });
    }

    leaveType.isActive = false;
    await leaveType.save();

    await logChange({
      userId: req.user._id,
      workspaceId,
      action: 'delete',
      entity: 'leave_type',
      entityId: leaveType._id,
      details: { name: leaveType.name },
      ipAddress: getClientIP(req)
    });

    res.json({ success: true, message: 'Leave type deactivated' });
  } catch (error) {
    console.error('Delete leave type error:', error);
    res.status(500).json({ message: 'Failed to delete leave type' });
  }
});

export default router;
