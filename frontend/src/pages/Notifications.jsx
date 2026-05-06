import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSidebar } from '../context/SidebarContext';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { Bell, Check, CheckCheck, Trash2, Filter, Calendar, User, AlertCircle, Menu, ArrowRight } from 'lucide-react';

const Notifications = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { toggleMobileSidebar } = useSidebar();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds) => {
    try {
      await api.patch('/notifications/mark-read', { notificationIds });
      await fetchNotifications();
    } catch (error) {
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/mark-read', {});
      await fetchNotifications();
    } catch (error) {
    }
  };

  const deleteNotification = async (id) => {
    try {
      // For now, just mark as read. You can add a delete endpoint if needed
      await markAsRead([id]);
    } catch (error) {
    }
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.read_at);
      case 'read':
        return notifications.filter(n => n.read_at);
      default:
        return notifications;
    }
  };

  const getNotificationMessage = (notification) => {
    // If message exists, use it
    if (notification.message) {
      return notification.message;
    }
    
    // Fallback: Generate message from type and payload
    const payload = notification.payload || {};
    switch (notification.type) {
      case 'task_assigned':
        return `You were assigned to task: "${payload.task_title || 'Untitled Task'}"`;
      case 'task_updated':
        return `Task "${payload.task_title || 'Untitled Task'}" was updated`;
      case 'task_completed':
        return `Task "${payload.task_title || 'Untitled Task'}" was completed`;
      case 'task_overdue':
        return `Task "${payload.task_title || 'Untitled Task'}" is overdue`;
      case 'status_changed':
        return `Task status changed from ${payload.old_status || 'unknown'} to ${payload.new_status || 'unknown'}`;
      case 'comment_added':
        return `New comment on task "${payload.task_title || 'Untitled Task'}"`;
      default:
        return 'You have a new notification';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task_assigned':
        return <User className="w-5 h-5 text-blue-500" />;
      case 'task_updated':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'task_completed':
        return <CheckCheck className="w-5 h-5 text-green-500" />;
      case 'task_overdue':
        return <Calendar className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredNotifications = getFilteredNotifications();

  if (loading) {
    return (
      <div className={`flex h-screen w-full ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'}`}>
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#136dec] mx-auto mb-4"></div>
            <p className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} font-medium`}>Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-full ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'}`}>
      <Sidebar />

      <main className={`flex-1 flex flex-col h-full w-full min-w-0 ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'} overflow-hidden`}>
        {/* Header */}
        <header className={`border-b ${theme === 'dark' ? 'border-[#282f39] bg-[#111418]' : 'border-gray-200 bg-white'} shrink-0`}>
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={toggleMobileSidebar}
                className={`lg:hidden ${theme === 'dark' ? 'text-[#9da8b9] hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
                aria-label="Toggle menu"
              >
                <Menu size={24} />
              </button>
              <div>
                <h2 className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-xl font-bold leading-tight`}>Notifications</h2>
                <p className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} text-xs mt-1`}>
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 bg-[#136dec] hover:bg-[#1258c4] text-white text-sm font-medium px-4 py-2 rounded transition-colors"
              >
                <CheckCheck size={16} />
                Mark All Read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 px-6 pb-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                filter === 'all'
                  ? 'bg-[#136dec] text-white'
                  : `${theme === 'dark' ? 'text-[#9da8b9] hover:text-white hover:bg-[#1c2027]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                filter === 'unread'
                  ? 'bg-[#136dec] text-white'
                  : `${theme === 'dark' ? 'text-[#9da8b9] hover:text-white hover:bg-[#1c2027]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                filter === 'read'
                  ? 'bg-[#136dec] text-white'
                  : `${theme === 'dark' ? 'text-[#9da8b9] hover:text-white hover:bg-[#1c2027]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`
              }`}
            >
              Read ({notifications.length - unreadCount})
            </button>
          </div>
        </header>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Bell className={`w-16 h-16 ${theme === 'dark' ? 'text-[#282f39]' : 'text-gray-300'} mb-4`} />
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
                {filter === 'unread' ? 'No unread notifications' : filter === 'read' ? 'No read notifications' : 'No notifications yet'}
              </h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                {filter === 'all' ? "You'll see notifications here when something happens" : 'Try changing the filter'}
              </p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-2">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`${theme === 'dark' ? 'bg-[#1c2027] border-[#282f39]' : 'bg-white border-gray-200'} border rounded-lg p-4 transition-all ${
                    !notification.read_at ? 'border-l-4 border-l-[#136dec]' : ''
                  } hover:shadow-md`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 p-2 rounded-full ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-gray-100'}`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-medium mb-1`}>
                        {getNotificationMessage(notification)}
                      </p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                        {formatDate(notification.created_at)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {!notification.read_at && (
                        <button
                          onClick={() => markAsRead([notification._id])}
                          className={`p-2 rounded transition-colors ${theme === 'dark' ? 'hover:bg-[#282f39]' : 'hover:bg-gray-100'}`}
                          title="Mark as read"
                        >
                          <Check className={`w-4 h-4 ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification._id)}
                        className={`p-2 rounded transition-colors ${theme === 'dark' ? 'hover:bg-[#282f39]' : 'hover:bg-gray-100'}`}
                        title="Delete"
                      >
                        <Trash2 className={`w-4 h-4 ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`} />
                      </button>
                    </div>
                  </div>

                  {/* Task Link if available */}
                  {notification.task_id && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <a
                        href={`/tasks`}
                        className="text-xs text-[#136dec] hover:text-blue-400 font-medium"
                      >
                        <span className="inline-flex items-center gap-1">
                          View Task
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Notifications;
