import cron from 'node-cron';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Team from '../models/Team.js';
import Workspace from '../models/Workspace.js';
import { sendOverdueTaskReminder, sendWeeklyReport, sendDueDateNotification, sendDailyAdminReport } from './emailService.js';
import ScheduledEmailCampaign from '../models/ScheduledEmailCampaign.js';
import brevoService from '../services/brevoEmailService.js';
import { generateExcelReport, generatePDFReport, isTaskOverdue, calculateDaysUntilDue } from './reportGenerator.js';
import { logChange } from './changeLogService.js';

// Initialize all scheduled jobs
export const initializeScheduler = () => {
  // Daily Admin Reports - Every day at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    await sendDailyAdminReports();
  }, {
    scheduled: true,
    timezone: "Asia/Karachi" // Adjust to your timezone
  });

  // Due Date Notifications - Tasks due tomorrow at 6:00 PM
  cron.schedule('0 18 * * *', async () => {
    await sendTomorrowDueNotifications();
  }, {
    scheduled: true,
    timezone: "Asia/Karachi" // Adjust to your timezone
  });

  // Due Date Notifications - Tasks due today at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    await sendTodayDueNotifications();
  }, {
    scheduled: true,
    timezone: "Asia/Karachi" // Adjust to your timezone
  });

  // Due Date Escalation - Follow-up reminders for tasks overdue by 3+ days at 10:00 AM
  cron.schedule('0 10 * * *', async () => {
    await sendOverdueEscalationReminders();
  }, {
    scheduled: true,
    timezone: "Asia/Karachi" // Adjust to your timezone
  });

  // Process Scheduled Email Campaigns - Every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    await processScheduledCampaigns();
  }, {
    scheduled: true,
    timezone: "Asia/Karachi" // Adjust to your timezone
  });

  // Daily Overdue Task Reminders - Every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    await sendOverdueReminders();
  }, {
    scheduled: true,
    timezone: "Asia/Karachi" // Adjust to your timezone
  });

  // Weekly Reports - Every Monday at 8:00 AM
  cron.schedule('0 8 * * 1', async () => {
    await sendWeeklyReports();
  }, {
    scheduled: true,
    timezone: "Asia/Karachi" // Adjust to your timezone
  });
};

// Send daily admin reports to admins
const sendDailyAdminReports = async () => {
  try {
    // WORKSPACE SUPPORT: Get all workspaces
    const workspaces = await Workspace.find({});

    let totalSuccessCount = 0;
    let totalFailCount = 0;

    // Process each workspace separately
    for (const workspace of workspaces) {
      try {
        // Log automation trigger per workspace
        await logChange({
          event_type: 'automation_triggered',
          action: 'Daily admin reports automation',
          description: `System triggered automatic daily admin report generation for ${workspace.name}`,
          target_type: 'automation',
          metadata: {
            automation_type: 'daily_admin_reports',
            triggered_at: new Date().toISOString()
          },
          workspaceId: workspace._id
        });

        // Get today's date at start of day
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get all tasks for analytics
        const allTasks = await Task.find({ workspaceId: workspace._id })
          .populate('assigned_to', 'full_name email')
          .populate('team_id', 'name');

        // Get tasks due today
        const dueToday = await Task.find({
          workspaceId: workspace._id,
          due_date: {
            $gte: today,
            $lt: tomorrow
          }
        }).populate('assigned_to', 'full_name email');

        // Get overdue tasks
        const overdue = await Task.find({
          workspaceId: workspace._id,
          due_date: { $lt: today },
          status: { $ne: 'done' }
        }).populate('assigned_to', 'full_name email');

        // Get tasks completed today
        const completedToday = await Task.countDocuments({
          workspaceId: workspace._id,
          status: 'done',
          updated_at: {
            $gte: today,
            $lt: tomorrow
          }
        });

        // Prepare report data
        const reportData = {
          totalTasks: allTasks.length,
          dueToday,
          overdue,
          completedToday
        };

        // Get all admin and HR users in this workspace
        const admins = await User.find({
          workspaceId: workspace._id,
          role: { $in: ['admin', 'hr'] },
          email: { $exists: true, $ne: '' }
        });

        if (admins.length === 0) {
          continue;
        }

        let successCount = 0;
        let failCount = 0;

        for (const admin of admins) {
          try {
            const result = await sendDailyAdminReport(
              admin.full_name,
              admin.email,
              reportData,
              workspace.name
            );

            if (result.success) {
              successCount++;
            } else {
              failCount++;
            }
          } catch (error) {
            failCount++;
          }
        }

        totalSuccessCount += successCount;
        totalFailCount += failCount;

        // Log report generation and distribution per workspace
        await logChange({
          event_type: 'report_generated',
          action: 'Daily admin reports generated and sent',
          description: `Daily admin reports generated for ${workspace.name}: ${successCount} recipients received reports, ${failCount} failed`,
          target_type: 'report',
          metadata: {
            report_type: 'daily_admin_summary',
            success_count: successCount,
            fail_count: failCount,
            due_today_count: dueToday.length,
            overdue_count: overdue.length,
            completed_today: completedToday,
            total_tasks: allTasks.length,
            completed_at: new Date().toISOString()
          },
          workspaceId: workspace._id
        });
      } catch (workspaceError) {
        // Log workspace-specific error
        await logChange({
          event_type: 'automation_triggered',
          action: 'Daily admin reports failed',
          description: `Daily admin report generation failed for ${workspace.name}: ${workspaceError.message}`,
          target_type: 'automation',
          metadata: {
            automation_type: 'daily_admin_reports',
            error: workspaceError.message,
            failed_at: new Date().toISOString()
          },
          workspaceId: workspace._id
        });
      }
    }

  } catch (error) {
  }
};

