# Unified Email Template System - Complete Implementation

## 📧 Overview

This document describes the complete unified email template system that supports all HR workflows at Code Catalyst through a single, variable-driven HTML template.

---

## 🎯 Core Principle

**One Template. All Emails. Variable-Driven.**

Instead of creating separate HTML templates for each email type, the system uses:
- **ONE unified template** (`template.html`)
- **Boolean flags** to control layout sections
- **Variables** for content injection
- **Backend logic** for email-specific data population

---

## 📦 System Components

### 1. Unified Template (`template.html`)

The single source of truth for all email layouts with:
- Professional gradient design (purple/dark theme)
- Responsive layout
- Conditional sections controlled by flags
- Semantic variable naming

### 2. Email Templates Database (`seedEmailTemplates.js`)

Contains **20 predefined templates** covering:

#### System Templates
- `WELCOME` - Welcome Email
- `CONTACT_ACK` - Contact Form Acknowledgement

#### Hiring & Interview
- `HIRING_APPLIED` - Hiring Form Acknowledgement
- `INTERVIEW_ONLINE` - Interview Scheduled (Online)
- `INTERVIEW_OFFLINE` - Interview Scheduled (Offline)
- `INTERVIEW_RESCHEDULED` - Interview Rescheduled
- `INTERVIEW_NO_SHOW` - Interview Not Attended

#### Onboarding
- `HIRED` - Hired (Offer Letter)
- `NOT_HIRED` - Not Hired (Rejection)
- `TEAM_CHOICE_INTERVIEWED` - Team Choice (Interviewed)
- `TEAM_CHOICE_NOT_INTERVIEWED` - Team Choice (Not Interviewed)

#### Engagement
- `SERVER_JOIN_REMINDER` - Server Join Reminder
- `INACTIVITY_WARNING` - Inactivity Warning

#### Leave Management
- `LEAVE_APPROVED` - Leave Request Approved
- `LEAVE_REJECTED` - Leave Request Rejected

#### Attendance
- `ATTENDANCE_REMINDER` - Attendance Reminder

#### Exit Management
- `RESIGNATION_ACK` - Resignation Acknowledged
- `TERMINATION_NOTICE` - Termination Notice
- `REJOIN_INVITE` - Rejoining Invitation

#### Custom
- `TASK_ASSIGNMENT` - Task Assignment
- `ANNOUNCEMENT` - General Announcement

---

## 🔧 Variable System

### A. Global Variables (Always Available)

Required for every email:

```javascript
{
  email_subject: "Subject line",
  logo_url: "https://...",
  header_title: "Email Title",
  recipient_name: "John Doe",
  intro_message: "Opening message...",
  closing_message: "Closing message...",
  sender_name: "Poorvi",
  sender_designation: "HR Lead",
  current_year: "2026",
  website_url: "https://code-catalyst.pages.dev/",
  discord_url: "https://discord.gg/...",
  linkedin_url: "https://www.linkedin.com/company/...",
  instagram_url: "https://www.instagram.com/..."
}
```

### B. Conditional Flags

Control layout sections:

```javascript
{
  show_details: true,      // Show details card
  show_highlight: false,   // Show highlight/warning box
  show_cta: true          // Show call-to-action button
}
```

### C. Details Card Variables

Used when `show_details = true`:

```javascript
{
  date: "14 October 2025",
  time: "9:30 AM - 12:00 PM",
  mode_or_venue: "Google Meet / Room 109",
  interviewer_or_team: "Poorvi (HR), Divy (President)"
}
```

### D. Highlight Block Variables

Used when `show_highlight = true`:

```javascript
{
  highlight_message: "Important notice or warning text..."
}
```

### E. CTA Variables

Used when `show_cta = true`:

```javascript
{
  cta_text: "Confirm Availability",
  cta_link: "mailto:hr@example.com"
}
```

---

## 📊 Email Type Configuration Examples

### Example 1: Interview Invitation (Online)

```javascript
{
  // Global
  email_subject: "Interview Schedule – Code Catalyst Recruitment",
  logo_url: process.env.LOGO_URL,
  header_title: "Interview Invitation",
  recipient_name: "John Doe",
  intro_message: "We are pleased to inform you that you have been shortlisted...",
  closing_message: "We look forward to meeting you!",
  
  // Flags
  show_details: true,
  show_highlight: false,
  show_cta: true,
  
  // Details
  date: "29/10/2025",
  time: "7:00 PM",
  mode_or_venue: "Google Meet - https://meet.google.com/...",
  interviewer_or_team: "Poorvi (HR lead), Aakansha (HR), Divy (President)",
  
  // CTA
  cta_text: "Confirm Availability",
  cta_link: "mailto:hr@codecatalyst.com",
  
  // Footer
  sender_name: "Poorvi",
  sender_designation: "HR Lead",
  current_year: "2026",
  website_url: "...",
  discord_url: "...",
  linkedin_url: "...",
  instagram_url: "..."
}
```

### Example 2: Rejection Email (Not Hired)

```javascript
{
  // Global
  email_subject: "Application Update – Code Catalyst Recruitment",
  logo_url: process.env.LOGO_URL,
  header_title: "Application Update",
  recipient_name: "Jane Smith",
  intro_message: "Thank you for attending the interview...",
  closing_message: "We hope to see you succeed in your endeavors!",
  
  // Flags
  show_details: false,    // No details needed
  show_highlight: true,   // Show rejection notice
  show_cta: false,       // No action needed
  
  // Highlight
  highlight_message: "After careful evaluation, we are unable to proceed with your application at this time.",
  
  // Footer
  sender_name: "HR Team",
  sender_designation: "",
  current_year: "2026",
  website_url: "...",
  discord_url: "...",
  linkedin_url: "...",
  instagram_url: "..."
}
```

