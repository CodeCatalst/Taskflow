import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { checkRole } from '../middleware/roleCheck.js';
import { requireCoreWorkspace } from '../middleware/workspaceGuard.js';
import EmailTemplate from '../models/EmailTemplate.js';
import User from '../models/User.js';
import { logChange } from '../utils/changeLogService.js';
import getClientIP from '../utils/getClientIP.js';
import { sendEmail } from '../utils/emailService.js';
import brevoService from '../services/brevoEmailService.js';

const router = express.Router();

// Get all email templates
router.get('/', authenticate, requireCoreWorkspace, checkRole(['admin', 'hr']), async (req, res) => {
  try {
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;
    const { category } = req.query;

    const query = { 
      $or: [
        { workspaceId },
        { workspaceId: null, isPredefined: true }
      ]
    };

    if (category) {
      query.category = category;
    }

    const templates = await EmailTemplate.find(query).sort({ isPredefined: -1, name: 1 });

    res.json({ success: true, templates });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ message: 'Failed to fetch email templates' });
  }
});

// Create custom email template
router.post('/', authenticate, requireCoreWorkspace, checkRole(['admin', 'hr']), async (req, res) => {
  try {
    const { name, code, subject, htmlContent, variables, category } = req.body;
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;

    const template = new EmailTemplate({
      workspaceId,
      name,
      code: code.toUpperCase(),
      subject,
      htmlContent,
      variables: variables || [],
      category: category || 'custom',
      isPredefined: false
    });

    await template.save();

    await logChange({
      userId: req.user._id,
      workspaceId,
      action: 'create',
      entity: 'email_template',
      entityId: template._id,
      details: { name, code },
      ipAddress: getClientIP(req)
    });

    res.status(201).json({ success: true, template });
  } catch (error) {
    console.error('Create template error:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Template code already exists' });
    } else {
      res.status(500).json({ message: 'Failed to create template' });
    }
  }
});

// Update email template
router.put('/:id', authenticate, requireCoreWorkspace, checkRole(['admin', 'hr']), async (req, res) => {
  try {
    const { name, subject, htmlContent, variables, isActive } = req.body;
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;

    const template = await EmailTemplate.findOne({ 
      _id: req.params.id, 
      workspaceId 
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    if (template.isPredefined) {
      return res.status(403).json({ message: 'Cannot modify predefined templates' });
    }

    template.name = name || template.name;
    template.subject = subject || template.subject;
    template.htmlContent = htmlContent || template.htmlContent;
    template.variables = variables || template.variables;
    template.isActive = isActive !== undefined ? isActive : template.isActive;

    await template.save();

    await logChange({
      userId: req.user._id,
      workspaceId,
      action: 'update',
      entity: 'email_template',
      entityId: template._id,
      details: { name },
      ipAddress: getClientIP(req)
    });

    res.json({ success: true, template });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ message: 'Failed to update template' });
  }
});

// Delete email template
router.delete('/:id', authenticate, requireCoreWorkspace, checkRole(['admin', 'hr']), async (req, res) => {
  try {
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;

    const template = await EmailTemplate.findOne({ 
      _id: req.params.id, 
      workspaceId 
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    if (template.isPredefined) {
      return res.status(403).json({ message: 'Cannot delete predefined templates' });
    }

    await template.deleteOne();

    await logChange({
      userId: req.user._id,
      workspaceId,
      action: 'delete',
      entity: 'email_template',
      entityId: template._id,
      details: { name: template.name },
      ipAddress: getClientIP(req)
    });

    res.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ message: 'Failed to delete template' });
  }
});

// Send test email
router.post('/test', authenticate, requireCoreWorkspace, checkRole(['admin', 'hr']), async (req, res) => {
  try {
    const { to, subject, htmlContent, variables = {} } = req.body;
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;

    if (!to || !subject || !htmlContent) {
      return res.status(400).json({ message: 'Recipient, subject, and content are required' });
    }

    // Interpolate variables in subject and content
    const interpolatedSubject = brevoService.interpolateVariables(subject, variables);
    const interpolatedHtml = brevoService.interpolateVariables(htmlContent, variables);

    const result = await sendEmail(to, interpolatedSubject, interpolatedHtml);

    if (result.success) {
      await logChange({
        userId: req.user._id,
        workspaceId,
        action: 'send',
        entity: 'email',
        details: { type: 'test', to, subject },
        ipAddress: getClientIP(req)
      });

      res.json({ success: true, message: 'Test email sent successfully', result });
    } else {
      res.status(500).json({ message: 'Failed to send test email', error: result.error });
    }
  } catch (error) {
    console.error('Send test email error:', error);
    res.status(500).json({ message: 'Failed to send test email' });
  }
});

