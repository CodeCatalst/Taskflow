import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useTheme } from '../context/ThemeContext';
import ResponsivePageLayout from '../components/layouts/ResponsivePageLayout';
import {
  Mail, Clock, CheckCircle, XCircle, AlertTriangle,
  Settings, Calendar, Users, TrendingUp, Activity,
  Zap, BarChart3, Send, Pause, Play, RefreshCw
} from 'lucide-react';

export default function EmailAutomationDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { currentTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [automationStats, setAutomationStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [scheduledCampaigns, setScheduledCampaigns] = useState([]);
  const [triggering, setTriggering] = useState({});

  // Automation configurations
  const automations = [
    {
      id: 'daily_admin_reports',
      name: 'Daily Admin Reports',
      description: 'Morning summary of tasks due today and overdue tasks',
      schedule: 'Daily at 8:00 AM',
      icon: BarChart3,
      status: 'active',
      lastRun: null,
      nextRun: '2024-01-15T08:00:00Z'
    },
    {
      id: 'tomorrow_due_notifications',
      name: 'Tomorrow Due Notifications',
      description: 'Reminders for tasks due tomorrow',
      schedule: 'Daily at 6:00 PM',
      icon: Clock,
      status: 'active',
      lastRun: null,
      nextRun: '2024-01-14T18:00:00Z'
    },
    {
      id: 'today_due_notifications',
      name: 'Today Due Notifications',
      description: 'Reminders for tasks due today',
      schedule: 'Daily at 8:00 AM',
      icon: AlertTriangle,
      status: 'active',
      lastRun: null,
      nextRun: '2024-01-15T08:00:00Z'
    },
    {
      id: 'overdue_reminders',
      name: 'Overdue Task Reminders',
      description: 'Reminders for overdue tasks',
      schedule: 'Daily at 9:00 AM',
      icon: XCircle,
      status: 'active',
      lastRun: null,
      nextRun: '2024-01-15T09:00:00Z'
    },
    {
      id: 'overdue_escalation',
      name: 'Overdue Escalation',
      description: 'Follow-up reminders for tasks overdue by 3+ days',
      schedule: 'Daily at 10:00 AM',
      icon: TrendingUp,
      status: 'active',
      lastRun: null,
      nextRun: '2024-01-15T10:00:00Z'
    },
    {
      id: 'weekly_reports',
      name: 'Weekly Admin Reports',
      description: 'Comprehensive weekly performance reports',
      schedule: 'Monday at 8:00 AM',
      icon: Calendar,
      status: 'active',
      lastRun: null,
      nextRun: '2024-01-22T08:00:00Z'
    }
  ];

  useEffect(() => {
    fetchAutomationData();
  }, [currentWorkspace]);

  const triggerAutomation = async (automationType) => {
    setTriggering(prev => ({ ...prev, [automationType]: true }));
    try {
      const endpointMap = {
        daily_reports: 'daily-reports',
        today_notifications: 'today-notifications',
        tomorrow_notifications: 'tomorrow-notifications',
        overdue_reminders: 'overdue-reminders',
        escalation_reminders: 'escalation-reminders',
        weekly_reports: 'weekly-reports',
        scheduled_campaigns: 'scheduled-campaigns'
      };

      const response = await api.post(`/api/automation/manual/${endpointMap[automationType]}`);
      if (response.data.success) {
        alert(`✅ ${automationType.replace('_', ' ').toUpperCase()} triggered successfully!`);
        fetchAutomationData(); // Refresh the data
      }
    } catch (error) {
      alert(`❌ Failed to trigger automation: ${error.response?.data?.error || error.message}`);
    } finally {
      setTriggering(prev => ({ ...prev, [automationType]: false }));
    }
  };

  const fetchAutomationData = async () => {
    setLoading(true);
    try {
      const [logsResponse, campaignsResponse] = await Promise.all([
        api.get('/api/changelog?entity=automation&page=1&limit=10').catch(() => ({ data: { logs: [] } })),
        api.get('/api/hr/scheduled-campaigns?page=1&limit=5').catch(() => ({ data: { campaigns: [] } }))
      ]);

      setRecentLogs(logsResponse.data.logs || []);
      setScheduledCampaigns(campaignsResponse.data.campaigns || []);

      setAutomationStats({
        totalEmailsSent: 1247,
        activeAutomations: 6,
        scheduledCampaigns: campaignsResponse.data.campaigns?.length || 0,
        successRate: 98.5
      });

    } catch (error) {
      console.error('Failed to fetch automation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-500 bg-green-50 dark:bg-green-900/20';
      case 'inactive': return 'text-gray-500 bg-gray-50 dark:bg-gray-900/20';
      case 'error': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      default: return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <ResponsivePageLayout title="Email Automation" subtitle="Manage automated email workflows">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className={currentTheme.textSecondary}>Loading automation dashboard...</p>
          </div>
        </div>
      </ResponsivePageLayout>
    );
  }

  return (
    <ResponsivePageLayout
      title="Email Automation"
      subtitle="Manage automated email workflows and monitor performance"
    >
      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className={`${currentTheme.surface} p-6 rounded-2xl border ${currentTheme.border} shadow-sm`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-blue-600">{automationStats?.totalEmailsSent || 0}</p>
                <p className={`text-sm ${currentTheme.textSecondary}`}>Emails Sent</p>
              </div>
            </div>
          </div>

          <div className={`${currentTheme.surface} p-6 rounded-2xl border ${currentTheme.border} shadow-sm`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-green-600">{automationStats?.activeAutomations || 0}</p>
                <p className={`text-sm ${currentTheme.textSecondary}`}>Active Automations</p>
              </div>
            </div>
          </div>

          <div className={`${currentTheme.surface} p-6 rounded-2xl border ${currentTheme.border} shadow-sm`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-purple-600">{automationStats?.scheduledCampaigns || 0}</p>
                <p className={`text-sm ${currentTheme.textSecondary}`}>Scheduled Campaigns</p>
              </div>
            </div>
          </div>

          <div className={`${currentTheme.surface} p-6 rounded-2xl border ${currentTheme.border} shadow-sm`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-green-600">{automationStats?.successRate || 0}%</p>
                <p className={`text-sm ${currentTheme.textSecondary}`}>Success Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Automations */}
        <div className={`${currentTheme.surface} rounded-2xl border ${currentTheme.border} shadow-sm`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-black ${currentTheme.text}`}>Active Automations</h3>
                <p className={currentTheme.textSecondary}>Automated email workflows running in your workspace</p>
              </div>
              <button
                onClick={() => navigate('/email-preferences')}
                className={`px-4 py-2 text-sm font-bold rounded-xl border ${currentTheme.border} ${currentTheme.surface} ${currentTheme.text} hover:bg-gray-50 dark:hover:bg-gray-800`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Preferences
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {automations.map((automation) => {
              const IconComponent = automation.icon;
              return (
                <div key={automation.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${getStatusColor(automation.status)}`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-bold ${currentTheme.text} mb-1`}>{automation.name}</h4>
                        <p className={`text-sm ${currentTheme.textSecondary} mb-2`}>{automation.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {automation.schedule}
                          </span>
                          <span className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            Next: {formatDateTime(automation.nextRun)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      automation.status === 'active'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400'
                    }`}>
                      {automation.status}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scheduled Campaigns & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scheduled Campaigns */}
          <div className={`${currentTheme.surface} rounded-2xl border ${currentTheme.border} shadow-sm`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-lg font-black ${currentTheme.text}`}>Scheduled Campaigns</h3>
                  <p className={currentTheme.textSecondary}>Upcoming bulk email campaigns</p>
                </div>
                <button
                  onClick={() => navigate('/scheduled-campaigns')}
                  className="px-4 py-2 bg-blue-500 text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-colors"
                >
                  Manage Campaigns
                </button>
              </div>
            </div>

            <div className="p-6">
              {scheduledCampaigns.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className={`w-12 h-12 mx-auto mb-4 ${currentTheme.textSecondary}`} />
                  <p className={`font-medium ${currentTheme.text}`}>No scheduled campaigns</p>
                  <p className={`text-sm ${currentTheme.textSecondary}`}>Create automated email campaigns</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scheduledCampaigns.slice(0, 3).map((campaign) => (
                    <div key={campaign._id} className={`p-4 rounded-xl border ${currentTheme.border} ${currentTheme.surface}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={`font-bold ${currentTheme.text} mb-1`}>{campaign.title}</h4>
                          <p className={`text-sm ${currentTheme.textSecondary} mb-2`}>{campaign.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{campaign.totalRecipients} recipients</span>
                            <span>Scheduled: {formatDateTime(campaign.scheduledDate)}</span>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-bold ${
                          campaign.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                          campaign.status === 'sent' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {campaign.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className={`${currentTheme.surface} rounded-2xl border ${currentTheme.border} shadow-sm`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-lg font-black ${currentTheme.text}`}>Recent Activity</h3>
                  <p className={currentTheme.textSecondary}>Latest automation executions</p>
                </div>
                <button
                  onClick={fetchAutomationData}
                  className={`p-2 rounded-xl ${currentTheme.surfaceSecondary} hover:bg-gray-100 dark:hover:bg-gray-700`}
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {recentLogs.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className={`w-12 h-12 mx-auto mb-4 ${currentTheme.textSecondary}`} />
                  <p className={`font-medium ${currentTheme.text}`}>No recent activity</p>
                  <p className={`text-sm ${currentTheme.textSecondary}`}>Automation logs will appear here</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentLogs.map((log) => (
                    <div key={log._id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className={`font-medium ${currentTheme.text} mb-1`}>{log.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(log.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                            log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {log.status || 'completed'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ResponsivePageLayout>
  );
}