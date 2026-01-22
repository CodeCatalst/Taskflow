import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import EmailTemplate from '../models/EmailTemplate.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const predefinedTemplates = [
  {
    name: 'Welcome Email',
    code: 'WELCOME',
    subject: 'Welcome to {{workspaceName}} - Your Account is Ready!',
    category: 'system',
    isPredefined: true,
    variables: [
      { name: 'workspaceName', description: 'Name of the workspace', example: 'TaskFlow' },
      { name: 'fullName', description: 'User\'s full name', example: 'John Doe' },
      { name: 'email', description: 'User\'s email address', example: 'john@example.com' },
      { name: 'password', description: 'Temporary password', example: 'TempPass123' },
      { name: 'loginUrl', description: 'Login page URL', example: 'https://app.taskflow.com/login' },
      { name: 'supportEmail', description: 'Support email address', example: 'support@taskflow.com' },
      { name: 'companyName', description: 'Company name', example: 'TaskFlow Inc.' }
    ],
    htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to {{workspaceName}}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
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
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
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
      background: url('data:image/svg+xml,<svg width="60" height="60" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="stars" width="60" height="60" patternUnits="userSpaceOnUse"><circle cx="30" cy="30" r="1" fill="rgba(255,255,255,0.3)"/><circle cx="10" cy="50" r="0.5" fill="rgba(255,255,255,0.2)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.2)"/></pattern></defs><rect width="60" height="60" fill="url(%23stars)"/></svg>');
      opacity: 0.6;
    }
    .logo-container {
      background: white;
      width: 80px;
      height: 80px;
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
      width: 50px;
      height: 50px;
      object-fit: contain;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
      position: relative;
      z-index: 1;
    }
    .header p {
      margin: 10px 0 0 0;
      font-size: 16px;
      opacity: 0.95;
      font-weight: 400;
      position: relative;
      z-index: 1;
    }
    .content {
      padding: 50px 40px;
    }
    .greeting {
      font-size: 20px;
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
    .credentials-card {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 30px;
      margin: 30px 0;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.1);
    }
    .credentials-card h3 {
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
      padding: 16px 20px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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
      background: #f8fafc;
      padding: 8px 12px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }
    .action-section {
      text-align: center;
      margin: 40px 0;
    }
    .btn-primary {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white !important;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 700;
      font-size: 16px;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
      letter-spacing: 0.5px;
      margin-right: 15px;
    }
    .btn-secondary {
      display: inline-block;
      padding: 14px 30px;
      background: white;
      color: #667eea !important;
      text-decoration: none;
      border: 2px solid #667eea;
      border-radius: 50px;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.3s ease;
    }
    .security-notice {
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
      border: 2px solid #f59e0b;
      border-radius: 12px;
      padding: 20px;
      margin: 30px 0;
      display: flex;
      align-items: flex-start;
      gap: 15px;
    }
    .security-notice .icon {
      font-size: 24px;
      color: #d97706;
      flex-shrink: 0;
    }
    .security-notice p {
      margin: 0;
      color: #92400e;
      font-size: 15px;
      line-height: 1.6;
    }
    .features-section {
      margin: 40px 0;
      background: #f8fafc;
      padding: 30px;
      border-radius: 12px;
    }
    .features-section h3 {
      color: #1a1a1a;
      margin-bottom: 25px;
      font-size: 20px;
      font-weight: 700;
      text-align: center;
    }
    .features-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .feature-item {
      background: white;
      padding: 20px;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
    .feature-icon {
      font-size: 32px;
      margin-bottom: 10px;
      display: block;
    }
    .feature-title {
      color: #667eea;
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .feature-text {
      color: #4a5568;
      font-size: 13px;
      line-height: 1.5;
    }
    .footer {
      background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
      padding: 40px 30px;
      text-align: center;
      color: #cbd5e0;
    }
    .footer-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    .footer-section h4 {
      color: white;
      margin: 0 0 10px 0;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .footer-section p {
      margin: 5px 0;
      font-size: 13px;
      color: #a0aec0;
    }
    .footer-section a {
      color: #90cdf4;
      text-decoration: none;
    }
    .footer-bottom {
      border-top: 1px solid #4a5568;
      padding-top: 20px;
      font-size: 12px;
      opacity: 0.8;
    }
    @media only screen and (max-width: 600px) {
      .features-grid {
        grid-template-columns: 1fr;
      }
      .footer-content {
        grid-template-columns: 1fr;
      }
      .content {
        padding: 30px 20px;
      }
      .header {
        padding: 40px 20px;
      }
      .action-section .btn-primary {
        display: block;
        margin-bottom: 15px;
        margin-right: 0;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-container">
          <img src="https://taskflow-nine-phi.vercel.app/logo.png" alt="{{workspaceName}} Logo" />
        </div>
        <h1>🎉 Welcome to {{workspaceName}}!</h1>
        <p>Your account is ready to go</p>
      </div>

      <div class="content">
        <div class="greeting">
          👋 Hello <strong>{{fullName}}</strong>!
        </div>

        <div class="message">
          <p>Welcome to <strong>{{workspaceName}}</strong>! We're excited to have you join our team. Your account has been created and you're all set to start collaborating and managing tasks like a pro.</p>
          <p>{{workspaceName}} is your comprehensive workspace solution designed to streamline team collaboration and boost productivity.</p>
        </div>

        <div class="credentials-card">
          <h3>
            🔐 Your Login Credentials
          </h3>
          <div class="credential-item">
            <span class="credential-label">📧 Email Address</span>
            <div class="credential-value">{{email}}</div>
          </div>
          <div class="credential-item">
            <span class="credential-label">🔑 Temporary Password</span>
            <div class="credential-value">{{password}}</div>
          </div>
        </div>

        <div class="action-section">
          <a href="{{loginUrl}}" class="btn-primary">🚀 Launch {{workspaceName}}</a>
          <a href="mailto:{{supportEmail}}" class="btn-secondary">📞 Get Support</a>
        </div>

        <div class="security-notice">
          <div class="icon">⚠️</div>
          <p><strong>Security First:</strong> Please change your password immediately after your first login. We recommend using a strong, unique password and enabling two-factor authentication when available.</p>
        </div>

        <div class="features-section">
          <h3>✨ What's Waiting for You</h3>

          <div class="features-grid">
            <div class="feature-item">
              <div class="feature-icon">📋</div>
              <div class="feature-title">Task Management</div>
              <div class="feature-text">Create, assign, and track tasks with advanced project management tools</div>
            </div>

            <div class="feature-item">
              <div class="feature-icon">📊</div>
              <div class="feature-title">Analytics & Reports</div>
              <div class="feature-text">Get insights into team performance and project progress</div>
            </div>

            <div class="feature-item">
              <div class="feature-icon">👥</div>
              <div class="feature-title">Team Collaboration</div>
              <div class="feature-text">Real-time communication and file sharing capabilities</div>
            </div>

            <div class="feature-item">
              <div class="feature-icon">📈</div>
              <div class="feature-title">Progress Tracking</div>
              <div class="feature-text">Monitor milestones and deadlines with visual dashboards</div>
            </div>
          </div>
        </div>

        <div class="message" style="text-align: center; margin-top: 40px;">
          <p style="font-size: 16px; color: #4a5568;">Need help getting started? Our support team is here to assist you! 💪</p>
          <p style="font-size: 18px; font-weight: 600; color: #667eea; margin-top: 20px;">Let's make productivity happen! 🎯</p>
        </div>
      </div>

      <div class="footer">
        <div class="footer-content">
          <div class="footer-section">
            <h4>{{companyName}}</h4>
            <p>Empowering teams worldwide</p>
            <p>Professional task management solutions</p>
          </div>
          <div class="footer-section">
            <h4>Support</h4>
            <p><a href="mailto:{{supportEmail}}">Email: {{supportEmail}}</a></p>
            <p><a href="{{loginUrl}}">Login Portal</a></p>
          </div>
        </div>
        <div class="footer-bottom">
          <p><strong>{{workspaceName}}</strong> - Collaborative Task Management System</p>
          <p>This is an automated message. Please do not reply to this email.</p>
          <p style="margin-top: 15px;">
            <a href="{{loginUrl}}" style="color: #90cdf4; text-decoration: none;">🌐 Access {{workspaceName}}</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
    `
  },
  {
    name: 'Leave Request Approved',
    code: 'LEAVE_APPROVED',
    subject: 'Leave Request Approved - {{workspaceName}}',
    category: 'leave',
    isPredefined: true,
    variables: [
      { name: 'workspaceName', description: 'Name of the workspace', example: 'TaskFlow' },
      { name: 'fullName', description: 'Employee\'s full name', example: 'John Doe' },
      { name: 'leaveType', description: 'Type of leave', example: 'Annual Leave' },
      { name: 'startDate', description: 'Leave start date', example: '2024-01-15' },
      { name: 'endDate', description: 'Leave end date', example: '2024-01-20' },
      { name: 'days', description: 'Number of leave days', example: '5' },
      { name: 'approvedBy', description: 'Name of approver', example: 'Jane Smith' },
      { name: 'remainingDays', description: 'Remaining leave days', example: '15' },
      { name: 'loginUrl', description: 'Login page URL', example: 'https://app.taskflow.com/login' },
      { name: 'supportEmail', description: 'Support email address', example: 'support@taskflow.com' }
    ],
    htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Leave Request Approved - {{workspaceName}}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
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
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
      background: url('data:image/svg+xml,<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="leaves" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.2)"/><path d="M15 25 Q20 15 25 25" stroke="rgba(255,255,255,0.3)" stroke-width="1" fill="none"/></pattern></defs><rect width="40" height="40" fill="url(%23leaves)"/></svg>');
      opacity: 0.6;
    }
    .logo-container {
      background: white;
      width: 80px;
      height: 80px;
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
      width: 50px;
      height: 50px;
      object-fit: contain;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
      position: relative;
      z-index: 1;
    }
    .header p {
      margin: 10px 0 0 0;
      font-size: 16px;
      opacity: 0.95;
      font-weight: 400;
      position: relative;
      z-index: 1;
    }
    .content {
      padding: 50px 40px;
    }
    .greeting {
      font-size: 20px;
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
    .leave-card {
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border: 2px solid #10b981;
      border-radius: 12px;
      padding: 30px;
      margin: 30px 0;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.1);
    }
    .leave-card h3 {
      margin: 0 0 20px 0;
      color: #059669;
      font-size: 18px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .leave-detail {
      margin: 16px 0;
      background: white;
      padding: 16px 20px;
      border-radius: 8px;
      border: 1px solid #d1fae5;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .detail-label {
      font-weight: 600;
      color: #059669;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .detail-value {
      color: #1a1a1a;
      font-size: 16px;
      font-weight: 600;
    }
    .approval-notice {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 2px solid #f59e0b;
      border-radius: 12px;
      padding: 20px;
      margin: 30px 0;
      display: flex;
      align-items: flex-start;
      gap: 15px;
    }
    .approval-notice .icon {
      font-size: 24px;
      color: #d97706;
      flex-shrink: 0;
    }
    .approval-notice p {
      margin: 0;
      color: #92400e;
      font-size: 15px;
      line-height: 1.6;
    }
    .balance-section {
      background: #f8fafc;
      padding: 25px;
      border-radius: 12px;
      margin: 30px 0;
      text-align: center;
    }
    .balance-section h4 {
      color: #1a1a1a;
      margin: 0 0 15px 0;
      font-size: 18px;
      font-weight: 700;
    }
    .balance-highlight {
      font-size: 32px;
      font-weight: 800;
      color: #059669;
      margin: 10px 0;
    }
    .balance-text {
      color: #4a5568;
      font-size: 14px;
    }
    .action-section {
      text-align: center;
      margin: 40px 0;
    }
    .btn-primary {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white !important;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 700;
      font-size: 16px;
      box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);
      transition: all 0.3s ease;
      letter-spacing: 0.5px;
      margin-right: 15px;
    }
    .btn-secondary {
      display: inline-block;
      padding: 14px 30px;
      background: white;
      color: #059669 !important;
      text-decoration: none;
      border: 2px solid #059669;
      border-radius: 50px;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.3s ease;
    }
    .reminder-section {
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
      border-radius: 12px;
      padding: 25px;
      margin: 30px 0;
    }
    .reminder-section h4 {
      color: #1a1a1a;
      margin: 0 0 15px 0;
      font-size: 16px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .reminder-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .reminder-list li {
      padding: 8px 0;
      color: #4a5568;
      font-size: 14px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }
    .reminder-list li::before {
      content: '✓';
      color: #10b981;
      font-weight: bold;
      flex-shrink: 0;
    }
    .footer {
      background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
      padding: 40px 30px;
      text-align: center;
      color: #cbd5e0;
    }
    .footer-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    .footer-section h4 {
      color: white;
      margin: 0 0 10px 0;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .footer-section p {
      margin: 5px 0;
      font-size: 13px;
      color: #a0aec0;
    }
    .footer-section a {
      color: #90cdf4;
      text-decoration: none;
    }
    .footer-bottom {
      border-top: 1px solid #4a5568;
      padding-top: 20px;
      font-size: 12px;
      opacity: 0.8;
    }
    @media only screen and (max-width: 600px) {
      .footer-content {
        grid-template-columns: 1fr;
      }
      .content {
        padding: 30px 20px;
      }
      .header {
        padding: 40px 20px;
      }
      .action-section .btn-primary {
        display: block;
        margin-bottom: 15px;
        margin-right: 0;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-container">
          <img src="https://taskflow-nine-phi.vercel.app/logo.png" alt="{{workspaceName}} Logo" />
        </div>
        <h1>✅ Leave Request Approved</h1>
        <p>Your time off has been confirmed</p>
      </div>

      <div class="content">
        <div class="greeting">
          👋 Hello <strong>{{fullName}}</strong>!
        </div>

        <div class="message">
          <p>Great news! Your leave request has been approved and processed. You can now enjoy your well-deserved time off. Here are all the details you need to know:</p>
        </div>

        <div class="leave-card">
          <h3>
            🏖️ Leave Details
          </h3>
          <div class="leave-detail">
            <span class="detail-label">Leave Type</span>
            <span class="detail-value">{{leaveType}}</span>
          </div>
          <div class="leave-detail">
            <span class="detail-label">Start Date</span>
            <span class="detail-value">{{startDate}}</span>
          </div>
          <div class="leave-detail">
            <span class="detail-label">End Date</span>
            <span class="detail-value">{{endDate}}</span>
          </div>
          <div class="leave-detail">
            <span class="detail-label">Duration</span>
            <span class="detail-value">{{days}} day(s)</span>
          </div>
        </div>

        <div class="approval-notice">
          <div class="icon">👤</div>
          <p><strong>Approved by:</strong> {{approvedBy}}</p>
        </div>

        <div class="balance-section">
          <h4>📊 Leave Balance Update</h4>
          <div class="balance-highlight">{{remainingDays}}</div>
          <p class="balance-text">days of {{leaveType}} remaining</p>
        </div>

        <div class="reminder-section">
          <h4>📝 Before You Go</h4>
          <ul class="reminder-list">
            <li>Hand over any pending tasks to your colleagues</li>
            <li>Update your out-of-office message in email and chat</li>
            <li>Ensure all work is properly documented</li>
            <li>Set up any necessary email auto-replies</li>
          </ul>
        </div>

        <div class="action-section">
          <a href="{{loginUrl}}" class="btn-primary">View Leave Details</a>
          <a href="mailto:{{supportEmail}}" class="btn-secondary">Contact HR</a>
        </div>

        <div class="message" style="text-align: center; margin-top: 40px;">
          <p style="font-size: 16px; color: #4a5568;">Enjoy your time off and come back refreshed! 🌴</p>
          <p style="font-size: 18px; font-weight: 600; color: #059669; margin-top: 20px;">Safe travels and best wishes! ✈️</p>
        </div>
      </div>

      <div class="footer">
        <div class="footer-content">
          <div class="footer-section">
            <h4>{{workspaceName}} HR</h4>
            <p>Supporting your work-life balance</p>
            <p>Professional HR management</p>
          </div>
          <div class="footer-section">
            <h4>Support</h4>
            <p><a href="mailto:{{supportEmail}}">Email: {{supportEmail}}</a></p>
            <p><a href="{{loginUrl}}">HR Portal</a></p>
          </div>
        </div>
        <div class="footer-bottom">
          <p><strong>{{workspaceName}}</strong> - Human Resources Management System</p>
          <p>This is an automated email. Please do not reply to this email.</p>
          <p style="margin-top: 15px;">
            <a href="{{loginUrl}}" style="color: #90cdf4; text-decoration: none;">🔗 Access {{workspaceName}}</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
    `
  },
  {
    name: 'Leave Request Rejected',
    code: 'LEAVE_REJECTED',
    subject: 'Leave Request Update - {{workspaceName}}',
    category: 'leave',
    isPredefined: true,
    variables: [
      { name: 'workspaceName', description: 'Name of the workspace', example: 'TaskFlow' },
      { name: 'fullName', description: 'Employee\'s full name', example: 'John Doe' },
      { name: 'leaveType', description: 'Type of leave', example: 'Annual Leave' },
      { name: 'startDate', description: 'Leave start date', example: '2024-01-15' },
      { name: 'endDate', description: 'Leave end date', example: '2024-01-20' },
      { name: 'reason', description: 'Reason for rejection', example: 'Insufficient leave balance' }
    ],
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .leave-details { background: white; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .reason-box { background: #fee; border: 1px solid #fca5a5; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .btn { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #136dec 0%, #0b4fb5 100%); color: white !important; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Leave Request Update</h1>
    </div>
    <div class="content">
      <p>Hello <strong>{{fullName}}</strong>,</p>
      <p>We regret to inform you that your leave request has been rejected. Here are the details:</p>
      <div class="leave-details">
        <h3>📅 Leave Request Details</h3>
        <p><strong>Type:</strong> {{leaveType}}</p>
        <p><strong>From:</strong> {{startDate}}</p>
        <p><strong>To:</strong> {{endDate}}</p>
      </div>
      <div class="reason-box">
        <h4>Reason for Rejection:</h4>
        <p>{{reason}}</p>
      </div>
      <p>Please contact your manager or HR for further discussion or to submit a new request.</p>
      <a href="#" class="btn">Submit New Request</a>
      <p style="margin-top: 30px;">Best regards,<br>{{workspaceName}} HR Team</p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `
  },
  {
    name: 'Attendance Reminder',
    code: 'ATTENDANCE_REMINDER',
    subject: 'Attendance Reminder - {{workspaceName}}',
    category: 'attendance',
    isPredefined: true,
    variables: [
      { name: 'workspaceName', description: 'Name of the workspace', example: 'TaskFlow' },
      { name: 'fullName', description: 'Employee\'s full name', example: 'John Doe' },
      { name: 'date', description: 'Date of attendance', example: '2024-01-15' }
    ],
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .reminder-box { background: white; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .btn { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white !important; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Attendance Reminder</h1>
    </div>
    <div class="content">
      <p>Hello <strong>{{fullName}}</strong>,</p>
      <p>This is a friendly reminder to mark your attendance for today.</p>
      <div class="reminder-box">
        <h3>📅 Today's Date</h3>
        <p style="font-size: 18px; font-weight: bold; color: #f59e0b;">{{date}}</p>
      </div>
      <p>Please remember to clock in/out as per your schedule. Regular attendance helps us maintain accurate records.</p>
      <a href="#" class="btn">Mark Attendance</a>
      <p style="margin-top: 30px;">Best regards,<br>{{workspaceName}} Team</p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `
  },
  {
    name: 'Task Assignment',
    code: 'TASK_ASSIGNMENT',
    subject: 'New Task Assigned: {{taskTitle}}',
    category: 'custom',
    isPredefined: true,
    variables: [
      { name: 'fullName', description: 'Assignee\'s full name', example: 'John Doe' },
      { name: 'taskTitle', description: 'Title of the task', example: 'Complete project report' },
      { name: 'taskDescription', description: 'Task description', example: 'Prepare the quarterly report...' },
      { name: 'priority', description: 'Task priority', example: 'High' },
      { name: 'dueDate', description: 'Task due date', example: '2024-01-20' },
      { name: 'assignedBy', description: 'Person who assigned the task', example: 'Jane Smith' }
    ],
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #136dec 0%, #0b4fb5 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .task-box { background: white; border-left: 4px solid #136dec; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .priority-badge { display: inline-block; padding: 5px 15px; background: #ef4444; color: white; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
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
      <p>Hello <strong>{{fullName}}</strong>,</p>
      <p>You have been assigned a new task:</p>
      <div class="task-box">
        <h2 style="margin-top: 0; color: #136dec;">{{taskTitle}}</h2>
        <p><span class="priority-badge">{{priority}} Priority</span></p>
        {{#taskDescription}}
        <p><strong>Description:</strong><br>{{taskDescription}}</p>
        {{/taskDescription}}
        {{#dueDate}}
        <p><strong>Due Date:</strong> {{dueDate}}</p>
        {{/dueDate}}
        <p style="color: #666; font-size: 14px;"><em>Assigned by {{assignedBy}}</em></p>
      </div>
      <p>Click the button below to view task details and get started:</p>
      <a href="#" class="btn">View Task</a>
      <p style="margin-top: 30px;">If you have any questions, please contact your team lead.</p>
      <p>Best regards,<br>TaskFlow Team</p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `
  },
  {
    name: 'General Announcement',
    code: 'ANNOUNCEMENT',
    subject: '{{subject}}',
    category: 'custom',
    isPredefined: true,
    variables: [
      { name: 'subject', description: 'Email subject', example: 'Important Company Update' },
      { name: 'content', description: 'Announcement content', example: 'We have an important update...' }
    ],
    htmlContent: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .announcement-box { background: white; border-left: 4px solid #8b5cf6; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📢 Announcement</h1>
    </div>
    <div class="content">
      <div class="announcement-box">
        <h2 style="margin-top: 0; color: #8b5cf6;">{{subject}}</h2>
        <div style="margin-top: 20px;">
          {{content}}
        </div>
      </div>
      <p>Best regards,<br>TaskFlow Team</p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `
  },
  // New HR templates from Email Drafts.docx
  {
    name: 'Hiring Form Acknowledgement',
    code: 'HIRING_APPLIED',
    subject: 'Thank You for Applying',
    category: 'hiring',
    isPredefined: true,
    variables: [
      { name: 'candidateName', description: 'Candidate\'s full name', example: 'John Doe' },
      { name: 'websiteUrl', description: 'Company website URL', example: 'https://code-catalyst.pages.dev/' },
      { name: 'discordUrl', description: 'Discord community URL', example: 'https://discord.gg/CfwBfFhDZf' },
      { name: 'linkedinUrl', description: 'LinkedIn page URL', example: 'https://www.linkedin.com/company/code-catalyst-s/' }
    ],
    htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You for Applying</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #667eea; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Thank You for Applying</h1>
    </div>
    <div class="content">
      <p>Hi {{candidateName}},</p>
      <p>Thank you for showing interest in joining the Code Catalyst Community and for submitting your details through our Hiring Form. 🎉</p>
      <p>We have successfully received your response and our HR/Recruitment team will carefully review your application. If your profile aligns with our current requirements, you will be shortlisted for the next stage of the selection process, which may include an interview or additional assessments.</p>
      <p>🔹 What Happens Next?</p>
      <p>Shortlisted candidates will receive an email with interview details and Google Meet link.</p>
      <p>Please keep an eye on your inbox for further updates.</p>
      <p>In the meantime, feel free to stay connected with us:</p>
      <ul>
        <li>🌐 Website: {{websiteUrl}}</li>
        <li>💬 Discord Community: {{discordUrl}}</li>
        <li>🔗 LinkedIn: {{linkedinUrl}}</li>
      </ul>
      <p>We truly appreciate the time and effort you've taken to apply, and we look forward to the possibility of working together to grow and innovate as part of Code Catalyst.</p>
      <p>Best regards,<br>HR<br>Code Catalyst</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `
  },
  {
    name: 'Interview Scheduled (Online)',
    code: 'INTERVIEW_ONLINE',
    subject: 'Interview Schedule – Code Catalyst Recruitment',
    category: 'interview',
    isPredefined: true,
    variables: [
      { name: 'candidateName', description: 'Candidate\'s full name', example: 'John Doe' },
      { name: 'date', description: 'Interview date', example: '29/10/2025' },
      { name: 'time', description: 'Interview time', example: '7:00 PM' },
      { name: 'meetLink', description: 'Google Meet link', example: 'https://meet.google.com/smx-tgss-ogv' },
      { name: 'interviewers', description: 'List of interviewers', example: 'Poorvi (HR lead), Aakansha(HR),Divy (President)' },
      { name: 'hrName', description: 'HR name', example: 'Poorvi' },
      { name: 'designation', description: 'HR designation', example: 'HR Lead' }
    ],
    htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Schedule</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .interview-details { background: white; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Interview Schedule – Code Catalyst Recruitment</h1>
    </div>
    <div class="content">
      <p>Hi {{candidateName}},</p>
      <p>We are pleased to inform you that you have been shortlisted for the Code Catalyst recruitment process. The next step will be your interview round, details of which are provided below:</p>

      <div class="interview-details">
        <p><strong>Interview Mode:</strong> Online (Google Meet)</p>
        <p><strong>Date:</strong> {{date}}</p>
        <p><strong>Time:</strong> {{time}}</p>
        <p><strong>Google Meet Link:</strong> <a href="{{meetLink}}">{{meetLink}}</a></p>
        <p><strong>Interviewer:</strong> {{interviewers}}</p>
      </div>

      <h3>Important Instructions:</h3>
      <ul>
        <li>Please ensure you join the call on time.</li>
        <li>Please wait till you are allowed to enter the meeting.</li>
        <li>Keep your camera and microphone turned on throughout the interview for smooth coordination.</li>
        <li>Maintain a professional environment (quiet background, stable internet connection).</li>
        <li>Be prepared to discuss your background, skills, and interest in contributing to the Code Catalyst Community.</li>
      </ul>

      <p>Kindly reply to this email to confirm your availability or let us know if you require rescheduling.</p>
      <p>We look forward to meeting you and learning more about your aspirations.</p>

      <p>Best regards,<br>{{hrName}}<br>{{designation}}<br>Code Catalyst</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `
  },
  {
    name: 'Hired',
    code: 'HIRED',
    subject: 'You are Hired, we\'re Excited to Have You on Our Team!',
    category: 'onboarding',
    isPredefined: true,
    variables: [
      { name: 'candidateName', description: 'Candidate\'s full name', example: 'John Doe' },
      { name: 'domainName', description: 'Assigned domain/team', example: 'Project Management' },
      { name: 'discordLink', description: 'Discord server link', example: 'https://discord.gg/uW3BthhwDU' },
      { name: 'hrName', description: 'HR name', example: 'Poorvi' },
      { name: 'designation', description: 'HR designation', example: 'HR Lead' },
      { name: 'linkedinPageUrl', description: 'LinkedIn page URL', example: 'https://www.linkedin.com/company/code-catalyst-s/' }
    ],
    htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You are Hired!</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .congrats { background: white; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Congratulations! 🎉</h1>
    </div>
    <div class="content">
      <div class="congrats">
        <h2>You are Hired!</h2>
        <p>We're excited to have you on our team!</p>
      </div>

      <p>Hi {{candidateName}},</p>
      <p>Congratulations! We are delighted to officially welcome you to the Code Catalyst Community. Your skills, passion, and dedication have earned you this opportunity, and we're excited to see the impact you will create as part of our growing network of innovators.</p>

      <p>We're thrilled to inform you that you've officially been selected as the <strong>{{domainName}} Team Member</strong> at Code Catalyst. Your profile stood out, and we're confident that you'll be a great addition to our growing team. Welcome aboard!</p>

      <p>To get started, please join our official Discord server where all important communication, onboarding, and team interactions take place:</p>
      <p><strong>Join here: <a href="{{discordLink}}">{{discordLink}}</a></strong></p>
      <p><em>Note: The joining link is valid only for 24 hours so make sure to join on priority.</em></p>

      <p>Feel free to introduce yourself in the introduction channel once you're in. One of our team members will guide you through the next steps.</p>

      <p>If you have any questions, you can reach out directly via Discord or reply to this email.</p>

      <p>Attached to this email, you will find your Offer Letter, which outlines your role, responsibilities, and the values we uphold at Code Catalyst. Please review the document carefully and confirm your acceptance by replying to this email.</p>

      <h3>Next Step – Share Your Achievement</h3>
      <p>We would love for you to share this milestone on LinkedIn to celebrate your selection and showcase your achievement with your network. This will also help you establish your professional presence and highlight your association with the Code Catalyst community.</p>

      <p>Here's a suggested format for your post:</p>
      <blockquote>
        Excited to share that I have officially joined Code Catalyst as a [Your Role]! Looking forward to contributing to amazing projects, learning with inspiring peers, and making an impact in the community.<br>
        #CodeCatalyst #Community #Innovation #Learning #Collaboration
      </blockquote>

      <p>Don't forget to tag "Code Catalyst" in your post so we can reshare it on our official page.<br>
      LinkedIn Page Link - <a href="{{linkedinPageUrl}}">{{linkedinPageUrl}}</a></p>

      <p>Once again, congratulations and welcome aboard! Let's build, learn, and grow together.</p>

      <p>Best regards,<br>{{hrName}}<br>{{designation}}<br>Code Catalyst Team</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `
  },
  {
    name: 'Interview Scheduled (Offline)',
    code: 'INTERVIEW_OFFLINE',
    subject: 'Interview Schedule – Code Catalyst Recruitment',
    category: 'interview',
    isPredefined: true,
    variables: [
      { name: 'candidateName', description: 'Candidate\'s full name', example: 'John Doe' },
      { name: 'date', description: 'Interview date', example: '14/10/2025' },
      { name: 'time', description: 'Interview time', example: '9:30 AM - 12:00 PM' },
      { name: 'venue', description: 'Interview venue', example: 'Room No. 109, JB Knowledge Park' },
      { name: 'interviewers', description: 'List of interviewers', example: 'Poorvi (HR), Divy (President), Arjan (Secretary)' },
      { name: 'hrName', description: 'HR name', example: 'Poorvi' },
      { name: 'designation', description: 'HR designation', example: 'HR Lead' }
    ],
    htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Schedule - Offline</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .interview-details { background: white; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Interview Schedule – Code Catalyst Recruitment</h1>
    </div>
    <div class="content">
      <p>Hi {{candidateName}},</p>
      <p>We are pleased to inform you that you have been shortlisted for the Code Catalyst recruitment process. The next step will be your interview round, details of which are provided below:</p>

      <div class="interview-details">
        <p><strong>Interview Mode:</strong> Offline (In-Person)</p>
        <p><strong>Date:</strong> {{date}}</p>
        <p><strong>Time:</strong> {{time}}</p>
        <p><strong>Venue:</strong> {{venue}}</p>
        <p><strong>Interviewer:</strong> {{interviewers}}</p>
      </div>

      <h3>Important Instructions:</h3>
      <ul>
        <li>Please arrive at least 10 minutes early.</li>
        <li>Carry your College ID Card and a copy of your resume.</li>
        <li>Dress well to maintain professionalism.</li>
        <li>Be prepared to discuss your background, skills, and interest in contributing to the Code Catalyst Community.</li>
      </ul>

      <p>Kindly reply to this email to confirm your availability or let us know if you require rescheduling.</p>
      <p>We look forward to meeting you and learning more about your aspirations.</p>

      <p>Best regards,<br>{{hrName}}<br>{{designation}}<br>Code Catalyst</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `
  },
  {
    name: 'Interview Rescheduled',
    code: 'INTERVIEW_RESCHEDULED',
    subject: 'Interview Reschedule for Code Catalyst Community',
    category: 'interview',
    isPredefined: true,
    variables: [
      { name: 'candidateName', description: 'Candidate\'s full name', example: 'John Doe' },
      { name: 'newDate', description: 'New interview date', example: '14/10/2025' },
      { name: 'newTime', description: 'New interview time', example: '9:30 AM - 12:00 PM' },
      { name: 'venue', description: 'Interview venue', example: 'Room No. 109, JB Knowledge Park' },
      { name: 'interviewers', description: 'List of interviewers', example: 'Poorvi (HR), Divy (President)' },
      { name: 'hrName', description: 'HR name', example: 'Poorvi' },
      { name: 'designation', description: 'HR designation', example: 'HR Lead' }
    ],
    htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Rescheduled</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .interview-details { background: white; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Interview Rescheduled</h1>
    </div>
    <div class="content">
      <p>Dear {{candidateName}},</p>
      <p>We hope you're doing well. We noticed that you couldn't attend your scheduled interview for Code Catalyst, our college's technical community.</p>
      <p>We understand that unforeseen circumstances can arise, so we're giving you another opportunity to attend the interview. Please find the new interview details below:</p>

      <div class="interview-details">
        <p><strong>Date:</strong> {{newDate}}</p>
        <p><strong>Time:</strong> {{newTime}}</p>
        <p><strong>Venue:</strong> {{venue}}</p>
        <p><strong>Interviewer:</strong> {{interviewers}}</p>
      </div>

      <h3>Important Instructions:</h3>
      <ul>
        <li>Please arrive at least 10 minutes early.</li>
        <li>Carry your College ID Card and a copy of your resume.</li>
        <li>Dress well to maintain professionalism.</li>
        <li>Confirm your availability by replying to this email before the date.</li>
      </ul>

      <p>We truly hope you can make it this time and are looking forward to meeting you.</p>

      <p>Best regards,<br>{{hrName}}<br>{{designation}}<br>Code Catalyst Team</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `
  },
  {
    name: 'Interview Not Attended',
    code: 'INTERVIEW_NO_SHOW',
    subject: 'Interview Update – Code Catalyst',
    category: 'interview',
    isPredefined: true,
    variables: [
      { name: 'candidateName', description: 'Candidate\'s full name', example: 'John Doe' },
      { name: 'websiteUrl', description: 'Company website URL', example: 'https://code-catalyst.pages.dev/' },
      { name: 'discordUrl', description: 'Discord community URL', example: 'https://discord.gg/CfwBfFhDZf' },
      { name: 'linkedinUrl', description: 'LinkedIn page URL', example: 'https://www.linkedin.com/company/code-catalyst-s/' },
      { name: 'instagramUrl', description: 'Instagram page URL', example: 'https://www.instagram.com/codecatalyst_jb/' }
    ],
    htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Update</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #6366f1; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .highlight { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
    .social-links { margin: 20px 0; }
    .social-links a { display: inline-block; margin: 0 10px; color: #6366f1; text-decoration: none; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Interview Update – Code Catalyst</h1>
    </div>
    <div class="content">
      <p>Hi {{candidateName}},</p>
      <p>We noticed that you were unable to attend your scheduled interview for Code Catalyst.</p>

      <div class="highlight">
        <p><strong>📌 Note:</strong> While we regret that we couldn't meet you this time, we truly appreciate your initial interest in joining Code Catalyst.</p>
      </div>

      <p>Even though the interview process couldn't proceed, we'd love to stay connected with you! 🌟 Code Catalyst is more than just a community—it's a space for innovation, learning, and collaboration.</p>

      <p>Feel free to explore our activities, events, and projects. You're always welcome to join us through our social platforms:</p>

      <div class="social-links">
        <p>
          🌐 <a href="{{websiteUrl}}">Website</a> | 
          💬 <a href="{{discordUrl}}">Discord</a> | 
          🔗 <a href="{{linkedinUrl}}">LinkedIn</a> | 
          📸 <a href="{{instagramUrl}}">Instagram</a>
        </p>
      </div>

      <p>We hope to see you around, and perhaps in future opportunities! 🚀</p>

      <p>Best regards,<br>HR Team<br>Code Catalyst</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `
  },
  {
    name: 'Not Hired (Rejection)',
    code: 'NOT_HIRED',
    subject: 'Application Update – Code Catalyst Recruitment',
    category: 'hiring',
    isPredefined: true,
    variables: [
      { name: 'candidateName', description: 'Candidate\'s full name', example: 'John Doe' },
      { name: 'websiteUrl', description: 'Company website URL', example: 'https://code-catalyst.pages.dev/' },
      { name: 'discordUrl', description: 'Discord community URL', example: 'https://discord.gg/CfwBfFhDZf' },
      { name: 'linkedinUrl', description: 'LinkedIn page URL', example: 'https://www.linkedin.com/company/code-catalyst-s/' },
      { name: 'instagramUrl', description: 'Instagram page URL', example: 'https://www.instagram.com/codecatalyst_jb/' }
    ],
    htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Update</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #8b5cf6; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .highlight { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
    .social-links { margin: 20px 0; }
    .social-links a { display: inline-block; margin: 0 10px; color: #8b5cf6; text-decoration: none; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Application Update</h1>
    </div>
    <div class="content">
      <p>Hi {{candidateName}},</p>
      <p>Thank you for attending the interview for Code Catalyst. We truly appreciate the time and effort you invested in this process.</p>

      <div class="highlight">
        <p><strong>📌 Update:</strong> After careful evaluation of all candidates, we regret to inform you that we are unable to proceed with your application at this time.</p>
      </div>

      <p>We want to emphasize that this decision was incredibly challenging, given the caliber of talent we encountered. While you weren't selected this time, we encourage you to keep honing your skills and exploring opportunities.</p>

      <p>Code Catalyst is not just about selection—it's about growth and community. We invite you to stay connected with us and engage with our events, projects, and learning initiatives:</p>

      <div class="social-links">
        <p>
          🌐 <a href="{{websiteUrl}}">Website</a> | 
          💬 <a href="{{discordUrl}}">Discord</a> | 
          🔗 <a href="{{linkedinUrl}}">LinkedIn</a> | 
          📸 <a href="{{instagramUrl}}">Instagram</a>
        </p>
      </div>

      <p>We genuinely hope to see you succeed in your endeavors, and perhaps our paths will cross again in the future. Keep pushing forward! 💪</p>

      <p>Best regards,<br>HR Team<br>Code Catalyst</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `
  },
  {
    name: 'Server Join Reminder',
    code: 'SERVER_JOIN_REMINDER',
    subject: 'Reminder: Join the Code Catalyst Core Server',
    category: 'engagement',
    isPredefined: true,
    variables: [
      { name: 'memberName', description: 'Member\'s full name', example: 'John Doe' },
      { name: 'discordLink', description: 'Discord server invite link', example: 'https://discord.gg/uW3BthhwDU' },
      { name: 'senderName', description: 'Sender name', example: 'HR Team' }
    ],
    htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Server Join Reminder</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #5865f2; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .cta-button { display: inline-block; background: #5865f2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Join the Code Catalyst Core Server</h1>
    </div>
    <div class="content">
      <p>Hi {{memberName}},</p>
      <p>We noticed that you haven't joined the Code Catalyst Core Server on Discord yet. 🎯</p>
      <p>This server is the central hub for all team activities, updates, announcements, and collaboration. It's essential that you join as soon as possible to stay connected with your team and access important resources.</p>

      <p style="text-align: center;">
        <a href="{{discordLink}}" class="cta-button">Join Core Server Now</a>
      </p>

      <p><strong>⚠️ Note:</strong> The joining link is valid for a limited time, so please join on priority.</p>

      <p>Once you've joined, please introduce yourself in the #introductions channel so we can welcome you officially!</p>

      <p>If you face any issues joining, feel free to reply to this email, and we'll assist you.</p>

      <p>Best regards,<br>{{senderName}}<br>Code Catalyst Team</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `
  },
  {
    name: 'Team Choice (Interviewed)',
    code: 'TEAM_CHOICE_INTERVIEWED',
    subject: 'Next Step – Choose Your Team at Code Catalyst',
    category: 'onboarding',
    isPredefined: true,
    variables: [
      { name: 'candidateName', description: 'Candidate\'s full name', example: 'John Doe' },
      { name: 'formLink', description: 'Team choice form link', example: 'https://forms.gle/example' }
    ],
    htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Choose Your Team</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .cta-button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Choose Your Team – Code Catalyst</h1>
    </div>
    <div class="content">
      <p>Hi {{candidateName}},</p>
      <p>Thank you for attending the interview for Code Catalyst! 🎉 We're excited to move forward with you.</p>
      <p>As the next step, we'd like you to choose the team/domain you're most interested in joining. Your preference will help us assign you to the right team where you can contribute and grow.</p>

      <p><strong>Available Teams/Domains:</strong></p>
      <ul>
        <li>Content Writing</li>
        <li>Video Editing</li>
        <li>Graphic Design</li>
        <li>Web Development</li>
        <li>App Development</li>
        <li>UI/UX Design</li>
        <li>Event Management</li>
        <li>Social Media Marketing</li>
      </ul>

      <p style="text-align: center;">
        <a href="{{formLink}}" class="cta-button">Choose Your Team</a>
      </p>

      <p>Please submit your preference within the next 24-48 hours so we can proceed with the onboarding process.</p>

      <p>Looking forward to having you on board! 🚀</p>

      <p>Best regards,<br>HR Team<br>Code Catalyst</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `
  },
  {
    name: 'Team Choice (Not Interviewed)',
    code: 'TEAM_CHOICE_NOT_INTERVIEWED',
    subject: 'Opportunity to Join Code Catalyst Teams',
    category: 'engagement',
    isPredefined: true,
    variables: [
      { name: 'candidateName', description: 'Candidate\'s full name', example: 'John Doe' },
      { name: 'formLink', description: 'Team choice form link', example: 'https://forms.gle/example' }
    ],
    htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Join Code Catalyst Teams</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #6366f1; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .cta-button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Join Code Catalyst Teams</h1>
    </div>
    <div class="content">
      <p>Hi {{candidateName}},</p>
      <p>We noticed you couldn't attend the scheduled interview for Code Catalyst. However, we don't want you to miss out on the opportunity to be part of our amazing community! ✨</p>
      <p>We're offering you a chance to join one of our specialized teams directly. You can choose the team/domain that aligns with your interests and skills.</p>

      <p><strong>Available Teams:</strong></p>
      <ul>
        <li>Content Writing</li>
        <li>Video Editing</li>
        <li>Graphic Design</li>
        <li>Social Media Marketing</li>
        <li>Event Management</li>
      </ul>

      <p style="text-align: center;">
        <a href="{{formLink}}" class="cta-button">Choose Your Team</a>
      </p>

      <p>This is a limited-time opportunity, so make sure to submit your choice soon!</p>

      <p>Don't miss this opportunity to be a part of something exciting and collaborative! 🚀</p>

      <p>Best regards,<br>Code Catalyst Team</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `
  },
  {
    name: 'Resignation Acknowledged',
    code: 'RESIGNATION_ACK',
    subject: 'Acknowledgement of Your Resignation',
    category: 'exit',
    isPredefined: true,
    variables: [
      { name: 'memberName', description: 'Member\'s full name', example: 'John Doe' },
      { name: 'managerName', description: 'Manager/Team lead name', example: 'Team Lead' }
    ],
    htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resignation Acknowledged</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #6b7280; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Resignation Acknowledged</h1>
    </div>
    <div class="content">
      <p>Hi {{memberName}},</p>
      <p>Thank you for informing us about your decision to resign from the Code Catalyst Community.</p>
      <p>We acknowledge your resignation and respect your choice. We truly appreciate the time, effort, and contributions you made during your tenure with us. Your work has been valuable, and you'll be missed by the team.</p>

      <p>We understand that priorities and circumstances change, and we wish you nothing but the best in your future endeavors. 🌟</p>

      <p>If you ever wish to reconnect or rejoin Code Catalyst in the future, our doors are always open for you.</p>

      <p>You will always remain a valued part of the Code Catalyst family. Thank you once again, and we hope our paths cross again someday!</p>

      <p>Best wishes,<br>{{managerName}}<br>Code Catalyst Team</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `
  },
  {
    name: 'Termination Notice',
    code: 'TERMINATION_NOTICE',
    subject: 'Important Notice Regarding Your Membership',
    category: 'exit',
    isPredefined: true,
    variables: [
      { name: 'memberName', description: 'Member\'s full name', example: 'John Doe' },
      { name: 'teamName', description: 'Team name', example: 'Development Team' },
      { name: 'inactivePeriod', description: 'Period of inactivity', example: '4 weeks' },
      { name: 'projectName', description: 'Project/community name', example: 'Code Catalyst' },
      { name: 'managerName', description: 'Manager name', example: 'Team Lead' }
    ],
    htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Termination Notice</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .highlight { background: #fee2e2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Important Notice Regarding Your Membership</h1>
    </div>
    <div class="content">
      <p>Hi {{memberName}},</p>
      <p>We hope this email finds you well.</p>

      <div class="highlight">
        <p><strong>⚠️ Notice:</strong> We regret to inform you that due to consistent inactivity and lack of engagement over the past {{inactivePeriod}}, your membership with the {{teamName}} at {{projectName}} is being terminated.</p>
      </div>

      <p>We understand that circumstances can change, and priorities may shift. However, active participation is essential for the smooth functioning and growth of our community.</p>

      <p>Despite multiple reminders and follow-ups, we haven't received a response or seen any activity from your end, which has led us to this decision.</p>

      <p>We genuinely appreciate the time you were part of {{projectName}} and the contributions you made earlier. You will always be remembered as a valued member.</p>

      <p>If you believe this decision was made in error or if you'd like to discuss this further, please feel free to reach out to us within the next 48 hours.</p>

      <p>We wish you all the best in your future endeavors and hope you achieve great success in whatever path you choose. 🌟</p>

      <p>Sincerely,<br>{{managerName}}<br>{{teamName}}<br>{{projectName}}</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `
  },
  {
    name: 'Inactivity Warning',
    code: 'INACTIVITY_WARNING',
    subject: 'Reminder: Your Activity on Code Catalyst',
    category: 'engagement',
    isPredefined: true,
    variables: [
      { name: 'memberName', description: 'Member\'s full name', example: 'John Doe' },
      { name: 'teamName', description: 'Team name', example: 'Content Team' },
      { name: 'inactivePeriod', description: 'Period of inactivity', example: '3 weeks' },
      { name: 'deadlineDate', description: 'Response deadline', example: '7 days' }
    ],
    htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inactivity Warning</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .highlight { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Activity Reminder</h1>
    </div>
    <div class="content">
      <p>Hi {{memberName}},</p>
      <p>We hope you're doing well! This is a gentle reminder regarding your activity status with the {{teamName}} at Code Catalyst.</p>

      <div class="highlight">
        <p><strong>⚠️ Notice:</strong> We've observed that you haven't been active for approximately {{inactivePeriod}}. We haven't seen your contributions or responses to team communications during this time.</p>
      </div>

      <p>We understand that everyone goes through busy phases, but consistent participation is crucial for our team's progress and collaboration.</p>

      <p><strong>What You Need to Do:</strong></p>
      <ul>
        <li>Reply to this email confirming your availability</li>
        <li>Join the team Discord and re-engage with ongoing discussions</li>
        <li>Let us know if you're facing any issues or need support</li>
      </ul>

      <p><strong>⏰ Deadline:</strong> Please respond within the next {{deadlineDate}}. If we don't hear from you, we may have to reconsider your membership status.</p>

      <p>We genuinely hope to hear from you soon and continue working together! 🚀</p>

      <p>Best regards,<br>{{teamName}} Lead<br>Code Catalyst</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please reply to confirm your status.</p>
    </div>
  </div>
</body>
</html>
    `
  },
  {
    name: 'Rejoining Invitation',
    code: 'REJOIN_INVITE',
    subject: 'Invitation to Rejoin the Team – Code Catalyst',
    category: 'engagement',
    isPredefined: true,
    variables: [
      { name: 'memberName', description: 'Member\'s full name', example: 'John Doe' },
      { name: 'teamName', description: 'Team name', example: 'Editors Team' },
      { name: 'managerName', description: 'Manager name', example: 'Content Lead' },
      { name: 'managerRole', description: 'Manager role', example: 'Team Manager' }
    ],
    htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rejoining Invitation</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome Back!</h1>
    </div>
    <div class="content">
      <p>Dear {{memberName}},</p>
      <p>We hope this email finds you well!</p>
      <p>It's been a while since you were part of the {{teamName}} at Code Catalyst, and we genuinely miss having you around. Your contributions and presence were always valued, and we believe you have a lot to offer to the team.</p>

      <p>We'd like to extend an invitation for you to rejoin the {{teamName}}! 🎉</p>

      <p><strong>Why Rejoin?</strong></p>
      <ul>
        <li>Reconnect with a passionate and collaborative team</li>
        <li>Work on exciting new projects and initiatives</li>
        <li>Enhance your skills and portfolio</li>
        <li>Be part of a thriving community of innovators</li>
      </ul>

      <p>If you're interested in rejoining or would like to discuss this further, please reply to this email or reach out to {{managerName}} directly.</p>

      <p>We truly hope to have you back on the team! Let's create, learn, and grow together once again. 🚀</p>

      <p>Warm regards,<br>{{managerName}}<br>{{managerRole}}<br>{{teamName}}<br>Code Catalyst</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please reply if interested.</p>
    </div>
  </div>
</body>
</html>
    `
  },
  {
    name: 'Contact Form Acknowledgement',
    code: 'CONTACT_ACK',
    subject: 'Thank You for Reaching Out!',
    category: 'system',
    isPredefined: true,
    variables: [
      { name: 'name', description: 'Contact person name', example: 'John Doe' },
      { name: 'timeline', description: 'Response timeline', example: '24-48 hours' },
      { name: 'websiteUrl', description: 'Company website URL', example: 'https://code-catalyst.pages.dev/' },
      { name: 'discordUrl', description: 'Discord community URL', example: 'https://discord.gg/CfwBfFhDZf' },
      { name: 'linkedinUrl', description: 'LinkedIn page URL', example: 'https://www.linkedin.com/company/code-catalyst-s/' }
    ],
    htmlContent: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contact Form Acknowledgement</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #667eea; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .social-links { margin: 20px 0; }
    .social-links a { display: inline-block; margin: 0 10px; color: #667eea; text-decoration: none; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Thank You for Reaching Out!</h1>
    </div>
    <div class="content">
      <p>Hi {{name}},</p>
      <p>Thank you for contacting Code Catalyst! 🎉 We've successfully received your message and appreciate you taking the time to reach out to us.</p>

      <p>Our team will review your query and get back to you within {{timeline}}. We strive to respond to every inquiry promptly and provide the best assistance possible.</p>

      <p>In the meantime, feel free to explore more about Code Catalyst:</p>

      <div class="social-links">
        <p>
          🌐 <a href="{{websiteUrl}}">Website</a> | 
          💬 <a href="{{discordUrl}}">Discord</a> | 
          🔗 <a href="{{linkedinUrl}}">LinkedIn</a>
        </p>
      </div>

      <p>If your matter is urgent, please mention "URGENT" in the subject line of your email, and we'll prioritize it accordingly.</p>

      <p>Thank you once again for connecting with us. We look forward to assisting you! 🚀</p>

      <p>Best regards,<br>Code Catalyst Team</p>
    </div>
    <div class="footer">
      <p>This is an automated acknowledgement. We'll respond to your query soon.</p>
    </div>
  </div>
</body>
</html>
    `
  }
];

async function seedEmailTemplates() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskflow');
    console.log('✅ Connected to MongoDB');

    console.log('🌱 Seeding predefined email templates...');

    for (const templateData of predefinedTemplates) {
      const existingTemplate = await EmailTemplate.findOne({ code: templateData.code });

      if (existingTemplate) {
        console.log(`⏭️  Template ${templateData.code} already exists, skipping...`);
        continue;
      }

      const template = new EmailTemplate(templateData);
      await template.save();
      console.log(`✅ Created template: ${templateData.name} (${templateData.code})`);
    }

    console.log('🎉 Email template seeding completed!');
    console.log(`📊 Created ${predefinedTemplates.length} predefined templates`);

  } catch (error) {
    console.error('❌ Error seeding email templates:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeder
seedEmailTemplates();