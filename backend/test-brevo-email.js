import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendEmail } from './utils/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const requiredVars = ['BREVO_API_KEY', 'EMAIL_FROM'];
const missingVars = requiredVars.filter((name) => !process.env[name]);

if (missingVars.length > 0) {
  process.stderr.write(`Missing required environment variables: ${missingVars.join(', ')}\n`);
  process.exit(1);
}

const testEmail = process.env.EMAIL_FROM;
const testSubject = 'TaskFlow Email Test';
const testHtmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Email Test</title>
</head>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <h2>TaskFlow Email Test</h2>
  <p>This is a test email to verify your Brevo email configuration is working correctly.</p>
  <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
  <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
  <hr>
  <p>If you received this email, your Brevo configuration is working.</p>
</body>
</html>
`;

const result = await sendEmail(testEmail, testSubject, testHtmlContent);

if (!result.success) {
  process.stderr.write(`Failed to send test email: ${result.error || 'Unknown error'}\n`);
  process.exit(1);
}

process.stdout.write(`Test email sent successfully to ${testEmail}\n`);