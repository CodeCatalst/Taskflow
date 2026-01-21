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