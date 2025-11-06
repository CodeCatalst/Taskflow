import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import notificationService from '../utils/notificationService';

/**
 * Hook to initialize and manage notifications
 * Call this hook in your main App component
 */
export const useNotifications = () => {
  const { user, socket } = useAuth();
  const lastNotificationTime = useRef(Date.now());
  const notificationQueue = useRef([]);
  const processingQueue = useRef(false);

  // Process queued notifications to prevent duplicates
  const processNotificationQueue = async () => {
    if (processingQueue.current || notificationQueue.current.length === 0) {
      return;
    }

    processingQueue.current = true;
    const notification = notificationQueue.current.shift();
    
    if (notification && notificationService.getPermissionStatus() === 'granted') {
      await notificationService.showTaskNotification(notification.type, notification.task);
      // Add small delay between notifications
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    processingQueue.current = false;
    
    // Process next notification if any
    if (notificationQueue.current.length > 0) {
      processNotificationQueue();
    }
  };

  // Queue notification for processing
  const queueNotification = (type, task) => {
    const settings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
    
    // Check if this notification type is enabled
    const settingKey = {
      'created': 'taskCreated',
      'updated': 'taskUpdated',
      'assigned': 'taskAssigned',
      'comment': 'newComment',
      'due': 'dueDateReminder',
      'overdue': 'dueDateReminder',
      'status_changed': 'statusChanged'
    }[type];

    if (settingKey && settings[settingKey] === false) {
      return; // Notification disabled in settings
    }

    // Prevent duplicate notifications within 2 seconds
    const now = Date.now();
    if (now - lastNotificationTime.current < 2000) {
      // Check if this exact task is already in queue
      const isDuplicate = notificationQueue.current.some(
        n => n.type === type && n.task._id === task._id
      );
      if (isDuplicate) {
        return;
      }
    }

    lastNotificationTime.current = now;
    notificationQueue.current.push({ type, task });
    processNotificationQueue();
  };

  useEffect(() => {
    if (!user) return;

    // Check if notifications are supported
    if (!notificationService.isNotificationSupported()) {
      console.warn('Notifications not supported in this browser');
      return;
    }

    // Get current permission status
    const permission = notificationService.getPermissionStatus();
    console.log('Notification permission status:', permission);

    // Set up socket listeners for real-time notifications
    if (socket) {
      // Generic notification handler
      const handleNotification = (data) => {
        console.log('Received notification:', data);
        
        if (data.type === 'task_assigned' && data.task) {
          queueNotification('assigned', data.task);
        } else if (data.type === 'status_changed' && data.task) {
          queueNotification('updated', data.task);
        }
      };

      const handleTaskCreated = (task) => {
        console.log('Task created event:', task);
        queueNotification('created', task);
      };

      const handleTaskUpdated = (task) => {
        console.log('Task updated event:', task);
        
        // Check if current user is involved in this task
        const isAssigned = task.assigned_to?.some(u => u._id === user.id || u === user.id);
        const isCreator = task.created_by?._id === user.id || task.created_by === user.id;
        
        if (isAssigned || isCreator) {
          queueNotification('updated', task);
        }
      };

      const handleTaskAssigned = (data) => {
        console.log('Task assigned event:', data);
        
        // Check if task is assigned to current user
        const task = data.task || data;
        const assignedTo = task.assigned_to || [];
        const isAssignedToMe = assignedTo.some(u => {
          const userId = u._id || u;
          return userId === user.id || userId.toString() === user.id.toString();
        });
        
        if (isAssignedToMe) {
          queueNotification('assigned', task);
        }
      };

      const handleCommentAdded = (data) => {
        console.log('Comment added event:', data);
        
        const task = data.task || data;
        // Check if current user is involved in this task
        const isAssigned = task.assigned_to?.some(u => u._id === user.id || u === user.id);
        const isCreator = task.created_by?._id === user.id || task.created_by === user.id;
        
        // Don't notify if the current user added the comment
        const commentBy = data.comment_by || data.user_id;
        const isOwnComment = commentBy === user.id || commentBy?.toString() === user.id.toString();
        
        if ((isAssigned || isCreator) && !isOwnComment) {
          queueNotification('comment', task);
        }
      };

      // Listen to both specific events and generic notification event
      socket.on('notification:new', handleNotification);
      socket.on('task:created', handleTaskCreated);
      socket.on('task:updated', handleTaskUpdated);
      socket.on('task:assigned', handleTaskAssigned);
      socket.on('comment:added', handleCommentAdded);

      // Periodic check for connection health (every 30 seconds)
      const healthCheckInterval = setInterval(() => {
        if (socket.connected) {
          console.log('Socket connected, notification system active');
        } else {
          console.warn('Socket disconnected, notifications may not work');
        }
      }, 30000);

      // Cleanup
      return () => {
        socket.off('notification:new', handleNotification);
        socket.off('task:created', handleTaskCreated);
        socket.off('task:updated', handleTaskUpdated);
        socket.off('task:assigned', handleTaskAssigned);
        socket.off('comment:added', handleCommentAdded);
        clearInterval(healthCheckInterval);
      };
    }
  }, [user, socket]);

  // Wake lock for mobile to prevent notification issues (optional enhancement)
  useEffect(() => {
    let wakeLock = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
          console.log('Wake lock acquired for better notifications');
        }
      } catch (err) {
        console.log('Wake lock not available:', err);
      }
    };

    // Request wake lock when user is active
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !wakeLock) {
        requestWakeLock();
      }
    });

    return () => {
      if (wakeLock) {
        wakeLock.release();
      }
    };
  }, []);

  // Function to manually trigger a test notification
  const testNotification = async () => {
    const permission = notificationService.getPermissionStatus();
    
    if (permission !== 'granted') {
      await notificationService.requestPermission();
    }
    
    await notificationService.showNotification('Test Notification', {
      body: 'This is a test notification from TaskFlow! If you see this, notifications are working correctly.',
      icon: '/icons/pwa-192x192.png',
      tag: 'test',
      requireInteraction: true,
      vibrate: [200, 100, 200],
    });
  };

  return {
    testNotification,
    isSupported: notificationService.isNotificationSupported(),
    permission: notificationService.getPermissionStatus(),
  };
};

export default useNotifications;
