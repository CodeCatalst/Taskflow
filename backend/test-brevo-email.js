import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendEmail } from './utils/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('🧪 Testing Brevo Email Configuration...\n');

// Display current configuration (hide password)
console.log('📧 Brevo Email Settings:');
console.log(`   API Key: ${process.env.BREVO_API_KEY ? '***' + process.env.BREVO_API_KEY.slice(-4) : 'NOT SET'}`);
console.log(`   Login Email: ${process.env.BREVO_LOGIN_EMAIL || 'NOT SET'}`);
console.log(`   From Email: ${process.env.EMAIL_FROM}`);
console.log(`   From Name: ${process.env.EMAIL_FROM_NAME}`);
console.log(`   Client URL: ${process.env.CLIENT_URL}\n`);

// Validate configuration
if (!process.env.BREVO_API_KEY) {
  console.error('❌ ERROR: BREVO_API_KEY is not set!');
  console.error('Please set BREVO_API_KEY in your .env file\n');
  console.log('📝 To get your Brevo API key:');
  console.log('   1. Go to https://app.brevo.com/settings/keys/api');
  console.log('   2. Sign in to your account');
  console.log('   3. Click "Generate a new API key"');
  console.log('   4. Copy the generated key (starts with xkeysib-)');
  console.log('   5. Add it to your .env file as BREVO_API_KEY\n');
  process.exit(1);
}

if (!process.env.BREVO_LOGIN_EMAIL) {
  console.warn('⚠️  WARNING: BREVO_LOGIN_EMAIL is not set!');
  console.warn('SMTP method will be skipped, only API method will be used.');
  console.warn('For better reliability, add your Brevo login email to .env\n');
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

console.log(`📤 Sending test email to: ${testEmail}\n`);

// Send test email
const result = await sendEmail(testEmail, testSubject, testHtmlContent);

if (result.success) {
  console.log('\n✅ SUCCESS! Test email sent successfully!');
  console.log(`📬 Message ID: ${result.messageId}`);
  console.log(`🔌 Provider: ${result.provider}`);
  console.log(`\n📥 Check your inbox at: ${testEmail}`);
  console.log('💡 Note: Check spam folder if you don\'t see it in inbox\n');
} else {
  console.log('\n❌ FAILED! Could not send test email');
  console.error(`Error: ${result.error}\n`);
  console.log('📝 Common Solutions:');
  console.log('   1. Verify your Brevo API key is correct');
  console.log('   2. Check if your sender email is verified in Brevo');
  console.log('   3. Ensure your Brevo account has email credits');
  console.log('   4. Check Brevo dashboard for any account restrictions\n');
}