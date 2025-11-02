import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'nodemailer';
const { createTransport } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('🧪 Email Configuration Test Tool');
console.log('================================\n');

// Check environment variables
console.log('📋 Current Configuration:');
console.log('  EMAIL_HOST:', process.env.EMAIL_HOST || '❌ NOT SET');
console.log('  EMAIL_PORT:', process.env.EMAIL_PORT || '❌ NOT SET');
console.log('  EMAIL_SECURE:', process.env.EMAIL_SECURE || '❌ NOT SET');
console.log('  EMAIL_USER:', process.env.EMAIL_USER || '❌ NOT SET');
console.log('  EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ SET' : '❌ NOT SET');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('');

// Validate configuration
const isConfigured = process.env.EMAIL_HOST && 
                     process.env.EMAIL_USER && 
                     process.env.EMAIL_PASSWORD;

if (!isConfigured) {
  console.error('❌ Email configuration is incomplete!');
  console.error('   Please set EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD in your .env file');
  process.exit(1);
}

// Test different configurations
const configurations = [
  {
    name: 'Gmail Port 587 (TLS)',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false
  },
  {
    name: 'Gmail Port 465 (SSL)',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true
  },
  {
    name: 'Current Configuration',
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true'
  }
];

async function testConfiguration(config) {
  console.log(`\n🔍 Testing: ${config.name}`);
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Secure: ${config.secure}`);
  
  const transporter = createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
    tls: {
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2'
    },
    debug: false,
    logger: false
  });

  try {
    console.log('   ⏳ Verifying connection...');
    const startTime = Date.now();
    await transporter.verify();
    const duration = Date.now() - startTime;
    console.log(`   ✅ Connection successful! (${duration}ms)`);
    transporter.close();
    return true;
  } catch (error) {
    console.log(`   ❌ Connection failed: ${error.message}`);
    console.log(`   Error Code: ${error.code || 'N/A'}`);
    
    if (error.code === 'ETIMEDOUT') {
      console.log('   💡 Timeout - Port may be blocked by firewall/hosting platform');
    } else if (error.code === 'EAUTH') {
      console.log('   💡 Authentication failed - Check your email and App Password');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('   💡 Connection refused - Wrong host or port');
    }
    
    try {
      transporter.close();
    } catch (e) {
      // Ignore
    }
    return false;
  }
}

async function sendTestEmail() {
  console.log('\n\n📧 Attempting to send test email...');
  console.log('================================\n');
  
  const testEmail = process.argv[2] || process.env.EMAIL_USER;
  
  if (!testEmail) {
    console.error('❌ No test email provided!');
    console.error('   Usage: node test-email-production.js your-email@example.com');
    return;
  }
  
  console.log(`   Recipient: ${testEmail}`);
  
  // Find working configuration
  const workingConfig = await (async () => {
    for (const config of configurations) {
      const result = await testConfiguration(config);
      if (result) return config;
    }
    return null;
  })();
  
  if (!workingConfig) {
    console.error('\n❌ No working configuration found!');
    console.error('   All connection attempts failed.');
    console.error('\n💡 Recommendations:');
    console.error('   1. Verify your Gmail App Password is correct');
    console.error('   2. Check if your hosting platform blocks SMTP ports');
    console.error('   3. Consider using SendGrid, Mailgun, or AWS SES');
    process.exit(1);
  }
  
  console.log(`\n✅ Using working configuration: ${workingConfig.name}`);
  console.log('   Creating transporter...');
  
  const transporter = createTransport({
    host: workingConfig.host,
    port: workingConfig.port,
    secure: workingConfig.secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    connectionTimeout: 30000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
    tls: {
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2'
    }
  });
  
  const mailOptions = {
    from: {
      name: 'TaskFlow Test',
      address: process.env.EMAIL_USER
    },
    to: testEmail,
    subject: '🧪 TaskFlow Email Test - ' + new Date().toLocaleString(),
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">✅ Email Configuration Test Successful!</h2>
        <p>Your email service is properly configured and working.</p>
        <div style="background: #f0f4ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #667eea;">Configuration Details:</h3>
          <p style="margin: 5px 0;"><strong>Host:</strong> ${workingConfig.host}</p>
          <p style="margin: 5px 0;"><strong>Port:</strong> ${workingConfig.port}</p>
          <p style="margin: 5px 0;"><strong>Secure:</strong> ${workingConfig.secure}</p>
          <p style="margin: 5px 0;"><strong>From:</strong> ${process.env.EMAIL_USER}</p>
        </div>
        <p>Test Time: ${new Date().toLocaleString()}</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          This is an automated test email from TaskFlow.
        </p>
      </div>
    `,
    text: `
Email Configuration Test Successful!

Your email service is properly configured and working.

Configuration:
- Host: ${workingConfig.host}
- Port: ${workingConfig.port}
- Secure: ${workingConfig.secure}
- From: ${process.env.EMAIL_USER}

Test Time: ${new Date().toLocaleString()}
    `
  };
  
  try {
    console.log('   📤 Sending email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('\n✅✅✅ Test email sent successfully! ✅✅✅');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}`);
    console.log(`   To: ${testEmail}`);
    console.log('\n💡 Check your inbox (and spam folder) for the test email.');
    
    transporter.close();
  } catch (error) {
    console.error('\n❌ Failed to send test email!');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}`);
    
    if (error.code === 'ETIMEDOUT') {
      console.error('\n💡 Timeout error - Common on hosting platforms');
      console.error('   The email may still have been sent - check your inbox');
      console.error('   Consider using a transactional email service (SendGrid, Mailgun)');
    }
    
    try {
      transporter.close();
    } catch (e) {
      // Ignore
    }
  }
}

// Run tests
console.log('\n🚀 Starting Email Configuration Tests...');
sendTestEmail().then(() => {
  console.log('\n================================');
  console.log('🏁 Test completed!');
}).catch(error => {
  console.error('\n💥 Test failed with error:', error);
  process.exit(1);
});
