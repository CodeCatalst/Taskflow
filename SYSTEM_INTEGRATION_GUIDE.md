# System Integration Guide: Brevo + TaskFlow HR Email Automation

## 🚀 Drop-In Ready Backend Integration Prompt

This guide provides complete instructions for integrating the unified HTML email template with your TaskFlow HR system using the Brevo transactional email API.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Architecture](#architecture)
4. [Email Service Implementation](#email-service-implementation)
5. [Email Type Functions](#email-type-functions)
6. [Brevo Integration](#brevo-integration)
7. [Testing](#testing)
8. [Deployment](#deployment)

---

## 1. Overview

### System Components
- **Template Engine**: Handlebars-compatible HTML template (`template.html`)
- **Email Provider**: Brevo (formerly Sendinblue) Transactional Email API
- **Backend**: Node.js / Express.js
- **Database**: MongoDB (TaskFlow existing setup)
- **Email Service**: `brevoEmailService.js` and `hrActionService.js`

### Email Types Supported
1. Interview Invitation (Hiring)
2. Not Hired (Rejection)
3. Interview Update (Non-Attendee)
4. Reminder (Join Server)
5. Interviewed (Team Choice)
6. Not Interviewed (Team Choice)
7. Leave Accepted
8. Interview Rescheduled
9. Resignation Acknowledged
10. Termination
11. Rejoining

---

## 2. Prerequisites

### Required npm Packages
```bash
npm install @sendinblue/client handlebars dotenv
```

### Environment Variables
Add to your `.env` file:
```env
# Brevo API Configuration
BREVO_API_KEY=your_brevo_api_key_here
BREVO_SENDER_EMAIL=codecatalystjb@gmail.com
BREVO_SENDER_NAME=Code Catalyst Team

# Application URLs
BASE_URL=https://yourapp.com
LOGO_URL=https://yourapp.com/assets/logo.png

# Social Media Links
SOCIAL_WHATSAPP=https://chat.whatsapp.com/your_link
SOCIAL_DISCORD=https://discord.gg/CCdv3rH
SOCIAL_INSTAGRAM=https://instagram.com/codecatalyst
SOCIAL_LINKEDIN=https://linkedin.com/company/codecatalyst
```

### File Structure
```
backend/
├── services/
│   ├── brevoEmailService.js      # Brevo API wrapper
│   ├── hrActionService.js        # HR-specific email functions
│   └── emailTemplateService.js   # New: Template rendering service
├── templates/
│   └── email/
│       └── template.html         # Unified HTML email template
├── config/
│   └── email.config.js           # Email configuration
└── utils/
    └── emailHelpers.js           # Helper functions
```

---

## 3. Architecture

### Email Flow Diagram
```
┌─────────────────┐
│  HR Action      │ (e.g., interview scheduled, leave approved)
│  (Controller)   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  hrActionService.js     │ (Prepare email data based on action type)
│  - Interview invitation │
│  - Leave notification   │
│  - Rejection notice     │
└────────┬────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  emailTemplateService.js     │ (Render HTML from template.html)
│  - Compile Handlebars        │
│  - Inject variables           │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  brevoEmailService.js        │ (Send via Brevo API)
│  - Format payload             │
│  - Send transactional email   │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────┐
│  Brevo API       │ → Email delivered to recipient
└──────────────────┘
```

---

## 4. Email Service Implementation

### 4.1 Email Template Service (`emailTemplateService.js`)

Create this new service to handle template rendering:

```javascript
const fs = require('fs').promises;
const path = require('path');
const Handlebars = require('handlebars');

class EmailTemplateService {
  constructor() {
    this.templateCache = null;
    this.templatePath = path.join(__dirname, '../templates/email/template.html');
  }

  /**
   * Load and compile the email template
   */
  async loadTemplate() {
    if (!this.templateCache) {
      const templateContent = await fs.readFile(this.templatePath, 'utf-8');
      this.templateCache = Handlebars.compile(templateContent);
    }
    return this.templateCache;
  }

  /**
   * Render email HTML with provided data
   * @param {Object} data - Variable data for template
   * @returns {String} - Rendered HTML
   */
  async renderEmail(data) {
    try {
      const template = await this.loadTemplate();
      
      // Add default values for optional fields
      const emailData = {
        // Global defaults
        logo_url: process.env.LOGO_URL || '',
        company_name: 'Code Catalyst',
        contact_email: process.env.BREVO_SENDER_EMAIL || 'codecatalystjb@gmail.com',
        
        // Conditional toggles (default to false)
        show_details: false,
        show_highlight: false,
        show_cta: false,
        show_social_links: false,
        
        // Merge with provided data (overrides defaults)
        ...data
      };
      
      return template(emailData);
    } catch (error) {
      console.error('Error rendering email template:', error);
      throw new Error(`Email template rendering failed: ${error.message}`);
    }
  }

  /**
   * Clear template cache (useful for development/testing)
   */
  clearCache() {
    this.templateCache = null;
  }
}

module.exports = new EmailTemplateService();
```

### 4.2 Update Brevo Email Service (`brevoEmailService.js`)

Enhance your existing Brevo service to work with the new template system:

```javascript
const SibApiV3Sdk = require('@sendinblue/client');
const emailTemplateService = require('./emailTemplateService');

class BrevoEmailService {
  constructor() {
    this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    this.apiKey = this.apiInstance.authentications['apiKey'];
    this.apiKey.apiKey = process.env.BREVO_API_KEY;
  }

  /**
   * Send transactional email using unified template
   * @param {Object} params - Email parameters
   * @param {String} params.to - Recipient email
   * @param {String} params.toName - Recipient name
   * @param {String} params.subject - Email subject
   * @param {Object} params.templateData - Variables for email template
   * @returns {Promise}
   */
  async sendTemplatedEmail({ to, toName, subject, templateData }) {
    try {
      // Render HTML from template
      const htmlContent = await emailTemplateService.renderEmail(templateData);

      // Prepare Brevo email object
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      
      sendSmtpEmail.sender = {
        name: process.env.BREVO_SENDER_NAME || 'Code Catalyst Team',
        email: process.env.BREVO_SENDER_EMAIL
      };
      
      sendSmtpEmail.to = [{
        email: to,
        name: toName
      }];
      
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = htmlContent;
      
      // Optional: Add tags for tracking
      sendSmtpEmail.tags = [
        templateData.email_type || 'hr-notification',
        'taskflow-hr'
      ];

      // Send email
      const response = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      
      console.log('Email sent successfully:', {
        messageId: response.messageId,
        to,
        subject
      });
      
      return {
        success: true,
        messageId: response.messageId
      };
      
    } catch (error) {
      console.error('Brevo email send error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send bulk emails (for mass communications)
   * @param {Array} recipients - Array of {email, name, templateData}
   * @param {String} subject - Email subject
   * @returns {Promise}
   */
  async sendBulkEmails(recipients, subject) {
    const results = [];
    
    for (const recipient of recipients) {
      try {
        const result = await this.sendTemplatedEmail({
          to: recipient.email,
          toName: recipient.name,
          subject,
          templateData: recipient.templateData
        });
        results.push({ email: recipient.email, success: true, result });
      } catch (error) {
        results.push({ email: recipient.email, success: false, error: error.message });
      }
    }
    
    return results;
  }
}

module.exports = new BrevoEmailService();
```

---

## 5. Email Type Functions

### 5.1 HR Action Service (`hrActionService.js`)

Create email-specific functions for each HR action:

```javascript
const brevoEmailService = require('./brevoEmailService');

class HRActionService {
  
  /**
   * 1. Send Interview Invitation
   */
  async sendInterviewInvitation(candidateData) {
    const templateData = {
      // Email metadata
      email_subject: `Interview Invitation - Code Catalyst`,
      email_type: 'interview_invitation',
      
      // Header
      logo_url: process.env.LOGO_URL,
      company_name: 'Code Catalyst',
      email_title: 'Interview Invitation',
      
      // Content
      greeting_text: `Hi ${candidateData.name},`,
      intro_message: `<p>Congratulations! We are excited to invite you for an interview with the <strong>Code Catalyst Community</strong>. This is a wonderful opportunity to showcase your skills and enthusiasm.</p>`,
      body_message: `
        <h3>Important Instructions:</h3>
        <ul>
          <li>Please arrive at least <strong>10 minutes early</strong>.</li>
          <li>Carry your <strong>College ID Card</strong> and a copy of your <strong>resume</strong>.</li>
          <li>Dress well to maintain professionalism.</li>
          <li>Be prepared to discuss your background, skills, and your interest in contributing to the <strong>Code Catalyst Community</strong>.</li>
        </ul>
      `,
      closing_message: `<p>Kindly reply to this email to <strong>confirm your availability</strong>. If you are unable to attend on the scheduled date, please inform us at the earliest.</p><p>We look forward to meeting you in person and learning more about you.</p>`,
      
      // Conditional sections
      show_details: true,
      show_highlight: false,
      show_cta: true,
      show_social_links: false,
      
      // Details card
      details_title: 'Interview Details',
      detail_date: candidateData.interviewDate,
      detail_date_label: 'Date',
      detail_time: candidateData.interviewTime,
      detail_time_label: 'Time',
      detail_venue: candidateData.venue || 'Room No. 109, JB Knowledge Park',
      detail_venue_label: 'Venue',
      detail_interviewer: candidateData.interviewers || 'Poorvi (HR), Divy (President), Arjan (Secretary), Jeevan (Vice President)',
      detail_interviewer_label: 'Interviewer(s)',
      
      // CTA
      cta_text: 'Confirm Your Availability',
      cta_link: `mailto:${process.env.BREVO_SENDER_EMAIL}?subject=Interview Confirmation - ${candidateData.name}`,
      cta_subtext: 'Click to send confirmation email',
      
      // Signature
      signature_greeting: 'Best regards,',
      sender_name: 'Poorvi',
      sender_role: 'HR Manager',
      sender_team: 'Code Catalyst Team',
      sender_organization: 'JB Knowledge Park'
    };
    
    return await brevoEmailService.sendTemplatedEmail({
      to: candidateData.email,
      toName: candidateData.name,
      subject: templateData.email_subject,
      templateData
    });
  }

  /**
   * 2. Send Rejection Email (Not Hired)
   */
  async sendRejectionEmail(candidateData) {
    const templateData = {
      email_subject: 'Application Update – Code Catalyst Recruitment',
      email_type: 'rejection',
      
      logo_url: process.env.LOGO_URL,
      company_name: 'Code Catalyst',
      email_title: 'Application Update',
      
      greeting_text: `Hi ${candidateData.name},`,
      intro_message: `<p>Thank you once again for your interest in joining the <strong>Code Catalyst Community</strong> and for taking the time to participate in our recruitment process.</p>`,
      body_message: `<p>After careful consideration, we regret to inform you that you have <strong>not been selected</strong> for the role at this time. The decision was based on the highly competitive nature of the process and the alignment of candidates' skills with our current requirements.</p><p>We truly appreciate the effort you put into your application and interview. Please don't be discouraged—your enthusiasm and potential were evident, and we encourage you to stay connected with us for future opportunities within Code Catalyst.</p>`,
      
      show_details: false,
      show_highlight: true,
      show_cta: false,
      show_social_links: true,
      
      // Highlight block - Community invitation
      highlight_icon: '🚀',
      highlight_title: 'Stay Connected!',
      highlight_message: `<p>No worries—you can still be a part of our growing community! Stay connected with us, collaborate, and participate in upcoming events through our platforms:</p>`,
      highlight_list_items: [
        `<strong>WhatsApp:</strong> <a href="${process.env.SOCIAL_WHATSAPP}" target="_blank">Join here</a>`,
        `<strong>Discord:</strong> <a href="${process.env.SOCIAL_DISCORD}" target="_blank">Join here</a>`,
        `<strong>Instagram:</strong> <a href="${process.env.SOCIAL_INSTAGRAM}" target="_blank">Follow us</a>`,
        `<strong>LinkedIn:</strong> <a href="${process.env.SOCIAL_LINKEDIN}" target="_blank">Connect with us</a>`
      ],
      
      // Social links in footer
      social_whatsapp: process.env.SOCIAL_WHATSAPP,
      social_discord: process.env.SOCIAL_DISCORD,
      social_instagram: process.env.SOCIAL_INSTAGRAM,
      social_linkedin: process.env.SOCIAL_LINKEDIN,
      
      closing_message: '<p>We wish you the very best in your professional journey and hope to see you thrive in your endeavors.</p>',
      
      signature_greeting: 'Best regards,',
      sender_name: 'Poorvi',
      sender_role: 'HR Manager',
      sender_team: 'Code Catalyst Team'
    };
    
    return await brevoEmailService.sendTemplatedEmail({
      to: candidateData.email,
      toName: candidateData.name,
      subject: templateData.email_subject,
      templateData
    });
  }

  /**
   * 3. Send Leave Approval Email
   */
  async sendLeaveApprovalEmail(memberData) {
    const templateData = {
      email_subject: 'Leave Request Approved ✅',
      email_type: 'leave_approved',
      
      logo_url: process.env.LOGO_URL,
      email_title: 'Leave Request Approved',
      
      greeting_text: `Dear ${memberData.name},`,
      intro_message: `<p>Your leave request has been reviewed and approved. You are officially granted leave for the specified period.</p>`,
      body_message: `<p>Please ensure that you coordinate with your respective team members and complete any pending tasks or updates before/after your absence so that the ongoing work remains on track.</p><p>We appreciate you informing us in advance and hope everything goes well on your end.</p>`,
      
      show_details: true,
      show_highlight: false,
      show_cta: false,
      show_social_links: false,
      
      details_title: 'Leave Details',
      detail_leave_dates: memberData.leaveDates,
      detail_leave_dates_label: 'Approved Leave Period',
      detail_reason: memberData.reason || 'Personal',
      detail_reason_label: 'Reason',
      detail_team: memberData.team,
      detail_team_label: 'Your Team',
      
      closing_message: '<p>Wishing you the best!</p>',
      
      signature_greeting: 'Warm regards,',
      sender_name: memberData.approverName || 'HR Team',
      sender_role: 'HR Manager',
      sender_team: 'Code Catalyst',
      sender_organization: memberData.organization || 'JB Knowledge Park'
    };
    
    return await brevoEmailService.sendTemplatedEmail({
      to: memberData.email,
      toName: memberData.name,
      subject: templateData.email_subject,
      templateData
    });
  }

  /**
   * 4. Send Interview Rescheduled Email
   */
  async sendInterviewRescheduleEmail(candidateData) {
    const templateData = {
      email_subject: 'Interview Reschedule for Code Catalyst Community',
      email_type: 'interview_rescheduled',
      
      logo_url: process.env.LOGO_URL,
      email_title: 'Interview Rescheduled',
      
      greeting_text: `Dear ${candidateData.name},`,
      intro_message: `<p>We hope you're doing well. We noticed that you couldn't attend your scheduled interview for <strong>Code Catalyst</strong>, our college's technical community.</p>`,
      body_message: `
        <p>We understand that unforeseen circumstances can arise, so we're giving you another opportunity to attend the interview. Please find the new interview details below:</p>
        <h3>Important Instructions:</h3>
        <ul>
          <li>Please arrive at least <strong>10 minutes early</strong>.</li>
          <li>Carry your <strong>College ID Card</strong> and a copy of your <strong>resume</strong>.</li>
          <li>Dress well to maintain professionalism.</li>
          <li>Be prepared to discuss your background, skills, and your interest in contributing to the <strong>Code Catalyst Community</strong>.</li>
        </ul>
      `,
      closing_message: `<p>Kindly reply to this email to <strong>confirm your availability</strong>. If you are unable to attend on the scheduled date, please inform us at the earliest.</p><p>We look forward to meeting you in person and learning more about you.</p>`,
      
      show_details: true,
      show_highlight: false,
      show_cta: true,
      show_social_links: false,
      
      details_title: 'New Interview Details',
      detail_date: candidateData.newInterviewDate,
      detail_date_label: 'Date',
      detail_time: candidateData.newInterviewTime,
      detail_time_label: 'Time',
      detail_venue: candidateData.venue || 'Room No. 109, JB Knowledge Park',
      detail_venue_label: 'Venue',
      detail_interviewer: candidateData.interviewers || 'Poorvi (HR), Divy (President), Arjan (Secretary), Jeevan (Vice President)',
      detail_interviewer_label: 'Interviewer(s)',
      
      cta_text: 'Confirm Rescheduled Interview',
      cta_link: `mailto:${process.env.BREVO_SENDER_EMAIL}?subject=Rescheduled Interview Confirmation - ${candidateData.name}`,
      
      signature_greeting: 'Best regards,',
      sender_name: 'Poorvi',
      sender_role: 'HR Manager',
      sender_team: 'Code Catalyst Team'
    };
    
    return await brevoEmailService.sendTemplatedEmail({
      to: candidateData.email,
      toName: candidateData.name,
      subject: templateData.email_subject,
      templateData
    });
  }

  /**
   * 5. Send Server Join Reminder
   */
  async sendServerJoinReminder(memberData) {
    const templateData = {
      email_subject: 'Reminder: Join the Core Server of Code Catalyst',
      email_type: 'server_join_reminder',
      
      logo_url: process.env.LOGO_URL,
      email_title: 'Important Reminder',
      
      greeting_text: `Dear ${memberData.name},`,
      intro_message: `<p>We noticed that you have not yet joined the official server as requested. Joining the server is an important step to confirm your participation and stay updated with team communications.</p>`,
      body_message: `<p><strong>Please note:</strong> If you do not join the server within the given time, your spot will be automatically released, and you will no longer be part of the team.</p><p>We encourage you to join at the earliest to avoid missing out.</p>`,
      
      show_details: false,
      show_highlight: false,
      show_cta: true,
      show_social_links: false,
      
      cta_text: 'Join Discord Server',
      cta_link: process.env.SOCIAL_DISCORD || 'https://discord.gg/CCdv3rH',
      cta_subtext: 'Click to join the official Code Catalyst server',
      
      closing_message: '<p>Looking forward to welcoming you on board.</p>',
      
      signature_greeting: 'Best regards,',
      sender_name: memberData.senderName || 'HR Team',
      sender_role: 'Team Coordinator',
      sender_team: 'Code Catalyst Team'
    };
    
    return await brevoEmailService.sendTemplatedEmail({
      to: memberData.email,
      toName: memberData.name,
      subject: templateData.email_subject,
      templateData
    });
  }

  /**
   * 6. Send Team Choice Email (Post-Interview)
   */
  async sendTeamChoiceEmail(candidateData, attended = true) {
    const title = attended 
      ? 'Your Code Catalyst Interview is Done — Choose Your Team!' 
      : 'Interview Update – Code Catalyst';
    
    const introMsg = attended
      ? `<p>Thank you for attending your <strong>Code Catalyst interview</strong>! 🌟 We loved seeing your enthusiasm and interest in being part of our technical community.</p>`
      : `<p>We noticed that you couldn't make it to your <strong>Code Catalyst interview</strong> — and we completely understand! 💫</p><p>You still have a chance to <strong>be part of our technical community</strong> and explore other amazing teams that make Code Catalyst what it is. 🚀</p>`;
    
    const templateData = {
      email_subject: title,
      email_type: attended ? 'team_choice_interviewed' : 'team_choice_not_interviewed',
      
      logo_url: process.env.LOGO_URL,
      email_title: title,
      
      greeting_text: attended ? `Hey ${candidateData.name},` : `Hey everyone,`,
      intro_message: introMsg,
      body_message: `
        <p>If you feel another team might suit your skills or interests better, you still have the option to <strong>explore other teams</strong> and contribute in a way that excites you the most. 🚀</p>
        <p>Here are the teams you can choose from:</p>
        <ul>
          <li>💡 <strong>PR (Public Relations)</strong> – Represent our community, manage outreach, and create visibility.</li>
          <li>📝 <strong>Content</strong> – Write, design, and craft engaging stories and posts.</li>
          <li>🧩 <strong>HR (Human Resources)</strong> – Assist in recruitment, coordination, and team engagement.</li>
          <li>🎉 <strong>Event Management</strong> – Plan, organize, and execute exciting tech events and fests.</li>
          <li>💻 <strong>Project Management</strong> – Lead innovative projects and collaborate on real-world solutions.</li>
        </ul>
      `,
      additional_message: attended 
        ? `<p><strong>Note:</strong> Attending the interview does not limit your options! You can still select a team that aligns with your strengths and interests.</p>`
        : `<p>We'd love to have you on board — every team plays a key role in keeping Code Catalyst active, creative, and impactful.</p>`,
      
      show_details: false,
      show_highlight: false,
      show_cta: false,
      show_social_links: false,
      
      closing_message: attended 
        ? `<p>We're excited to have you on board and can't wait to see the amazing contributions you'll make to Code Catalyst! ✨</p>`
        : `<p>Don't miss this opportunity to be a part of something exciting and collaborative! ✨</p>`,
      
      signature_greeting: 'Best regards,',
      sender_name: 'Code Catalyst Team',
      sender_role: '',
      sender_team: ''
    };
    
    return await brevoEmailService.sendTemplatedEmail({
      to: candidateData.email,
      toName: candidateData.name,
      subject: templateData.email_subject,
      templateData
    });
  }

  /**
   * 7. Send Resignation Acknowledgement
   */
  async sendResignationAcknowledgement(memberData) {
    const templateData = {
      email_subject: 'Acknowledgement of Your Resignation',
      email_type: 'resignation_acknowledged',
      
      logo_url: process.env.LOGO_URL,
      email_title: 'Resignation Acknowledged',
      
      greeting_text: `Hi ${memberData.name},`,
      intro_message: `<p>Thank you for informing us about your decision to resign from the <strong>Code Catalyst Community</strong>.</p>`,
      body_message: `<p>We acknowledge your resignation and respect your choice. Your efforts and contributions during your time with us have been appreciated, and we're grateful for the time and dedication you've given to the community.</p><p>If there are any pending tasks or handovers, please make sure to complete them before your exit to ensure a smooth transition.</p>`,
      closing_message: `<p>We wish you all the best in your future endeavors and hope you continue to grow and achieve great things ahead. You will always remain a valued part of the <strong>Code Catalyst family</strong>.</p>`,
      
      show_details: false,
      show_highlight: false,
      show_cta: false,
      show_social_links: false,
      
      signature_greeting: 'Warm regards,',
      sender_name: memberData.managerName || 'HR Team',
      sender_role: 'HR Manager',
      sender_team: 'Code Catalyst Core Team',
      contact_email: process.env.BREVO_SENDER_EMAIL
    };
    
    return await brevoEmailService.sendTemplatedEmail({
      to: memberData.email,
      toName: memberData.name,
      subject: templateData.email_subject,
      templateData
    });
  }

  /**
   * 8. Send Termination Notice
   */
  async sendTerminationNotice(memberData) {
    const templateData = {
      email_subject: 'Formal Notice of Termination of Team Membership',
      email_type: 'termination',
      
      logo_url: process.env.LOGO_URL,
      email_title: 'Notice of Termination',
      
      greeting_text: `Dear ${memberData.name},`,
      intro_message: `<p>This letter serves as formal notification that your position as a competitive player/team member on the <strong>${memberData.teamName || '[Team Name]'}</strong> roster for <strong>${memberData.projectName || '[Game/Project]'}</strong> is terminated, effective immediately.</p>`,
      body_message: `<p>This decision, made by <strong>Team Management</strong>, is based on your consistent failure to meet the minimum activity and commitment standards required of all active members, as outlined in the Team Agreement and Code of Conduct.</p><p>Specifically, the grounds for termination are:</p>`,
      
      show_details: true,
      show_highlight: true,
      show_cta: false,
      show_social_links: false,
      
      details_title: 'Grounds for Termination',
      detail_custom_field_1: 'Repeated, unexcused absences and severe tardiness from mandatory team practices, meetings, and events.',
      detail_custom_label_1: '❌ Irregular Attendance',
      detail_custom_field_2: `Failure to maintain regular engagement in critical team communication channels over the past ${memberData.inactivePeriod || '3 weeks'}.`,
      detail_custom_label_2: '❌ Inactivity',
      
      highlight_icon: '⚠️',
      highlight_title: 'Next Steps and Requirements',
      highlight_message: `<p>You are required to immediately cease using the <strong>${memberData.teamName || '[Team Name]'}</strong> brand, logo, and intellectual property.</p><p>Consistent participation and reliable attendance are non-negotiable requirements for a competitive team environment.</p>`,
      
      closing_message: '<p>Thank you for your time with the team.</p>',
      
      signature_greeting: 'Sincerely,',
      sender_name: memberData.managerName || 'Team Management',
      sender_role: 'Team Lead',
      sender_team: memberData.teamName || 'Code Catalyst'
    };
    
    return await brevoEmailService.sendTemplatedEmail({
      to: memberData.email,
      toName: memberData.name,
      subject: templateData.email_subject,
      templateData
    });
  }

  /**
   * 9. Send Rejoining Invitation
   */
  async sendRejoiningInvitation(memberData) {
    const templateData = {
      email_subject: `Invitation to Rejoin the ${memberData.teamName || 'Team'} – Code Catalyst`,
      email_type: 'rejoining',
      
      logo_url: process.env.LOGO_URL,
      email_title: 'Welcome Back!',
      
      greeting_text: `Dear ${memberData.name},`,
      intro_message: `<p>I hope you're doing well. We're glad to inform you that the team has decided to welcome you back to the <strong>${memberData.teamName || 'Editors Team'}</strong> of <strong>Code Catalyst</strong>.</p>`,
      body_message: `<p>Your previous contributions and creative input have always added great value to the team, and we're excited to have you onboard once again. We believe your presence will strengthen the team's work and bring fresh perspectives to upcoming projects.</p><p>Please confirm your availability at the earliest so we can proceed with adding you back to the official workspace and upcoming tasks.</p>`,
      
      show_details: false,
      show_highlight: false,
      show_cta: true,
      show_social_links: false,
      
      cta_text: 'Confirm Rejoining',
      cta_link: `mailto:${process.env.BREVO_SENDER_EMAIL}?subject=Rejoining Confirmation - ${memberData.name}`,
      cta_subtext: 'Let us know you\'re ready to rejoin',
      
      closing_message: '<p>Welcome back to the team!</p>',
      
      signature_greeting: 'Warm regards,',
      sender_name: memberData.managerName || 'Team Lead',
      sender_role: memberData.managerRole || 'Project Manager',
      sender_team: memberData.teamName || 'Code Catalyst Team'
    };
    
    return await brevoEmailService.sendTemplatedEmail({
      to: memberData.email,
      toName: memberData.name,
      subject: templateData.email_subject,
      templateData
    });
  }
}

module.exports = new HRActionService();
```

---

## 6. Brevo Integration

### 6.1 Initialize Brevo Client

Ensure your Brevo API key is correctly configured:

```javascript
// config/email.config.js
module.exports = {
  brevo: {
    apiKey: process.env.BREVO_API_KEY,
    senderEmail: process.env.BREVO_SENDER_EMAIL || 'codecatalystjb@gmail.com',
    senderName: process.env.BREVO_SENDER_NAME || 'Code Catalyst Team'
  },
  templates: {
    path: './templates/email/',
    mainTemplate: 'template.html'
  },
  social: {
    whatsapp: process.env.SOCIAL_WHATSAPP || '',
    discord: process.env.SOCIAL_DISCORD || 'https://discord.gg/CCdv3rH',
    instagram: process.env.SOCIAL_INSTAGRAM || '',
    linkedin: process.env.SOCIAL_LINKEDIN || ''
  }
};
```

### 6.2 Error Handling & Logging

Add proper error handling and logging:

```javascript
// utils/emailHelpers.js
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/email-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/email-combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

/**
 * Wrap email send with error handling and logging
 */
async function sendEmailWithLogging(emailFunction, params, actionType) {
  try {
    logger.info(`Sending ${actionType} email to ${params.email}`, {
      recipient: params.email,
      type: actionType,
      timestamp: new Date().toISOString()
    });
    
    const result = await emailFunction(params);
    
    logger.info(`${actionType} email sent successfully`, {
      recipient: params.email,
      messageId: result.messageId,
      timestamp: new Date().toISOString()
    });
    
    return { success: true, result };
    
  } catch (error) {
    logger.error(`Failed to send ${actionType} email`, {
      recipient: params.email,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return { success: false, error: error.message };
  }
}

module.exports = {
  logger,
  sendEmailWithLogging
};
```

---

## 7. Testing

### 7.1 Unit Tests

Create test file `__tests__/emailService.test.js`:

```javascript
const emailTemplateService = require('../services/emailTemplateService');
const brevoEmailService = require('../services/brevoEmailService');
const hrActionService = require('../services/hrActionService');

describe('Email Template Service', () => {
  test('should render interview invitation template', async () => {
    const data = {
      email_title: 'Test Interview',
      greeting_text: 'Hi John,',
      intro_message: '<p>Test message</p>',
      show_details: true,
      details_title: 'Interview Details',
      detail_date: '14 Oct 2025',
      detail_date_label: 'Date'
    };
    
    const html = await emailTemplateService.renderEmail(data);
    
    expect(html).toContain('Test Interview');
    expect(html).toContain('Hi John,');
    expect(html).toContain('Interview Details');
  });
});

describe('HR Action Service', () => {
  test('should prepare interview invitation data', async () => {
    const candidateData = {
      name: 'John Doe',
      email: 'john@example.com',
      interviewDate: '14 October 2025',
      interviewTime: '9:30 AM - 12:00 PM',
      venue: 'Room 109'
    };
    
    // Mock brevoEmailService
    brevoEmailService.sendTemplatedEmail = jest.fn().mockResolvedValue({
      success: true,
      messageId: 'test-message-id'
    });
    
    const result = await hrActionService.sendInterviewInvitation(candidateData);
    
    expect(result.success).toBe(true);
    expect(brevoEmailService.sendTemplatedEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'john@example.com',
        toName: 'John Doe'
      })
    );
  });
});
```

### 7.2 Manual Testing Script

Create `scripts/testEmail.js`:

```javascript
require('dotenv').config();
const hrActionService = require('../services/hrActionService');

async function testInterviewInvitation() {
  console.log('Testing Interview Invitation Email...');
  
  const result = await hrActionService.sendInterviewInvitation({
    name: 'Test Candidate',
    email: 'your-test-email@example.com', // Replace with your email
    interviewDate: '14 October 2025',
    interviewTime: '9:30 AM - 12:00 PM',
    venue: 'Room No. 109, JB Knowledge Park',
    interviewers: 'Poorvi (HR), Divy (President)'
  });
  
  console.log('Result:', result);
}

async function testRejectionEmail() {
  console.log('Testing Rejection Email...');
  
  const result = await hrActionService.sendRejectionEmail({
    name: 'Test Candidate',
    email: 'your-test-email@example.com'
  });
  
  console.log('Result:', result);
}

// Run tests
(async () => {
  await testInterviewInvitation();
  await testRejectionEmail();
  process.exit(0);
})();
```

Run with:
```bash
node scripts/testEmail.js
```

---

## 8. Deployment

### 8.1 Environment Variables

Ensure all required environment variables are set in production:

```bash
# .env.production
BREVO_API_KEY=your_production_api_key
BREVO_SENDER_EMAIL=codecatalystjb@gmail.com
BREVO_SENDER_NAME=Code Catalyst Team
BASE_URL=https://yourproductionurl.com
LOGO_URL=https://yourproductionurl.com/assets/logo.png
SOCIAL_WHATSAPP=https://chat.whatsapp.com/your_link
SOCIAL_DISCORD=https://discord.gg/CCdv3rH
SOCIAL_INSTAGRAM=https://instagram.com/codecatalyst
SOCIAL_LINKEDIN=https://linkedin.com/company/codecatalyst
```

### 8.2 Usage in Controllers

Example integration in your HR routes:

```javascript
// routes/leaves.js
const express = require('express');
const router = express.Router();
const hrActionService = require('../services/hrActionService');
const LeaveRequest = require('../models/LeaveRequest');

// Approve leave request
router.patch('/:id/approve', async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id).populate('userId');
    
    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }
    
    // Update leave status
    leaveRequest.status = 'approved';
    await leaveRequest.save();
    
    // Send approval email
    await hrActionService.sendLeaveApprovalEmail({
      name: leaveRequest.userId.name,
      email: leaveRequest.userId.email,
      leaveDates: `${leaveRequest.startDate.toDateString()} to ${leaveRequest.endDate.toDateString()}`,
      reason: leaveRequest.reason,
      team: leaveRequest.userId.team,
      approverName: req.user.name,
      organization: 'JB Knowledge Park'
    });
    
    res.json({ 
      message: 'Leave request approved and email sent',
      leaveRequest 
    });
    
  } catch (error) {
    console.error('Error approving leave:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
```

### 8.3 Background Job Processing (Optional)

For large-scale email sending, consider using a job queue:

```javascript
// services/emailQueueService.js
const Bull = require('bull');
const hrActionService = require('./hrActionService');

const emailQueue = new Bull('email-queue', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
});

// Process email jobs
emailQueue.process('send-email', async (job) => {
  const { type, data } = job.data;
  
  switch (type) {
    case 'interview_invitation':
      return await hrActionService.sendInterviewInvitation(data);
    case 'leave_approval':
      return await hrActionService.sendLeaveApprovalEmail(data);
    case 'rejection':
      return await hrActionService.sendRejectionEmail(data);
    // Add other email types...
    default:
      throw new Error(`Unknown email type: ${type}`);
  }
});

// Add email to queue
async function queueEmail(type, data) {
  await emailQueue.add('send-email', { type, data }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  });
}

module.exports = { emailQueue, queueEmail };
```

---

## 🎯 Quick Start Checklist

- [ ] Install required npm packages
- [ ] Set up environment variables in `.env`
- [ ] Copy `template.html` to `backend/templates/email/`
- [ ] Create `emailTemplateService.js` in `backend/services/`
- [ ] Update `brevoEmailService.js` with new templating logic
- [ ] Create `hrActionService.js` with all email type functions
- [ ] Test emails using `scripts/testEmail.js`
- [ ] Integrate email functions into your controllers/routes
- [ ] Deploy to production with correct environment variables
- [ ] Monitor email delivery in Brevo dashboard

---

## 📞 Support & Troubleshooting

### Common Issues

**1. Template Not Found Error**
```
Error: ENOENT: no such file or directory
```
Solution: Ensure `template.html` is in the correct path: `backend/templates/email/template.html`

**2. Brevo API Authentication Failed**
```
Error: 401 Unauthorized
```
Solution: Check that `BREVO_API_KEY` is correctly set in `.env` file

**3. Variables Not Rendering**
```
Email shows {{variable_name}} instead of value
```
Solution: Ensure you're using triple braces `{{{variable}}}` for HTML content

**4. Email Not Sent**
```
Error: Invalid email address
```
Solution: Validate email addresses before passing to `sendTemplatedEmail()`

### Debug Mode

Enable detailed logging:
```javascript
// In your .env file
DEBUG=email:*
LOG_LEVEL=debug
```

---

## 📚 Additional Resources

- [Brevo API Documentation](https://developers.brevo.com/)
- [Handlebars Template Docs](https://handlebarsjs.com/)
- [Email Variables Reference](./EMAIL_VARIABLES_REFERENCE.md)
- [TaskFlow HR Module Docs](./HR_MODULE_IMPLEMENTATION.md)

---

**Version:** 1.0  
**Last Updated:** January 2025  
**Author:** TaskFlow Development Team  
**Contact:** codecatalystjb@gmail.com