// Send notifications for tasks due tomorrow
const sendTomorrowDueNotifications = async () => {
  try {
    // WORKSPACE SUPPORT: Get all workspaces
    const workspaces = await Workspace.find({});

    let totalSuccessCount = 0;
    let totalFailCount = 0;
    let totalTasksCount = 0;

    // Process each workspace separately
    for (const workspace of workspaces) {
      try {
        // Log automation trigger per workspace
        await logChange({
          event_type: 'automation_triggered',
          action: 'Tomorrow due notifications automation',
          description: `System triggered automatic tomorrow due notifications for ${workspace.name}`,
          target_type: 'automation',
          metadata: {
            automation_type: 'tomorrow_due_notifications',
            triggered_at: new Date().toISOString()
          },
          workspaceId: workspace._id
        });

        // Calculate tomorrow's date range
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

        // Get all tasks due tomorrow in this workspace
        const tasks = await Task.find({
          workspaceId: workspace._id,
          due_date: {
            $gte: tomorrow,
            $lt: dayAfterTomorrow
          },
          status: { $ne: 'done' }
        })
        .populate('assigned_to', 'full_name email')
        .populate('team_id', 'name');

        if (tasks.length === 0) {
          continue;
        }

        totalTasksCount += tasks.length;

        // Group tasks by user
        const userTasksMap = new Map();

        tasks.forEach(task => {
          if (task.assigned_to && task.assigned_to.length > 0) {
            task.assigned_to.forEach(user => {
              if (user.email) {
                if (!userTasksMap.has(user.email)) {
                  userTasksMap.set(user.email, {
                    fullName: user.full_name,
                    email: user.email,
                    tasks: []
                  });
                }

                userTasksMap.get(user.email).tasks.push({
                  _id: task._id,
                  title: task.title,
                  description: task.description,
                  priority: task.priority,
                  due_date: task.due_date
                });
              }
            });
          }
        });

        // Send email to each user with their tasks due tomorrow
        let successCount = 0;
        let failCount = 0;

        for (const [email, userData] of userTasksMap.entries()) {
          try {
            const result = await sendDueDateNotification(
              userData.fullName,
              userData.email,
              userData.tasks,
              'tomorrow'
            );

            if (result.success) {
              successCount++;
            } else {
              failCount++;
            }
          } catch (error) {
            failCount++;
          }
        }

        totalSuccessCount += successCount;
        totalFailCount += failCount;

        // Log automation completion per workspace
        await logChange({
          event_type: 'automation_triggered',
          action: 'Tomorrow due notifications completed',
          description: `Tomorrow due notifications completed for ${workspace.name}: ${successCount} emails sent successfully, ${failCount} failed`,
          target_type: 'automation',
          metadata: {
            automation_type: 'tomorrow_due_notifications',
            success_count: successCount,
            fail_count: failCount,
            total_tasks: tasks.length,
            completed_at: new Date().toISOString()
          },
          workspaceId: workspace._id
        });
      } catch (workspaceError) {
        // Log workspace-specific error
        await logChange({
          event_type: 'automation_triggered',
          action: 'Tomorrow due notifications failed',
          description: `Tomorrow due notifications failed for ${workspace.name}: ${workspaceError.message}`,
          target_type: 'automation',
          metadata: {
            automation_type: 'tomorrow_due_notifications',
            error: workspaceError.message,
            failed_at: new Date().toISOString()
          },
          workspaceId: workspace._id
        });
      }
    }

  } catch (error) {
  }
};

