import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'nodemailer';
const { createTransport } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Check environment variables
// Validate configuration
const isConfigured = process.env.EMAIL_HOST && 
                     process.env.EMAIL_USER && 
                     process.env.EMAIL_PASSWORD;

if (!isConfigured) {
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
    const startTime = Date.now();
    await transporter.verify();
    const duration = Date.now() - startTime;
    `);
    transporter.close();
    return true;
  } catch (error) {
    if (error.code === 'ETIMEDOUT') {
      } else if (error.code === 'EAUTH') {
      } else if (error.code === 'ECONNREFUSED') {
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
  const testEmail = process.argv[2] || process.env.EMAIL_USER;
  
  if (!testEmail) {
    return;
  }
  
  // Find working configuration
  const workingConfig = await (async () => {
    for (const config of configurations) {
      const result = await testConfiguration(config);
      if (result) return config;
    }
    return null;
  })();
  
  if (!workingConfig) {
    process.exit(1);
  }
  
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
    const info = await transporter.sendMail(mailOptions);
    for the test email.');
    
    transporter.close();
  } catch (error) {
    if (error.code === 'ETIMEDOUT') {
      ');
    }
    
    try {
      transporter.close();
    } catch (e) {
      // Ignore
    }
  }
}

// Run tests
sendTestEmail().then(() => {
  }).catch(error => {
  process.exit(1);
});
