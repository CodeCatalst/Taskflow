// Node.js 18+ has native fetch
const RENDER_URL = 'https://taskflow-henr.onrender.com';

async function testEmailConfig() {
  try {
    const response = await fetch(`${RENDER_URL}/api/test-email-config`);
    const data = await response.json();

    if (data.config) {
      }

    if (data.missing && data.missing.length > 0) {
      );
    }

    return data.success;
  } catch (error) {
    return false;
  }
}

async function testEmailSend(testEmail) {
  try {
    const response = await fetch(`${RENDER_URL}/api/test-email-send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail })
    });

    const data = await response.json();

    if (data.details) {
      if (data.details.messageId) {
        }
      if (data.details.response) {
        }
      if (data.details.status) {
        }
      if (data.error || data.details.error) {
        }
      if (data.details.code) {
        }
    }

    return data.success;
  } catch (error) {
    return false;
  }
}

async function checkBackendHealth() {
  try {
    const response = await fetch(`${RENDER_URL}/api/health`);
    const data = await response.json();

    return data.status === 'OK';
  } catch (error) {
    return false;
  }
}

async function runTests() {
  const testEmail = process.argv[2] || 'jassalarjan.awc@gmail.com';

  // Step 0: Health check
  const isHealthy = await checkBackendHealth();
  if (!isHealthy) {
    ');
    \n');
    return;
  }

  // Step 1: Check email configuration
  const isConfigured = await testEmailConfig();
  
  if (!isConfigured) {
    ');
    return;
  }

  // Step 2: Test email sending
  const emailSent = await testEmailSend(testEmail);

  // Final summary
  if (emailSent) {
    } else {
    }
  }

// Run the tests
runTests().catch(error => {
  process.exit(1);
});