// Send escalation reminders for tasks overdue by 3+ days
const sendOverdueEscalationReminders = async () => {
  try {
    // WORKSPACE SUPPORT: Get all workspaces
    const workspaces = await Workspace.find({});

    let totalSuccessCount = 0;
    let totalFailCount = 0;
    let totalTasksCount = 0;

    // Process each workspace separately
    for (const workspace of workspaces) {
      try {
        // Log automation trigger per workspace
        await logChange({
          event_type: 'automation_triggered',
          action: 'Overdue escalation reminders automation',
          description: `System triggered automatic overdue escalation reminders for ${workspace.name}`,
          target_type: 'automation',
          metadata: {
            automation_type: 'overdue_escalation_reminders',
            triggered_at: new Date().toISOString()
          },
          workspaceId: workspace._id
        });

        // Calculate date 3 days ago (for escalation)
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        threeDaysAgo.setHours(0, 0, 0, 0);

        // Get all tasks that are overdue by 3+ days in this workspace
        const tasks = await Task.find({
          workspaceId: workspace._id,
          due_date: { $lt: threeDaysAgo },
          status: { $ne: 'done' }
        })
        .populate('assigned_to', 'full_name email')
        .populate('team_id', 'name');

        if (tasks.length === 0) {
          continue;
        }

        totalTasksCount += tasks.length;

        // Group tasks by user
        const userTasksMap = new Map();

        tasks.forEach(task => {
          if (task.assigned_to && task.assigned_to.length > 0) {
            task.assigned_to.forEach(user => {
              if (user.email) {
                if (!userTasksMap.has(user.email)) {
                  userTasksMap.set(user.email, {
                    fullName: user.full_name,
                    email: user.email,
                    tasks: []
                  });
                }

                const daysOverdue = Math.abs(calculateDaysUntilDue(task.due_date));
                userTasksMap.get(user.email).tasks.push({
                  _id: task._id,
                  title: task.title,
                  description: task.description,
                  priority: task.priority,
                  due_date: task.due_date,
                  daysOverdue: daysOverdue
                });
              }
            });
          }
        });

        // Send escalation email to each user with their overdue tasks
        let successCount = 0;
        let failCount = 0;

        for (const [email, userData] of userTasksMap.entries()) {
          try {
            const result = await sendOverdueTaskReminder(
              userData.fullName,
              userData.email,
              userData.tasks[0].title, // Send individual emails for each escalated task
              userData.tasks[0].daysOverdue
            );

            if (result.success) {
              successCount++;
            } else {
              failCount++;
            }
          } catch (error) {
            failCount++;
          }
        }

        totalSuccessCount += successCount;
        totalFailCount += failCount;

        // Log automation completion per workspace
        await logChange({
          event_type: 'automation_triggered',
          action: 'Overdue escalation reminders completed',
          description: `Overdue escalation reminders completed for ${workspace.name}: ${successCount} emails sent successfully, ${failCount} failed`,
          target_type: 'automation',
          metadata: {
            automation_type: 'overdue_escalation_reminders',
            success_count: successCount,
            fail_count: failCount,
            total_tasks: tasks.length,
            completed_at: new Date().toISOString()
          },
          workspaceId: workspace._id
        });
      } catch (workspaceError) {
        // Log workspace-specific error
        await logChange({
          event_type: 'automation_triggered',
          action: 'Overdue escalation reminders failed',
          description: `Overdue escalation reminders failed for ${workspace.name}: ${workspaceError.message}`,
          target_type: 'automation',
          metadata: {
            automation_type: 'overdue_escalation_reminders',
            error: workspaceError.message,
            failed_at: new Date().toISOString()
          },
          workspaceId: workspace._id
        });
      }
    }

  } catch (error) {
  }
};

