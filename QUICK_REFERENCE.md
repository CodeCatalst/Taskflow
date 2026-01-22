# Quick Reference Card - Email Template System

## 🚀 Quick Send Examples

### 1. Interview Invitation
```javascript
await hrActionService.sendInterviewInvitation({
  name: 'John Doe',
  email: 'john@example.com',
  interviewDate: '14 October 2025',
  interviewTime: '9:30 AM - 12:00 PM',
  venue: 'Room No. 109, JB Knowledge Park',
  interviewers: 'Poorvi (HR), Divy (President)'
});
```

### 2. Rejection Email
```javascript
await hrActionService.sendRejectionEmail({
  name: 'Jane Smith',
  email: 'jane@example.com'
});
```

### 3. Leave Approval
```javascript
await hrActionService.sendLeaveApprovalEmail({
  name: 'Mike Johnson',
  email: 'mike@example.com',
  leaveDates: '15-20 January 2025',
  reason: 'Personal',
  team: 'Content Team',
  approverName: 'HR Manager'
});
```

### 4. Interview Reschedule
```javascript
await hrActionService.sendInterviewRescheduleEmail({
  name: 'Sarah Williams',
  email: 'sarah@example.com',
  newInterviewDate: '21 October 2025',
  newInterviewTime: '10:00 AM - 11:30 AM',
  venue: 'Room No. 109, JB Knowledge Park'
});
```

### 5. Server Join Reminder
```javascript
await hrActionService.sendServerJoinReminder({
  name: 'Alex Brown',
  email: 'alex@example.com',
  senderName: 'HR Team'
});
```

### 6. Team Choice (Post-Interview)
```javascript
// For candidates who attended interview
await hrActionService.sendTeamChoiceEmail({
  name: 'Chris Davis',
  email: 'chris@example.com'
}, true); // attended = true

// For candidates who missed interview
await hrActionService.sendTeamChoiceEmail({
  name: 'Pat Wilson',
  email: 'pat@example.com'
}, false); // attended = false
```

### 7. Resignation Acknowledgement
```javascript
await hrActionService.sendResignationAcknowledgement({
  name: 'Taylor Martinez',
  email: 'taylor@example.com',
  managerName: 'Project Manager'
});
```

### 8. Termination Notice
```javascript
await hrActionService.sendTerminationNotice({
  name: 'Jordan Anderson',
  email: 'jordan@example.com',
  teamName: 'Development Team',
  projectName: 'Code Catalyst',
  inactivePeriod: '4 weeks',
  managerName: 'Team Lead'
});
```

### 9. Rejoining Invitation
```javascript
await hrActionService.sendRejoiningInvitation({
  name: 'Morgan Thomas',
  email: 'morgan@example.com',
  teamName: 'Editors Team',
  managerName: 'Content Lead',
  managerRole: 'Team Manager'
});
```

---

## 📊 Variable Quick Reference

### Essential Variables (Every Email)
```javascript
{
  email_subject: 'Your Email Subject',
  email_title: 'Header Title',
  greeting_text: 'Hi [Name],',
  intro_message: '<p>Your intro paragraph</p>',
  sender_name: 'Your Name',
  sender_role: 'Your Role',
  sender_team: 'Your Team'
}
```

### Conditional Toggles
```javascript
{
  show_details: true,      // Shows Details Card
  show_highlight: true,    // Shows Highlight Block
  show_cta: true,          // Shows CTA Button
  show_social_links: true  // Shows Social Links
}
```

### Details Card
```javascript
{
  details_title: 'Card Title',
  detail_date: '14 October 2025',
  detail_date_label: 'Date',
  detail_time: '9:30 AM',
  detail_time_label: 'Time',
  detail_venue: 'Room 109',
  detail_venue_label: 'Venue'
}
```

### Highlight Block
```javascript
{
  highlight_icon: '🚀',
  highlight_title: 'Important!',
  highlight_message: '<p>Your message</p>',
  highlight_list_items: [
    '<strong>Item 1:</strong> Description',
    '<strong>Item 2:</strong> Description'
  ]
}
```

### CTA Button
```javascript
{
  cta_text: 'Click Here',
  cta_link: 'https://yourlink.com',
  cta_subtext: 'Optional subtext'
}
```

### Social Links
```javascript
{
  social_whatsapp: 'https://whatsapp.com/...',
  social_discord: 'https://discord.gg/...',
  social_instagram: 'https://instagram.com/...',
  social_linkedin: 'https://linkedin.com/...'
}
```

---

## 🔧 Environment Variables