// Send email to users
router.post('/send', authenticate, requireCoreWorkspace, checkRole(['admin', 'hr']), async (req, res) => {
  try {
    const { recipients, subject, htmlContent, templateId, variables = {} } = req.body;
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;

    if (!recipients || !subject || !htmlContent) {
      return res.status(400).json({ message: 'Recipients, subject, and content are required' });
    }

    // Get recipient emails
    let recipientEmails = [];
    if (Array.isArray(recipients)) {
      // Check recipient type
      if (recipients.length > 0) {
        const firstRecipient = recipients[0];
        if (typeof firstRecipient === 'string') {
          if (firstRecipient.includes('@')) {
            // Direct email addresses
            recipientEmails = recipients.map(email => ({ email, name: '' }));
          } else {
            // User IDs - fetch user details
            const users = await User.find({
              _id: { $in: recipients },
              workspaceId,
              isActive: true
            }).select('email fullName');
            recipientEmails = users.map(user => ({ email: user.email, name: user.fullName }));
          }
        } else if (typeof firstRecipient === 'object' && firstRecipient.email) {
          // Recipient objects with email and name
          recipientEmails = recipients.map(recipient => ({
            email: recipient.email,
            name: recipient.name || recipient.email
          }));
        }
      }
    } else if (recipients === 'all') {
      const users = await User.find({ workspaceId, isActive: true }).select('email fullName');
      recipientEmails = users.map(user => ({ email: user.email, name: user.fullName }));
    }

    if (recipientEmails.length === 0) {
      return res.status(400).json({ message: 'No valid recipients found' });
    }

    // Find template if templateId provided to get sender info
    let template = null;
    if (templateId) {
      template = await EmailTemplate.findById(templateId);
    }

    // Interpolate variables in content and subject
    const interpolatedSubject = brevoService.interpolateVariables(subject, variables);
    const interpolatedHtml = brevoService.interpolateVariables(htmlContent, variables);

    // Use brevoService for sending
    const result = await brevoService.send({
      to: recipientEmails.map(r => r.email),
      subject: interpolatedSubject,
      htmlContent: interpolatedHtml,
      params: {}, // No additional params needed since we already interpolated
      from: template ? {
        name: template.senderName || process.env.EMAIL_FROM_NAME || 'TaskFlow',
        email: template.senderEmail || process.env.EMAIL_FROM || 'updates.codecatalyst@gmail.com'
      } : null,
      useLayout: false // Predefined templates already have complete HTML structure
    });

    if (result.success) {
      await logChange({
        userId: req.user._id,
        workspaceId,
        action: 'send',
        entity: 'email',
        details: { type: 'custom', count: recipientEmails.length, subject, templateId },
        ipAddress: getClientIP(req)
      });

      res.json({
        success: true,
        message: `Email sent to ${recipientEmails.length} recipients`,
        result
      });
    } else {
      res.status(500).json({ message: 'Failed to send emails', error: result.error });
    }
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ message: 'Failed to send emails' });
  }
});

