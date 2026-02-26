import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import { triggerOverdueReminders, triggerWeeklyReports } from './utils/scheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// Test function
const testAutomation = async () => {
  // Connect to database
  await connectDB();

  const args = process.argv.slice(2);
  const testType = args[0] || 'both';

  try {
    switch (testType) {
      case 'reminders':
        await triggerOverdueReminders();
        break;
      
      case 'reports':
        await triggerWeeklyReports();
        break;
      
      case 'both':
      default:
        await triggerOverdueReminders();
        await triggerWeeklyReports();
        break;
    }

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

// Run test
testAutomation();