// Send notifications for tasks due today
const sendTodayDueNotifications = async () => {
  try {
    // WORKSPACE SUPPORT: Get all workspaces
    const workspaces = await Workspace.find({});

    let totalSuccessCount = 0;
    let totalFailCount = 0;
    let totalTasksCount = 0;

    // Process each workspace separately
    for (const workspace of workspaces) {
      try {
        // Log automation trigger per workspace
        await logChange({
          event_type: 'automation_triggered',
          action: 'Today due notifications automation',
          description: `System triggered automatic today due notifications for ${workspace.name}`,
          target_type: 'automation',
          metadata: {
            automation_type: 'today_due_notifications',
            triggered_at: new Date().toISOString()
          },
          workspaceId: workspace._id
        });

        // Calculate today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);



        // Get all tasks due today in this workspace
        const tasks = await Task.find({
          workspaceId: workspace._id,
          due_date: {
            $gte: today,
            $lt: tomorrow
          },
          status: { $ne: 'done' }
        })
        .populate('assigned_to', 'full_name email')
        .populate('team_id', 'name');

        if (tasks.length === 0) {
          continue;
        }

        totalTasksCount += tasks.length;

        // Group tasks by user
        const userTasksMap = new Map();

        tasks.forEach(task => {
          if (task.assigned_to && task.assigned_to.length > 0) {
            task.assigned_to.forEach(user => {
              if (user.email) {
                if (!userTasksMap.has(user.email)) {
                  userTasksMap.set(user.email, {
                    fullName: user.full_name,
                    email: user.email,
                    tasks: []
                  });
                }

                userTasksMap.get(user.email).tasks.push({
                  _id: task._id,
                  title: task.title,
                  description: task.description,
                  priority: task.priority,
                  due_date: task.due_date
                });
              }
            });
          }
        });

        // Send email to each user with their tasks due today
        let successCount = 0;
        let failCount = 0;

        for (const [email, userData] of userTasksMap.entries()) {
          try {
            const result = await sendDueDateNotification(
              userData.fullName,
              userData.email,
              userData.tasks,
              'today'
            );

            if (result.success) {
              successCount++;
            } else {
              failCount++;
            }
          } catch (error) {
            failCount++;
          }
        }

        totalSuccessCount += successCount;
        totalFailCount += failCount;

        // Log automation completion per workspace
        await logChange({
          event_type: 'automation_triggered',
          action: 'Today due notifications completed',
          description: `Today due notifications completed for ${workspace.name}: ${successCount} emails sent successfully, ${failCount} failed`,
          target_type: 'automation',
          metadata: {
            automation_type: 'today_due_notifications',
            success_count: successCount,
            fail_count: failCount,
            total_tasks: tasks.length,
            completed_at: new Date().toISOString()
          },
          workspaceId: workspace._id
        });
      } catch (workspaceError) {
        // Log workspace-specific error
        await logChange({
          event_type: 'automation_triggered',
          action: 'Today due notifications failed',
          description: `Today due notifications failed for ${workspace.name}: ${workspaceError.message}`,
          target_type: 'automation',
          metadata: {
            automation_type: 'today_due_notifications',
            error: workspaceError.message,
            failed_at: new Date().toISOString()
          },
          workspaceId: workspace._id
        });
      }
    }

  } catch (error) {
  }
};

