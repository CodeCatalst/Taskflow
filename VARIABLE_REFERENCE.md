# Email Template Variable Quick Reference

## 🎯 Master Variable List

This is the complete, authoritative list of variables supported by the unified template system.

---

## A. Global Variables (Always Required)

These variables are used in EVERY email type:

```javascript
{
  // Email Metadata
  email_subject: string,           // Subject line (max 60 chars)
  
  // Header
  logo_url: string,                // Company logo URL
  header_title: string,            // Header title (e.g., "Interview Invitation")
  
  // Recipient
  recipient_name: string,          // Recipient's first name or full name
  
  // Content
  intro_message: string,           // Opening paragraph(s)
  closing_message: string,         // Closing paragraph(s)
  
  // Signature
  sender_name: string,             // Sender's name
  sender_designation: string,      // Sender's title/role
  
  // Footer
  current_year: string,            // Current year for copyright
  website_url: string,             // Company website
  discord_url: string,             // Discord community link
  linkedin_url: string,            // LinkedIn page
  instagram_url: string            // Instagram page
}
```

---

## B. Conditional Flags (Boolean)

Control which sections appear in the email:

```javascript
{
  show_details: boolean,           // Show details card (interview info, leave dates, etc.)
  show_highlight: boolean,         // Show highlight/warning box
  show_cta: boolean               // Show call-to-action button
}
```

**Usage:**
- `true` = Section appears
- `false` or `undefined` = Section hidden

---

## C. Details Card Variables

Used when `show_details = true`:

```javascript
{
  date: string,                    // Event date (e.g., "14 October 2025")
  time: string,                    // Event time (e.g., "9:30 AM - 12:00 PM")
  mode_or_venue: string,           // Meeting mode or physical venue
  interviewer_or_team: string      // Interviewer names or team name
}
```

**Examples:**
- Interview: `mode_or_venue: "Google Meet - https://meet.google.com/xxx"`
- Leave: `mode_or_venue: "Personal Leave"`
- Offline: `mode_or_venue: "Room No. 109, JB Knowledge Park"`

---

## D. Highlight Block Variables

Used when `show_highlight = true`:

```javascript
{
  highlight_message: string        // Warning, notice, or important message
}
```

**Examples:**
- Rejection: `"After careful evaluation, we are unable to proceed..."`
- Warning: `"You have been inactive for 3 weeks..."`
- Notice: `"The joining link is valid only for 24 hours"`

---

## E. CTA Variables

Used when `show_cta = true`:

```javascript
{
  cta_text: string,               // Button text (e.g., "Confirm Availability")
  cta_link: string                // Button URL
}
```

**Examples:**
- Email: `cta_link: "mailto:hr@example.com?subject=Confirmation"`
- Form: `cta_link: "https://forms.gle/example"`
- Discord: `cta_link: "https://discord.gg/example"`

---

## F. Extended Variables (Optional)

These can be embedded within text messages for additional context:

```javascript
{
  // Template-specific data
  team_name: string,
  role_name: string,
  domain_name: string,
  college_name: string,
  organization_name: string,
  termination_reason: string,
  resignation_date: string,
  leave_dates: string,
  inactivity_period: string,
  deadline_date: string
}
```

**Note:** These are injected into `intro_message`, `closing_message`, or `highlight_message` rather than having dedicated UI slots.

---

## 📧 Email Type → Variable Mapping

### Interview Invitation (Online/Offline)

```javascript
{
  // Flags
  show_details: true,
  show_highlight: false,
  show_cta: true,
  
  // Required
  email_subject: "Interview Schedule – Code Catalyst Recruitment",
  header_title: "Interview Invitation",
  recipient_name: "John Doe",
  intro_message: "We are pleased to inform you...",
  
  // Details
  date: "29/10/2025",
  time: "7:00 PM",
  mode_or_venue: "Google Meet / Room 109",
  interviewer_or_team: "Poorvi (HR), Divy (President)",
  
  // CTA
  cta_text: "Confirm Availability",
  cta_link: "mailto:hr@codecatalyst.com",
  
  // Closing
  closing_message: "We look forward to meeting you!",
  sender_name: "Poorvi",
  sender_designation: "HR Lead"
}
```

---

### Not Hired (Rejection)

```javascript
{
  // Flags
  show_details: false,
  show_highlight: true,
  show_cta: false,
  
  // Required
  email_subject: "Application Update – Code Catalyst Recruitment",
  header_title: "Application Update",
  recipient_name: "Jane Smith",
  intro_message: "Thank you for attending the interview...",
  
  // Highlight
  highlight_message: "After careful evaluation, we are unable to proceed with your application at this time.",
  
  // Closing
  closing_message: "We hope to see you succeed!",
  sender_name: "HR Team",
  sender_designation: ""
}
```

---

### Leave Approval

