import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendEmail } from './utils/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Display current configuration (hide password)
: 'NOT SET'}`);
// Validate configuration
if (!process.env.BREVO_API_KEY) {
  ');
  process.exit(1);
}

if (!process.env.BREVO_LOGIN_EMAIL) {
  // SMTP method will be skipped, only API method will be used
}

// Test email details
const testEmail = process.env.EMAIL_FROM; // Send to yourself
const testSubject = 'TaskFlow Email Test';
const testHtmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Email Test</title>
</head>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <h2>✅ TaskFlow Email Test</h2>
  <p>This is a test email to verify your Brevo email configuration is working correctly.</p>
  <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
  <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
  <hr>
  <p>If you received this email, your Brevo configuration is working! 🎉</p>
</body>
</html>
`;

// Send test email
const result = await sendEmail(testEmail, testSubject, testHtmlContent);

if (result.success) {
  } else {
  }