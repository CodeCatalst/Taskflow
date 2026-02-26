import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// Display configuration (masking password)
' : '❌ NOT SET');
// Check if all required variables are set
if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  process.exit(1);
}

// Test different configurations
const configurations = [
  {
    name: 'Configuration 1: Port 587 (TLS/STARTTLS)',
    config: {
      host: process.env.EMAIL_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      }
    }
  },
  {
    name: 'Configuration 2: Port 465 (SSL)',
    config: {
      host: process.env.EMAIL_HOST,
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
      tls: {
        rejectUnauthorized: false
      }
    }
  },
  {
    name: 'Configuration 3: Port 587 with strict TLS',
    config: {
      host: process.env.EMAIL_HOST,
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000
    }
  }
];

async function testConnection(configObj) {
  const transporter = nodemailer.createTransport(configObj.config);

  try {
    await transporter.verify();
    return true;
  } catch (error) {
    if (error.code === 'ETIMEDOUT') {
      } else if (error.code === 'EAUTH') {
      } else if (error.code === 'ECONNECTION') {
      }
    return false;
  }
}

async function testSendEmail(configObj, testEmail) {
  const transporter = nodemailer.createTransport(configObj.config);

  const mailOptions = {
    from: {
      name: 'TaskFlow Test',
      address: process.env.EMAIL_USER
    },
    to: testEmail,
    subject: '✅ TaskFlow Email Test - SUCCESS',
    text: 'This is a test email from TaskFlow. If you received this, the email service is working correctly!',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #f4f4f4;">
        <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #667eea;">✅ TaskFlow Email Test</h2>
          <p>This is a test email from TaskFlow.</p>
          <p><strong>If you received this, the email service is working correctly!</strong></p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Sent at: ${new Date().toLocaleString()}
          </p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    return false;
  }
}

async function runTests() {
  let successfulConfig = null;
  
  for (const config of configurations) {
    const success = await testConnection(config);
    if (success) {
      successfulConfig = config;
      break; // Stop at first successful configuration
    }
  }

  if (successfulConfig) {
    // Ask if user wants to send test email
    // Try to send a test email
    const testEmail = process.argv[2] || process.env.EMAIL_USER;
    \n');
    
    if (process.argv[2]) {
      await testSendEmail(successfulConfig, testEmail);
    }
  } else {
    }

  }

runTests().catch(error => {
  process.exit(1);
});
