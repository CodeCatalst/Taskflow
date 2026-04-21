import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { checkRole } from '../middleware/roleCheck.js';
import { requireCoreWorkspace } from '../middleware/workspaceGuard.js';
import ScheduledEmailCampaign from '../models/ScheduledEmailCampaign.js';
import EmailTemplate from '../models/EmailTemplate.js';
import User from '../models/User.js';
import { logChange } from '../utils/changeLogService.js';
import getClientIP from '../utils/getClientIP.js';
import { escapeRegex, normalizePlainText } from '../utils/requestValidation.js';

const router = express.Router();

// Get all scheduled campaigns for the workspace
router.get('/', authenticate, requireCoreWorkspace, checkRole(['admin', 'hr']), async (req, res) => {
  try {
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;
    const { status, page = 1, limit = 20, search } = req.query;

    let query = { workspaceId };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(escapeRegex(normalizePlainText(search, 'search', { maxLength: 100 })), 'i');
      query.$or = [
        { title: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { subject: { $regex: searchRegex } }
      ];
    }

    const totalCount = await ScheduledEmailCampaign.countDocuments(query);
    const campaigns = await ScheduledEmailCampaign.find(query)
      .populate('createdBy', 'full_name email')
      .populate('templateId', 'name code')
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({
      success: true,
      campaigns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch scheduled campaigns' });
  }
});

// Create a new scheduled campaign
router.post('/', authenticate, requireCoreWorkspace, checkRole(['admin', 'hr']), async (req, res) => {
  try {
    const {
      title,
      description,
      templateId,
      subject,
      htmlContent,
      variables = {},
      recipients,
      scheduleType = 'once',
      scheduledDate,
      recurrence,
      tags = [],
      priority = 'normal'
    } = req.body;

    const workspaceId = req.context?.workspaceId || req.user.workspaceId;

    if (!title || !templateId || !subject || !htmlContent || !recipients || !scheduledDate) {
      return res.status(400).json({
        message: 'Title, template ID, subject, content, recipients, and scheduled date are required'
      });
    }

    // Validate scheduled date is in the future
    if (new Date(scheduledDate) <= new Date()) {
      return res.status(400).json({ message: 'Scheduled date must be in the future' });
    }

    // Validate recipients
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ message: 'At least one recipient is required' });
    }

    const campaign = new ScheduledEmailCampaign({
      title,
      description,
      workspaceId,
      createdBy: req.user._id,
      templateId,
      subject,
      htmlContent,
      variables,
      recipients,
      scheduleType,
      scheduledDate: new Date(scheduledDate),
      recurrence: scheduleType === 'recurring' ? recurrence : undefined,
      tags,
      priority
    });

    await campaign.save();

    await logChange({
      userId: req.user._id,
      workspaceId,
      action: 'create',
      entity: 'scheduled_email_campaign',
      entityId: campaign._id,
      details: { title, recipientCount: recipients.length },
      ipAddress: getClientIP(req)
    });

    res.status(201).json({ success: true, campaign });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create scheduled campaign' });
  }
});

// Update a scheduled campaign
router.put('/:id', authenticate, requireCoreWorkspace, checkRole(['admin', 'hr']), async (req, res) => {
  try {
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;
    const campaignId = req.params.id;

    const campaign = await ScheduledEmailCampaign.findOne({
      _id: campaignId,
      workspaceId,
      status: { $in: ['scheduled', 'failed'] } // Only allow updates for campaigns that haven't been sent
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found or cannot be updated' });
    }

    const allowedUpdates = [
      'title', 'description', 'subject', 'htmlContent', 'variables',
      'recipients', 'scheduledDate', 'recurrence', 'tags', 'priority'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Validate scheduled date if being updated
    if (updates.scheduledDate && new Date(updates.scheduledDate) <= new Date()) {
      return res.status(400).json({ message: 'Scheduled date must be in the future' });
    }

    Object.assign(campaign, updates);
    await campaign.save();

    await logChange({
      userId: req.user._id,
      workspaceId,
      action: 'update',
      entity: 'scheduled_email_campaign',
      entityId: campaign._id,
      details: { title: campaign.title, updatedFields: Object.keys(updates) },
      ipAddress: getClientIP(req)
    });

    res.json({ success: true, campaign });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update scheduled campaign' });
  }
});

// Cancel a scheduled campaign
router.post('/:id/cancel', authenticate, requireCoreWorkspace, checkRole(['admin', 'hr']), async (req, res) => {
  try {
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;
    const campaignId = req.params.id;

    const campaign = await ScheduledEmailCampaign.findOneAndUpdate(
      {
        _id: campaignId,
        workspaceId,
        status: 'scheduled'
      },
      { status: 'cancelled' },
      { new: true }
    );

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found or already processed' });
    }

    await logChange({
      userId: req.user._id,
      workspaceId,
      action: 'cancel',
      entity: 'scheduled_email_campaign',
      entityId: campaign._id,
      details: { title: campaign.title },
      ipAddress: getClientIP(req)
    });

    res.json({ success: true, message: 'Campaign cancelled successfully', campaign });
  } catch (error) {
    res.status(500).json({ message: 'Failed to cancel campaign' });
  }
});

// Delete a scheduled campaign
router.delete('/:id', authenticate, requireCoreWorkspace, checkRole(['admin', 'hr']), async (req, res) => {
  try {
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;
    const campaignId = req.params.id;

    const campaign = await ScheduledEmailCampaign.findOneAndDelete({
      _id: campaignId,
      workspaceId,
      status: { $in: ['scheduled', 'cancelled', 'failed'] } // Only allow deletion for campaigns that haven't been sent
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found or cannot be deleted' });
    }

    await logChange({
      userId: req.user._id,
      workspaceId,
      action: 'delete',
      entity: 'scheduled_email_campaign',
      entityId: campaign._id,
      details: { title: campaign.title },
      ipAddress: getClientIP(req)
    });

    res.json({ success: true, message: 'Campaign deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete campaign' });
  }
});

// Get campaign statistics
router.get('/stats', authenticate, requireCoreWorkspace, checkRole(['admin', 'hr']), async (req, res) => {
  try {
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;

    const stats = await ScheduledEmailCampaign.aggregate([
      { $match: { workspaceId: workspaceId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          scheduled: { $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] } },
          sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          totalRecipients: { $sum: '$totalRecipients' },
          totalSent: { $sum: '$sentCount' }
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      scheduled: 0,
      sent: 0,
      failed: 0,
      cancelled: 0,
      totalRecipients: 0,
      totalSent: 0
    };

    res.json({ success: true, stats: result });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch campaign statistics' });
  }
});

export default router;