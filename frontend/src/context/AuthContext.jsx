import { createContext, useState, useContext, useEffect, useRef } from 'react';
import api from '../api/axios';
import { io } from 'socket.io-client';

const AuthContext = createContext(null);

export { AuthContext };

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);



  useEffect(() => {
    // Clear legacy browser-readable tokens now that auth is cookie-only.
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    // Check if user is logged in from persisted profile state.
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        initializeSocket(userData.id, userData.workspace?.id || userData.workspaceId || userData.currentWorkspaceId);
      } catch (error) {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const initializeSocket = (userId, workspaceId) => {
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    if (socket) {
      socket.disconnect();
    }

    // Temporarily override addEventListener to prevent deprecated unload listener
    const originalAddEventListener = window.addEventListener;
    let unloadHandler = null;
    window.addEventListener = function(type, handler, options) {
      if (type === 'unload') {
        unloadHandler = handler;
        return; // Don't add the listener
      }
      return originalAddEventListener.call(this, type, handler, options);
    };

    const newSocket = io(SOCKET_URL, {
      closeOnBeforeunload: false,
      autoConnect: true
    });

    // Restore original addEventListener
    window.addEventListener = originalAddEventListener;

    // Manually handle cleanup if needed
    if (unloadHandler) {
      // We can call cleanup manually when the socket disconnects
      newSocket.on('disconnect', () => {
        // Perform any necessary cleanup here if needed
      });
    }
    
    newSocket.on('connect', () => {
      newSocket.emit('join', { userId, workspaceId });
    });

    newSocket.on('disconnect', () => {
      // Socket disconnected
    });

    // Note: Actual notification listeners are set up in useNotifications hook
    // to avoid duplicate event handlers
    
    setSocket(newSocket);
  };

  const login = async (email, password, rememberMe = false, sessionTimeout = 24) => {
    try {
      const response = await api.post('/auth/login', { email, password, rememberMe, sessionTimeout });
      const { user, workspace, workspaces } = response.data;

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
      initializeSocket(user.id, workspace?.id || user.workspaceId || user.currentWorkspaceId);

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
      
      // Switch to selected workspace
      const switchResponse = await api.post('/auth/switch-workspace', { 
        workspaceId: workspace.id 
      });

      // Fetch all workspaces
      const workspacesResponse = await api.get('/auth/my-workspaces');
      const allWorkspaces = workspacesResponse.data.workspaces || [];

      // Update user with selected workspace
      const userWithWorkspace = {
        ...userData,
        workspace: workspace,
        workspaces: allWorkspaces
      };

      localStorage.setItem('user', JSON.stringify(userWithWorkspace));
      setUser(userWithWorkspace);
      initializeSocket(userData.id, workspace.id);

      return { success: true };
    } catch (error) {
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
      const { user } = response.data;

      localStorage.setItem('user', JSON.stringify(user));

      setUser(user);
      initializeSocket(user.id, user.workspace?.id || user.workspaceId || user.currentWorkspaceId);

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
    return {
      user: null,
      loading: true,
      socket: null,
      login: async () => ({ success: false, message: 'Auth context not available' }),
      selectWorkspace: async () => ({ success: false, message: 'Auth context not available' }),
      register: async () => ({ success: false, message: 'Auth context not available' }),
      logout: () => {},
      updateUser: () => {},
    };
  }
  return context;
};