// Get users for email recipient selection with advanced search and filters
router.get('/users', authenticate, requireCoreWorkspace, checkRole(['admin', 'hr']), async (req, res) => {
  try {
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;
    const {
      search,
      role,
      department,
      isActive,
      team,
      limit = 50,
      page = 1
    } = req.query;

    let query = { workspaceId };

    // Add filters
    if (isActive !== undefined && isActive !== 'all') {
      query.isActive = isActive === 'true';
    }
    if (role && role !== 'all' && Array.isArray(role)) {
      query.role = { $in: role };
    } else if (role && role !== 'all') {
      query.role = role;
    }
    if (department && department !== 'all') {
      query.department = department;
    }
    if (team && team !== 'all') {
      // Assuming users have a teams field or we can join with teams
      // For now, we'll skip team filtering as it requires team relationship
    }

    // Add advanced search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { full_name: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { department: { $regex: searchRegex } }
      ];
    }

    // Get total count for pagination
    const totalCount = await User.countDocuments(query);

    // Get paginated results
    const users = await User.find(query)
      .select('full_name email role department isActive profile_picture createdAt')
      .sort({ full_name: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Get unique departments and roles for filter options
    const departments = await User.distinct('department', { workspaceId, department: { $ne: null, $ne: '' } });
    const roles = await User.distinct('role', { workspaceId });

    res.json({
      success: true,
      users: users.map(user => ({
        id: user._id,
        name: user.full_name,
        email: user.email,
        role: user.role,
        department: user.department || 'Not specified',
        isActive: user.isActive,
        avatar: user.profile_picture,
        joinedAt: user.createdAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      },
      filters: {
        departments: departments.filter(d => d).sort(),
        roles: roles.sort()
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get email configuration status
router.get('/config', authenticate, requireCoreWorkspace, checkRole(['admin', 'hr']), async (req, res) => {
  try {
    const config = {
      brevoConfigured: !!process.env.BREVO_API_KEY,
      senderEmail: process.env.BREVO_SENDER_EMAIL || 'updates.codecatalyst@gmail.com',
      senderName: process.env.BREVO_SENDER_NAME || 'TaskFlow'
    };

    res.json({ success: true, config });
  } catch (error) {
    console.error('Get email config error:', error);
    res.status(500).json({ message: 'Failed to get email configuration' });
  }
});

// Test send email using template
router.post('/test-send', authenticate, requireCoreWorkspace, checkRole(['admin', 'hr']), async (req, res) => {
  try {
    const { templateId, variables = {}, testRecipient } = req.body;
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;

    if (!templateId || !testRecipient) {
      return res.status(400).json({ message: 'Template ID and test recipient are required' });
    }

    // Find template
    const template = await EmailTemplate.findOne({
      _id: templateId,
      isActive: true,
      $or: [
        { workspaceId },
        { workspaceId: null, isPredefined: true }
      ]
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Send test email
    const result = await brevoService.send({
      to: testRecipient,
      subject: template.subject,
      htmlContent: template.htmlContent,
      params: variables,
      from: {
        name: template.senderName || process.env.EMAIL_FROM_NAME || 'TaskFlow',
        email: template.senderEmail || process.env.EMAIL_FROM || 'updates.codecatalyst@gmail.com'
      },
      useLayout: true
    });

    if (result.success) {
      await logChange({
        userId: req.user._id,
        workspaceId,
        action: 'send',
        entity: 'email',
        details: { type: 'test', templateId, testRecipient },
        ipAddress: getClientIP(req)
      });

      res.json({ success: true, message: 'Test email sent successfully', result });
    } else {
      res.status(500).json({ message: 'Failed to send test email', error: result.error });
    }
  } catch (error) {
    console.error('Test send error:', error);
    res.status(500).json({ message: 'Failed to send test email' });
  }
});

// Bulk send emails using template
router.post('/bulk-send', authenticate, requireCoreWorkspace, checkRole(['admin', 'hr']), async (req, res) => {
  try {
    const { templateId, variables = {}, recipients } = req.body;
    const workspaceId = req.context?.workspaceId || req.user.workspaceId;

    if (!templateId || !recipients || recipients.length === 0) {
      return res.status(400).json({ message: 'Template ID and recipients are required' });
    }

    // Find template
    const template = await EmailTemplate.findOne({
      _id: templateId,
      isActive: true,
      $or: [
        { workspaceId },
        { workspaceId: null, isPredefined: true }
      ]
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    const results = [];
    let sentCount = 0;

    // Send to each recipient
    for (const recipient of recipients) {
      try {
        // Skip if recipient has unsubscribed (for external recipients)
        if (recipient.source === 'EXTERNAL' && recipient.preferences?.unsubscribe) {
          results.push({ email: recipient.email, status: 'skipped', reason: 'unsubscribed' });
          continue;
        }

        const result = await brevoService.send({
          to: recipient.email,
          subject: template.subject,
          htmlContent: template.htmlContent,
          params: variables,
          from: {
            name: template.senderName || process.env.EMAIL_FROM_NAME || 'TaskFlow',
            email: template.senderEmail || process.env.EMAIL_FROM || 'updates.codecatalyst@gmail.com'
          },
          useLayout: true // Use layout to ensure proper HTML structure and CSS styling
        });

        if (result.success) {
          sentCount++;
          results.push({ email: recipient.email, status: 'sent', messageId: result.messageId });
        } else {
          results.push({ email: recipient.email, status: 'failed', error: result.error });
        }
      } catch (error) {
        console.error(`Failed to send to ${recipient.email}:`, error);
        results.push({ email: recipient.email, status: 'error', error: error.message });
      }
    }

    // Log bulk send
    await logChange({
      userId: req.user._id,
      workspaceId,
      action: 'send',
      entity: 'email',
      details: {
        type: 'bulk',
        templateId,
        totalRecipients: recipients.length,
        sentCount,
        templateName: template.name
      },
      ipAddress: getClientIP(req)
    });

    res.json({
      success: true,
      message: `Emails processed: ${sentCount} sent, ${recipients.length - sentCount} failed`,
      results: { sentCount, totalCount: recipients.length, details: results }
    });
  } catch (error) {
    console.error('Bulk send error:', error);
    res.status(500).json({ message: 'Failed to send emails' });
  }
});

export default router;