// Send overdue task reminders to users
const sendOverdueReminders = async () => {
  try {
    
    // WORKSPACE SUPPORT: Get all workspaces
    const workspaces = await Workspace.find({});
    
    let totalSuccessCount = 0;
    let totalFailCount = 0;
    let totalTasksCount = 0;

    // Process each workspace separately
    for (const workspace of workspaces) {
      try {
        
        // Log automation trigger per workspace
        await logChange({
          event_type: 'automation_triggered',
          action: 'Overdue task reminders automation',
          description: `System triggered automatic overdue task reminder emails for ${workspace.name}`,
          target_type: 'automation',
          metadata: {
            automation_type: 'overdue_reminders',
            triggered_at: new Date().toISOString()
          },
          workspaceId: workspace._id
        });

        // Get all tasks that are overdue in this workspace
        const tasks = await Task.find({
          workspaceId: workspace._id,
          due_date: { $lt: new Date() },
          status: { $ne: 'done' }
        })
        .populate('assigned_to', 'full_name email')
        .populate('team_id', 'name');

        if (tasks.length === 0) {
          continue;
        }

        totalTasksCount += tasks.length;

    // Group tasks by user
    const userTasksMap = new Map();
    
    tasks.forEach(task => {
      if (task.assigned_to && task.assigned_to.length > 0) {
        task.assigned_to.forEach(user => {
          if (user.email) {
            if (!userTasksMap.has(user.email)) {
              userTasksMap.set(user.email, {
                fullName: user.full_name,
                email: user.email,
                tasks: []
              });
            }
            
            const daysOverdue = Math.abs(calculateDaysUntilDue(task.due_date));
            userTasksMap.get(user.email).tasks.push({
              title: task.title,
              priority: task.priority,
              due_date: task.due_date,
              daysOverdue: daysOverdue
            });
          }
        });
      }
    });

    // Send email to each user with their overdue tasks
    let successCount = 0;
    let failCount = 0;

    for (const [email, userData] of userTasksMap.entries()) {
      try {
        const result = await sendOverdueTaskReminder(
          userData.fullName,
          userData.email,
          userData.tasks
        );
        
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
      }
    }

        
        totalSuccessCount += successCount;
        totalFailCount += failCount;
        
        // Log automation completion per workspace
        await logChange({
          event_type: 'automation_triggered',
          action: 'Overdue reminders completed',
          description: `Overdue reminder automation completed for ${workspace.name}: ${successCount} emails sent successfully, ${failCount} failed`,
          target_type: 'automation',
          metadata: {
            automation_type: 'overdue_reminders',
            success_count: successCount,
            fail_count: failCount,
            total_tasks: tasks.length,
            completed_at: new Date().toISOString()
          },
          workspaceId: workspace._id
        });
      } catch (workspaceError) {
        
        // Log workspace-specific error
        await logChange({
          event_type: 'automation_triggered',
          action: 'Overdue reminders failed',
          description: `Overdue reminder automation failed for ${workspace.name}: ${workspaceError.message}`,
          target_type: 'automation',
          metadata: {
            automation_type: 'overdue_reminders',
            error: workspaceError.message,
            failed_at: new Date().toISOString()
          },
          workspaceId: workspace._id
        });
      }
    }

  } catch (error) {
  }
};

