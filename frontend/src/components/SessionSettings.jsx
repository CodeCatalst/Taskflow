import { useState, useEffect } from 'react';
import { Clock, Info } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const SessionSettings = () => {
  const { currentTheme } = useTheme();
  const [sessionTimeout, setSessionTimeout] = useState(2); // Default 2 hours
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load saved timeout preference
    const savedTimeout = localStorage.getItem('sessionTimeout');
    if (savedTimeout) {
      setSessionTimeout(parseInt(savedTimeout));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('sessionTimeout', sessionTimeout.toString());
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    
    // Show info message
    alert(
      `✅ Session timeout updated to ${sessionTimeout} hour(s).\n\n` +
      `⚠️ Note: This will take effect on your next login.\n` +
      `You will be warned 5 minutes before automatic logout.`
    );
  };

  const timeoutOptions = [
    { value: 0.5, label: '30 minutes (High Security)' },
    { value: 1, label: '1 hour' },
    { value: 2, label: '2 hours (Default)' },
    { value: 4, label: '4 hours' },
    { value: 8, label: '8 hours (Full Workday)' },
    { value: 12, label: '12 hours' },
    { value: 24, label: '24 hours (Keep me logged in)' },
  ];

  return (
    <div className={`${currentTheme.surface} rounded-lg shadow-md p-4 sm:p-6`}>
      <div className="flex items-center space-x-3 mb-4 sm:mb-6">
        <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
        <h2 className={`text-lg sm:text-xl font-semibold ${currentTheme.text}`}>Session Timeout</h2>
      </div>

      <div className={`${currentTheme.surfaceSecondary} p-3 sm:p-4 rounded-lg mb-4 sm:mb-6`}>
        <div className="flex items-start space-x-2">
          <Info className={`w-5 h-5 ${currentTheme.textSecondary} flex-shrink-0 mt-0.5`} />
          <div className={`text-xs sm:text-sm ${currentTheme.textSecondary}`}>
            <p className="mb-2">
              <strong>Auto-logout for security:</strong> You'll be automatically logged out after the selected period of inactivity.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>You'll receive a warning 5 minutes before logout</li>
              <li>Any mouse movement, click, or keyboard activity resets the timer</li>
              <li>Recommended: 2 hours for balance between security and convenience</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
            Inactivity Timeout Duration
          </label>
          <select
            value={sessionTimeout}
            onChange={(e) => setSessionTimeout(parseFloat(e.target.value))}
            className={`w-full px-3 py-2 ${currentTheme.surface} ${currentTheme.text} ${currentTheme.border} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base`}
          >
            {timeoutOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={`${currentTheme.surfaceSecondary} p-3 rounded-lg`}>
          <p className={`text-xs sm:text-sm ${currentTheme.textSecondary}`}>
            <strong>Current selection:</strong> You'll be logged out after{' '}
            <span className="text-blue-600 dark:text-blue-400 font-semibold">
              {sessionTimeout >= 1 
                ? `${sessionTimeout} hour${sessionTimeout !== 1 ? 's' : ''}`
                : `${sessionTimeout * 60} minutes`}
            </span>{' '}
            of inactivity.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm sm:text-base"
        >
          {saved ? '✓ Saved!' : 'Save Session Settings'}
        </button>
      </div>

      {/* Security Tips */}
      <div className={`mt-4 sm:mt-6 p-3 sm:p-4 border-l-4 border-yellow-400 ${currentTheme.surfaceSecondary} rounded`}>
        <h4 className={`font-semibold ${currentTheme.text} mb-2 text-sm sm:text-base`}>
          🔒 Security Best Practices
        </h4>
        <ul className={`text-xs sm:text-sm ${currentTheme.textSecondary} space-y-1`}>
          <li>• Use shorter timeout on shared computers</li>
          <li>• Always logout manually when finished</li>
          <li>• Don't save passwords in your browser on public devices</li>
          <li>• Lock your computer when stepping away</li>
        </ul>
      </div>
    </div>
  );
};

export default SessionSettings;
