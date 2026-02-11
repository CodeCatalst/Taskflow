import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

/**
 * Workspace Context
 * 
 * Manages workspace-related state for the application
 * Provides workspace information and feature flags to components
 * 
 * WORKSPACE TYPES:
 * - CORE: Full-featured enterprise workspace (no limits)
 * - COMMUNITY: Free workspace with limited features and usage limits
 * 
 * MULTI-WORKSPACE SUPPORT:
 * - Users can belong to multiple workspaces
 * - Can switch between workspaces
 * - HR/Admin see leave requests across all their workspaces
 */

const WorkspaceContext = createContext(null);

export const WorkspaceProvider = ({ children }) => {
  const { user } = useAuth();
  
  const [workspace, setWorkspace] = useState({
    id: null,
    name: null,
    type: null,
    features: {},
    limits: {},
    usage: {},
  });
  
  const [allWorkspaces, setAllWorkspaces] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  // Initialize workspace from localStorage on mount
  useEffect(() => {
    const storedWorkspace = localStorage.getItem('workspace');
    const storedWorkspaces = localStorage.getItem('allWorkspaces');
    
    if (storedWorkspace) {
      try {
        const parsed = JSON.parse(storedWorkspace);
        setWorkspace(parsed);
      } catch (error) {
        console.error('Failed to parse stored workspace:', error);
        localStorage.removeItem('workspace');
      }
    }
    
    if (storedWorkspaces) {
      try {
        const parsed = JSON.parse(storedWorkspaces);
        setAllWorkspaces(parsed);
      } catch (error) {
        console.error('Failed to parse stored workspaces:', error);
        localStorage.removeItem('allWorkspaces');
      }
    }
    
    setIsLoading(false);
  }, []);

  // Update workspace when user changes
  useEffect(() => {
    if (user && user.workspace) {
      // Check if we have a stored workspace ID that's different from user.workspace
      // This happens after a workspace switch - trust the stored workspace over user object
      const storedWorkspace = localStorage.getItem('workspace');
      if (storedWorkspace) {
        try {
          const parsed = JSON.parse(storedWorkspace);
          // If stored workspace ID differs from user.workspace.id, keep the stored one
          // (it's newer because switchWorkspace updated it before reload)
          if (parsed.id && parsed.id !== user.workspace.id) {
            console.log('Using stored workspace after switch:', parsed.id);
            // Don't update from user.workspace - keep the stored one
            return;
          }
        } catch (e) {
          console.error('Failed to parse stored workspace:', e);
        }
      }
      updateWorkspace(user.workspace);
    }
    if (user && user.workspaces) {
      setAllWorkspaces(user.workspaces);
      localStorage.setItem('allWorkspaces', JSON.stringify(user.workspaces));
    }
    if (!user) {
      clearWorkspace();
    }
  }, [user]);

  /**
   * Update workspace information
   * @param {Object} workspaceData - Workspace data from API
   */
  const updateWorkspace = (workspaceData) => {
    const newWorkspace = {
      id: workspaceData.id,
      name: workspaceData.name,
      type: workspaceData.type,
      features: workspaceData.features || {},
      limits: workspaceData.limits || {},
      usage: workspaceData.usage || {},
    };
    
    setWorkspace(newWorkspace);
    localStorage.setItem('workspace', JSON.stringify(newWorkspace));
  };

  /**
   * Clear workspace data (on logout)
   */
  const clearWorkspace = () => {
    setWorkspace({
      id: null,
      name: null,
      type: null,
      features: {},
      limits: {},
      usage: {},
    });
    setAllWorkspaces([]);
    localStorage.removeItem('workspace');
    localStorage.removeItem('allWorkspaces');
  };
  
  /**
   * Switch to a different workspace
   * @param {string} workspaceId - Workspace ID to switch to
   */
  const switchWorkspace = async (workspaceId) => {
    try {
      console.log('Switching to workspace:', workspaceId);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        console.error('No access token found');
        return false;
      }
      
      const response = await fetch('http://localhost:3000/api/auth/switch-workspace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ workspaceId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Workspace switch failed:', errorData);
        throw new Error(errorData.message || 'Failed to switch workspace');
      }
      
      const data = await response.json();
      console.log('Workspace switched successfully:', data);
      updateWorkspace(data.workspace);
      
      // Also update the user object in localStorage to reflect new workspace
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          user.workspace = data.workspace;
          localStorage.setItem('user', JSON.stringify(user));
          console.log('Updated user object with new workspace');
        } catch (e) {
          console.error('Failed to update user object:', e);
        }
      }
      
      // Reload page to refresh all workspace-scoped data
      window.location.reload();
      
      return true;
    } catch (error) {
      console.error('Switch workspace error:', error);
      return false;
    }
  };
  
  /**
   * Fetch all user workspaces
   */
  const fetchAllWorkspaces = async () => {
    try {
      console.log('Fetching all workspaces...');
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        console.error('No access token found');
        return [];
      }
      
      const response = await fetch('http://localhost:3000/api/auth/my-workspaces', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to fetch workspaces:', errorData);
        throw new Error('Failed to fetch workspaces');
      }
      
      const data = await response.json();
      console.log('Workspaces fetched:', data.workspaces);
      setAllWorkspaces(data.workspaces);
      localStorage.setItem('allWorkspaces', JSON.stringify(data.workspaces));
      
      return data.workspaces;
    } catch (error) {
      console.error('Fetch workspaces error:', error);
      return [];
    }
  };

  /**
   * Check if current workspace is CORE
   * @returns {boolean}
   */
  const isCore = () => {
    return workspace.type === 'CORE';
  };

  /**
   * Check if current workspace is COMMUNITY
   * @returns {boolean}
   */
  const isCommunity = () => {
    return workspace.type === 'COMMUNITY';
  };

  /**
   * Check if workspace has a specific feature enabled
   * @param {string} featureName - Feature name (e.g., 'bulkUserImport', 'auditLogs')
   * @returns {boolean}
   */
  const hasFeature = (featureName) => {
    return workspace.features?.[featureName] === true;
  };

  /**
   * Check if workspace can add more users
   * @returns {boolean}
   */
  const canAddUser = () => {
    if (isCore() || !workspace.limits?.maxUsers) return true;
    return (workspace.usage?.userCount || 0) < workspace.limits.maxUsers;
  };

  /**
   * Check if workspace can add more tasks
   * @returns {boolean}
   */
  const canAddTask = () => {
    if (isCore() || !workspace.limits?.maxTasks) return true;
    return (workspace.usage?.taskCount || 0) < workspace.limits.maxTasks;
  };

  /**
   * Check if workspace can add more teams
   * @returns {boolean}
   */
  const canAddTeam = () => {
    if (isCore() || !workspace.limits?.maxTeams) return true;
    return (workspace.usage?.teamCount || 0) < workspace.limits.maxTeams;
  };

  /**
   * Get remaining capacity for a resource
   * @param {string} resource - 'users', 'tasks', or 'teams'
   * @returns {number|null} - Remaining count, or null if unlimited
   */
  const getRemainingCapacity = (resource) => {
    if (isCore()) return null; // Unlimited
    
    const limitKey = `max${resource.charAt(0).toUpperCase() + resource.slice(1)}`;
    const usageKey = `${resource}Count`;
    
    const limit = workspace.limits?.[limitKey];
    const current = workspace.usage?.[usageKey] || 0;
    
    if (limit === null || limit === undefined) return null;
    return Math.max(0, limit - current);
  };

  /**
   * Check if approaching limit (within 80%)
   * @param {string} resource - 'users', 'tasks', or 'teams'
   * @returns {boolean}
   */
  const isApproachingLimit = (resource) => {
    if (isCore()) return false;
    
    const limitKey = `max${resource.charAt(0).toUpperCase() + resource.slice(1)}`;
    const usageKey = `${resource}Count`;
    
    const limit = workspace.limits?.[limitKey];
    const current = workspace.usage?.[usageKey] || 0;
    
    if (!limit) return false;
    return current >= (limit * 0.8);
  };

  /**
   * Get workspace display badge
   * @returns {Object} - { text, color }
   */
  const getWorkspaceBadge = () => {
    if (isCore()) {
      return { text: 'CORE', color: 'blue' };
    } else if (isCommunity()) {
      return { text: 'COMMUNITY', color: 'green' };
    }
    return { text: 'Unknown', color: 'gray' };
  };

  const value = {
    workspace,
    allWorkspaces,
    isLoading,
    updateWorkspace,
    clearWorkspace,
    switchWorkspace,
    fetchAllWorkspaces,
    
    // Helper methods
    isCore,
    isCommunity,
    hasFeature,
    canAddUser,
    canAddTask,
    canAddTeam,
    getRemainingCapacity,
    isApproachingLimit,
    getWorkspaceBadge,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

/**
 * Hook to use workspace context
 * @returns {Object} Workspace context value
 */
export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

export default WorkspaceContext;
