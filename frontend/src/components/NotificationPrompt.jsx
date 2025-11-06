import { useState, useEffect } from 'react';
import { Bell, X, Smartphone } from 'lucide-react';
import notificationService from '../utils/notificationService';

const NotificationPrompt = () => {
  const [visible, setVisible] = useState(false);
  const [permission, setPermission] = useState('default');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if notification prompt was previously dismissed
    const wasDismissed = localStorage.getItem('notificationPromptDismissed');
    
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Check notification support and permission
    const isSupported = notificationService.isNotificationSupported();
    const currentPermission = notificationService.getPermissionStatus();
    
    setPermission(currentPermission);

    // Show prompt if notifications are supported but not granted
    if (isSupported && currentPermission !== 'granted') {
      setVisible(true);
    }
  }, []);

  const handleEnable = async () => {
    const result = await notificationService.requestPermission();
    setPermission(result);
    
    if (result === 'granted') {
      setVisible(false);
      localStorage.setItem('notificationPromptDismissed', 'true');
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    localStorage.setItem('notificationPromptDismissed', 'true');
  };

  const handleReshow = () => {
    localStorage.removeItem('notificationPromptDismissed');
    setDismissed(false);
    setVisible(true);
  };

  if (!visible && !dismissed) {
    return null;
  }

  // Show small button to re-trigger prompt if dismissed
  if (dismissed && permission !== 'granted') {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={handleReshow}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all hover:scale-110"
          title="Enable Notifications"
        >
          <Bell size={24} />
        </button>
      </div>
    );
  }

  if (!visible) {
    return null;
  }

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  return (
    <div className="fixed bottom-0 left-0 right-0 md:bottom-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-none md:rounded-lg shadow-2xl p-4 md:p-5">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-start space-x-3 pr-6">
          <div className="flex-shrink-0 bg-white/20 p-2 rounded-lg">
            {isMobile ? <Smartphone size={24} /> : <Bell size={24} />}
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">
              {isMobile ? '📱 Stay Updated on Mobile' : '🔔 Enable Notifications'}
            </h3>
            <p className="text-sm text-white/90 mb-3">
              {isMobile
                ? 'Get instant task updates on your phone. Enable notifications to stay in the loop!'
                : 'Never miss an important task update. Enable notifications to get real-time alerts.'}
            </p>

            {isMobile && (
              <div className="bg-white/10 rounded-lg p-2 mb-3 text-xs">
                <p className="font-medium mb-1">📌 Quick Tip:</p>
                <p>For best results on iOS, add TaskFlow to your Home Screen first.</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleEnable}
                className="flex-1 bg-white text-blue-600 hover:bg-gray-100 font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Enable Notifications
              </button>
              <button
                onClick={handleDismiss}
                className="flex-1 bg-white/20 hover:bg-white/30 font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPrompt;
