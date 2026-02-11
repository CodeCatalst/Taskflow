import { createContext, useState, useContext, useEffect, useRef } from 'react';
import api from '../api/axios';
import { io } from 'socket.io-client';
import notificationService from '../utils/notificationService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      initializeSocket(JSON.parse(storedUser).id);
    }
    setLoading(false);
  }, []);

  const initializeSocket = (userId) => {
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(SOCKET_URL);
    
    newSocket.on('connect', () => {
      newSocket.emit('join', userId);
    });

    newSocket.on('disconnect', () => {
      // Socket disconnected
    });

    // Note: Actual notification listeners are set up in useNotifications hook
    // to avoid duplicate event handlers
    
    setSocket(newSocket);
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, workspace, workspaces, accessToken, refreshToken } = response.data;

      // Store tokens immediately
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // If user has multiple workspaces, return them for selection
      if (workspaces && workspaces.length > 1) {
        return { 
          success: true, 
          requiresWorkspaceSelection: true,
          user,
          workspace,
          workspaces
        };
      }

      // Single workspace - proceed with normal login
      const userWithWorkspace = {
        ...user,
        workspace: workspace,
        workspaces: workspaces || []
      };

      localStorage.setItem('user', JSON.stringify(userWithWorkspace));
      setUser(userWithWorkspace);
      initializeSocket(user.id);

      return { success: true };
    } catch (error) {
      const errorData = error.response?.data;
      return {
        success: false,
        message: errorData?.message || 'Login failed',
        requiresVerification: errorData?.requiresVerification || false,
        accountDeactivated: errorData?.accountDeactivated || false,
      };
    }
  };

  const selectWorkspace = async (workspace, userData) => {
    try {
      console.log('selectWorkspace called with:', { workspace, userData });
      
      // Switch to selected workspace
      const switchResponse = await api.post('/auth/switch-workspace', { 
        workspaceId: workspace.id 
      });
      console.log('Switch workspace response:', switchResponse.data);

      // Fetch all workspaces
      const workspacesResponse = await api.get('/auth/my-workspaces');
      const allWorkspaces = workspacesResponse.data.workspaces || [];
      console.log('Fetched workspaces:', allWorkspaces);

      // Update user with selected workspace
      const userWithWorkspace = {
        ...userData,
        workspace: workspace,
        workspaces: allWorkspaces
      };

      localStorage.setItem('user', JSON.stringify(userWithWorkspace));
      setUser(userWithWorkspace);
      initializeSocket(userData.id);

      console.log('Workspace selection complete');
      return { success: true };
    } catch (error) {
      console.error('Error in selectWorkspace:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to select workspace'
      };
    }
  };

  const register = async (full_name, email, password, role = 'member') => {
    try {
      const response = await api.post('/auth/register', {
        full_name,
        email,
        password,
        role,
      });
      const { user, accessToken, refreshToken } = response.data;

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      setUser(user);
      initializeSocket(user.id);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('lastActivityTime');
    setUser(null);
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  // Update user data (e.g., after profile picture change)
  const updateUser = (updatedUserData) => {
    const newUser = { ...user, ...updatedUserData };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const value = {
    user,
    loading,
    socket,
    login,
    selectWorkspace,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};