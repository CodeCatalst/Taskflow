# Email Template Variables Reference

## Complete Variable Specification for HR Email System

This document provides a comprehensive mapping of ALL variables supported by the unified HTML email template for the TaskFlow HR Module. The template is designed to handle all HR communication scenarios without requiring manual editing.

---

## 📋 Table of Contents

1. [Global Variables](#global-variables)
2. [Conditional Toggles](#conditional-toggles)
3. [Details Card Variables](#details-card-variables)
4. [Highlight Block Variables](#highlight-block-variables)
5. [CTA Variables](#cta-variables)
6. [Email Type Mappings](#email-type-mappings)

---

## 1. Global Variables

These variables are **always available** and form the foundation of every email.

### Header & Identity
| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `email_subject` | String | Email subject line (for email client, not displayed in template) | "Interview Invitation - Code Catalyst" |
| `logo_url` | String (URL) | Company/organization logo URL | "https://example.com/logo.png" |
| `company_name` | String | Organization name (for alt text) | "Code Catalyst" |
| `email_title` | String | Main header title displayed in template | "Interview Invitation" |

### Content Structure
| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `greeting_text` | String | Personalized greeting | "Hi John," or "Dear Candidate," |
| `intro_message` | HTML String | Primary message body (supports HTML) | `<p>We are excited to invite you...</p>` |
| `body_message` | HTML String (Optional) | Additional message content | `<p>Please note the following...</p>` |
| `additional_message` | HTML String (Optional) | Extra message section | `<p>We look forward to...</p>` |
| `closing_message` | HTML String (Optional) | Final closing remarks | `<p>Thank you for your interest...</p>` |

### Signature
| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `signature_greeting` | String | Signature opening | "Best regards," or "Warm regards," |
| `sender_name` | String | Sender's name | "Poorvi" |
| `sender_role` | String | Sender's role/title | "HR Manager" |
| `sender_team` | String | Sender's team | "Code Catalyst Team" |
| `sender_organization` | String (Optional) | Organization name | "JB Knowledge Park" |

### Footer
| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `footer_text` | String (Optional) | Footer message | "© 2025 Code Catalyst. All rights reserved." |
| `contact_email` | String (Email) | Contact email address | "codecatalystjb@gmail.com" |
| `contact_phone` | String (Optional) | Contact phone number | "+91 98765 43210" |
| `company_address` | String (Optional) | Physical address | "JB Knowledge Park, Faridabad" |
| `footer_legal` | String (Optional) | Legal/privacy notice | "This email is confidential..." |

---

## 2. Conditional Toggles

Boolean flags that control which sections appear in the email.

| Variable | Type | Description | Default |
|----------|------|-------------|---------|
| `show_details` | Boolean | Shows/hides the Details Card section | `false` |
| `show_highlight` | Boolean | Shows/hides the Highlight Block section | `false` |
| `show_cta` | Boolean | Shows/hides the Call-to-Action button | `false` |
| `show_social_links` | Boolean | Shows/hides social media links in footer | `false` |

---

## 3. Details Card Variables

Used when `show_details = true`. Displays structured information in a table format with emoji icons.

### Core Detail Fields
| Variable | Type | Description | Icon |
|----------|------|-------------|------|
| `details_title` | String | Card heading | N/A |
| `detail_date` | String | Date value | 📅 |
| `detail_date_label` | String | Date field label | "Date:" |
| `detail_time` | String | Time value | 🕒 |
| `detail_time_label` | String | Time field label | "Time:" |
| `detail_venue` | String | Location/venue value | 📍 |
| `detail_venue_label` | String | Venue field label | "Venue:" |
| `detail_interviewer` | String | Interviewer names | 👥 |
| `detail_interviewer_label` | String | Interviewer field label | "Interviewer:" |

### Additional Detail Fields
| Variable | Type | Description | Icon |
|----------|------|-------------|------|
| `detail_role` | String | Role/position name | 💼 |
| `detail_role_label` | String | Role field label | "Role:" |
| `detail_team` | String | Team name | 👥 |
| `detail_team_label` | String | Team field label | "Team:" |
| `detail_duration` | String | Duration/period | ⏱️ |
| `detail_duration_label` | String | Duration field label | "Duration:" |
| `detail_leave_dates` | String | Leave date range | 📆 |
| `detail_leave_dates_label` | String | Leave dates field label | "Leave Period:" |
| `detail_reason` | String | Reason/notes | 📝 |
| `detail_reason_label` | String | Reason field label | "Reason:" |

### Custom Detail Fields
| Variable | Type | Description |
|----------|------|-------------|
| `detail_custom_field_1` | String | Custom field value 1 |
| `detail_custom_label_1` | String | Custom field label 1 |
| `detail_custom_field_2` | String | Custom field value 2 |
| `detail_custom_label_2` | String | Custom field label 2 |
| `detail_custom_field_3` | String | Custom field value 3 |
| `detail_custom_label_3` | String | Custom field label 3 |

---

## 4. Highlight Block Variables

Used when `show_highlight = true`. Creates a visually distinct colored block for important information or lists.

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `highlight_icon` | String (Emoji/HTML) | Icon displayed at top | "🚀" or "⚠️" |
| `highlight_title` | String | Block heading | "Important Instructions" |
| `highlight_message` | HTML String | Main highlight message | `<p>No worries—you can still be part of our community!</p>` |
| `highlight_list_items` | Array of Strings | List items (supports HTML) | `["<strong>WhatsApp:</strong> Join here", "<strong>Discord:</strong> Join here"]` |

---

## 5. CTA Variables

Used when `show_cta = true`. Displays a prominent call-to-action button.

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `cta_text` | String | Button text | "Confirm Your Availability" |
| `cta_link` | String (URL) | Button destination URL | "https://forms.example.com/confirm" |
| `cta_subtext` | String (Optional) | Text below button | "This link expires in 48 hours" |

---

## 6. Social Links Variables

Used when `show_social_links = true`. Displays social media links in the footer.

| Variable | Type | Description |
|----------|------|-------------|
| `social_whatsapp` | String (URL) | WhatsApp group/contact link |
| `social_discord` | String (URL) | Discord server invite link |
| `social_instagram` | String (URL) | Instagram profile URL |
| `social_linkedin` | String (URL) | LinkedIn page URL |

---

## 📧 Email Type Mappings

### 1. Interview Invitation (Hiring)

**Conditional Flags:**
```javascript
{
  show_details: true,
  show_highlight: false,
  show_cta: true,
  show_social_links: false
}
```

**Required Variables:**
- `email_title`: "Interview Invitation"
- `greeting_text`: "Hi [Candidate Name],"
- `intro_message`: "Congratulations! We are pleased to invite you for an interview..."
- `details_title`: "Interview Details"
- `detail_date`: "14 October 2025"
- `detail_date_label`: "Date"
- `detail_time`: "9:30 AM to 12:00 PM"
- `detail_time_label`: "Time"
- `detail_venue`: "Room No. 109, JB Knowledge Park"
- `detail_venue_label`: "Venue"
- `detail_interviewer`: "Poorvi (HR), Divy (President), Arjan (Secretary), Jeevan (Vice President)"
- `detail_interviewer_label`: "Interviewer"
- `body_message`: `<h3>Important Instructions:</h3><ul><li>Please arrive at least <strong>10 minutes early</strong>.</li><li>Carry your <strong>College ID Card</strong> and a copy of your <strong>resume</strong>.</li><li>Dress well to maintain professionalism.</li><li>Be prepared to discuss your background, skills, and your interest in contributing to the <strong>Code Catalyst Community</strong>.</li></ul>`
- `closing_message`: "Kindly reply to this email to <strong>confirm your availability</strong>..."
- `cta_text`: "Confirm Availability"
- `cta_link`: "mailto:[hr-email]?subject=Interview Confirmation"

---

### 2. Not Hired (Rejection)

**Conditional Flags:**
```javascript
{
  show_details: false,
  show_highlight: true,
  show_cta: false,
  show_social_links: true
}
```

**Required Variables:**
- `email_title`: "Application Update"
- `greeting_text`: "Hi [Candidate's Name],"
- `intro_message`: "Thank you once again for your interest in joining the <strong>Code Catalyst Community</strong>..."
- `body_message`: "After careful consideration, we regret to inform you that you have <strong>not been selected</strong>..."
- `highlight_icon`: "🚀"
- `highlight_title`: "Stay Connected!"
- `highlight_message`: "No worries—you can still be a part of our growing community! Stay connected with us, collaborate, and participate in upcoming events through our platforms:"
- `highlight_list_items`: [
  "<strong>WhatsApp:</strong> <a href='[link]'>Join here</a>",
  "<strong>Discord:</strong> <a href='[link]'>Join here</a>",
  "<strong>Instagram:</strong> <a href='[link]'>Follow us</a>",
  "<strong>LinkedIn:</strong> <a href='[link]'>Connect with us</a>"
]
- `social_whatsapp`: "[WhatsApp URL]"
- `social_discord`: "[Discord URL]"
- `social_instagram`: "[Instagram URL]"
- `social_linkedin`: "[LinkedIn URL]"

---

### 3. Interview Update (Non-Attendee - Main Server Draft)

**Conditional Flags:**
```javascript
{
  show_details: false,
  show_highlight: true,
  show_cta: false,
  show_social_links: true
}
```

**Required Variables:**
- `email_title`: "Interview Update"
- `greeting_text`: "Dear [Name],"
- `intro_message`: "We noticed that you were unable to attend your scheduled interview with <strong>Code Catalyst</strong>..."
- `body_message`: "As you didn't join at the given time, your interview has been marked as <strong>canceled</strong>."
- `highlight_icon`: "🚀"
- `highlight_title`: "Still Join Our Community!"
- `highlight_message`: "No worries—you can still be a part of our growing community!"
- `highlight_list_items`: [
  "<strong>WhatsApp:</strong> <a href='[link]'>Join here</a>",
  "<strong>Discord:</strong> <a href='[link]'>Join here</a>",
  "<strong>Instagram:</strong> <a href='[link]'>Follow us</a>",
  "<strong>LinkedIn:</strong> <a href='[link]'>Connect with us</a>"
]

---

### 4. Reminder (Join Core Server)

**Conditional Flags:**
```javascript
{
  show_details: false,
  show_highlight: false,
  show_cta: true,
  show_social_links: false
}
```

**Required Variables:**
- `email_title`: "Reminder: Join Core Server"
- `greeting_text`: "Dear [Name],"
- `intro_message`: "We noticed that you have not yet joined the official server as requested..."
- `body_message`: "<strong>Please note:</strong> If you do not join the server within the given time, your spot will be automatically released..."
- `cta_text`: "Join Discord Server"
- `cta_link`: "https://discord.gg/CCdv3rH"
- `cta_subtext`: "Click the button above to join now"

---

### 5. Interviewed (Team Choice)

**Conditional Flags:**
```javascript
{
  show_details: false,
  show_highlight: false,
  show_cta: false,
  show_social_links: false
}
```

**Required Variables:**
- `email_title`: "Your Code Catalyst Interview is Done — Choose Your Team!"
- `greeting_text`: "Hey [Student Name],"
- `intro_message`: "Thank you for attending your <strong>Code Catalyst interview</strong>! 🌟..."
- `body_message`: `<p>Here are the teams you can choose from:</p><ul><li>💡 <strong>PR (Public Relations)</strong> – Represent our community...</li><li>📝 <strong>Content</strong> – Write, design, and craft engaging stories...</li><li>🧩 <strong>HR (Human Resources)</strong> – Assist in recruitment...</li><li>🎉 <strong>Event Management</strong> – Plan, organize, and execute exciting tech events...</li><li>💻 <strong>Project Management</strong> – Lead innovative projects...</li></ul>`
- `additional_message`: "<strong>Note:</strong> Attending the interview does not limit your options!..."

---

### 6. Not Interviewed (Team Choice)

**Conditional Flags:**
```javascript
{
  show_details: false,
  show_highlight: false,
  show_cta: false,
  show_social_links: false
}
```

**Required Variables:**
- `email_title`: "Interview Update"
- `greeting_text`: "Hey everyone,"
- `intro_message`: "We noticed that you couldn't make it to your <strong>Code Catalyst interview</strong>..."
- `body_message`: "You still have a chance to <strong>be part of our technical community</strong>..."
- `additional_message`: `<p>If you're interested, you can now opt to join any of the following teams:</p><ul><li>💡 <strong>PR</strong></li><li>📝 <strong>Content</strong></li><li>🧩 <strong>HR</strong></li><li>🎉 <strong>Event Management</strong></li><li>💻 <strong>Project Management</strong></li></ul>`

---

### 7. Leave Accepted

**Conditional Flags:**
```javascript
{
  show_details: true,
  show_highlight: false,
  show_cta: false,
  show_social_links: false
}
```

**Required Variables:**
- `email_title`: "Leave Request Approved ✅"
- `greeting_text`: "Dear [Student's Name],"
- `intro_message`: "Your leave request has been reviewed and approved..."
- `details_title`: "Leave Details"
- `detail_leave_dates`: "[mention date(s)]"
- `detail_leave_dates_label`: "Approved Leave Period"
- `detail_reason`: "[reason if provided]"
- `detail_reason_label`: "Reason"
- `body_message`: "Please ensure that you coordinate with your respective team members..."

---

### 8. Interview Rescheduled

**Conditional Flags:**
```javascript
{
  show_details: true,
  show_highlight: false,
  show_cta: true,
  show_social_links: false
}
```

**Required Variables:**
- `email_title`: "Interview Reschedule"
- `greeting_text`: "Dear [Student's Name],"
- `intro_message`: "We hope you're doing well. We noticed that you couldn't attend your scheduled interview..."
- `body_message`: "We understand that unforeseen circumstances can arise, so we're giving you another opportunity..."
- `details_title`: "New Interview Details"
- `detail_date`: "14 October 2025"
- `detail_time`: "9:30 AM to 12:00 PM"
- `detail_venue`: "Room No. 109, JB Knowledge Park"
- `detail_interviewer`: "Poorvi (HR), Divy (President), Arjan (Secretary), Jeevan (Vice President)"
- `cta_text`: "Confirm Rescheduled Interview"
- `cta_link`: "[confirmation URL]"

---

### 9. Resignation Acknowledged

**Conditional Flags:**
```javascript
{
  show_details: false,
  show_highlight: false,
  show_cta: false,
  show_social_links: false
}
```

**Required Variables:**
- `email_title`: "Acknowledgement of Your Resignation"
- `greeting_text`: "Hi [Member's Name],"
- `intro_message`: "Thank you for informing us about your decision to resign from the <strong>Code Catalyst Community</strong>."
- `body_message`: "We acknowledge your resignation and respect your choice..."
- `closing_message`: "You will always remain a valued part of the <strong>Code Catalyst family</strong>."

---

### 10. Termination

**Conditional Flags:**
```javascript
{
  show_details: true,
  show_highlight: true,
  show_cta: false,
  show_social_links: false
}
```

**Required Variables:**
- `email_title`: "Notice of Termination"
- `greeting_text`: "Dear [Member Name],"
- `intro_message`: "This letter serves as formal notification that your position as a team member on the [Team Name] roster is terminated, effective immediately."
- `body_message`: "This decision is based on your consistent failure to meet the minimum activity and commitment standards..."
- `details_title`: "Grounds for Termination"
- `detail_custom_field_1`: "Repeated, unexcused absences and severe tardiness..."
- `detail_custom_label_1`: "❌ Irregular Attendance"
- `detail_custom_field_2`: "Failure to maintain regular engagement in critical team communication channels..."
- `detail_custom_label_2`: "❌ Inactivity"
- `highlight_title`: "Next Steps"
- `highlight_message`: "You are required to immediately cease using the [Team Name] brand, logo, and intellectual property."

---

### 11. Rejoining

**Conditional Flags:**
```javascript
{
  show_details: false,
  show_highlight: false,
  show_cta: true,
  show_social_links: false
}
```

**Required Variables:**
- `email_title`: "Invitation to Rejoin"
- `greeting_text`: "Dear [Member Name],"
- `intro_message`: "I hope you're doing well. We're glad to inform you that the team has decided to welcome you back..."
- `body_message`: "Your previous contributions and creative input have always added great value to the team..."
- `cta_text`: "Confirm Rejoining"
- `cta_link`: "[confirmation URL]"
- `closing_message`: "Welcome back to the team!"

---

## 🔧 Technical Implementation Notes

### 1. **Handlebars Syntax**
The template uses Handlebars-style syntax:
- `{{variable}}` - Simple variable substitution
- `{{{variable}}}` - HTML-safe variable (does not escape HTML)
- `{{#if condition}}...{{/if}}` - Conditional rendering
- `{{#each array}}...{{/each}}` - Loop through arrays

### 2. **HTML Support**
Variables with triple braces `{{{ }}}` support HTML:
- `intro_message`
- `body_message`
- `additional_message`
- `closing_message`
- `highlight_message`
- `highlight_list_items` (array elements)

### 3. **Boolean Toggles**
All `show_*` variables expect boolean values:
```javascript
// Example
{
  show_details: true,  // Show details card
  show_highlight: false  // Hide highlight block
}
```

### 4. **Conditional Fields**
Detail card fields only render if both label and value are provided:
```javascript
{
  detail_date: "14 October 2025",  // Value
  detail_date_label: "Date"  // Label
}
```

### 5. **Array Handling**
`highlight_list_items` expects an array of strings:
```javascript
{
  highlight_list_items: [
    "<strong>Item 1:</strong> Description",
    "<strong>Item 2:</strong> Description"
  ]
}
```

---

## 📝 Usage Example

```javascript
const emailData = {
  // Global
  email_subject: "Interview Invitation - Code Catalyst",
  logo_url: "https://codecatalyst.com/logo.png",
  company_name: "Code Catalyst",
  email_title: "Interview Invitation",
  greeting_text: "Hi John Doe,",
  intro_message: "<p>Congratulations! We are excited to invite you for an interview...</p>",
  
  // Conditional toggles
  show_details: true,
  show_highlight: false,
  show_cta: true,
  show_social_links: false,
  
  // Details card
  details_title: "Interview Details",
  detail_date: "14 October 2025",
  detail_date_label: "Date",
  detail_time: "9:30 AM - 12:00 PM",
  detail_time_label: "Time",
  detail_venue: "Room 109, JB Knowledge Park",
  detail_venue_label: "Venue",
  
  // CTA
  cta_text: "Confirm Your Availability",
  cta_link: "https://forms.example.com/confirm",
  
  // Signature
  signature_greeting: "Best regards,",
  sender_name: "Poorvi",
  sender_role: "HR Manager",
  sender_team: "Code Catalyst Team",
  
  // Footer
  contact_email: "codecatalystjb@gmail.com"
};
```

---

## ✅ Variable Checklist

Use this checklist to ensure complete variable coverage for each email type:

- [ ] **Global Variables**: All required fields populated
- [ ] **Conditional Toggles**: Correct boolean values set
- [ ] **Details Card**: Labels and values provided (if `show_details = true`)
- [ ] **Highlight Block**: Icon, title, message, and list items (if `show_highlight = true`)
- [ ] **CTA**: Text and link provided (if `show_cta = true`)
- [ ] **Signature**: Sender information complete
- [ ] **Footer**: Contact information and social links (if applicable)

---

## 🆘 Support

For questions or issues with variable mapping:
- Email: codecatalystjb@gmail.com
- Documentation: See `SYSTEM_INTEGRATION_GUIDE.md`

---

**Last Updated:** January 2025  
**Template Version:** 2.0  
**Compatible With:** Brevo Transactional Email API, TaskFlow HR Module