// Generate and send weekly reports to admins
const sendWeeklyReports = async () => {
  try {
    
    // WORKSPACE SUPPORT: Get all workspaces
    const workspaces = await Workspace.find({});
    
    let totalSuccessCount = 0;
    let totalFailCount = 0;

    // Process each workspace separately
    for (const workspace of workspaces) {
      try {
        
        // Log automation trigger per workspace
        await logChange({
          event_type: 'automation_triggered',
          action: 'Weekly reports automation',
          description: `System triggered automatic weekly report generation for ${workspace.name}`,
          target_type: 'automation',
          metadata: {
            automation_type: 'weekly_reports',
            triggered_at: new Date().toISOString()
          },
          workspaceId: workspace._id
        });
        
        // Get all tasks from the last 7 days in this workspace
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const allTasks = await Task.find({ workspaceId: workspace._id })
          .populate('assigned_to', 'full_name email')
          .populate('team_id', 'name')
          .populate('created_by', 'full_name');

    const weekTasks = allTasks.filter(task => 
      new Date(task.created_at) >= sevenDaysAgo
    );


    // Calculate analytics
    const overdueTasks = allTasks.filter(isTaskOverdue);
    const completedTasks = allTasks.filter(task => task.status === 'done');
    const inProgressTasks = allTasks.filter(task => task.status === 'in_progress');
    const todoTasks = allTasks.filter(task => task.status === 'todo');
    const reviewTasks = allTasks.filter(task => task.status === 'review');

    // Get unique teams and users
    const uniqueTeams = new Set(allTasks.map(t => t.team_id?.name).filter(Boolean));
    const uniqueUsers = new Set();
    allTasks.forEach(task => {
      if (task.assigned_to) {
        task.assigned_to.forEach(user => uniqueUsers.add(user._id.toString()));
      }
    });

    // Calculate team performance metrics
    const teamStats = {};
    const userStats = {};

    allTasks.forEach(task => {
      // Team stats
      const teamName = task.team_id?.name || 'No Team';
      if (!teamStats[teamName]) {
        teamStats[teamName] = { total: 0, completed: 0, overdue: 0 };
      }
      teamStats[teamName].total++;
      if (task.status === 'done') teamStats[teamName].completed++;
      if (isTaskOverdue(task)) teamStats[teamName].overdue++;

      // User stats
      if (task.assigned_to && task.assigned_to.length > 0) {
        task.assigned_to.forEach(user => {
          const userId = user._id.toString();
          if (!userStats[userId]) {
            userStats[userId] = {
              name: user.full_name,
              total: 0,
              completed: 0,
              overdue: 0,
              inProgress: 0
            };
          }
          userStats[userId].total++;
          if (task.status === 'done') userStats[userId].completed++;
          if (task.status === 'in_progress') userStats[userId].inProgress++;
          if (isTaskOverdue(task)) userStats[userId].overdue++;
        });
      }
    });

    // Calculate completion trends (compare with previous week)
    const previousWeekStart = new Date(sevenDaysAgo);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);

    const previousWeekTasks = await Task.find({
      workspaceId: workspace._id,
      created_at: { $gte: previousWeekStart, $lt: sevenDaysAgo }
    });

    const previousWeekCompleted = previousWeekTasks.filter(task => task.status === 'done').length;
    const currentWeekCompleted = weekTasks.filter(task => task.status === 'done').length;

    const completionTrend = previousWeekCompleted > 0
      ? (((currentWeekCompleted - previousWeekCompleted) / previousWeekCompleted) * 100).toFixed(1)
      : currentWeekCompleted > 0 ? '100.0' : '0.0';

    // Calculate priority distribution
    const priorityStats = {
      urgent: allTasks.filter(t => t.priority === 'urgent').length,
      high: allTasks.filter(t => t.priority === 'high').length,
      medium: allTasks.filter(t => t.priority === 'medium').length,
      low: allTasks.filter(t => t.priority === 'low').length
    };

    // Top performers (users with highest completion rate)
    const topPerformers = Object.values(userStats)
      .filter(user => user.total > 0)
      .map(user => ({
        name: user.name,
        completionRate: ((user.completed / user.total) * 100).toFixed(1),
        totalTasks: user.total,
        completedTasks: user.completed
      }))
      .sort((a, b) => parseFloat(b.completionRate) - parseFloat(a.completionRate))
      .slice(0, 5);

    // Team performance
    const teamPerformance = Object.entries(teamStats)
      .filter(([teamName]) => teamName !== 'No Team')
      .map(([teamName, stats]) => ({
        name: teamName,
        completionRate: stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : '0.0',
        totalTasks: stats.total,
        completedTasks: stats.completed,
        overdueTasks: stats.overdue
      }))
      .sort((a, b) => parseFloat(b.completionRate) - parseFloat(a.completionRate));

    const analytics = {
      totalTasks: allTasks.length,
      completedTasks: completedTasks.length,
      inProgressTasks: inProgressTasks.length,
      overdueTasks: overdueTasks.length,
      activeTeams: uniqueTeams.size,
      activeUsers: uniqueUsers.size,
      statusDistribution: [
        { name: 'Todo', value: todoTasks.length },
        { name: 'In Progress', value: inProgressTasks.length },
        { name: 'Review', value: reviewTasks.length },
        { name: 'Done', value: completedTasks.length },
      ],
      priorityDistribution: [
        { name: 'Urgent', value: priorityStats.urgent },
        { name: 'High', value: priorityStats.high },
        { name: 'Medium', value: priorityStats.medium },
        { name: 'Low', value: priorityStats.low }
      ],
      completionTrend,
      topPerformers,
      teamPerformance,
      weeklyCreatedTasks: weekTasks.length,
      previousWeekCompleted: previousWeekCompleted
    };

    const completionRate = analytics.totalTasks > 0
      ? ((analytics.completedTasks / analytics.totalTasks) * 100).toFixed(1)
      : '0.0';

    // Generate reports
    const excelBuffer = await generateExcelReport(allTasks, analytics);
    
    const pdfBuffer = generatePDFReport(allTasks, analytics);

    const now = new Date();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekRange = `${weekStart.toLocaleDateString()} - ${now.toLocaleDateString()}`;

    // Prepare report data for email
    const reportData = {
      weekRange,
      totalTasks: analytics.totalTasks,
      completedTasks: analytics.completedTasks,
      inProgressTasks: analytics.inProgressTasks,
      overdueTasks: analytics.overdueTasks,
      completionRate: completionRate,
      activeTeams: analytics.activeTeams,
      activeUsers: analytics.activeUsers,
      completionTrend: analytics.completionTrend,
      weeklyCreatedTasks: analytics.weeklyCreatedTasks,
      topPerformers: analytics.topPerformers,
      teamPerformance: analytics.teamPerformance,
      statusDistribution: analytics.statusDistribution,
      priorityDistribution: analytics.priorityDistribution
    };

    // Prepare attachments
    const timestamp = now.toISOString().slice(0, 10);
    const attachments = [
      {
        filename: `TaskFlow_Report_${timestamp}.xlsx`,
        content: Buffer.from(excelBuffer),
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      },
      {
        filename: `TaskFlow_Report_${timestamp}.pdf`,
        content: Buffer.from(pdfBuffer),
        contentType: 'application/pdf'
      }
    ];

        // Get all admin and HR users in this workspace
        const admins = await User.find({
          workspaceId: workspace._id,
          role: { $in: ['admin', 'hr'] },
          email: { $exists: true, $ne: '' }
        });

        if (admins.length === 0) {
          continue;
        }

    let successCount = 0;
    let failCount = 0;

    for (const admin of admins) {
      try {
        const result = await sendWeeklyReport(
          admin.full_name,
          admin.email,
          reportData,
          attachments
        );
        
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
      }
    }

        
        totalSuccessCount += successCount;
        totalFailCount += failCount;
        
        // Log report generation and distribution per workspace
        await logChange({
          event_type: 'report_generated',
          action: 'Weekly reports generated and sent',
          description: `Weekly reports generated for ${workspace.name}: ${successCount} recipients received reports, ${failCount} failed`,
          target_type: 'report',
          metadata: {
            report_type: 'weekly_summary',
            success_count: successCount,
            fail_count: failCount,
            total_tasks: allTasks.length,
            completed_tasks: analytics.completedTasks,
            completion_rate: completionRate,
            week_range: weekRange,
            completed_at: new Date().toISOString()
          },
          workspaceId: workspace._id
        });
      } catch (workspaceError) {
        
        // Log workspace-specific error
        await logChange({
          event_type: 'automation_triggered',
          action: 'Weekly reports failed',
          description: `Weekly report generation failed for ${workspace.name}: ${workspaceError.message}`,
          target_type: 'automation',
          metadata: {
            automation_type: 'weekly_reports',
            error: workspaceError.message,
            failed_at: new Date().toISOString()
          },
          workspaceId: workspace._id
        });
      }
    }

  } catch (error) {
  }
};