```javascript
{
  // Flags
  show_details: true,
  show_highlight: false,
  show_cta: false,
  
  // Required
  email_subject: "Leave Request Approved",
  header_title: "Leave Approved",
  recipient_name: "Mike Johnson",
  intro_message: "Your leave request has been approved!",
  
  // Details
  date: "15-20 January 2025",
  time: "",  // Not used
  mode_or_venue: "Personal Leave",
  interviewer_or_team: "Content Team",
  
  // Closing
  closing_message: "Enjoy your time off!",
  sender_name: "HR Manager",
  sender_designation: "Human Resources"
}
```

---

### Server Join Reminder

```javascript
{
  // Flags
  show_details: false,
  show_highlight: false,
  show_cta: true,
  
  // Required
  email_subject: "Reminder: Join the Code Catalyst Core Server",
  header_title: "Join Core Server",
  recipient_name: "Alex Brown",
  intro_message: "We noticed you haven't joined our Discord server yet...",
  
  // CTA
  cta_text: "Join Core Server Now",
  cta_link: "https://discord.gg/example",
  
  // Closing
  closing_message: "The link is valid for a limited time!",
  sender_name: "HR Team",
  sender_designation: ""
}
```

---

### Inactivity Warning

```javascript
{
  // Flags
  show_details: false,
  show_highlight: true,
  show_cta: false,
  
  // Required
  email_subject: "Reminder: Your Activity on Code Catalyst",
  header_title: "Activity Reminder",
  recipient_name: "Chris Davis",
  intro_message: "We hope you're doing well! This is a reminder...",
  
  // Highlight
  highlight_message: "We've observed that you haven't been active for approximately 3 weeks.",
  
  // Closing
  closing_message: "Please respond within 7 days.",
  sender_name: "Team Lead",
  sender_designation: "Content Team"
}
```

---

### Resignation Acknowledged

```javascript
{
  // Flags
  show_details: false,
  show_highlight: false,
  show_cta: false,
  
  // Required
  email_subject: "Acknowledgement of Your Resignation",
  header_title: "Resignation Acknowledged",
  recipient_name: "Taylor Martinez",
  intro_message: "Thank you for informing us about your decision...",
  closing_message: "You will always remain a valued part of our family!",
  
  // Signature
  sender_name: "Project Manager",
  sender_designation: "Team Lead"
}
```

---

## 🔧 Variable Naming Conventions

### DO ✅
- Use clear, descriptive names: `recipient_name`, `intro_message`
- Use underscores for multi-word names: `show_details`, `cta_link`
- Use consistent prefixes: `show_*` for booleans, `cta_*` for buttons

### DON'T ❌
- Use camelCase: `recipientName` (wrong)
- Use generic names: `text1`, `value` (unclear)
- Mix conventions: `show-details` (inconsistent)

---

## 📋 Template-Specific Variable Examples

### INTERVIEW_ONLINE

```javascript
{
  candidateName: "John Doe",        // Maps to: recipient_name
  date: "29/10/2025",               // Maps to: date
  time: "7:00 PM",                  // Maps to: time
  meetLink: "https://...",          // Maps to: mode_or_venue
  interviewers: "Poorvi, Divy",     // Maps to: interviewer_or_team
  hrName: "Poorvi",                 // Maps to: sender_name
  designation: "HR Lead"            // Maps to: sender_designation
}
```

### HIRED

```javascript
{
  candidateName: "John Doe",        // Maps to: recipient_name
  domainName: "Web Development",    // Injected in: intro_message
  discordLink: "https://...",       // Maps to: cta_link
  hrName: "Poorvi",                 // Maps to: sender_name
  designation: "HR Lead"            // Maps to: sender_designation
}
```

### TERMINATION_NOTICE

```javascript
{
  memberName: "Jordan Anderson",    // Maps to: recipient_name
  teamName: "Dev Team",             // Injected in: intro_message
  inactivePeriod: "4 weeks",        // Injected in: highlight_message
  managerName: "Team Lead"          // Maps to: sender_name
}
```

---

## 🎨 Variable Types

| Variable | Type | Example | Max Length |
|----------|------|---------|------------|
| `email_subject` | string | "Interview Schedule" | 60 chars |
| `recipient_name` | string | "John Doe" | 50 chars |
| `intro_message` | HTML string | `<p>Hello...</p>` | 1000 chars |
| `show_details` | boolean | `true` | - |
| `date` | string | "14 October 2025" | 50 chars |
| `cta_link` | URL | "https://..." | 500 chars |

---

## ⚠️ Important Notes

1. **HTML in Messages**: `intro_message`, `closing_message`, and `highlight_message` support HTML
2. **Required vs Optional**: All global variables are required; conditionals are optional
3. **Fallbacks**: System provides defaults for missing optional variables
4. **Validation**: Backend validates required variables before sending

---

## 🔍 Quick Lookup

**Need interview details?** → Use `show_details: true` + `date`, `time`, `mode_or_venue`, `interviewer_or_team`

**Need warning box?** → Use `show_highlight: true` + `highlight_message`

**Need action button?** → Use `show_cta: true` + `cta_text`, `cta_link`

**Need footer links?** → Always present with `website_url`, `discord_url`, etc.

---

**Reference Version:** 2.0  
**Last Updated:** January 22, 2026  
**Compatible With:** template.html v2.0
