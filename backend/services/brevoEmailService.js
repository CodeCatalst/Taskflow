import * as brevoAPI from '@getbrevo/brevo';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Brevo Email Service
 * Handles transactional email sending via Brevo API
 */
class BrevoEmailService {
  constructor() {
    this.client = null;
    this.layoutTemplate = null;
    this.initClient();
  }

  initClient() {
    // Lazy initialization - only initialize when needed
    return;
  }

  getClient() {
    if (!this.client && process.env.BREVO_API_KEY) {
      try {
        const apiInstance = new brevoAPI.TransactionalEmailsApi();
        apiInstance.setApiKey(brevoAPI.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
        this.client = apiInstance;
      } catch (error) {
        this.client = null;
      }
    }
    return this.client;
  }

  /**
   * Load base layout from template.html
   */
  getLayout() {
    if (!this.layoutTemplate) {
      try {
        const layoutPath = path.join(__dirname, '..', '..', 'template.html');
        if (fs.existsSync(layoutPath)) {
          this.layoutTemplate = fs.readFileSync(layoutPath, 'utf8');
        }
      } catch (error) {
      }
    }
    return this.layoutTemplate;
  }

  /**
   * Wrap content in the base layout
   */
  wrapInLayout(content, subject, params = {}) {
    const layout = this.getLayout();
    if (!layout) return content;

    // Check if content is already a full HTML document
    if (content.includes('<html') || content.includes('<body')) {
      return this.interpolateVariables(content, params);
    }

    // Default params for layout
    const layoutParams = {
      email_subject: subject,
      logo_url: params.logo_url || 'https://taskflow-nine-phi.vercel.app/logo.png',
      header_title: params.header_title || 'Notification',
      recipient_name: params.fullName || params.candidateName || params.name || 'User',
      intro_message: content, // The content itself becomes the intro or body
      website_url: params.websiteUrl || 'https://taskflow-nine-phi.vercel.app',
      discord_url: params.discordUrl || 'https://discord.gg/CfwBfFhDZf',
      linkedin_url: params.linkedinUrl || 'https://www.linkedin.com/company/code-catalyst-s/',
      instagram_url: params.instagramUrl || 'https://www.instagram.com/codecatalyst_jb/',
      current_year: new Date().getFullYear(),
      sender_name: params.senderName || process.env.EMAIL_FROM_NAME || 'TaskFlow',
      sender_designation: params.senderDesignation || 'Team',
      ...params
    };

    // Very basic Handlebars-like conditional replacement for the layout
    let wrapped = layout;
    
    // Replace conditionals {{#if var}}...{{/if}}
    const ifRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;
    wrapped = wrapped.replace(ifRegex, (match, p1, p2) => {
      return layoutParams[p1] ? p2 : '';
    });

    // Replace variables
    return this.interpolateVariables(wrapped, layoutParams);
  }

  /**
   * Send transactional email
   * @param {Object} options
   * @param {string|string[]} options.to - Recipient email(s)
   * @param {string} options.subject - Email subject
   * @param {string} options.htmlContent - HTML content
   * @param {Object} options.params - Template parameters for variable interpolation
   * @param {Object} options.from - Sender info {email, name}
   * @param {boolean} options.useLayout - Whether to wrap in base layout
   * @returns {Object} Send result with success, messageId, etc.
   */
  async send({ to, subject, htmlContent, params = {}, from, useLayout = false }) {
    if (!from) {
      from = {
        email: process.env.EMAIL_FROM || 'updates.codecatalyst@gmail.com',
        name: process.env.EMAIL_FROM_NAME || 'TaskFlow'
      };
    }
    try {
      const client = this.getClient();
      if (!client) {
        throw new Error('Brevo API client not configured');
      }

      // Interpolate variables in subject
      const interpolatedSubject = this.interpolateVariables(subject, params);
      
      // Prepare HTML content
      let finalHtml = htmlContent;
      if (useLayout) {
        finalHtml = this.wrapInLayout(htmlContent, interpolatedSubject, { ...params, senderName: from.name });
      } else {
        finalHtml = this.interpolateVariables(htmlContent, params);
      }

      const sendSmtpEmail = new brevoAPI.SendSmtpEmail();
      sendSmtpEmail.sender = from;
      sendSmtpEmail.to = Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }];
      sendSmtpEmail.subject = interpolatedSubject;
      sendSmtpEmail.htmlContent = finalHtml;

      const result = await client.sendTransacEmail(sendSmtpEmail);

      // Handle different response structures
      let messageId = null;
      if (result.body) {
        messageId = result.body.messageId || result.body.id;
      }

      return {
        success: true,
        messageId: messageId,
        status: 'sent',
        provider: 'brevo-api'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: 'failed',
        provider: 'brevo-api'
      };
    }
  }

  /**
   * Interpolate variables in template string
   * Supports {{variable}} syntax
   */
  interpolateVariables(template, params) {
    if (!template || !params) return template;

    let result = template;
    for (const [key, value] of Object.entries(params)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    }
    return result;
  }
}

export default new BrevoEmailService();
