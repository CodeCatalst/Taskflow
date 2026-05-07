import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [successMessage, setSuccessMessage] = useState('');

  const handleLogout = () => {
    logout();
  };

  const handleThemeToggle = () => {
    toggleTheme();
    setSuccessMessage('Theme updated!');
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  return (
    <div className="settings-container">
      <h1>Settings</h1>

      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="settings-section">
        <h2>Profile</h2>
        <p>Logged in as: <strong>{user?.full_name}</strong></p>
        <p>Email: <strong>{user?.email}</strong></p>
        <p>Role: <strong>{user?.role}</strong></p>
      </div>

      <div className="settings-section">
        <h2>Preferences</h2>
        <label>
          <input
            type="checkbox"
            checked={theme === 'dark'}
            onChange={handleThemeToggle}
          />
          Dark Mode
        </label>
      </div>

      <div className="settings-section">
        <button onClick={handleLogout} className="btn-logout">
          Logout
        </button>
      </div>
    </div>
  );
}