```env
# Required
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=codecatalystjb@gmail.com
BREVO_SENDER_NAME=Code Catalyst Team

# Optional (with defaults)
LOGO_URL=https://yourapp.com/logo.png
SOCIAL_WHATSAPP=https://chat.whatsapp.com/your_link
SOCIAL_DISCORD=https://discord.gg/CCdv3rH
SOCIAL_INSTAGRAM=https://instagram.com/codecatalyst
SOCIAL_LINKEDIN=https://linkedin.com/company/codecatalyst
```

---

## 🎯 Email Type Decision Tree

```
Need to send email?
│
├─ Scheduling interview? → sendInterviewInvitation()
├─ Rescheduling interview? → sendInterviewRescheduleEmail()
├─ Candidate not selected? → sendRejectionEmail()
├─ Candidate missed interview? → sendTeamChoiceEmail(..., false)
├─ Post-interview team selection? → sendTeamChoiceEmail(..., true)
├─ Member not joined server? → sendServerJoinReminder()
├─ Approving leave? → sendLeaveApprovalEmail()
├─ Accepting resignation? → sendResignationAcknowledgement()
├─ Terminating member? → sendTerminationNotice()
└─ Re-inviting former member? → sendRejoiningInvitation()
```

---

## ⚡ Common Patterns

### Pattern 1: Email with Details Card
```javascript
{
  show_details: true,
  details_title: 'Event Details',
  detail_date: 'Date value',
  detail_date_label: 'Date',
  detail_time: 'Time value',
  detail_time_label: 'Time'
}
```

### Pattern 2: Email with Highlight + Social Links
```javascript
{
  show_highlight: true,
  show_social_links: true,
  highlight_icon: '🚀',
  highlight_title: 'Stay Connected!',
  highlight_message: '<p>Join our community</p>',
  social_discord: process.env.SOCIAL_DISCORD,
  social_whatsapp: process.env.SOCIAL_WHATSAPP
}
```

### Pattern 3: Email with CTA Button
```javascript
{
  show_cta: true,
  cta_text: 'Confirm Now',
  cta_link: 'https://forms.example.com/confirm',
  cta_subtext: 'Click to confirm your participation'
}
```

---

## 🐛 Debugging

### Test Email Rendering
```javascript
const emailTemplateService = require('./services/emailTemplateService');

const html = await emailTemplateService.renderEmail({
  email_title: 'Test',
  greeting_text: 'Hi Test,',
  intro_message: '<p>Test message</p>',
  sender_name: 'Test Sender'
});

console.log(html); // Inspect rendered HTML
```

### Check Brevo API Connection
```javascript
const brevoEmailService = require('./services/brevoEmailService');

try {
  await brevoEmailService.sendTemplatedEmail({
    to: 'test@example.com',
    toName: 'Test User',
    subject: 'Test Email',
    templateData: { /* minimal data */ }
  });
  console.log('✅ Email sent successfully');
} catch (error) {
  console.error('❌ Error:', error.message);
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Template not found` | Incorrect file path | Check `template.html` location |
| `401 Unauthorized` | Invalid API key | Verify `BREVO_API_KEY` in `.env` |
| `{{variable}}` visible in email | Wrong syntax | Use `{{{variable}}}` for HTML |
| Section not showing | Conditional flag not set | Ensure `show_details: true`, etc. |

---

## 📱 Testing Checklist

- [ ] Send test email to Gmail
- [ ] Send test email to Outlook
- [ ] Check mobile rendering (iPhone/Android)
- [ ] Verify all links work
- [ ] Test conditional sections (show/hide)
- [ ] Validate social media links
- [ ] Confirm CTA button functionality
- [ ] Check signature formatting
- [ ] Review footer content
- [ ] Test with missing optional variables

---

## 🆘 Quick Troubleshooting

### Email Not Sending?
1. Check Brevo API key is valid
2. Verify sender email is configured in Brevo
3. Confirm recipient email is valid
4. Check server logs for errors

### Template Not Rendering?
1. Ensure `template.html` exists in correct path
2. Verify Handlebars is installed: `npm list handlebars`
3. Check variable data structure matches expected format
4. Clear template cache: `emailTemplateService.clearCache()`

### Variables Not Showing?
1. Confirm variable names match exactly (case-sensitive)
2. Use `{{{variable}}}` for HTML content
3. Check conditional flags are set correctly
4. Verify variable is not `undefined` or `null`

---

## 📞 Get Help

- **Documentation**: `SYSTEM_INTEGRATION_GUIDE.md`
- **Variable List**: `EMAIL_VARIABLES_REFERENCE.md`
- **Summary**: `IMPLEMENTATION_SUMMARY.md`
- **Email**: codecatalystjb@gmail.com

---

**Last Updated**: January 2025  
**Version**: 2.0  
**Print this page for quick reference!**
