import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useTheme } from '../context/ThemeContext';
import ResponsivePageLayout from '../components/layouts/ResponsivePageLayout';
import ConfirmModal from '../components/modals/ConfirmModal';
import { useConfirmModal } from '../hooks/useConfirmModal';
import {
  Settings, Bell, Mail, Clock, Save, RotateCcw,
  CheckCircle, XCircle, AlertTriangle, Calendar
} from 'lucide-react';

export default function EmailPreferences() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const { currentTheme } = useTheme();
  const confirmModal = useConfirmModal();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    dueDateReminders: {
      enabled: true,
      tomorrowReminders: true,
      todayReminders: true,
      overdueEscalation: true
    },
    taskNotifications: {
      enabled: true,
      assignmentNotifications: true,
      statusUpdateNotifications: true,
      commentNotifications: true
    },
    adminReports: {
      enabled: false,
      dailyReports: true,
      weeklyReports: true
    },
    emailFrequency: 'immediate',
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00'
    }
  });

  useEffect(() => {
    fetchPreferences();
  }, [currentWorkspace]);

  const fetchPreferences = async () => {
    try {
      const response = await api.get('/user/email-preferences');
      if (response.data && response.data.preferences) {
        setPreferences(response.data.preferences);
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      // Optimistically update local state immediately
      const previousPreferences = { ...preferences };

      const response = await api.put('/user/email-preferences', preferences);
      setPreferences(response.data.preferences);

      await confirmModal.show({
        title: 'Preferences Saved',
        message: 'Your email notification preferences have been updated successfully.',
        confirmText: 'OK',
        variant: 'success'
      });
    } catch (error) {
      alert('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };



  const handleResetToDefaults = async () => {
    const confirmed = await confirmModal.show({
      title: 'Reset Preferences',
      message: 'Are you sure you want to reset all preferences to their default values?',
      confirmText: 'Reset',
      cancelText: 'Cancel',
      variant: 'warning'
    });

    if (confirmed) {
      try {
        const response = await api.post('/user/email-preferences/reset');
        setPreferences(response.data.preferences);
      } catch (error) {
        alert('Failed to reset preferences');
      }
    }
  };


  const updatePreference = (category, key, value) => {
    console.log(`Updating preference ${category}.${key} to ${value}`);
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const updateNestedPreference = (category, subcategory, key, value) => {
    console.log(`Updating nested preference ${category}.${subcategory}.${key} to ${value}`);
    setPreferences(prev => {
      const categoryData = prev[category] || {};
      const subcategoryData = categoryData[subcategory] || {};

      return {
        ...prev,
        [category]: {
          ...categoryData,
          [subcategory]: {
            ...subcategoryData,
            [key]: value
          }
        }
      };
    });
  };

  if (loading) {
    return (
      <ResponsivePageLayout title="Email Preferences" subtitle="Configure your notification settings">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Settings className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className={currentTheme.textSecondary}>Loading preferences...</p>
          </div>
        </div>
      </ResponsivePageLayout>
    );
  }

  return (
    <ResponsivePageLayout
      title="Email Preferences"
      subtitle="Configure your notification settings and preferences"
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Due Date Reminders */}
        <div className={`${currentTheme.surface} rounded-2xl border ${currentTheme.border} shadow-sm overflow-hidden`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${currentTheme.text}`}>Due Date Reminders</h3>
                <p className={currentTheme.textSecondary}>Notifications about upcoming and overdue tasks</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className={`font-medium ${currentTheme.text} flex items-center gap-2`}>
                  <Bell className="w-4 h-4" />
                  Enable Due Date Reminders
                </label>
                <p className={`text-sm ${currentTheme.textSecondary} mt-1`}>
                  Receive automated reminders about task deadlines
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.dueDateReminders.enabled}
                  onChange={(e) => updateNestedPreference('dueDateReminders', 'enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {preferences.dueDateReminders.enabled && (
              <div className="space-y-4 ml-6 border-l-2 border-gray-200 dark:border-gray-700 pl-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className={`font-medium ${currentTheme.text}`}>Tomorrow's Due Tasks</label>
                    <p className={`text-sm ${currentTheme.textSecondary}`}>Reminders sent at 6:00 PM for tasks due tomorrow</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.dueDateReminders.tomorrowReminders}
                    onChange={(e) => updateNestedPreference('dueDateReminders', 'tomorrowReminders', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className={`font-medium ${currentTheme.text}`}>Today's Due Tasks</label>
                    <p className={`text-sm ${currentTheme.textSecondary}`}>Reminders sent at 8:00 AM for tasks due today</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.dueDateReminders.todayReminders}
                    onChange={(e) => updateNestedPreference('dueDateReminders', 'todayReminders', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className={`font-medium ${currentTheme.text}`}>Overdue Escalation</label>
                    <p className={`text-sm ${currentTheme.textSecondary}`}>Follow-up reminders for tasks overdue by 3+ days</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.dueDateReminders.overdueEscalation}
                    onChange={(e) => updateNestedPreference('dueDateReminders', 'overdueEscalation', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Task Notifications */}
        <div className={`${currentTheme.surface} rounded-2xl border ${currentTheme.border} shadow-sm overflow-hidden`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${currentTheme.text}`}>Task Notifications</h3>
                <p className={currentTheme.textSecondary}>Notifications about task activities and updates</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className={`font-medium ${currentTheme.text} flex items-center gap-2`}>
                  <Mail className="w-4 h-4" />
                  Enable Task Notifications
                </label>
                <p className={`text-sm ${currentTheme.textSecondary} mt-1`}>
                  Receive notifications about task assignments and updates
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.taskNotifications.enabled}
                  onChange={(e) => updateNestedPreference('taskNotifications', 'enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {preferences.taskNotifications.enabled && (
              <div className="space-y-4 ml-6 border-l-2 border-gray-200 dark:border-gray-700 pl-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className={`font-medium ${currentTheme.text}`}>Task Assignments</label>
                    <p className={`text-sm ${currentTheme.textSecondary}`}>When you're assigned to a new task</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.taskNotifications.assignmentNotifications}
                    onChange={(e) => updateNestedPreference('taskNotifications', 'assignmentNotifications', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className={`font-medium ${currentTheme.text}`}>Status Updates</label>
                    <p className={`text-sm ${currentTheme.textSecondary}`}>When task status changes</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.taskNotifications.statusUpdateNotifications}
                    onChange={(e) => updateNestedPreference('taskNotifications', 'statusUpdateNotifications', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className={`font-medium ${currentTheme.text}`}>Comments</label>
                    <p className={`text-sm ${currentTheme.textSecondary}`}>When someone comments on your tasks</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.taskNotifications.commentNotifications}
                    onChange={(e) => updateNestedPreference('taskNotifications', 'commentNotifications', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Admin Reports (Only for admins) */}
        {(user.role === 'admin' || user.role === 'hr') && (
          <div className={`${currentTheme.surface} rounded-2xl border ${currentTheme.border} shadow-sm overflow-hidden`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${currentTheme.text}`}>Admin Reports</h3>
                  <p className={currentTheme.textSecondary}>Automated reports and analytics</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className={`font-medium ${currentTheme.text} flex items-center gap-2`}>
                    <AlertTriangle className="w-4 h-4" />
                    Enable Admin Reports
                  </label>
                  <p className={`text-sm ${currentTheme.textSecondary} mt-1`}>
                    Receive automated workspace reports and analytics
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.adminReports.enabled}
                    onChange={(e) => updateNestedPreference('adminReports', 'enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {preferences.adminReports.enabled && (
                <div className="space-y-4 ml-6 border-l-2 border-gray-200 dark:border-gray-700 pl-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className={`font-medium ${currentTheme.text}`}>Daily Reports</label>
                      <p className={`text-sm ${currentTheme.textSecondary}`}>Morning summary of workspace activity</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.adminReports.dailyReports}
                      onChange={(e) => updateNestedPreference('adminReports', 'dailyReports', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className={`font-medium ${currentTheme.text}`}>Weekly Reports</label>
                      <p className={`text-sm ${currentTheme.textSecondary}`}>Comprehensive weekly analytics</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.adminReports.weeklyReports}
                      onChange={(e) => updateNestedPreference('adminReports', 'weeklyReports', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Email Frequency & Quiet Hours */}
        <div className={`${currentTheme.surface} rounded-2xl border ${currentTheme.border} shadow-sm overflow-hidden`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${currentTheme.text}`}>Delivery Settings</h3>
                <p className={currentTheme.textSecondary}>Control when and how often you receive notifications</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className={`block font-medium ${currentTheme.text} mb-2`}>Email Frequency</label>
              <select
                value={preferences.emailFrequency}
                onChange={(e) => updatePreference('emailFrequency', e.target.value)}
                className={`w-full px-4 py-2 border ${currentTheme.border} rounded-xl ${currentTheme.surface} ${currentTheme.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <option value="immediate">Immediate (Real-time)</option>
                <option value="daily">Daily Digest</option>
                <option value="weekly">Weekly Digest</option>
              </select>
              <p className={`text-sm ${currentTheme.textSecondary} mt-1`}>
                How often to send batched notifications
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className={`font-medium ${currentTheme.text} flex items-center gap-2`}>
                    <Clock className="w-4 h-4" />
                    Quiet Hours
                  </label>
                  <p className={`text-sm ${currentTheme.textSecondary} mt-1`}>
                    Pause notifications during specified hours
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.quietHours.enabled}
                    onChange={(e) => updateNestedPreference('quietHours', 'enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {preferences.quietHours.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6 border-l-2 border-gray-200 dark:border-gray-700 pl-6">
                  <div>
                    <label className={`block font-medium ${currentTheme.text} mb-2`}>Start Time</label>
                    <input
                      type="time"
                      value={preferences.quietHours.startTime}
                      onChange={(e) => updateNestedPreference('quietHours', 'startTime', e.target.value)}
                      className={`w-full px-4 py-2 border ${currentTheme.border} rounded-xl ${currentTheme.surface} ${currentTheme.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  <div>
                    <label className={`block font-medium ${currentTheme.text} mb-2`}>End Time</label>
                    <input
                      type="time"
                      value={preferences.quietHours.endTime}
                      onChange={(e) => updateNestedPreference('quietHours', 'endTime', e.target.value)}
                      className={`w-full px-4 py-2 border ${currentTheme.border} rounded-xl ${currentTheme.surface} ${currentTheme.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleResetToDefaults}
            className={`px-6 py-3 font-bold rounded-xl border ${currentTheme.border} ${currentTheme.surface} ${currentTheme.text} hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2`}
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </button>

          <button
            onClick={handleSavePreferences}
            disabled={saving}
            className={`px-8 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50`}
          >
            {saving ? (
              <Clock className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>

      <ConfirmModal {...confirmModal.config} />
    </ResponsivePageLayout>
  );
}