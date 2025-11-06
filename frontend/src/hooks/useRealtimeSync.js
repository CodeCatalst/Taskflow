import { useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook for real-time data synchronization
 * Listens to Socket.IO events and triggers data refresh callbacks
 */
export const useRealtimeSync = (callbacks = {}) => {
  const { socket } = useAuth();

  const {
    onTaskCreated,
    onTaskUpdated,
    onTaskDeleted,
    onTaskAssigned,
    onUserCreated,
    onUserUpdated,
    onUserDeleted,
    onTeamCreated,
    onTeamUpdated,
    onTeamDeleted,
    onCommentAdded,
    onStatusChanged,
  } = callbacks;

  useEffect(() => {
    if (!socket) return;

    // Task events
    if (onTaskCreated) {
      socket.on('task:created', onTaskCreated);
    }
    if (onTaskUpdated) {
      socket.on('task:updated', onTaskUpdated);
    }
    if (onTaskDeleted) {
      socket.on('task:deleted', onTaskDeleted);
    }
    if (onTaskAssigned) {
      socket.on('task:assigned', onTaskAssigned);
    }
    if (onStatusChanged) {
      socket.on('task:statusChanged', onStatusChanged);
    }

    // User events
    if (onUserCreated) {
      socket.on('user:created', onUserCreated);
    }
    if (onUserUpdated) {
      socket.on('user:updated', onUserUpdated);
    }
    if (onUserDeleted) {
      socket.on('user:deleted', onUserDeleted);
    }

    // Team events
    if (onTeamCreated) {
      socket.on('team:created', onTeamCreated);
    }
    if (onTeamUpdated) {
      socket.on('team:updated', onTeamUpdated);
    }
    if (onTeamDeleted) {
      socket.on('team:deleted', onTeamDeleted);
    }

    // Comment events
    if (onCommentAdded) {
      socket.on('comment:added', onCommentAdded);
    }

    // Cleanup
    return () => {
      if (onTaskCreated) socket.off('task:created', onTaskCreated);
      if (onTaskUpdated) socket.off('task:updated', onTaskUpdated);
      if (onTaskDeleted) socket.off('task:deleted', onTaskDeleted);
      if (onTaskAssigned) socket.off('task:assigned', onTaskAssigned);
      if (onStatusChanged) socket.off('task:statusChanged', onStatusChanged);
      if (onUserCreated) socket.off('user:created', onUserCreated);
      if (onUserUpdated) socket.off('user:updated', onUserUpdated);
      if (onUserDeleted) socket.off('user:deleted', onUserDeleted);
      if (onTeamCreated) socket.off('team:created', onTeamCreated);
      if (onTeamUpdated) socket.off('team:updated', onTeamUpdated);
      if (onTeamDeleted) socket.off('team:deleted', onTeamDeleted);
      if (onCommentAdded) socket.off('comment:added', onCommentAdded);
    };
  }, [socket, onTaskCreated, onTaskUpdated, onTaskDeleted, onTaskAssigned, onStatusChanged, 
      onUserCreated, onUserUpdated, onUserDeleted, onTeamCreated, onTeamUpdated, 
      onTeamDeleted, onCommentAdded]);

  // Return helper function to manually trigger refresh
  const refreshData = useCallback(() => {
    if (socket) {
      socket.emit('request:refresh');
    }
  }, [socket]);

  return { refreshData };
};

export default useRealtimeSync;
