import * as brevoAPI from '@getbrevo/brevo';

/**
 * Brevo Email Service
 * Handles transactional email sending via Brevo API
 */
class BrevoEmailService {
  constructor() {
    this.client = null;
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
        console.error('❌ Failed to initialize Brevo client:', error.message);
        this.client = null;
      }
    }
    return this.client;
  }

  /**
   * Send transactional email
   * @param {Object} options
   * @param {string|string[]} options.to - Recipient email(s)
   * @param {string} options.subject - Email subject
   * @param {string} options.htmlContent - HTML content
   * @param {Object} options.params - Template parameters for variable interpolation
   * @param {Object} options.from - Sender info {email, name}
   * @returns {Object} Send result with success, messageId, etc.
   */
  async send({ to, subject, htmlContent, params = {}, from }) {
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

      // Interpolate variables in subject and htmlContent
      const interpolatedSubject = this.interpolateVariables(subject, params);
      const interpolatedHtml = this.interpolateVariables(htmlContent, params);

      const sendSmtpEmail = new brevoAPI.SendSmtpEmail();
      sendSmtpEmail.sender = from;
      sendSmtpEmail.to = Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }];
      sendSmtpEmail.subject = interpolatedSubject;
      sendSmtpEmail.htmlContent = interpolatedHtml;

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
      console.error('❌ Brevo email send error:', error.message);
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