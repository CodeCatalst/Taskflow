/**
 * Notification Service for PWA
 * Handles desktop and mobile push notifications
 */

class NotificationService {
  constructor() {
    this.permission = 'default';
    this.isSupported = 'Notification' in window;
  }

  /**
   * Check if notifications are supported
   */
  isNotificationSupported() {
    return this.isSupported;
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus() {
    if (!this.isSupported) return 'unsupported';
    return Notification.permission;
  }

  /**
   * Request notification permission from user
   */
  async requestPermission() {
    if (!this.isSupported) {
      return 'unsupported';
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      if (permission === 'granted') {
        console.log('✅ Notification permission granted');
        
        // Show a welcome notification to confirm it's working
        await this.showNotification('🎉 Notifications Enabled!', {
          body: 'You will now receive task updates and reminders.',
          icon: '/icons/pwa-192x192.png',
          badge: '/icons/pwa-64x64.png',
          tag: 'welcome',
          requireInteraction: false,
          vibrate: [200, 100, 200],
        });
      } else if (permission === 'denied') {
        console.warn('⚠️ Notification permission denied');
      } else {
        console.log('ℹ️ Notification permission dismissed');
      }
      
      return permission;
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      return 'error';
    }
  }

  /**
   * Show a notification
   * @param {string} title - Notification title
   * @param {object} options - Notification options
   */
  async showNotification(title, options = {}) {
    if (!this.isSupported) {
      return null;
    }

    if (Notification.permission !== 'granted') {
      return null;
    }

    try {
      // Default options
      const defaultOptions = {
        icon: '/icons/pwa-192x192.png',
        badge: '/icons/pwa-64x64.png',
        vibrate: [200, 100, 200],
        requireInteraction: false,
        silent: false,
      };

      const notificationOptions = { ...defaultOptions, ...options };

      // Try service worker notification first (preferred method)
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        try {
          const registration = await navigator.serviceWorker.ready;
          return await registration.showNotification(title, notificationOptions);
        } catch (swError) {
          // Fall through to direct notification
        }
      }
      
      // Fallback to direct Notification API
      // This is more reliable in development and when SW is not available
      const notification = new Notification(title, notificationOptions);
      
      // Add click handler
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  /**
   * Show task-related notification
   * @param {string} type - Type of notification (created, updated, assigned, due, overdue)
   * @param {object} task - Task object
   */
  async showTaskNotification(type, task) {
    const notifications = {
      created: {
        title: '📝 New Task Created',
        body: `Task: ${task.title}`,
        icon: '/icons/pwa-192x192.png',
        tag: `task-${task._id}`,
        data: { type: 'task', action: 'created', taskId: task._id },
      },
      updated: {
        title: '🔄 Task Updated',
        body: `Task "${task.title}" has been updated`,
        icon: '/icons/pwa-192x192.png',
        tag: `task-${task._id}`,
        data: { type: 'task', action: 'updated', taskId: task._id },
      },
      assigned: {
        title: '👤 Task Assigned to You',
        body: `You've been assigned: ${task.title}`,
        icon: '/icons/pwa-192x192.png',
        tag: `task-${task._id}`,
        requireInteraction: true,
        data: { type: 'task', action: 'assigned', taskId: task._id },
      },
      due: {
        title: '⏰ Task Due Soon',
        body: `"${task.title}" is due soon`,
        icon: '/icons/pwa-192x192.png',
        tag: `task-due-${task._id}`,
        requireInteraction: true,
        data: { type: 'task', action: 'due', taskId: task._id },
      },
      overdue: {
        title: '🚨 Task Overdue',
        body: `"${task.title}" is overdue!`,
        icon: '/icons/pwa-192x192.png',
        tag: `task-overdue-${task._id}`,
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200],
        data: { type: 'task', action: 'overdue', taskId: task._id },
      },
      comment: {
        title: '💬 New Comment',
        body: `New comment on "${task.title}"`,
        icon: '/icons/pwa-192x192.png',
        tag: `task-comment-${task._id}`,
        data: { type: 'task', action: 'comment', taskId: task._id },
      },
    };

    const notification = notifications[type];
    if (notification) {
      await this.showNotification(notification.title, {
        body: notification.body,
        icon: notification.icon,
        badge: notification.badge || '/icons/pwa-64x64.png',
        tag: notification.tag,
        requireInteraction: notification.requireInteraction,
        vibrate: notification.vibrate,
        data: notification.data,
        actions: [
          { action: 'view', title: 'View Task', icon: '/icons/pwa-64x64.png' },
          { action: 'close', title: 'Close', icon: '/icons/pwa-64x64.png' },
        ],
      });
    }
  }

  /**
   * Close notification by tag
   */
  async closeNotification(tag) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const registration = await navigator.serviceWorker.ready;
      const notifications = await registration.getNotifications({ tag });
      notifications.forEach(notification => notification.close());
    }
  }

  /**
   * Close all notifications
   */
  async closeAllNotifications() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const registration = await navigator.serviceWorker.ready;
      const notifications = await registration.getNotifications();
      notifications.forEach(notification => notification.close());
    }
  }

  /**
   * Schedule a notification (for due date reminders)
   * Note: This requires the Notifications API and timing
   */
  scheduleNotification(title, options, delayMs) {
    return setTimeout(() => {
      this.showNotification(title, options);
    }, delayMs);
  }

  /**
   * Check for overdue tasks and show notifications
   */
  checkOverdueTasks(tasks) {
    const now = new Date();
    tasks.forEach(task => {
      if (task.due_date && task.status !== 'done' && task.status !== 'archived') {
        const dueDate = new Date(task.due_date);
        if (dueDate < now) {
          this.showTaskNotification('overdue', task);
        }
      }
    });
  }

  /**
   * Check for tasks due soon (within 24 hours)
   */
  checkTasksDueSoon(tasks) {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    tasks.forEach(task => {
      if (task.due_date && task.status !== 'done' && task.status !== 'archived') {
        const dueDate = new Date(task.due_date);
        if (dueDate > now && dueDate < tomorrow) {
          this.showTaskNotification('due', task);
        }
      }
    });
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
