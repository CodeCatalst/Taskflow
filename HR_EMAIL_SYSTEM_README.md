# HR Email System Implementation

## Overview

The HR Email System provides automated email notifications for HR-related events in the TaskFlow application. It integrates with Brevo (formerly Sendinblue) for reliable email delivery and uses predefined HTML templates for consistent branding and professional appearance.

## Architecture

### Core Components

1. **BrevoEmailService** (`backend/services/brevoEmailService.js`)
   - Primary email service using Brevo's transactional email API
   - Handles authentication and email sending
   - Supports template variable interpolation

2. **EmailService** (`backend/utils/emailService.js`)
   - Alternative SMTP-based email service using Brevo SMTP relay
   - Fallback option for email delivery
   - Supports both API and SMTP methods

3. **HrEventService** (`backend/services/hrEventService.js`)
   - Maps HR events to email templates
   - Handles event-driven email dispatching
   - Includes employee status validation

4. **EmailTemplate Model** (`backend/models/EmailTemplate.js`)
   - Stores email templates with variables and metadata
   - Supports workspace-specific and global templates
   - Categorizes templates by type (leave, attendance, system)

## Email Templates

### Predefined Templates

The system includes the following predefined email templates:

#### Leave Management
- **LEAVE_APPROVED**: Notifies employees when their leave request is approved
- **LEAVE_REJECTED**: Notifies employees when their leave request is rejected

#### Attendance Management
- **ATTENDANCE_REMINDER**: Sent for attendance overrides and reminders

#### Employee Management
- **EMPLOYEE_ACTIVATED**: Welcome email when employee account is activated
- **EMPLOYEE_DEACTIVATED**: Notification when employee account is deactivated

#### System Templates
- **WELCOME**: General welcome email for new users

### Template Variables

Templates support dynamic content through variable interpolation:

```javascript
// Example variables for LEAVE_APPROVED template
{
  workspaceName: 'TaskFlow',
  fullName: 'John Doe',
  leaveType: 'Annual Leave',
  startDate: '2024-01-15',
  endDate: '2024-01-20',
  days: '5',
  approvedBy: 'Jane Smith',
  remainingDays: '15',
  loginUrl: 'https://app.taskflow.com/login',
  supportEmail: 'support@taskflow.com'
}
```

## Event-Driven Email Flow

### HR Event Processing

1. **Event Trigger**: HR actions (leave approval, employee status change) trigger events
2. **Event Mapping**: `HrEventService.EVENT_TEMPLATE_MAP` maps events to templates
3. **Template Resolution**: System finds appropriate template for workspace or uses global fallback
4. **Variable Resolution**: Event data is mapped to template variables
5. **Email Dispatch**: Email is sent via BrevoEmailService
6. **Logging**: Email delivery is logged in the change log system

### Event Types

```javascript
static EVENT_TEMPLATE_MAP = {
  LEAVE_APPROVED: 'LEAVE_APPROVED',
  LEAVE_REJECTED: 'LEAVE_REJECTED',
  ATTENDANCE_OVERRIDDEN: 'ATTENDANCE_REMINDER',
  EMPLOYEE_ACTIVATED: 'EMPLOYEE_ACTIVATED',
  EMPLOYEE_DEACTIVATED: 'EMPLOYEE_DEACTIVATED'
};
```

## Configuration

### Environment Variables

```env
# Brevo Configuration
BREVO_API_KEY=your_brevo_api_key
BREVO_LOGIN_EMAIL=your_brevo_account_email

# Email Settings
EMAIL_FROM=updates@codecatalyst.com
EMAIL_FROM_NAME=TaskFlow
```

### Template Management

Templates can be managed through the API endpoints:

- `GET /api/email-templates` - List templates
- `POST /api/email-templates` - Create custom templates
- `PUT /api/email-templates/:id` - Update templates
- `DELETE /api/email-templates/:id` - Delete templates

## Security & Validation

### Employee Status Check

Emails are only sent to employees with `ACTIVE` employment status. Inactive or exited employees are skipped to prevent unwanted communications.

### Workspace Context

Templates are resolved with workspace priority:
1. Workspace-specific templates
2. Global predefined templates

## Email Template Structure

### HTML Template Format

Templates use responsive HTML with inline CSS for maximum compatibility:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
  <style>
    /* Responsive styles */
  </style>
</head>
<body>
  <div class="email-wrapper">
    <!-- Email content with {{variables}} -->
  </div>
</body>
</html>
```

## Testing & Development

### Testing Scripts

- `backend/test-email.js` - Basic email functionality test
- `backend/test-brevo-email.js` - Brevo-specific tests
- `backend/test-email-production.js` - Production environment tests

### Seeding Templates

Run `node backend/scripts/seedEmailTemplates.js` to populate predefined templates.

## Integration Points

### HR Module Integration

The email system integrates with:
- Leave management system
- Attendance tracking
- Employee lifecycle management
- User activation/deactivation workflows

### Change Logging

All email deliveries are logged in the change log system with metadata including:
- Event type
- Template used
- Delivery status
- Message ID
- Recipient information

## Best Practices

1. **Template Variables**: Always provide all required variables when triggering emails
2. **Error Handling**: Implement proper error handling for email failures
3. **Testing**: Test emails in staging before production deployment
4. **Rate Limiting**: Be aware of Brevo's sending limits
5. **Content**: Keep email content professional and branded
6. **Accessibility**: Ensure emails are accessible with proper contrast and alt text

## Troubleshooting

### Common Issues

1. **Emails not sending**: Check Brevo API key and configuration
2. **Template not found**: Verify template codes and workspace settings
3. **Variables not resolving**: Ensure all required variables are provided
4. **Employee not receiving**: Check employee status and email address validity

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` to see detailed email processing logs.