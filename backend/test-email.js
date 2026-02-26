import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendCredentialEmail } from './utils/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Display current configuration (hide password)
: 'NOT SET'}`);
// Validate configuration
if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  process.exit(1);
}

// Test email details
const testEmail = process.env.EMAIL_USER; // Send to yourself
const testName = 'Test User';
const testPassword = 'Test@123456';

// Send test email
const result = await sendCredentialEmail(testName, testEmail, testPassword);

if (result.success) {
  } else {
  ');
  }

process.exit(result.success ? 0 : 1);