### Example 3: Leave Approval

```javascript
{
  // Global
  email_subject: "Leave Request Approved",
  logo_url: process.env.LOGO_URL,
  header_title: "Leave Approved",
  recipient_name: "Mike Johnson",
  intro_message: "Your leave request has been approved!",
  closing_message: "Enjoy your time off and come back refreshed!",
  
  // Flags
  show_details: true,
  show_highlight: false,
  show_cta: false,
  
  // Details
  date: "15-20 January 2025",
  time: "",  // Not used for leave
  mode_or_venue: "Personal Leave",
  interviewer_or_team: "Content Team",
  
  // Footer
  sender_name: "HR Manager",
  sender_designation: "Human Resources",
  current_year: "2026",
  website_url: "...",
  discord_url: "...",
  linkedin_url: "...",
  instagram_url: "..."
}
```

---

## 🚀 Implementation Guide

### Step 1: Seed Email Templates

Run the seeder script to populate the database:

```bash
node backend/scripts/seedEmailTemplates.js
```

This creates all 20 predefined templates in the database.

### Step 2: Send an Email

Use the appropriate service function:

```javascript
import { HrEventService } from '../services/hrEventService.js';

// Example: Send interview invitation
await HrEventService.handleEvent('INTERVIEW_SCHEDULED_ONLINE', {
  email: 'candidate@example.com',
  name: 'John Doe',
  date: '29/10/2025',
  time: '7:00 PM',
  meetLink: 'https://meet.google.com/...',
  interviewers: 'Poorvi (HR lead), Aakansha (HR)',
  hrName: 'Poorvi',
  designation: 'HR Lead'
}, workspaceId);
```

### Step 3: Frontend Usage

The HR Dashboard automatically displays all templates by category:

- **Hiring** (purple badge)
- **Interview** (indigo badge)
- **Onboarding** (teal badge)
- **Engagement** (pink badge)
- **Exit** (red badge)
- **Leave** (blue badge)
- **Attendance** (orange badge)
- **System** (green badge)

---

## 🎨 Email Categories

| Category | Icon | Color | Email Types |
|----------|------|-------|-------------|
| **hiring** | UserPlus | Purple | Hiring Applied, Not Hired |
| **interview** | MessageSquare | Indigo | Online, Offline, Rescheduled, No-Show |
| **onboarding** | Users | Teal | Hired, Team Choice (x2) |
| **engagement** | Bell | Pink | Server Reminder, Inactivity Warning, Rejoin Invite |
| **exit** | UserMinus | Red | Resignation Ack, Termination Notice |
| **leave** | Calendar | Blue | Leave Approved, Leave Rejected |
| **attendance** | Clock | Orange | Attendance Reminder |
| **system** | User | Green | Welcome, Contact Ack |
| **custom** | FileText | Gray | Task Assignment, Announcement |

---

## ✅ Variable Validation

The system automatically validates required variables for each template type through `templateVariableRegistry.js`.

Example validation:

```javascript
INTERVIEW_ONLINE: {
  required: ['candidateName', 'date', 'time', 'meetLink', 'interviewers', 'hrName', 'designation'],
  optional: []
}
```

---

## 🔄 Email Workflow

1. **HR Action** → User triggers action in dashboard
2. **Event Dispatch** → `HrEventService.handleEvent()` called
3. **Template Lookup** → Finds template code (e.g., `INTERVIEW_ONLINE`)
4. **Variable Resolution** → Populates variables from event data
5. **Email Rendering** → Brevo renders unified template with variables
6. **Delivery** → Email sent via Brevo transactional API
7. **Audit Log** → Action recorded in change logs

---

## 📋 Maintenance Guide

### Adding a New Email Type

1. **Add template to `seedEmailTemplates.js`:**

```javascript
{
  name: 'New Email Type',
  code: 'NEW_EMAIL',
  subject: 'Email Subject',
  category: 'engagement',
  isPredefined: true,
  variables: [
    { name: 'variableName', description: 'Description', example: 'Example' }
  ],
  htmlContent: `...`
}
```

2. **Add event mapping in `hrEventService.js`:**

```javascript
static EVENT_TEMPLATE_MAP = {
  ...
  NEW_EMAIL_EVENT: 'NEW_EMAIL'
}
```

3. **Add variable validation in `templateVariableRegistry.js`:**

```javascript
NEW_EMAIL: {
  required: ['variableName', 'recipient_name'],
  optional: []
}
```

4. **Run seeder:**

```bash
node backend/scripts/seedEmailTemplates.js
```

---

## 🎯 Benefits of Unified System

✅ **Single Source of Truth** - One template maintains consistency  
✅ **Easy Updates** - Change template.html, all emails update  
✅ **Reduced Complexity** - No HTML duplication  
✅ **Clean Separation** - Layout (HTML) separate from content (variables)  
✅ **Flexible** - Boolean flags enable/disable sections  
✅ **Scalable** - Add new email types without new templates  
✅ **Maintainable** - Easier to debug and update  
✅ **Professional** - Consistent branding across all emails

---

## 📞 Support

For questions or issues:
- **Technical Lead:** Jassa
- **Project:** TaskFlow HR Module
- **Documentation:** This file + API_REFERENCE_HR_MODULE.md

---

**Last Updated:** January 22, 2026  
**Version:** 2.0  
**Status:** ✅ Production Ready
