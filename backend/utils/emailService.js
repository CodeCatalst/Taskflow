import * as brevoAPI from '@getbrevo/brevo';
import nodemailer from 'nodemailer';

// Brevo API Client
let brevoClient = null;
const getBrevoClient = () => {
  if (!brevoClient && process.env.BREVO_API_KEY) {
    const apiInstance = new brevoAPI.TransactionalEmailsApi();
    apiInstance.setApiKey(brevoAPI.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
    brevoClient = apiInstance;
  }
  return brevoClient;
};

// Brevo SMTP Client
let smtpTransporter = null;
const getSmtpTransporter = () => {
  if (!smtpTransporter && process.env.BREVO_API_KEY && process.env.BREVO_LOGIN_EMAIL) {
    smtpTransporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.BREVO_LOGIN_EMAIL, // Your Brevo account login email
        pass: process.env.BREVO_API_KEY      // Your Brevo API key (works as SMTP password)
      }
    });
  }
  return smtpTransporter;
};

// Get default sender info from environment
const getDefaultSender = () => ({
  email: process.env.EMAIL_FROM || 'updates.codecatalyst@gmail.com',
  name: process.env.EMAIL_FROM_NAME || 'TaskFlow'
});

// Send email using Brevo SMTP
const sendWithBrevoSMTP = async (to, subject, htmlContent, from = null) => {
  try {
    console.log('🔍 Checking Brevo SMTP configuration...');
    console.log('   API Key present:', !!process.env.BREVO_API_KEY);
    console.log('   Login Email present:', !!process.env.BREVO_LOGIN_EMAIL);
    console.log('   Sender email:', from?.email || getDefaultSender().email);
    
    const transporter = getSmtpTransporter();
    if (!transporter) {
      throw new Error('Brevo SMTP client not configured. Please set BREVO_API_KEY and BREVO_LOGIN_EMAIL in your .env file');
    }

    const sender = from || getDefaultSender();
    const recipients = Array.isArray(to) 
      ? to.map(recipient => typeof recipient === 'string' ? recipient : recipient.email).join(', ')
      : (typeof to === 'string' ? to : to.email);

    console.log('📤 Attempting to send email via Brevo SMTP...');
    const result = await transporter.sendMail({
      from: `"${sender.name}" <${sender.email}>`,
      to: recipients,
      subject: subject,
      html: htmlContent
    });

    console.log('✅ Email sent via Brevo SMTP:', result.messageId);
    
    return {
      success: true,
      status: 'sent',
      messageId: result.messageId,
      provider: 'brevo-smtp'
    };
  } catch (error) {
    console.error('❌ Brevo SMTP error details:');
    console.error('   Message:', error.message);
    console.error('   Code:', error.code);
    console.error('   Response:', error.response);
    
    return {
      success: false,
      status: 'failed',
      error: error.message,
      provider: 'brevo-smtp'
    };
  }
};

