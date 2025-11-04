import pkg from 'nodemailer';
const { createTransport } = pkg;

// Create reusable transporter - Simple configuration that works
const createTransporter = () => {
  const config = {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    // Simple, reliable settings
    pool: true,
    maxConnections: 5,
    maxMessages: 10,
    // Standard timeouts
    connectionTimeout: 5000,  // 5 seconds
    greetingTimeout: 5000,    // 5 seconds  
    socketTimeout: 10000,     // 10 seconds
    // Simple TLS config
    tls: {
      rejectUnauthorized: false
    }
  };

  console.log('📧 Creating transporter with config:', {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.auth.user
  });

  return createTransport(config);
};

// Helper to send email asynchronously (fire-and-forget)
// This doesn't block the API response
const sendEmailAsync = (transporter, mailOptions) => {
  // Validate environment variables before attempting to send
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('❌ Email configuration missing! Required: EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD');
    console.error('   EMAIL_HOST:', process.env.EMAIL_HOST || 'NOT SET');
    console.error('   EMAIL_USER:', process.env.EMAIL_USER || 'NOT SET');
    console.error('   EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***SET***' : 'NOT SET');
    return { success: false, status: 'error', message: 'Email service not configured' };
  }

  console.log('📧 Queueing email to:', mailOptions.to);
  console.log('   Subject:', mailOptions.subject);

  // Send email in background without blocking
  transporter.sendMail(mailOptions)
    .then(info => {
      console.log('✅ Email sent successfully!');
      console.log('   Message ID:', info.messageId);
      console.log('   Response:', info.response);
    })
    .catch(error => {
      console.error('❌ Email sending failed!');
      console.error('   Error:', error.message);
      console.error('   Code:', error.code);
    });
  
  // Return immediately without waiting
  return { success: true, status: 'queued', message: 'Email is being sent in background' };
};

// Helper to send email synchronously (wait for result)
// Use this for testing or when you need to know if email actually sent
const sendEmailSync = async (transporter, mailOptions) => {
  // Validate environment variables
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    const error = {
      success: false,
      status: 'error',
      message: 'Email service not configured',
      details: {
        EMAIL_HOST: process.env.EMAIL_HOST || 'NOT SET',
        EMAIL_USER: process.env.EMAIL_USER || 'NOT SET',
        EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET'
      }
    };
    console.error('❌ Email configuration missing:', error);
    return error;
  }

  console.log('📧 Sending email synchronously to:', mailOptions.to);
  
  try {
    // Skip verify in production to avoid hanging
    // Only verify in development/testing
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Verifying SMTP connection (dev mode)...');
      await transporter.verify();
      console.log('✅ SMTP connection verified successfully');
    }
    
    // Now send the email
    console.log('📤 Sending email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return {
      success: true,
      status: 'sent',
      messageId: info.messageId,
      response: info.response
    };
  } catch (error) {
    console.error('❌ Email operation failed:', error.message);
    console.error('   Error Code:', error.code);
    console.error('   Command:', error.command);
    
    // Provide helpful error messages
    let helpfulMessage = error.message;
    if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKET') {
      helpfulMessage = 'Connection timeout - Check your internet connection, firewall settings, or try using port 465 with secure=true';
    } else if (error.code === 'EAUTH') {
      helpfulMessage = 'Authentication failed - Verify your email and app password are correct';
    } else if (error.code === 'ECONNECTION') {
      helpfulMessage = 'Cannot connect to SMTP server - Check EMAIL_HOST and EMAIL_PORT settings';
    }
    
    return {
      success: false,
      status: 'failed',
      error: helpfulMessage,
      code: error.code,
      details: {
        responseCode: error.responseCode,
        response: error.response,
        command: error.command
      }
    };
  }
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
    .greeting-wave {
      display: inline-block;
      animation: wave 0.5s ease-in-out;
    }
    @keyframes wave {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(20deg); }
      75% { transform: rotate(-20deg); }
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
    .btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 15px 40px rgba(102, 126, 234, 0.5);
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
    .security-icon {
      font-size: 24px;
      flex-shrink: 0;
    }
    .security-notice p {
      margin: 0;
      color: #996300;
      font-size: 15px;
      line-height: 1.6;
    }
    .security-notice strong {
      color: #cc7a00;
      font-weight: 700;
    }
    .footer {
      background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
      padding: 40px 30px;
      text-align: center;
      color: #cbd5e0;
    }
    .footer-logo {
      width: 40px;
      height: 40px;
      margin: 0 auto 15px;
      opacity: 0.9;
      display: block;
    }
    .footer p {
      margin: 8px 0;
      font-size: 14px;
    }
    .footer strong {
      color: #ffffff;
      font-weight: 700;
    }
    .footer a {
      color: #90cdf4;
      text-decoration: none;
      font-weight: 600;
    }
    .footer a:hover {
      color: #63b3ed;
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
      transition: transform 0.2s;
    }
    .feature-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.1);
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
          <span class="greeting-wave">👋</span> Hi <strong>${fullName}</strong>!
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
          <div class="security-icon">⚠️</div>
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
        <img src="https://taskflow-nine-phi.vercel.app/logo.png" alt="TaskFlow" class="footer-logo" />
        <p><strong>TaskFlow</strong></p>
        <p>Collaborative Task Management System</p>
        <p style="margin-top: 20px; font-size: 12px; opacity: 0.8;">This is an automated message. Please do not reply.</p>
        <p style="margin-top: 15px;">
          <a href="${appUrl}">🌐 Visit TaskFlow</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

