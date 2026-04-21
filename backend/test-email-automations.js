import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { triggerOverdueReminders, triggerWeeklyReports, triggerDailyAdminReports, triggerTomorrowDueNotifications, triggerTodayDueNotifications, triggerOverdueEscalationReminders, triggerProcessScheduledCampaigns } from './utils/scheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to database
await mongoose.connect(process.env.MONGODB_URI);
console.log('Connected to MongoDB for testing\n');

console.log('🚀 Starting Email Automation Test...\n');

// Run all automation triggers
const runAllAutomations = async () => {
  try {
    console.log('📊 Triggering Daily Admin Reports...');
    await triggerDailyAdminReports();
    console.log('✅ Daily Admin Reports completed\n');

    console.log('⏰ Triggering Tomorrow Due Notifications...');
    await triggerTomorrowDueNotifications();
    console.log('✅ Tomorrow Due Notifications completed\n');

    console.log('🚨 Triggering Today Due Notifications...');
    await triggerTodayDueNotifications();
    console.log('✅ Today Due Notifications completed\n');

    console.log('⚠️ Triggering Overdue Task Reminders...');
    await triggerOverdueReminders();
    console.log('✅ Overdue Task Reminders completed\n');

    console.log('📈 Triggering Overdue Escalation Reminders...');
    await triggerOverdueEscalationReminders();
    console.log('✅ Overdue Escalation Reminders completed\n');

    console.log('📧 Triggering Weekly Reports...');
    await triggerWeeklyReports();
    console.log('✅ Weekly Reports completed\n');

    console.log('📬 Processing Scheduled Campaigns...');
    await triggerProcessScheduledCampaigns();
    console.log('✅ Scheduled Campaigns processing completed\n');

    console.log('🎉 All email automations have been triggered successfully!');
    console.log('📧 Check your email and logs for the results.');

  } catch (error) {
    console.error('❌ Error running automations:', error);
    process.exit(1);
  }
};

// Run the automations
runAllAutomations().then(() => {
  console.log('\n🏁 Automation test completed. Exiting...');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Failed to run automations:', error);
  process.exit(1);
});