// Send email using Brevo API
const sendWithBrevoAPI = async (to, subject, htmlContent, from = null) => {
  try {
    console.log('🔍 Checking Brevo API configuration...');
    console.log('   API Key present:', !!process.env.BREVO_API_KEY);
    console.log('   Sender email:', from?.email || getDefaultSender().email);
    
    const client = getBrevoClient();
    if (!client) {
      throw new Error('Brevo API client not configured. Please set BREVO_API_KEY in your .env file');
    }

    const sendSmtpEmail = new brevoAPI.SendSmtpEmail();
    sendSmtpEmail.sender = from || getDefaultSender();
    sendSmtpEmail.to = Array.isArray(to) ? to.map(recipient => typeof recipient === 'string' ? { email: recipient } : recipient) : [{ email: to }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;

    console.log('📤 Attempting to send email via Brevo API...');
    const result = await client.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Email sent via Brevo API:', result.response?.statusCode || 'success');
    
    return {
      success: true,
      status: 'sent',
      messageId: result.response?.body?.messageId || result.body?.messageId,
      provider: 'brevo-api'
    };
  } catch (error) {
    console.error('❌ Brevo API error details:');
    console.error('   Message:', error.message);
    console.error('   Status:', error.response?.status);
    console.error('   Status Text:', error.response?.statusText);
    console.error('   Response Body:', JSON.stringify(error.response?.body || error.response?.data));
    
    return {
      success: false,
      status: 'failed',
      error: error.message,
      provider: 'brevo-api'
    };
  }
};

// Send email using Brevo API only
export const sendEmail = async (to, subject, htmlContent, from = null) => {
  console.log('📧 Sending email via Brevo API to:', to);

  if (process.env.BREVO_API_KEY) {
    console.log('🔑 API key detected, using API method...');
    return await sendWithBrevoAPI(to, subject, htmlContent, from);
  }

  console.error('❌ No Brevo credentials configured');
  return {
    success: false,
    status: 'failed',
    error: 'No Brevo credentials configured. Set BREVO_API_KEY in your .env file',
    provider: 'none'
  };
};

// HTML Email Template for New User Credentials
const getCredentialEmailTemplate = (fullName, email, password, appUrl) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to TaskFlow</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      margin: 0;
      padding: 0;
    }
    .email-wrapper {
      padding: 40px 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 50px 30px;
      text-align: center;
      color: white;
      position: relative;
    }
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
      opacity: 0.3;
    }
    .logo-container {
      background: white;
      width: 100px;
      height: 100px;
      border-radius: 50%;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      position: relative;
      z-index: 1;
    }
    .logo-container img {
      width: 70px;
      height: 70px;
      object-fit: contain;
      display: block;
      margin: 0 auto;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.5px;
      position: relative;
      z-index: 1;
    }
    .header p {
      margin: 10px 0 0 0;
      font-size: 18px;
      opacity: 0.95;
      font-weight: 400;
      position: relative;
      z-index: 1;
    }
    .content {
      padding: 50px 40px;
    }
    .greeting {
      font-size: 24px;
      color: #1a1a1a;
      margin-bottom: 20px;
      font-weight: 600;
    }
    .message {
      color: #4a5568;
      margin-bottom: 30px;
      font-size: 16px;
      line-height: 1.8;
    }
    .credentials-box {
      background: linear-gradient(135deg, #f6f8ff 0%, #f0f4ff 100%);
      border: 2px solid #e0e7ff;
      border-radius: 12px;
      padding: 30px;
      margin: 30px 0;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.1);
    }
    .credentials-box h3 {
      margin: 0 0 20px 0;
      color: #667eea;
      font-size: 18px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .credential-item {
      margin: 16px 0;
      background: white;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #e0e7ff;
    }
    .credential-label {
      font-weight: 600;
      color: #667eea;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      display: block;
    }
    .credential-value {
      color: #1a1a1a;
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Courier New', monospace;
      font-size: 16px;
      font-weight: 600;
      word-break: break-all;
    }
    .button-container {
      text-align: center;
      margin: 40px 0;
    }
    .btn {
      display: inline-block;
      padding: 18px 50px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white !important;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 700;
      font-size: 18px;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
      letter-spacing: 0.5px;
    }
    .security-notice {
      background: linear-gradient(135deg, #fff7e6 0%, #ffe8cc 100%);
      border: 2px solid #ffd699;
      border-radius: 12px;
      padding: 20px;
      margin: 30px 0;
      display: flex;
      align-items: start;
      gap: 15px;
    }
    .security-notice p {
      margin: 0;
      color: #996300;
      font-size: 15px;
      line-height: 1.6;
    }
    .footer {
      background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
      padding: 40px 30px;
      text-align: center;
      color: #cbd5e0;
    }
    .footer p {
      margin: 8px 0;
      font-size: 14px;
    }
    .divider {
      height: 2px;
      background: linear-gradient(90deg, transparent 0%, #e0e7ff 50%, transparent 100%);
      margin: 35px 0;
    }
    .features {
      margin: 35px 0;
      background: #f8fafc;
      padding: 30px;
      border-radius: 12px;
    }
    .features h3 {
      color: #1a1a1a;
      margin-bottom: 25px;
      font-size: 20px;
      font-weight: 700;
      text-align: center;
    }
    .feature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .feature-item {
      background: white;
      padding: 20px;
      border-radius: 10px;
      border: 1px solid #e0e7ff;
    }
    .feature-icon {
      font-size: 32px;
      margin-bottom: 10px;
    }
    .feature-title {
      color: #667eea;
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 5px;
    }
    .feature-text {
      color: #4a5568;
      font-size: 13px;
      line-height: 1.5;
    }
    @media only screen and (max-width: 600px) {
      .feature-grid {
        grid-template-columns: 1fr;
      }
      .content {
        padding: 30px 20px;
      }
      .header {
        padding: 40px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-container">
          <img src="https://taskflow-nine-phi.vercel.app/logo.png" alt="TaskFlow Logo" />
        </div>
        <h1>Welcome to TaskFlow! 🚀</h1>
        <p>Your account is ready to go</p>
      </div>
      
      <div class="content">
        <div class="greeting">
          👋 Hi <strong>${fullName}</strong>!
        </div>
        
        <div class="message">
          <p>We're excited to have you on board! Your TaskFlow account has been created and you're all set to start managing tasks like a pro.</p>
          <p>TaskFlow is your all-in-one collaborative workspace where teams come together to get things done efficiently.</p>
        </div>

        <div class="credentials-box">
          <h3>
            <span>🔐</span>
            Your Login Credentials
          </h3>
          <div class="credential-item">
            <span class="credential-label">📧 Email Address</span>
            <div class="credential-value">${email}</div>
          </div>
          <div class="credential-item">
            <span class="credential-label">🔑 Temporary Password</span>
            <div class="credential-value">${password}</div>
          </div>
        </div>

        <div class="security-notice">
          <div style="font-size: 24px;">⚠️</div>
          <p><strong>Security First:</strong> Please change your password after your first login. Head to Settings → Change Password to set a secure password of your choice.</p>
        </div>

        <div class="button-container">
          <a href="${appUrl}" class="btn">🚀 Launch TaskFlow</a>
        </div>

        <div class="divider"></div>

        <div class="features">
          <h3>✨ What's Waiting for You</h3>
          
          <div class="feature-grid">
            <div class="feature-item">
              <div class="feature-icon">📋</div>
              <div class="feature-title">Task Management</div>
              <div class="feature-text">Create, assign, and track tasks with ease</div>
            </div>
            
            <div class="feature-item">
              <div class="feature-icon">📊</div>
              <div class="feature-title">Kanban Boards</div>
              <div class="feature-text">Visualize workflow with drag-and-drop</div>
            </div>
            
            <div class="feature-item">
              <div class="feature-icon">👥</div>
              <div class="feature-title">Team Collaboration</div>
              <div class="feature-text">Work together in real-time</div>
            </div>
            
            <div class="feature-item">
              <div class="feature-icon">📈</div>
              <div class="feature-title">Analytics & Reports</div>
              <div class="feature-text">Track progress with insights</div>
            </div>
          </div>
        </div>

        <div class="divider"></div>

        <div class="message" style="text-align: center;">
          <p style="font-size: 16px; color: #4a5568;">Need help getting started? Your admin team is here to support you! 💪</p>
          <p style="font-size: 18px; font-weight: 600; color: #667eea; margin-top: 20px;">Let's make productivity happen! 🎯</p>
        </div>
      </div>

      <div class="footer">
        <p><strong>TaskFlow</strong></p>
        <p>Collaborative Task Management System</p>
        <p style="margin-top: 20px; font-size: 12px; opacity: 0.8;">This is an automated message. Please do not reply.</p>
        <p style="margin-top: 15px;">
          <a href="${appUrl}" style="color: #90cdf4; text-decoration: none;">🌐 Visit TaskFlow</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

// Send verification email for new user registration
export const sendVerificationEmail = async (fullName, email, verificationCode, password, workspaceName) => {
  try {
    const appUrl = process.env.NODE_ENV === 'production'
      ? 'https://taskflow-nine-phi.vercel.app'
      : (process.env.CLIENT_URL || 'https://taskflow-nine-phi.vercel.app');

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #136dec 0%, #0b4fb5 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .verification-box { background: white; border: 2px solid #136dec; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
    .verification-code { font-size: 36px; font-weight: bold; color: #136dec; letter-spacing: 8px; font-family: 'Courier New', monospace; }
    .credentials-box { background: white; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .btn { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #136dec 0%, #0b4fb5 100%); color: white !important; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to ${workspaceName}!</h1>
      <p>Verify your email to get started</p>
    </div>
    <div class="content">
      <p>Hello <strong>${fullName}</strong>,</p>
      <p>Welcome to <strong>${workspaceName}</strong>! Your account has been created and you need to verify your email address to activate it.</p>

      <div class="verification-box">
        <p style="margin: 0; color: #666; font-size: 14px; margin-bottom: 10px;">Your Verification Code</p>
        <div class="verification-code">${verificationCode}</div>
      </div>

      <p style="text-align: center; color: #666; font-size: 14px;">Enter this code on the verification page to activate your account</p>

      <div class="credentials-box">
        <h3 style="margin-top: 0; color: #10b981;">Your Login Credentials</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${password}</p>
      </div>

      <div class="warning">
        <strong>⚠️ Important:</strong>
        <ul style="margin: 10px 0;">
          <li>This verification code expires in 24 hours</li>
          <li>Keep your credentials safe</li>
          <li>Change your password after first login</li>
        </ul>
      </div>

      <p>Click the button below to verify your account:</p>
      <a href="${appUrl}/verify-email" class="btn">Verify Email Address</a>

      <p style="margin-top: 30px;">If you have any questions, please contact your administrator.</p>
      <p>Best regards,<br>TaskFlow Team</p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `;

    const subject = `Verify Your Email - Welcome to ${workspaceName}`;

    const result = await sendEmail(email, subject, htmlContent);

    if (result.success) {
      console.log('✅ Verification email sent successfully');
    } else {
      console.error('❌ Failed to send verification email:', result.error);
    }

    return result;
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    return { success: false, status: 'error', error: error.message };
  }
};

// Send credential email to new user
export const sendCredentialEmail = async (fullName, email, password) => {
  try {
    const appUrl = process.env.NODE_ENV === 'production' 
      ? 'https://taskflow-nine-phi.vercel.app'
      : (process.env.CLIENT_URL || 'https://taskflow-nine-phi.vercel.app');

    const htmlContent = getCredentialEmailTemplate(fullName, email, password, appUrl);
    const subject = '🎉 Welcome to TaskFlow - Your Account is Ready!';

    const result = await sendEmail(email, subject, htmlContent);
    
    if (result.success) {
      console.log('✅ Credential email sent successfully');
    } else {
      console.error('❌ Failed to send credential email:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error sending credential email:', error);
    return { success: false, status: 'error', error: error.message };
  }
};

// HTML Template for Task Assignment Email
const getTaskAssignmentTemplate = (userName, taskTitle, taskDescription, priority, dueDate, appUrl) => {
  const priorityColors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#10b981'
  };
  const priorityColor = priorityColors[priority?.toLowerCase()] || '#6b7280';

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #136dec 0%, #0b4fb5 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .task-box { background: white; border-left: 4px solid ${priorityColor}; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .priority-badge { display: inline-block; padding: 5px 15px; background: ${priorityColor}; color: white; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
    .btn { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #136dec 0%, #0b4fb5 100%); color: white !important; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 New Task Assigned</h1>
    </div>
    <div class="content">
      <p>Hello <strong>${userName}</strong>,</p>
      <p>You have been assigned a new task:</p>
      <div class="task-box">
        <h2 style="margin-top: 0; color: #136dec;">${taskTitle}</h2>
        <p><span class="priority-badge">${priority || 'Medium'} Priority</span></p>
        ${taskDescription ? `<p><strong>Description:</strong><br>${taskDescription}</p>` : ''}
        ${dueDate ? `<p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>` : ''}
      </div>
      <p>Click the button below to view task details and get started:</p>
      <a href="${appUrl}" class="btn">View Task</a>
      <p style="margin-top: 30px;">If you have any questions, please contact your team lead.</p>
      <p>Best regards,<br>TaskFlow Team</p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `;
};

// Send task assignment notification
export const sendTaskAssignmentEmail = async (userName, userEmail, taskTitle, taskDescription, priority, dueDate) => {
  try {
    const appUrl = process.env.NODE_ENV === 'production' 
      ? 'https://taskflow-nine-phi.vercel.app'
      : (process.env.CLIENT_URL || 'https://taskflow-nine-phi.vercel.app');

    const htmlContent = getTaskAssignmentTemplate(userName, taskTitle, taskDescription, priority, dueDate, appUrl);
    const subject = `📋 New Task Assigned: ${taskTitle}`;

    const result = await sendEmail(userEmail, subject, htmlContent);
    
    if (result.success) {
      console.log('✅ Task assignment email sent successfully');
    } else {
      console.error('❌ Failed to send task assignment email:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error sending task assignment email:', error);
    return { success: false, status: 'error', error: error.message };
  }
};

// HTML Template for Task Status Update
const getTaskStatusTemplate = (userName, taskTitle, oldStatus, newStatus, updatedBy, appUrl) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #136dec 0%, #0b4fb5 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .status-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #e0e7ff; }
    .status-change { display: flex; align-items: center; justify-content: center; gap: 15px; margin: 20px 0; }
    .status { padding: 10px 20px; border-radius: 5px; font-weight: bold; }
    .status-old { background: #fee; color: #c33; }
    .status-new { background: #efe; color: #3c3; }
    .arrow { font-size: 24px; color: #136dec; }
    .btn { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #136dec 0%, #0b4fb5 100%); color: white !important; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔄 Task Status Updated</h1>
    </div>
    <div class="content">
      <p>Hello <strong>${userName}</strong>,</p>
      <p>The status of your task has been updated:</p>
      <div class="status-box">
        <h2 style="margin-top: 0; color: #136dec;">${taskTitle}</h2>
        <div class="status-change">
          <span class="status status-old">${oldStatus}</span>
          <span class="arrow">→</span>
          <span class="status status-new">${newStatus}</span>
        </div>
        <p style="text-align: center; color: #666;"><em>Updated by ${updatedBy}</em></p>
      </div>
      <p>Click below to view the task:</p>
      <a href="${appUrl}" class="btn">View Task</a>
      <p style="margin-top: 30px;">Best regards,<br>TaskFlow Team</p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `;
};

// Send task status update notification
export const sendTaskStatusEmail = async (userName, userEmail, taskTitle, oldStatus, newStatus, updatedBy) => {
  try {
    const appUrl = process.env.NODE_ENV === 'production' 
      ? 'https://taskflow-nine-phi.vercel.app'
      : (process.env.CLIENT_URL || 'https://taskflow-nine-phi.vercel.app');

    const htmlContent = getTaskStatusTemplate(userName, taskTitle, oldStatus, newStatus, updatedBy, appUrl);
    const subject = `🔄 Task Status Updated: ${taskTitle}`;

    console.log('📧 Sending task status email via Brevo API to:', userEmail);
    const result = await sendEmail(userEmail, subject, htmlContent);
    
    if (result.success) {
      console.log('✅ Task status email sent successfully');
    } else {
      console.error('❌ Failed to send task status email:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error sending task status email:', error);
    return { success: false, status: 'error', error: error.message };
  }
};

// HTML Template for Due Date Reminder
const getDueDateReminderTemplate = (userName, taskTitle, taskDescription, dueDate, appUrl) => {
  const daysUntilDue = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
  const urgencyColor = daysUntilDue <= 1 ? '#ef4444' : daysUntilDue <= 3 ? '#f59e0b' : '#10b981';

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, ${urgencyColor} 0%, ${urgencyColor}dd 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .reminder-box { background: white; border-left: 4px solid ${urgencyColor}; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .urgency-badge { display: inline-block; padding: 8px 20px; background: ${urgencyColor}; color: white; border-radius: 20px; font-weight: bold; }
    .btn { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #136dec 0%, #0b4fb5 100%); color: white !important; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Task Due Date Reminder</h1>
    </div>
    <div class="content">
      <p>Hello <strong>${userName}</strong>,</p>
      <p>This is a friendly reminder about an upcoming task deadline:</p>
      <div class="reminder-box">
        <h2 style="margin-top: 0; color: #136dec;">${taskTitle}</h2>
        <p><span class="urgency-badge">Due ${daysUntilDue <= 0 ? 'TODAY' : daysUntilDue === 1 ? 'TOMORROW' : `in ${daysUntilDue} days`}</span></p>
        ${taskDescription ? `<p><strong>Description:</strong><br>${taskDescription}</p>` : ''}
        <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
      </div>
      <p>Please make sure to complete this task on time. Click below to view details:</p>
      <a href="${appUrl}" class="btn">View Task</a>
      <p style="margin-top: 30px;">Best regards,<br>TaskFlow Team</p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `;
};

// Send due date reminder
export const sendDueDateReminder = async (userName, userEmail, taskTitle, taskDescription, dueDate) => {
  try {
    const appUrl = process.env.NODE_ENV === 'production' 
      ? 'https://taskflow-nine-phi.vercel.app'
      : (process.env.CLIENT_URL || 'https://taskflow-nine-phi.vercel.app');

    const htmlContent = getDueDateReminderTemplate(userName, taskTitle, taskDescription, dueDate, appUrl);
    const subject = `⏰ Reminder: ${taskTitle} - Due Soon`;

    console.log('📧 Sending due date reminder via Brevo API to:', userEmail);
    const result = await sendEmail(userEmail, subject, htmlContent);
    
    if (result.success) {
      console.log('✅ Due date reminder sent successfully');
    } else {
      console.error('❌ Failed to send due date reminder:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error sending due date reminder:', error);
    return { success: false, status: 'error', error: error.message };
  }
};

// HTML Template for Password Reset
const getPasswordResetTemplate = (fullName, resetToken) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #136dec 0%, #0b4fb5 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .token-box { background: white; border: 2px solid #136dec; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
    .token { font-size: 36px; font-weight: bold; color: #136dec; letter-spacing: 8px; font-family: 'Courier New', monospace; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Password Reset Request</h1>
    </div>
    <div class="content">
      <p>Hello ${fullName},</p>
      <p>We received a request to reset your password for your TaskFlow account. Use the code below to reset your password:</p>
      <div class="token-box">
        <p style="margin: 0; color: #666; font-size: 14px; margin-bottom: 10px;">Your Reset Code</p>
        <div class="token">${resetToken}</div>
      </div>
      <p style="text-align: center; color: #666; font-size: 14px;">Enter this code on the password reset page</p>
      <div class="warning">
        <strong>⚠️ Important:</strong>
        <ul style="margin: 10px 0;">
          <li>This code will expire in 1 hour</li>
          <li>Do not share this code with anyone</li>
          <li>If you didn't request this, please ignore this email</li>
        </ul>
      </div>
      <p>If you're having trouble, contact your administrator for assistance.</p>
      <p>Best regards,<br>TaskFlow Team</p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `;
};

// Send password reset confirmation email with new password
export const sendPasswordResetEmail = async (fullName, email, newPassword) => {
  try {
    const appUrl = process.env.NODE_ENV === 'production'
      ? 'https://taskflow-nine-phi.vercel.app'
      : (process.env.CLIENT_URL || 'https://taskflow-nine-phi.vercel.app');

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .password-box { background: white; border: 2px solid #10b981; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
    .password { font-size: 24px; font-weight: bold; color: #10b981; letter-spacing: 2px; font-family: 'Courier New', monospace; }
    .btn { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #136dec 0%, #0b4fb5 100%); color: white !important; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Password Reset Successful</h1>
      <p>Your password has been updated</p>
    </div>
    <div class="content">
      <p>Hello <strong>${fullName}</strong>,</p>
      <p>Your password has been successfully reset. Here are your new login credentials:</p>

      <div class="password-box">
        <p style="margin: 0; color: #666; font-size: 14px; margin-bottom: 10px;">Your New Password</p>
        <div class="password">${newPassword}</div>
      </div>

      <p style="text-align: center; color: #666; font-size: 14px;">Use this password to log in to your account</p>

      <div class="warning">
        <strong>⚠️ Security Reminder:</strong>
        <ul style="margin: 10px 0;">
          <li>Change this password after your next login</li>
          <li>Keep your credentials secure</li>
          <li>Never share your password with others</li>
        </ul>
      </div>

      <p>Click the button below to log in with your new password:</p>
      <a href="${appUrl}" class="btn">Login to TaskFlow</a>

      <p style="margin-top: 30px;">If you didn't request this password reset, please contact your administrator immediately.</p>
      <p>Best regards,<br>TaskFlow Team</p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `;

    const subject = 'Password Reset Successful - TaskFlow';

    console.log('📧 Sending password reset confirmation email via Brevo API to:', email);
    const result = await sendEmail(email, subject, htmlContent);

    if (result.success) {
      console.log('✅ Password reset confirmation email sent successfully');
    } else {
      console.error('❌ Failed to send password reset confirmation email:', result.error);
    }

    return result;
  } catch (error) {
    console.error('❌ Error sending password reset confirmation email:', error);
    return { success: false, status: 'error', error: error.message };
  }
};

// Send password reset token email
export const sendPasswordResetLink = async (full_name, email, resetToken) => {
  try {
    const htmlContent = getPasswordResetTemplate(full_name, resetToken);
    const subject = 'Reset Your Password - TaskFlow';

    console.log('📧 Sending password reset email via Brevo API to:', email);
    const result = await sendEmail(email, subject, htmlContent);
    
    if (result.success) {
      console.log(`✅ Password reset email sent successfully to ${email}`);
    } else {
      console.error('❌ Failed to send password reset email:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Error sending password reset email to ${email}:`, error);
    return { success: false, error: error.message };
  }
};

// HTML Template for Comment Notification
const getCommentNotificationTemplate = (userName, commenterName, taskTitle, commentText, appUrl) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #136dec 0%, #0b4fb5 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .comment-box { background: white; border-left: 4px solid #136dec; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .btn { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #136dec 0%, #0b4fb5 100%); color: white !important; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💬 New Comment on Task</h1>
    </div>
    <div class="content">
      <p>Hello <strong>${userName}</strong>,</p>
      <p><strong>${commenterName}</strong> commented on the task:</p>
      <div class="comment-box">
        <h3 style="margin-top: 0; color: #136dec;">${taskTitle}</h3>
        <p style="background: #f0f4ff; padding: 15px; border-radius: 5px; font-style: italic;">"${commentText}"</p>
        <p style="color: #666; font-size: 14px; margin-top: 10px;">— ${commenterName}</p>
      </div>
      <p>Click below to view the full conversation:</p>
      <a href="${appUrl}" class="btn">View Task</a>
      <p style="margin-top: 30px;">Best regards,<br>TaskFlow Team</p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `;
};

// Send comment notification
export const sendCommentNotification = async (userName, userEmail, commenterName, taskTitle, commentText) => {
  try {
    const appUrl = process.env.NODE_ENV === 'production' 
      ? 'https://taskflow-nine-phi.vercel.app'
      : (process.env.CLIENT_URL || 'https://taskflow-nine-phi.vercel.app');

    const htmlContent = getCommentNotificationTemplate(userName, commenterName, taskTitle, commentText, appUrl);
    const subject = `💬 New Comment: ${taskTitle}`;

    console.log('📧 Sending comment notification via Brevo API to:', userEmail);
    const result = await sendEmail(userEmail, subject, htmlContent);
    
    if (result.success) {
      console.log('✅ Comment notification sent successfully');
    } else {
      console.error('❌ Failed to send comment notification:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error sending comment notification:', error);
    return { success: false, status: 'error', error: error.message };
  }
};

// Template rendering helper for custom emails
export const renderTemplate = (template, variables) => {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(regex, value);
  }
  return rendered;
};

// Send overdue task reminder
export const sendOverdueTaskReminder = async (userName, userEmail, taskTitle, daysOverdue) => {
  try {
    const appUrl = process.env.NODE_ENV === 'production' 
      ? 'https://taskflow-nine-phi.vercel.app'
      : (process.env.CLIENT_URL || 'https://taskflow-nine-phi.vercel.app');

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .overdue-box { background: white; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .overdue-badge { display: inline-block; padding: 8px 20px; background: #ef4444; color: white; border-radius: 20px; font-weight: bold; }
    .btn { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #136dec 0%, #0b4fb5 100%); color: white !important; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 Overdue Task Alert</h1>
    </div>
    <div class="content">
      <p>Hello <strong>${userName}</strong>,</p>
      <p>The following task is overdue and requires your immediate attention:</p>
      <div class="overdue-box">
        <h2 style="margin-top: 0; color: #ef4444;">${taskTitle}</h2>
        <p><span class="overdue-badge">OVERDUE by ${daysOverdue} ${daysOverdue === 1 ? 'day' : 'days'}</span></p>
      </div>
      <p>Please complete this task as soon as possible:</p>
      <a href="${appUrl}" class="btn">View Task</a>
      <p style="margin-top: 30px;">Best regards,<br>TaskFlow Team</p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `;

    const subject = `🚨 Overdue Task: ${taskTitle}`;

    console.log('📧 Sending overdue task reminder via Brevo API to:', userEmail);
    const result = await sendEmail(userEmail, subject, htmlContent);
    
    if (result.success) {
      console.log('✅ Overdue task reminder sent successfully');
    } else {
      console.error('❌ Failed to send overdue task reminder:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error sending overdue task reminder:', error);
    return { success: false, status: 'error', error: error.message };
  }
};

// Send weekly report
export const sendWeeklyReport = async (userName, userEmail, reportData) => {
  try {
    const appUrl = process.env.NODE_ENV === 'production' 
      ? 'https://taskflow-nine-phi.vercel.app'
      : (process.env.CLIENT_URL || 'https://taskflow-nine-phi.vercel.app');

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #136dec 0%, #0b4fb5 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
    .stat-box { background: white; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #e0e7ff; }
    .stat-number { font-size: 36px; font-weight: bold; color: #136dec; }
    .stat-label { color: #666; font-size: 14px; margin-top: 5px; }
    .btn { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #136dec 0%, #0b4fb5 100%); color: white !important; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Your Weekly Report</h1>
    </div>
    <div class="content">
      <p>Hello <strong>${userName}</strong>,</p>
      <p>Here's your task summary for this week:</p>
      <div class="stats-grid">
        <div class="stat-box">
          <div class="stat-number">${reportData.completed || 0}</div>
          <div class="stat-label">Tasks Completed</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">${reportData.pending || 0}</div>
          <div class="stat-label">Tasks Pending</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">${reportData.inProgress || 0}</div>
          <div class="stat-label">In Progress</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">${reportData.overdue || 0}</div>
          <div class="stat-label">Overdue</div>
        </div>
      </div>
      <p>Keep up the great work! Click below to see your full dashboard:</p>
      <a href="${appUrl}" class="btn">View Dashboard</a>
      <p style="margin-top: 30px;">Best regards,<br>TaskFlow Team</p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `;

    const subject = '📊 Your Weekly TaskFlow Report';

    console.log('📧 Sending weekly report via Brevo API to:', userEmail);
    const result = await sendEmail(userEmail, subject, htmlContent);
    
    if (result.success) {
      console.log('✅ Weekly report sent successfully');
    } else {
      console.error('❌ Failed to send weekly report:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error sending weekly report:', error);
    return { success: false, status: 'error', error: error.message };
  }
};

// Export all email functions
export default {
  sendEmail,
  sendCredentialEmail,
  sendTaskAssignmentEmail,
  sendTaskStatusEmail,
  sendDueDateReminder,
  sendPasswordResetLink,
  sendCommentNotification,
  renderTemplate,
  sendOverdueTaskReminder,
  sendWeeklyReport
};