// Send credential email to new user
export const sendCredentialEmail = async (fullName, email, password) => {
  try {
    const transporter = createTransporter();
    // Use Vercel URL in production, fallback to CLIENT_URL or localhost
    const appUrl = process.env.NODE_ENV === 'production' 
      ? 'https://taskflow-nine-phi.vercel.app'
      : (process.env.CLIENT_URL || 'https://taskflow-nine-phi.vercel.app');

    const mailOptions = {
      from: {
        name: 'TaskFlow Team',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: '🎉 Welcome to TaskFlow - Your Account is Ready!',
      html: getCredentialEmailTemplate(fullName, email, password, appUrl),
      // Plain text fallback
      text: `
Welcome to TaskFlow!

Hi ${fullName},

Your TaskFlow account has been successfully created! 🎉

LOGIN CREDENTIALS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email: ${email}
🔑 Password: ${password}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 Login here: ${appUrl}

⚠️ IMPORTANT: Please change your password after your first login for security.

WHAT YOU CAN DO:
✓ Manage tasks and projects
✓ Use Kanban boards
✓ Collaborate with your team
✓ Track progress with analytics

Need help? Contact your administrator!

Best regards,
The TaskFlow Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TaskFlow - Collaborative Task Management
${appUrl}
      `.trim()
    };

    // Send email without blocking - return immediately
    console.log('📧 Sending credential email to:', email);
    
    // Send email in background
    transporter.sendMail(mailOptions)
      .then(info => {
        console.log('✅ Credential email sent successfully!');
        console.log('   To:', email);
        console.log('   Message ID:', info.messageId);
      })
      .catch(error => {
        console.error('❌ Failed to send credential email');
        console.error('   To:', email);
        console.error('   Error:', error.message);
      });
    
    // Return immediately without waiting
    return { success: true, status: 'queued', message: 'Email queued for sending' };
  } catch (error) {
    console.error('❌ Error in sendCredentialEmail:', error);
    return { success: false, status: 'error', error: error.message };
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (fullName, email, newPassword) => {
  try {
    const transporter = createTransporter();
    // Use Vercel URL in production, fallback to CLIENT_URL or localhost
    const appUrl = process.env.NODE_ENV === 'production' 
      ? 'https://taskflow-nine-phi.vercel.app'
      : (process.env.CLIENT_URL || 'http://localhost:3000');

    const mailOptions = {
      from: {
        name: 'TaskFlow Team',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: '🔑 TaskFlow - Password Reset',
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      padding: 40px 20px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .credentials-box {
      background: #f8f9fa;
      border-left: 4px solid #f5576c;
      padding: 20px;
      margin: 25px 0;
      border-radius: 5px;
    }
    .credential-item {
      margin: 12px 0;
    }
    .credential-label {
      font-weight: 600;
      color: #555;
      font-size: 14px;
    }
    .credential-value {
      color: #333;
      font-family: 'Courier New', monospace;
      background: #fff;
      padding: 8px 12px;
      border-radius: 4px;
      border: 1px solid #ddd;
      font-size: 14px;
      margin-top: 5px;
      display: inline-block;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .btn {
      display: inline-block;
      padding: 14px 35px;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      text-decoration: none;
      border-radius: 25px;
      font-weight: 600;
      font-size: 16px;
    }
    .security-notice {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 25px 0;
      border-radius: 5px;
      color: #856404;
      font-size: 14px;
    }
    .footer {
      background: #f8f9fa;
      padding: 25px;
      text-align: center;
      color: #6c757d;
      font-size: 13px;
      border-top: 1px solid #e9ecef;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔑 Password Reset</h1>
    </div>
    
    <div class="content">
      <p>Hi <strong>${fullName}</strong>,</p>
      
      <p>Your password has been reset by an administrator. Here is your new temporary password:</p>

      <div class="credentials-box">
        <div class="credential-item">
          <div class="credential-label">Email:</div>
          <div class="credential-value">${email}</div>
        </div>
        <div class="credential-item">
          <div class="credential-label">New Password:</div>
          <div class="credential-value">${newPassword}</div>
        </div>
      </div>

      <div class="security-notice">
        <strong>⚠️ Important:</strong> Please change this password immediately after logging in for security purposes.
      </div>

      <div class="button-container">
        <a href="${appUrl}" class="btn">Login to TaskFlow</a>
      </div>
    </div>

    <div class="footer">
      <p><strong>TaskFlow</strong> - Collaborative Task Management System</p>
      <p>This is an automated email. Please do not reply to this message.</p>
    </div>
  </div>
</body>
</html>
      `,
      text: `
Password Reset

Hi ${fullName},

Your password has been reset. Here is your new temporary password:

Email: ${email}
New Password: ${newPassword}

Please login at: ${appUrl}

Important: Please change this password immediately after logging in.

Best regards,
TaskFlow Team
      `.trim()
    };

    // Send email asynchronously without blocking
    sendEmailAsync(transporter, mailOptions);
    console.log('📧 Password reset email queued for:', email);
    return { success: true, status: 'queued', message: 'Password reset email is being sent' };
  } catch (error) {
    console.error('❌ Error queuing password reset email:', error);
    return { success: false, error: error.message };
  }
};

// HTML Email Template for Overdue Task Reminder
const getOverdueTaskEmailTemplate = (fullName, tasks, appUrl) => {
  const taskRows = tasks.map(task => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 12px; font-weight: 600; color: #2d3748;">${task.title}</td>
      <td style="padding: 12px; color: #718096;">
        <span style="background: ${getPriorityColor(task.priority)}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
          ${task.priority.toUpperCase()}
        </span>
      </td>
      <td style="padding: 12px; color: #e53e3e; font-weight: 600;">${task.daysOverdue} day${task.daysOverdue > 1 ? 's' : ''}</td>
      <td style="padding: 12px; color: #718096;">${new Date(task.due_date).toLocaleDateString()}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Overdue Tasks Reminder</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background: linear-gradient(135deg, #f56565 0%, #c53030 100%);
      margin: 0;
      padding: 0;
    }
    .email-wrapper {
      padding: 40px 20px;
    }
    .container {
      max-width: 650px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    .header {
      background: linear-gradient(135deg, #f56565 0%, #c53030 100%);
      padding: 40px 30px;
      text-align: center;
      color: white;
    }
    .logo-circle {
      width: 80px;
      height: 80px;
      background: white;
      border-radius: 50%;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }
    .logo-circle img {
      width: 50px;
      height: 50px;
      display: block;
      margin: 0 auto;
    }
    .content {
      padding: 40px 30px;
    }
    .alert-box {
      background: #fff5f5;
      border-left: 4px solid #e53e3e;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background: #f7fafc;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #2d3748;
      border-bottom: 2px solid #e2e8f0;
    }
    .btn {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #f56565 0%, #c53030 100%);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      box-shadow: 0 4px 15px rgba(245, 101, 101, 0.3);
    }
    .footer {
      background: #f7fafc;
      padding: 30px;
      text-align: center;
      color: #718096;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-circle">
          <img src="https://taskflow-nine-phi.vercel.app/logo.png" alt="TaskFlow Logo" />
        </div>
        <h1 style="margin: 0; font-size: 28px;">⚠️ Overdue Tasks Alert</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">You have ${tasks.length} overdue task${tasks.length > 1 ? 's' : ''} requiring immediate attention</p>
      </div>

      <div class="content">
        <p style="font-size: 16px; color: #2d3748;">Hi <strong>${fullName}</strong>,</p>
        
        <div class="alert-box">
          <p style="margin: 0; color: #c53030; font-weight: 600;">⏰ The following tasks are overdue and need your immediate attention:</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Task</th>
              <th>Priority</th>
              <th>Overdue By</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            ${taskRows}
          </tbody>
        </table>

        <p style="font-size: 16px; color: #4a5568;">Please review and update these tasks as soon as possible to keep your projects on track. 🎯</p>

        <div style="text-align: center;">
          <a href="${appUrl}/tasks" class="btn">View My Tasks</a>
        </div>

        <p style="font-size: 14px; color: #718096; margin-top: 30px;">
          <strong>💡 Tip:</strong> Set realistic deadlines and update task progress regularly to avoid overdue tasks.
        </p>
      </div>

      <div class="footer">
        <img src="https://taskflow-nine-phi.vercel.app/logo.png" alt="TaskFlow" style="width: 30px; height: 30px; margin-bottom: 10px;" />
        <p><strong>TaskFlow</strong></p>
        <p>Collaborative Task Management System</p>
        <p style="margin-top: 20px; font-size: 12px; opacity: 0.8;">This is an automated reminder. Please do not reply.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

// Helper function for priority colors in email
const getPriorityColor = (priority) => {
  const colors = {
    low: '#48bb78',
    medium: '#ed8936',
    high: '#f56565',
    urgent: '#c53030'
  };
  return colors[priority.toLowerCase()] || '#718096';
};

// Send overdue task reminder email
export const sendOverdueTaskReminder = async (fullName, email, tasks) => {
  try {
    const transporter = createTransporter();
    const appUrl = process.env.NODE_ENV === 'production' 
      ? 'https://taskflow-nine-phi.vercel.app'
      : (process.env.CLIENT_URL || 'http://localhost:3000');

    const mailOptions = {
      from: {
        name: 'TaskFlow Reminders',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: `⚠️ You have ${tasks.length} overdue task${tasks.length > 1 ? 's' : ''} - Action Required`,
      html: getOverdueTaskEmailTemplate(fullName, tasks, appUrl),
      text: `
Overdue Tasks Reminder

Hi ${fullName},

You have ${tasks.length} overdue task${tasks.length > 1 ? 's' : ''} requiring immediate attention:

${tasks.map((task, i) => `${i + 1}. ${task.title}
   Priority: ${task.priority.toUpperCase()}
   Overdue by: ${task.daysOverdue} day${task.daysOverdue > 1 ? 's' : ''}
   Due Date: ${new Date(task.due_date).toLocaleDateString()}
`).join('\n')}

Please login to TaskFlow to review and update these tasks: ${appUrl}/tasks

Best regards,
TaskFlow Team
      `.trim()
    };

    // Send email asynchronously without blocking
    sendEmailAsync(transporter, mailOptions);
    console.log(`📧 Overdue reminder email queued for: ${email}`);
    return { success: true, status: 'queued', message: 'Overdue reminder email is being sent' };
  } catch (error) {
    console.error(`❌ Error queuing overdue reminder email to ${email}:`, error);
    return { success: false, error: error.message };
  }
};

// HTML Email Template for Weekly Report
const getWeeklyReportEmailTemplate = (adminName, reportData, appUrl) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly TaskFlow Report</title>
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
      max-width: 650px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
      color: white;
    }
    .logo-circle {
      width: 80px;
      height: 80px;
      background: white;
      border-radius: 50%;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }
    .logo-circle img {
      width: 50px;
      height: 50px;
      display: block;
      margin: 0 auto;
    }
    .content {
      padding: 40px 30px;
    }
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin: 25px 0;
    }
    .stat-card {
      background: #f7fafc;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      border-left: 4px solid #667eea;
    }
    .stat-card.warning {
      border-left-color: #ed8936;
    }
    .stat-card.danger {
      border-left-color: #f56565;
    }
    .stat-card.success {
      border-left-color: #48bb78;
    }
    .stat-number {
      font-size: 32px;
      font-weight: 700;
      color: #2d3748;
      margin: 5px 0;
    }
    .stat-label {
      color: #718096;
      font-size: 14px;
      font-weight: 500;
    }
    .btn {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }
    .footer {
      background: #f7fafc;
      padding: 30px;
      text-align: center;
      color: #718096;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-circle">
          <img src="https://taskflow-nine-phi.vercel.app/logo.png" alt="TaskFlow Logo" />
        </div>
        <h1 style="margin: 0; font-size: 28px;">📊 Weekly Report</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">${reportData.weekRange}</p>
      </div>

      <div class="content">
        <p style="font-size: 16px; color: #2d3748;">Hi <strong>${adminName}</strong>,</p>
        
        <p style="font-size: 16px; color: #4a5568;">Here's your weekly TaskFlow summary:</p>

        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-label">Total Tasks</div>
            <div class="stat-number">${reportData.totalTasks}</div>
          </div>
          <div class="stat-card success">
            <div class="stat-label">Completed</div>
            <div class="stat-number">${reportData.completedTasks}</div>
          </div>
          <div class="stat-card warning">
            <div class="stat-label">In Progress</div>
            <div class="stat-number">${reportData.inProgressTasks}</div>
          </div>
          <div class="stat-card danger">
            <div class="stat-label">Overdue</div>
            <div class="stat-number">${reportData.overdueTasks}</div>
          </div>
        </div>

        <div style="background: #edf2f7; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <p style="margin: 0 0 10px 0; font-weight: 600; color: #2d3748;">📈 Key Metrics:</p>
          <p style="margin: 5px 0; color: #4a5568;">• Completion Rate: <strong>${reportData.completionRate}%</strong></p>
          <p style="margin: 5px 0; color: #4a5568;">• Active Teams: <strong>${reportData.activeTeams}</strong></p>
          <p style="margin: 5px 0; color: #4a5568;">• Active Users: <strong>${reportData.activeUsers}</strong></p>
        </div>

        <p style="font-size: 16px; color: #4a5568;">📎 Detailed reports (Excel & PDF) are attached to this email.</p>

        <div style="text-align: center;">
          <a href="${appUrl}/analytics" class="btn">View Full Analytics</a>
        </div>

        <p style="font-size: 14px; color: #718096; margin-top: 30px; font-style: italic;">
          This automated report is sent every Monday at 8:00 AM to help you stay on top of your team's progress. 📅
        </p>
      </div>

      <div class="footer">
        <img src="https://taskflow-nine-phi.vercel.app/logo.png" alt="TaskFlow" style="width: 30px; height: 30px; margin-bottom: 10px;" />
        <p><strong>TaskFlow</strong></p>
        <p>Collaborative Task Management System</p>
        <p style="margin-top: 20px; font-size: 12px; opacity: 0.8;">This is an automated report. Please do not reply.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

// Send weekly report email with attachments
export const sendWeeklyReport = async (adminName, email, reportData, attachments) => {
  try {
    const transporter = createTransporter();
    const appUrl = process.env.NODE_ENV === 'production' 
      ? 'https://taskflow-nine-phi.vercel.app'
      : (process.env.CLIENT_URL || 'http://localhost:3000');

    const mailOptions = {
      from: {
        name: 'TaskFlow Reports',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: `📊 Weekly TaskFlow Report - ${reportData.weekRange}`,
      html: getWeeklyReportEmailTemplate(adminName, reportData, appUrl),
      text: `
Weekly TaskFlow Report
${reportData.weekRange}

Hi ${adminName},

Here's your weekly TaskFlow summary:

STATISTICS:
• Total Tasks: ${reportData.totalTasks}
• Completed: ${reportData.completedTasks}
• In Progress: ${reportData.inProgressTasks}
• Overdue: ${reportData.overdueTasks}
• Completion Rate: ${reportData.completionRate}%
• Active Teams: ${reportData.activeTeams}
• Active Users: ${reportData.activeUsers}

Detailed reports (Excel & PDF) are attached to this email.

View full analytics: ${appUrl}/analytics

Best regards,
TaskFlow Team
      `.trim(),
      attachments: attachments
    };

    // Send email asynchronously without blocking
    sendEmailAsync(transporter, mailOptions);
    console.log(`📧 Weekly report email queued for: ${email}`);
    return { success: true, status: 'queued', message: 'Weekly report email is being sent' };
  } catch (error) {
    console.error(`❌ Error queuing weekly report email to ${email}:`, error);
    return { success: false, error: error.message };
  }
};

export default {
  sendCredentialEmail,
  sendPasswordResetEmail,
  sendOverdueTaskReminder,
  sendWeeklyReport
};