// Manual trigger functions (for testing)
export const triggerOverdueReminders = async () => {
  await sendOverdueReminders();
};

export const triggerWeeklyReports = async () => {
  await sendWeeklyReports();
};

export const triggerDailyAdminReports = async () => {
  await sendDailyAdminReports();
};

export const triggerTomorrowDueNotifications = async () => {
  await sendTomorrowDueNotifications();
};

export const triggerTodayDueNotifications = async () => {
  await sendTodayDueNotifications();
};

export const triggerOverdueEscalationReminders = async () => {
  await sendOverdueEscalationReminders();
};

export const triggerProcessScheduledCampaigns = async () => {
  await processScheduledCampaigns();
};

// Process scheduled email campaigns
const processScheduledCampaigns = async () => {
  try {
    const now = new Date();

    // Find campaigns that are due to be sent
    const dueCampaigns = await ScheduledEmailCampaign.find({
      status: 'scheduled',
      scheduledDate: { $lte: now }
    }).populate('workspaceId', 'name');

    if (dueCampaigns.length === 0) {
      return;
    }

    for (const campaign of dueCampaigns) {
      try {
        // Update status to processing
        campaign.status = 'processing';
        await campaign.save();

        let successCount = 0;
        let failCount = 0;

        // Send to each recipient
        for (const recipient of campaign.recipients) {
          try {
            // Merge global and recipient-specific variables
            const mergedVariables = {
              ...campaign.variables,
              ...recipient.variables
            };

            // Interpolate variables in subject and content
            const interpolatedSubject = brevoService.interpolateVariables(campaign.subject, mergedVariables);
            const interpolatedHtml = brevoService.interpolateVariables(campaign.htmlContent, mergedVariables);

            const result = await brevoService.send({
              to: recipient.email,
              subject: interpolatedSubject,
              htmlContent: interpolatedHtml,
              params: mergedVariables,
              from: {
                name: 'TaskFlow',
                email: process.env.EMAIL_FROM || 'updates.codecatalyst@gmail.com'
              },
              useLayout: false
            });

            if (result.success) {
              successCount++;
            } else {
              failCount++;
            }
          } catch (error) {
            failCount++;
          }
        }

        // Update campaign status and counts
        campaign.status = failCount === 0 ? 'sent' : (successCount > 0 ? 'sent' : 'failed');
        campaign.sentAt = new Date();
        campaign.sentCount = successCount;
        campaign.failedCount = failCount;

        // Handle recurring campaigns
        if (campaign.scheduleType === 'recurring' && successCount > 0) {
          const nextScheduledDate = calculateNextOccurrence(campaign);
          if (nextScheduledDate) {
            // Create a new campaign instance for the next occurrence
            const newCampaign = new ScheduledEmailCampaign({
              ...campaign.toObject(),
              _id: undefined,
              scheduledDate: nextScheduledDate,
              status: 'scheduled',
              sentAt: undefined,
              sentCount: 0,
              failedCount: 0,
              created_at: new Date(),
              updated_at: new Date()
            });
            await newCampaign.save();
          }
        }

        await campaign.save();

        // Log the campaign execution
        await logChange({
          event_type: 'automation_triggered',
          action: 'scheduled_campaign_executed',
          description: `Scheduled email campaign "${campaign.title}" executed: ${successCount} sent, ${failCount} failed`,
          target_type: 'scheduled_email_campaign',
          metadata: {
            campaignId: campaign._id,
            success_count: successCount,
            fail_count: failCount,
            total_recipients: campaign.totalRecipients
          },
          workspaceId: campaign.workspaceId
        });

      } catch (campaignError) {
        // Mark campaign as failed
        campaign.status = 'failed';
        await campaign.save();
      }
    }

  } catch (error) {
  }
};

