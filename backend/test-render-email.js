// Node.js 18+ has native fetch
const RENDER_URL = 'https://taskflow-henr.onrender.com';

console.log('═══════════════════════════════════════════════════');
console.log('   TESTING RENDER DEPLOYMENT - EMAIL SERVICE');
console.log('═══════════════════════════════════════════════════\n');

async function testEmailConfig() {
  console.log('🔍 Step 1: Checking Email Configuration...');
  console.log(`   URL: ${RENDER_URL}/api/test-email-config\n`);

  try {
    const response = await fetch(`${RENDER_URL}/api/test-email-config`);
    const data = await response.json();

    console.log('📋 Email Configuration Status:');
    console.log('   Success:', data.success ? '✅' : '❌');
    console.log('   Configured:', data.configured ? '✅' : '❌');
    console.log('   Message:', data.message);
    
    if (data.config) {
      console.log('\n📧 Email Settings:');
      console.log('   HOST:', data.config.EMAIL_HOST);
      console.log('   PORT:', data.config.EMAIL_PORT);
      console.log('   SECURE:', data.config.EMAIL_SECURE);
      console.log('   USER:', data.config.EMAIL_USER);
      console.log('   PASSWORD:', data.config.EMAIL_PASSWORD);
    }

    if (data.missing && data.missing.length > 0) {
      console.log('\n⚠️  Missing Variables:', data.missing.join(', '));
    }

    console.log('\n');
    return data.success;
  } catch (error) {
    console.error('❌ Failed to check email config:', error.message);
    return false;
  }
}

async function testEmailSend(testEmail) {
  console.log('📧 Step 2: Testing Email Send...');
  console.log(`   URL: ${RENDER_URL}/api/test-email-send`);
  console.log(`   To: ${testEmail}\n`);

  try {
    const response = await fetch(`${RENDER_URL}/api/test-email-send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail })
    });

    const data = await response.json();

    console.log('📨 Email Send Result:');
    console.log('   Success:', data.success ? '✅' : '❌');
    console.log('   Message:', data.message);
    
    if (data.details) {
      console.log('\n📝 Details:');
      if (data.details.messageId) {
        console.log('   Message ID:', data.details.messageId);
      }
      if (data.details.response) {
        console.log('   Response:', data.details.response);
      }
      if (data.details.status) {
        console.log('   Status:', data.details.status);
      }
      if (data.error || data.details.error) {
        console.log('   Error:', data.error || data.details.error);
      }
      if (data.details.code) {
        console.log('   Error Code:', data.details.code);
      }
    }

    console.log('\n');
    return data.success;
  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
    return false;
  }
}

async function checkBackendHealth() {
  console.log('🏥 Step 0: Checking Backend Health...');
  console.log(`   URL: ${RENDER_URL}/api/health\n`);

  try {
    const response = await fetch(`${RENDER_URL}/api/health`);
    const data = await response.json();

    console.log('💚 Backend Status:', data.status === 'OK' ? '✅ Online' : '❌ Offline');
    console.log('   Message:', data.message);
    console.log('\n');
    return data.status === 'OK';
  } catch (error) {
    console.error('❌ Backend is offline or unreachable:', error.message);
    console.log('\n');
    return false;
  }
}

async function runTests() {
  const testEmail = process.argv[2] || 'jassalarjan.awc@gmail.com';

  console.log(`🎯 Target: ${RENDER_URL}`);
  console.log(`📬 Test Email: ${testEmail}\n`);

  // Step 0: Health check
  const isHealthy = await checkBackendHealth();
  if (!isHealthy) {
    console.log('═══════════════════════════════════════════════════');
    console.log('❌ BACKEND IS NOT REACHABLE');
    console.log('═══════════════════════════════════════════════════');
    console.log('\n💡 Possible reasons:');
    console.log('   1. Render service is not deployed yet');
    console.log('   2. Service is sleeping (free tier)');
    console.log('   3. Deployment failed');
    console.log('   4. Network/DNS issues\n');
    console.log('🔧 Actions:');
    console.log('   1. Check Render Dashboard: https://dashboard.render.com');
    console.log('   2. Check deployment logs');
    console.log('   3. Try again in 1-2 minutes (waking up from sleep)\n');
    return;
  }

  // Step 1: Check email configuration
  const isConfigured = await testEmailConfig();
  
  if (!isConfigured) {
    console.log('═══════════════════════════════════════════════════');
    console.log('⚠️  EMAIL NOT CONFIGURED ON RENDER');
    console.log('═══════════════════════════════════════════════════');
    console.log('\n🔧 To fix this:');
    console.log('   1. Go to: https://dashboard.render.com');
    console.log('   2. Select your service: taskflow-henr');
    console.log('   3. Click: "Environment" tab');
    console.log('   4. Add these variables:');
    console.log('');
    console.log('      EMAIL_HOST=smtp.gmail.com');
    console.log('      EMAIL_PORT=587');
    console.log('      EMAIL_SECURE=false');
    console.log('      EMAIL_USER=updates.codecatalyst@gmail.com');
    console.log('      EMAIL_PASSWORD=kjuz elsu eoko tyyz');
    console.log('');
    console.log('   5. Click "Save Changes"');
    console.log('   6. Wait for automatic redeploy (2-5 minutes)');
    console.log('   7. Run this test again\n');
    return;
  }

  // Step 2: Test email sending
  const emailSent = await testEmailSend(testEmail);

  // Final summary
  console.log('═══════════════════════════════════════════════════');
  if (emailSent) {
    console.log('✅ SUCCESS - EMAIL SYSTEM WORKING!');
    console.log('═══════════════════════════════════════════════════');
    console.log(`\n📬 Check your inbox: ${testEmail}`);
    console.log('   Email should arrive within 30-60 seconds\n');
    console.log('🎉 Your Render deployment is ready!');
    console.log('   • Email configuration: ✅');
    console.log('   • Email sending: ✅');
    console.log('   • User creation will work: ✅\n');
  } else {
    console.log('❌ EMAIL SEND FAILED');
    console.log('═══════════════════════════════════════════════════');
    console.log('\n🔍 Check Render Logs:');
    console.log('   1. Go to Render Dashboard');
    console.log('   2. Select: taskflow-henr');
    console.log('   3. Click: "Logs" tab');
    console.log('   4. Look for email errors\n');
    console.log('💡 Common issues:');
    console.log('   • Email credentials incorrect');
    console.log('   • Gmail app password expired');
    console.log('   • Network/firewall blocking SMTP');
    console.log('   • Environment variables not saved properly\n');
  }
  console.log('═══════════════════════════════════════════════════\n');
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
