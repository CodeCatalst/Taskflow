import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import models
import LeaveType from '../models/LeaveType.js';
import EmailTemplate from '../models/EmailTemplate.js';
import Holiday from '../models/Holiday.js';
import LeaveBalance from '../models/LeaveBalance.js';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const seedHRData = async () => {
  try {
    

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    

    // Get all workspaces
    const workspaces = await Workspace.find();
    

    for (const workspace of workspaces) {
      

      // 1. Seed Leave Types
      const leaveTypes = [
        {
          workspaceId: workspace._id,
          name: 'Sick Leave',
          code: 'SICK',
          annualQuota: 12,
          carryForward: false,
          maxCarryForward: 0,
          color: '#ef4444',
          description: 'Medical leave for illness or health issues'
        },
        {
          workspaceId: workspace._id,
          name: 'Casual Leave',
          code: 'CASUAL',
          annualQuota: 10,
          carryForward: true,
          maxCarryForward: 5,
          color: '#3b82f6',
          description: 'Personal leave for planned activities'
        },
        {
          workspaceId: workspace._id,
          name: 'Paid Time Off',
          code: 'PTO',
          annualQuota: 15,
          carryForward: true,
          maxCarryForward: 7,
          color: '#10b981',
          description: 'Vacation and personal time off'
        },
        {
          workspaceId: workspace._id,
          name: 'Unpaid Leave',
          code: 'UNPAID',
          annualQuota: 0,
          carryForward: false,
          maxCarryForward: 0,
          color: '#6b7280',
          description: 'Leave without pay'
        }
      ];

      for (const leaveTypeData of leaveTypes) {
        const existing = await LeaveType.findOne({ 
          workspaceId: workspace._id, 
          code: leaveTypeData.code 
        });

        if (!existing) {
          const leaveType = await LeaveType.create(leaveTypeData);
          

          // Initialize leave balances for all users in workspace
          const users = await User.find({ workspaceId: workspace._id });
          const currentYear = new Date().getFullYear();

          for (const user of users) {
            await LeaveBalance.create({
              userId: user._id,
              workspaceId: workspace._id,
              leaveTypeId: leaveType._id,
              year: currentYear,
              totalQuota: leaveType.annualQuota,
              used: 0,
              pending: 0,
              available: leaveType.annualQuota,
              carriedForward: 0
            });
          }
          
        } else {
          
        }
      }

      // 2. Seed Holidays for current year
      const currentYear = new Date().getFullYear();
      const holidays = [
        {
          workspaceId: workspace._id,
          name: 'New Year',
          date: new Date(`${currentYear}-01-01`),
          isRecurring: true,
          description: 'New Year\'s Day celebration'
        },
        {
          workspaceId: workspace._id,
          name: 'Independence Day',
          date: new Date(`${currentYear}-07-04`),
          isRecurring: true,
          description: 'Independence Day celebration'
        },
        {
          workspaceId: workspace._id,
          name: 'Christmas',
          date: new Date(`${currentYear}-12-25`),
          isRecurring: true,
          description: 'Christmas holiday'
        },
        {
          workspaceId: workspace._id,
          name: 'Thanksgiving',
          date: new Date(`${currentYear}-11-28`),
          isRecurring: true,
          description: 'Thanksgiving Day'
        }
      ];

      for (const holidayData of holidays) {
        const existing = await Holiday.findOne({
          workspaceId: workspace._id,
          name: holidayData.name,
          date: holidayData.date
        });

        if (!existing) {
          await Holiday.create(holidayData);
          
        } else {
          
        }
      }
    }

    // 3. Seed Global Email Templates (workspace-independent)
    const emailTemplates = [
      {
        workspaceId: null,
        name: 'Leave Request Submitted',
        code: 'LEAVE_REQUEST_SUBMITTED',
        subject: 'New Leave Request - Action Required',
        htmlContent: `
          <h2>New Leave Request Submitted</h2>
          <p>A new leave request has been submitted and requires your review.</p>
          <hr>
          <p><strong>Employee:</strong> {{employeeName}}</p>
          <p><strong>Leave Type:</strong> {{leaveType}}</p>
          <p><strong>Start Date:</strong> {{startDate}}</p>
          <p><strong>End Date:</strong> {{endDate}}</p>
          <p><strong>Number of Days:</strong> {{days}}</p>
          <p><strong>Reason:</strong> {{reason}}</p>
          <hr>
          <p>Please log in to TaskFlow to approve or reject this request.</p>
        `,
        variables: [
          { name: 'employeeName', description: 'Name of employee', example: 'John Doe' },
          { name: 'leaveType', description: 'Type of leave', example: 'Sick Leave' },
          { name: 'startDate', description: 'Leave start date', example: '2026-01-20' },
          { name: 'endDate', description: 'Leave end date', example: '2026-01-22' },
          { name: 'days', description: 'Number of days', example: '3' },
          { name: 'reason', description: 'Reason for leave', example: 'Medical appointment' }
        ],
        category: 'leave',
        isPredefined: true
      },
      {
        workspaceId: null,
        name: 'Leave Request Approved',
        code: 'LEAVE_APPROVED',
        subject: 'Leave Request Approved ✅',
        htmlContent: `
          <h2 style="color: green;">Leave Request Approved</h2>
          <p>Dear {{employeeName}},</p>
          <p>Your leave request has been <strong style="color: green;">APPROVED</strong>.</p>
          <hr>
          <p><strong>Leave Type:</strong> {{leaveType}}</p>
          <p><strong>Start Date:</strong> {{startDate}}</p>
          <p><strong>End Date:</strong> {{endDate}}</p>
          <p><strong>Number of Days:</strong> {{days}}</p>
          <hr>
          <p>Enjoy your time off! 🌴</p>
        `,
        variables: [
          { name: 'employeeName', description: 'Name of employee', example: 'John Doe' },
          { name: 'leaveType', description: 'Type of leave', example: 'Casual Leave' },
          { name: 'startDate', description: 'Leave start date', example: '2026-01-20' },
          { name: 'endDate', description: 'Leave end date', example: '2026-01-22' },
          { name: 'days', description: 'Number of days', example: '3' }
        ],
        category: 'leave',
        isPredefined: true
      },
      {
        workspaceId: null,
        name: 'Leave Request Rejected',
        code: 'LEAVE_REJECTED',
        subject: 'Leave Request Rejected ❌',
        htmlContent: `
          <h2 style="color: red;">Leave Request Rejected</h2>
          <p>Dear {{employeeName}},</p>
          <p>Your leave request has been <strong style="color: red;">REJECTED</strong>.</p>
          <hr>
          <p><strong>Leave Type:</strong> {{leaveType}}</p>
          <p><strong>Start Date:</strong> {{startDate}}</p>
          <p><strong>End Date:</strong> {{endDate}}</p>
          <p><strong>Number of Days:</strong> {{days}}</p>
          <p><strong>Rejection Reason:</strong> {{rejectionReason}}</p>
          <hr>
          <p>Please contact your HR department for more information.</p>
        `,
        variables: [
          { name: 'employeeName', description: 'Name of employee', example: 'John Doe' },
          { name: 'leaveType', description: 'Type of leave', example: 'Casual Leave' },
          { name: 'startDate', description: 'Leave start date', example: '2026-01-20' },
          { name: 'endDate', description: 'Leave end date', example: '2026-01-22' },
          { name: 'days', description: 'Number of days', example: '3' },
          { name: 'rejectionReason', description: 'Reason for rejection', example: 'Insufficient notice' }
        ],
        category: 'leave',
        isPredefined: true
      },
      {
        workspaceId: null,
        name: 'Attendance Reminder',
        code: 'ATTENDANCE_REMINDER',
        subject: 'Attendance Reminder - Action Required',
        htmlContent: `
          <h2>⏰ Attendance Reminder</h2>
          <p>Dear {{employeeName}},</p>
          <p>This is a reminder that you have not checked in/out for today.</p>
          <p><strong>Date:</strong> {{date}}</p>
          <hr>
          <p>Please ensure you mark your attendance regularly to maintain accurate records.</p>
        `,
        variables: [
          { name: 'employeeName', description: 'Name of employee', example: 'John Doe' },
          { name: 'date', description: 'Date of missing attendance', example: '2026-01-19' }
        ],
        category: 'attendance',
        isPredefined: true
      }
    ];

    for (const templateData of emailTemplates) {
      const existing = await EmailTemplate.findOne({ code: templateData.code });

      if (!existing) {
        await EmailTemplate.create(templateData);
        
      } else {
        
      }
    }

    
    
    
    
    
    

    process.exit(0);
  } catch (error) {
    
    process.exit(1);
  }
};

seedHRData();