// Helper function to calculate next occurrence for recurring campaigns
const calculateNextOccurrence = (campaign) => {
  const currentDate = campaign.scheduledDate;
  const recurrence = campaign.recurrence;

  if (!recurrence) return null;

  let nextDate = new Date(currentDate);

  switch (recurrence.frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + recurrence.interval);
      break;
    case 'weekly':
      if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
        // Find next day of week
        const currentDay = nextDate.getDay();
        const targetDays = recurrence.daysOfWeek.sort((a, b) => a - b);

        for (const targetDay of targetDays) {
          if (targetDay > currentDay) {
            nextDate.setDate(nextDate.getDate() + (targetDay - currentDay));
            return nextDate;
          }
        }

        // If no day found this week, go to next week
        const nextWeekDay = targetDays[0];
        nextDate.setDate(nextDate.getDate() + (7 - currentDay + nextWeekDay));
      } else {
        nextDate.setDate(nextDate.getDate() + (7 * recurrence.interval));
      }
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + recurrence.interval);
      if (recurrence.dayOfMonth) {
        nextDate.setDate(recurrence.dayOfMonth);
      }
      break;
    default:
      return null;
  }

  // Check if we've exceeded the end date
  if (recurrence.endDate && nextDate > recurrence.endDate) {
    return null;
  }

  return nextDate;
};

export default {
  initializeScheduler,
  triggerOverdueReminders,
  triggerWeeklyReports,
  triggerDailyAdminReports,
  triggerTomorrowDueNotifications,
  triggerTodayDueNotifications,
  triggerOverdueEscalationReminders,
  triggerProcessScheduledCampaigns
};
