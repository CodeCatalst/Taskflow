import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useConfirmModal } from '../hooks/useConfirmModal';
import Sidebar from '../components/Sidebar';
import ThemeToggle from '../components/ThemeToggle';
import NotificationSettings from '../components/NotificationSettings';
import SessionSettings from '../components/SessionSettings';
import ConfirmModal from '../components/modals/ConfirmModal';
import api from '../api/axios';
import { User, Settings as SettingsIcon, Palette, Monitor, Lock, Eye, EyeOff, Bell, AlertCircle, Camera, Trash2, Upload, AlertTriangle } from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const { theme } = useTheme();
  const confirmModal = useConfirmModal();
  const fileInputRef = useRef(null);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [pictureMessage, setPictureMessage] = useState({ type: '', text: '' });

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setPictureMessage({ type: 'error', text: 'Please upload a valid image (JPEG, PNG, GIF, or WebP)' });
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setPictureMessage({ type: 'error', text: 'Image too large. Maximum size is 2MB.' });
      return;
    }

    setIsUploadingPicture(true);
    setPictureMessage({ type: '', text: '' });

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result;
          const response = await api.post('/users/me/profile-picture', {
            profile_picture: base64
          });

          // Update user in context
          updateUser({ profile_picture: response.data.user.profile_picture });
          setPictureMessage({ type: 'success', text: 'Profile picture updated successfully!' });
        } catch (error) {
          setPictureMessage({ 
            type: 'error', 
            text: error.response?.data?.message || 'Failed to upload profile picture' 
          });
        } finally {
          setIsUploadingPicture(false);
        }
      };
      reader.onerror = () => {
        setPictureMessage({ type: 'error', text: 'Failed to read the image file' });
        setIsUploadingPicture(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setPictureMessage({ type: 'error', text: 'Failed to process the image' });
      setIsUploadingPicture(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveProfilePicture = async () => {
    if (!user?.profile_picture) return;

    setIsUploadingPicture(true);
    setPictureMessage({ type: '', text: '' });

    try {
      await api.delete('/users/me/profile-picture');
      updateUser({ profile_picture: null });
      setPictureMessage({ type: 'success', text: 'Profile picture removed successfully!' });
    } catch (error) {
      setPictureMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to remove profile picture' 
      });
    } finally {
      setIsUploadingPicture(false);
    }
  };

  // Generate initials from name
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Generate a consistent color based on the name
  const getColorFromName = (str) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500',
    ];
    let hash = 0;
    for (let i = 0; i < (str || '').length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await api.post('/users/me/change-password', {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });

      setPasswordMessage({ type: 'success', text: response.data.message });
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setPasswordMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to change password' 
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    const confirmed = await confirmModal.show({
      title: 'Delete Workspace & Account',
      message: `Are you absolutely sure you want to delete your workspace "${user?.workspace?.name}"?\n\nThis will PERMANENTLY DELETE:\n• Your account\n• All users in this workspace\n• All tasks and projects\n• All teams\n• All data and settings\n\nThis action cannot be undone!`,
      confirmText: 'Yes, Delete Everything',
      variant: 'danger'
    });

    if (!confirmed) return;

    // Second confirmation for extra safety
    const doubleConfirmed = await confirmModal.show({
      title: '⚠️ FINAL WARNING',
      message: `Last chance to change your mind!\n\nClicking "Confirm Deletion" will PERMANENTLY and IRREVERSIBLY delete:\n\n• Workspace: ${user?.workspace?.name}\n• Your account: ${user?.email}\n• ${user?.workspace?.type === 'COMMUNITY' ? 'All community' : 'All'} data\n\nThere is NO way to recover this data!`,
      confirmText: 'Confirm Deletion',
      variant: 'danger'
    });

    if (!doubleConfirmed) return;

    try {
      await api.delete('/workspaces/my-workspace/delete');
      
      // Logout and redirect to home page
      await logout();
      navigate('/', { 
        state: { 
          message: 'Your workspace and account have been permanently deleted.' 
        } 
      });
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete workspace. Please contact support.');
    }
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'}`}>
      <Sidebar />

      <main className={`flex-1 flex flex-col h-full min-w-0 ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'}`}>
        {/* Header */}
        <header className={`border-b ${theme === 'dark' ? 'border-[#282f39] bg-[#111418]' : 'border-gray-200 bg-white'} shrink-0`}>
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-xl font-bold leading-tight`}>Settings</h2>
              <p className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} text-xs mt-1`}>Customize your TaskFlow experience</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Profile Section */}
            <div className={`${theme === 'dark' ? 'bg-[#1c2027] border-[#282f39]' : 'bg-white border-gray-200'} rounded border p-6`}>
              <div className="flex items-center gap-3 mb-6">
                <User className="text-[#136dec]" size={24} />
                <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider`}>Profile</h3>
              </div>

              {/* Profile Picture Section */}
              <div className="mb-6">
                <label className={`block text-xs font-bold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} uppercase tracking-wider mb-3`}>
                  Profile Picture
                </label>
                <div className="flex items-center gap-6">
                  {/* Current Avatar */}
                  <div className="relative">
                    {user?.profile_picture ? (
                      <img
                        src={user.profile_picture}
                        alt={user?.full_name || 'User'}
                        className="w-24 h-24 rounded-full object-cover border-4 border-[#136dec]"
                      />
                    ) : (
                      <div className={`w-24 h-24 rounded-full ${getColorFromName(user?.full_name)} flex items-center justify-center text-white text-2xl font-bold border-4 border-[#136dec]`}>
                        {getInitials(user?.full_name)}
                      </div>
                    )}
                    {isUploadingPicture && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                      id="profile-picture-input"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPicture}
                      className="flex items-center gap-2 px-4 py-2 bg-[#136dec] text-white rounded hover:bg-[#1158c7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Upload size={16} />
                      <span>{user?.profile_picture ? 'Change Picture' : 'Upload Picture'}</span>
                    </button>
                    {user?.profile_picture && (
                      <button
                        type="button"
                        onClick={handleRemoveProfilePicture}
                        disabled={isUploadingPicture}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={16} />
                        <span>Remove</span>
                      </button>
                    )}
                    <p className={`text-xs ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-500'}`}>
                      JPEG, PNG, GIF or WebP. Max 2MB.
                    </p>
                  </div>
                </div>

                {/* Picture Upload Message */}
                {pictureMessage.text && (
                  <div className={`mt-3 p-3 rounded border ${
                    pictureMessage.type === 'success' 
                      ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}>
                    {pictureMessage.text}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} uppercase tracking-wider mb-2`}>Full Name</label>
                  <input
                    type="text"
                    value={user?.full_name || ''}
                    readOnly
                    className={`w-full px-3 py-2 ${theme === 'dark' ? 'bg-[#111418] border-[#282f39] text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} uppercase tracking-wider mb-2`}>Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    readOnly
                    className={`w-full px-3 py-2 ${theme === 'dark' ? 'bg-[#111418] border-[#282f39] text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} uppercase tracking-wider mb-2`}>Role</label>
                  <input
                    type="text"
                    value={user?.role?.replace('_', ' ') || ''}
                    readOnly
                    className={`w-full px-3 py-2 ${theme === 'dark' ? 'bg-[#111418] border-[#282f39] text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded capitalize`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} uppercase tracking-wider mb-2`}>Member Since</label>
                  <input
                    type="text"
                    value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : ''}
                    readOnly
                    className={`w-full px-3 py-2 ${theme === 'dark' ? 'bg-[#111418] border-[#282f39] text-white' : 'bg-gray-50 border-gray-300 text-gray-900'} border rounded`}
                  />
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className={`${theme === 'dark' ? 'bg-[#1c2027] border-[#282f39]' : 'bg-white border-gray-200'} rounded border p-6`}>
              <div className="flex items-center gap-3 mb-6">
                <Lock className="text-[#136dec]" size={24} />
                <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider`}>Security</h3>
              </div>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className={`block text-xs font-bold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} uppercase tracking-wider mb-2`}>
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showOldPassword ? "text" : "password"}
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                      className={`w-full px-3 py-2 pr-10 ${theme === 'dark' ? 'bg-[#111418] border-[#282f39] text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-[#9da8b9] hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      {showOldPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-bold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} uppercase tracking-wider mb-2`}>
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className={`w-full px-3 py-2 pr-10 ${theme === 'dark' ? 'bg-[#111418] border-[#282f39] text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-[#9da8b9] hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-bold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} uppercase tracking-wider mb-2`}>
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className={`w-full px-3 py-2 pr-10 ${theme === 'dark' ? 'bg-[#111418] border-[#282f39] text-white' : 'bg-white border-gray-300 text-gray-900'} border rounded focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-[#9da8b9] hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {passwordMessage.text && (
                  <div className={`p-3 rounded border ${
                    passwordMessage.type === 'success' 
                      ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}>
                    {passwordMessage.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full bg-[#136dec] hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isChangingPassword ? 'Changing Password...' : 'Change Password'}
                </button>
              </form>
            </div>

            {/* Appearance Section */}
            <div className={`${theme === 'dark' ? 'bg-[#1c2027] border-[#282f39]' : 'bg-white border-gray-200'} rounded border p-6`}>
              <div className="flex items-center gap-3 mb-6">
                <Palette className="text-[#136dec]" size={24} />
                <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider`}>Appearance</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>Theme & Color Scheme</h4>
                  <p className={`text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} mb-4`}>
                    Customize how TaskFlow looks and feels. Changes are saved automatically.
                  </p>
                  <ThemeToggle />
                </div>

                <div className={`border-t ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} pt-6`}>
                  <div className="flex items-center gap-3">
                    <Monitor className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`} size={20} />
                    <div>
                      <h4 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-sm`}>System Integration</h4>
                      <p className={`text-xs ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} mt-1`}>
                        Your theme preferences are automatically synced across devices and saved locally.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Preferences Section */}
            <div className={`${theme === 'dark' ? 'bg-[#1c2027] border-[#282f39]' : 'bg-white border-gray-200'} rounded border p-6`}>
              <div className="flex items-center gap-3 mb-6">
                <SettingsIcon className="text-[#136dec]" size={24} />
                <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider`}>Preferences</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-sm`}>Email Notifications</h4>
                    <p className={`text-xs ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} mt-1`}>Receive email updates about your tasks</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className={`w-11 h-6 ${theme === 'dark' ? 'bg-[#282f39] border-[#3e454f]' : 'bg-gray-200 border-gray-300'} peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all border peer-checked:bg-[#136dec]`}></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-sm`}>Task Reminders</h4>
                    <p className={`text-xs ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} mt-1`}>Get reminded about upcoming due dates</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className={`w-11 h-6 ${theme === 'dark' ? 'bg-[#282f39] border-[#3e454f]' : 'bg-gray-200 border-gray-300'} peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all border peer-checked:bg-[#136dec]`}></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className={`${theme === 'dark' ? 'bg-[#1c2027] border-[#282f39]' : 'bg-white border-gray-200'} rounded border p-6`}>
              <div className="flex items-center gap-3 mb-6">
                <Bell className="text-[#136dec]" size={24} />
                <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider`}>Notifications</h3>
              </div>
              <NotificationSettings />
            </div>

            {/* Session Timeout Settings */}
            <div className={`${theme === 'dark' ? 'bg-[#1c2027] border-[#282f39]' : 'bg-white border-gray-200'} rounded border p-6`}>
              <SessionSettings />
            </div>

            {/* Debug Info - Admin Only */}
            {user?.role === 'admin' && (
              <div className={`${theme === 'dark' ? 'bg-[#1c2027] border-[#282f39]' : 'bg-white border-gray-200'} rounded border p-6`}>
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="text-yellow-500" size={24} />
                  <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider`}>Notification Debug (Admin Only)</h3>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="grid grid-cols-2 gap-2">
                    <span className={theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}>Browser Support:</span>
                    <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                      {'Notification' in window ? '✅ Supported' : '❌ Not Supported'}
                    </span>
                    
                    <span className={theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}>Permission:</span>
                    <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                      {typeof Notification !== 'undefined' ? Notification.permission : 'N/A'}
                    </span>
                    
                    <span className={theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}>Service Worker:</span>
                    <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                      {'serviceWorker' in navigator ? '✅ Available' : '❌ Not Available'}
                    </span>
                    
                    <span className={theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}>SW Registered:</span>
                    <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                      {navigator.serviceWorker?.controller ? '✅ Yes' : '⚠️ No'}
                    </span>
                  </div>
                  
                  <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                    <p className="text-yellow-400 text-xs">
                      <strong className="font-bold">Tip:</strong> If notifications aren't working, try:
                      <br />1. Check browser console for errors
                      <br />2. Verify HTTPS connection (required)
                      <br />3. Clear browser cache and reload
                      <br />4. Check browser notification settings
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Danger Zone - Community Admin Only */}
            {user?.role === 'community_admin' && (
              <div className={`${theme === 'dark' ? 'bg-red-950/20 border-red-900/50' : 'bg-red-50 border-red-200'} rounded border p-6`}>
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="text-red-500" size={24} />
                  <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-red-400' : 'text-red-700'} uppercase tracking-wider`}>Danger Zone</h3>
                </div>
                
                <div className={`${theme === 'dark' ? 'bg-red-950/40 border-red-900' : 'bg-white border-red-200'} border rounded-lg p-5`}>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <Trash2 className="text-red-500" size={28} />
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-bold text-base ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
                        Delete Workspace & Account
                      </h4>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-3 leading-relaxed`}>
                        Permanently delete your workspace "<strong>{user?.workspace?.name}</strong>" and your account.
                      </p>
                      <div className={`${theme === 'dark' ? 'bg-red-950/60' : 'bg-red-50'} border ${theme === 'dark' ? 'border-red-900' : 'border-red-200'} rounded-lg p-4 mb-4`}>
                        <p className={`font-semibold ${theme === 'dark' ? 'text-red-400' : 'text-red-700'} mb-2 flex items-center gap-2`}>
                          <AlertTriangle size={16} />
                          This action will permanently delete:
                        </p>
                        <ul className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} space-y-1.5 ml-6 list-disc`}>
                          <li>Your account and login credentials</li>
                          <li>All users in this workspace</li>
                          <li>All tasks and projects</li>
                          <li>All teams and team members</li>
                          <li>All files and attachments</li>
                          <li>All settings and configurations</li>
                          <li>All activity history and logs</li>
                        </ul>
                        <p className={`text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-700'} mt-3 font-bold`}>
                          ⚠️ This action cannot be undone! All data will be lost forever.
                        </p>
                      </div>
                      <button
                        onClick={handleDeleteWorkspace}
                        className={`
                          px-6 py-3 rounded-lg font-semibold text-sm
                          bg-red-600 hover:bg-red-700 text-white
                          transition-all duration-200
                          flex items-center gap-2
                          shadow-lg hover:shadow-xl
                          focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                          ${theme === 'dark' ? 'focus:ring-offset-[#111418]' : 'focus:ring-offset-white'}
                        `}
                      >
                        <Trash2 size={18} />
                        Delete My Workspace & Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Confirm Modal */}
      <ConfirmModal {...confirmModal} />
    </div>
  );
};

export default Settings;
