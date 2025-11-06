import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import notificationService from '../utils/notificationService';
import { Bell, BellOff, Check, X } from 'lucide-react';

const NotificationSettings = () => {
  const { currentTheme } = useTheme();
  const [permission, setPermission] = useState('default');
  const [isSupported, setIsSupported] = useState(true);
  const [settings, setSettings] = useState({
    taskAssigned: true,
    taskUpdated: true,
    taskDue: true,
    taskOverdue: true,
    newComment: true,
    taskCreated: true,
  });

  useEffect(() => {
    setIsSupported(notificationService.isNotificationSupported());
    setPermission(notificationService.getPermissionStatus());

    // Load settings from localStorage
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleRequestPermission = async () => {
    const result = await notificationService.requestPermission();
    setPermission(result);
  };

  const handleSettingChange = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
  };

  const testNotification = async () => {
    try {
      // First verify permission
      if (Notification.permission !== 'granted') {
        alert('⚠️ Please enable notifications first by clicking "Enable Notifications" button.');
        return;
      }

      await notificationService.showNotification('🎉 Test Notification', {
        body: 'If you can see this, notifications are working perfectly!',
        icon: '/icons/pwa-192x192.png',
        badge: '/icons/pwa-64x64.png',
        tag: 'test',
        requireInteraction: false,
        vibrate: [200, 100, 200],
      });
      
      // Show success message with mobile-specific tips
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const message = isMobile 
        ? '✅ Test notification sent!\n\n📱 On mobile:\n- Check your notification tray\n- Ensure Do Not Disturb is off\n- For iOS: Add to Home Screen first'
        : '✅ Test notification sent! Check your desktop for the notification.';
      
      alert(message);
    } catch (error) {
      console.error('❌ Error showing test notification:', error);
      alert(`❌ Error showing notification:\n${error.message}\n\nCheck browser console for details.`);
    }
  };

  if (!isSupported) {
    return (
      <div className={`${currentTheme.surface} rounded-lg p-6 shadow-md`}>
        <div className="flex items-center space-x-3 mb-4">
          <BellOff className={`w-6 h-6 ${currentTheme.textSecondary}`} />
          <h3 className={`text-lg font-semibold ${currentTheme.text}`}>
            Notifications Not Supported
          </h3>
        </div>
        <p className={`${currentTheme.textSecondary}`}>
          Your browser doesn't support notifications. Please use a modern browser like Chrome, Firefox, or Edge.
        </p>
      </div>
    );
  }

  return (
    <div className={`${currentTheme.surface} rounded-lg p-4 sm:p-6 shadow-md`}>
      <div className="flex items-center space-x-3 mb-4">
        <Bell className={`w-5 h-5 sm:w-6 sm:h-6 ${currentTheme.textSecondary}`} />
        <h3 className={`text-base sm:text-lg font-semibold ${currentTheme.text}`}>
          Notification Settings
        </h3>
      </div>

      {/* Permission Status */}
      <div className={`mb-6 p-3 sm:p-4 rounded-lg ${currentTheme.surfaceSecondary}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className={`font-medium ${currentTheme.text} text-sm sm:text-base`}>Permission Status</p>
            <p className={`text-xs sm:text-sm ${currentTheme.textSecondary} mt-1`}>
              {permission === 'granted' && '✅ Notifications are enabled'}
              {permission === 'denied' && '❌ Notifications are blocked'}
              {permission === 'default' && '⚠️ Notification permission not requested'}
            </p>
          </div>
          {permission !== 'granted' && (
            <button
              onClick={handleRequestPermission}
              className="btn bg-blue-600 text-white hover:bg-blue-700 text-sm px-4 py-2 w-full sm:w-auto"
            >
              Enable Notifications
            </button>
          )}
          {permission === 'granted' && (
            <button
              onClick={testNotification}
              className="btn bg-green-600 text-white hover:bg-green-700 text-sm px-4 py-2 w-full sm:w-auto"
            >
              Test Notification
            </button>
          )}
        </div>
      </div>

      {/* Notification Preferences */}
      {permission === 'granted' && (
        <div className="space-y-3 sm:space-y-4">
          <h4 className={`font-medium ${currentTheme.text} text-sm sm:text-base`}>
            Notification Preferences
          </h4>
          
          <div className="space-y-2 sm:space-y-3">
            <NotificationToggle
              label="Task Assigned to Me"
              description="Get notified when a task is assigned to you"
              checked={settings.taskAssigned}
              onChange={() => handleSettingChange('taskAssigned')}
              currentTheme={currentTheme}
            />
            
            <NotificationToggle
              label="Task Updates"
              description="Get notified when a task you're involved in is updated"
              checked={settings.taskUpdated}
              onChange={() => handleSettingChange('taskUpdated')}
              currentTheme={currentTheme}
            />
            
            <NotificationToggle
              label="Task Due Soon"
              description="Get notified when a task is due within 24 hours"
              checked={settings.taskDue}
              onChange={() => handleSettingChange('taskDue')}
              currentTheme={currentTheme}
            />
            
            <NotificationToggle
              label="Overdue Tasks"
              description="Get notified about overdue tasks"
              checked={settings.taskOverdue}
              onChange={() => handleSettingChange('taskOverdue')}
              currentTheme={currentTheme}
            />
            
            <NotificationToggle
              label="New Comments"
              description="Get notified when someone comments on your tasks"
              checked={settings.newComment}
              onChange={() => handleSettingChange('newComment')}
              currentTheme={currentTheme}
            />
            
            <NotificationToggle
              label="New Task Created"
              description="Get notified when a new task is created (for admins/team leads)"
              checked={settings.taskCreated}
              onChange={() => handleSettingChange('taskCreated')}
              currentTheme={currentTheme}
            />
          </div>
        </div>
      )}

      {permission === 'denied' && (
        <div className={`mt-4 p-3 sm:p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800`}>
          <p className={`text-xs sm:text-sm ${currentTheme.text}`}>
            <strong>Notifications are blocked.</strong> To enable notifications, you need to update your browser settings:
          </p>
          <ul className={`list-disc list-inside mt-2 text-xs sm:text-sm ${currentTheme.textSecondary} space-y-1`}>
            <li>Click the lock/info icon in your browser's address bar</li>
            <li>Find the Notifications setting</li>
            <li>Change it to "Allow"</li>
            <li>Refresh this page</li>
          </ul>
        </div>
      )}

      {/* Mobile-specific information */}
      <div className={`mt-4 p-3 sm:p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800`}>
        <p className={`text-xs sm:text-sm font-medium ${currentTheme.text} mb-2`}>
          📱 Mobile Device Tips
        </p>
        <ul className={`list-disc list-inside text-xs sm:text-sm ${currentTheme.textSecondary} space-y-1`}>
          <li><strong>iOS:</strong> Add TaskFlow to Home Screen for notifications to work</li>
          <li><strong>Android:</strong> Ensure notifications are allowed in browser settings</li>
          <li><strong>All devices:</strong> Check that Do Not Disturb mode is off</li>
          <li><strong>HTTPS required:</strong> Notifications only work on secure connections</li>
        </ul>
      </div>

      {/* Debug Information */}
      <div className={`mt-4 p-3 rounded-lg ${currentTheme.surfaceSecondary}`}>
        <details>
          <summary className={`text-xs sm:text-sm font-medium ${currentTheme.text} cursor-pointer`}>
            🔧 Technical Details (for debugging)
          </summary>
          <div className={`mt-3 text-xs ${currentTheme.textSecondary} space-y-1 font-mono`}>
            <div>Browser: {navigator.userAgent.match(/Chrome|Safari|Firefox|Edge/)?.[0] || 'Unknown'}</div>
            <div>Mobile: {/Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'Yes' : 'No'}</div>
            <div>HTTPS: {window.location.protocol === 'https:' ? '✅ Yes' : '❌ No (required!)'}</div>
            <div>Service Worker: {'serviceWorker' in navigator ? '✅ Supported' : '❌ Not supported'}</div>
            <div>SW Active: {navigator.serviceWorker?.controller ? '✅ Yes' : '⚠️ No'}</div>
            <div>Permission API: {'permissions' in navigator ? '✅ Available' : '❌ Not available'}</div>
          </div>
        </details>
      </div>
    </div>
  );
};

const NotificationToggle = ({ label, description, checked, onChange, currentTheme }) => {
  return (
    <div className={`flex items-start space-x-3 p-3 rounded-lg ${currentTheme.surfaceSecondary}`}>
      <button
        onClick={onChange}
        className={`flex-shrink-0 mt-0.5 w-10 h-6 sm:w-12 sm:h-7 rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <div
          className={`w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full shadow-md transform transition-transform ${
            checked ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0.5'
          }`}
        >
          {checked && <Check className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 p-0.5" />}
        </div>
      </button>
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${currentTheme.text} text-sm sm:text-base`}>{label}</p>
        <p className={`text-xs sm:text-sm ${currentTheme.textSecondary} mt-0.5`}>{description}</p>
      </div>
    </div>
  );
};

export default NotificationSettings;
