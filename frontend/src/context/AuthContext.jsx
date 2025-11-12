import { createContext, useState, useContext, useEffect, useRef } from 'react';
import api from '../api/axios';
import { io } from 'socket.io-client';
import notificationService from '../utils/notificationService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  // Get user's preferred timeout or use default (2 hours)
  const getSessionTimeout = () => {
    const savedTimeout = localStorage.getItem('sessionTimeout');
    return savedTimeout ? parseFloat(savedTimeout) * 60 * 60 * 1000 : 2 * 60 * 60 * 1000;
  };

  // Auto-logout configuration (in milliseconds)
  const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before logout
  
  // Use refs to persist timer IDs across re-renders
  const inactivityTimerRef = useRef(null);
  const warningTimerRef = useRef(null);

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

  // Check session when page becomes visible (user returns to tab)
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible - check if session expired
        const lastActivity = localStorage.getItem('lastActivityTime');
        if (lastActivity) {
          const INACTIVITY_TIMEOUT = getSessionTimeout();
          const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
          if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
            const timeoutHours = INACTIVITY_TIMEOUT / (60 * 60 * 1000);
            alert(
              `🔒 Session Expired\n\nYou have been logged out after ${timeoutHours >= 1 ? `${timeoutHours} hour${timeoutHours !== 1 ? 's' : ''}` : `${timeoutHours * 60} minutes`} of inactivity.`
            );
            logout();
            window.location.href = '/login';
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // Set up inactivity detection
  useEffect(() => {
    if (!user) return;

    const INACTIVITY_TIMEOUT = getSessionTimeout();

    const resetInactivityTimer = () => {
      // Clear existing timers
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }

      const timeoutHours = INACTIVITY_TIMEOUT / (60 * 60 * 1000);
      const warningMinutes = WARNING_TIME / (60 * 1000);

      console.log(`🕐 Inactivity timer reset. Will warn in ${(INACTIVITY_TIMEOUT - WARNING_TIME) / 60000} minutes, logout in ${INACTIVITY_TIMEOUT / 60000} minutes`);

      // Set warning timer (5 minutes before logout)
      warningTimerRef.current = setTimeout(() => {
        console.log('⚠️ Showing inactivity warning');
        const shouldStayLoggedIn = confirm(
          `⚠️ Session Timeout Warning\n\nYou will be logged out in ${warningMinutes} minutes due to inactivity.\n\nClick OK to stay logged in, or Cancel to logout now.`
        );
        
        if (shouldStayLoggedIn) {
          console.log('✅ User chose to stay logged in');
          resetInactivityTimer(); // Reset the timer if user wants to stay
        } else {
          console.log('❌ User chose to logout');
          handleInactivityLogout();
        }
      }, INACTIVITY_TIMEOUT - WARNING_TIME);

      // Set main logout timer
      inactivityTimerRef.current = setTimeout(() => {
        console.log('🔒 Inactivity timeout reached - logging out');
        handleInactivityLogout();
      }, INACTIVITY_TIMEOUT);

      // Store last activity time
      localStorage.setItem('lastActivityTime', Date.now().toString());
    };

    const handleInactivityLogout = () => {
      const timeoutHours = INACTIVITY_TIMEOUT / (60 * 60 * 1000);
      alert(
        `🔒 Session Expired\n\nYou have been logged out after ${timeoutHours >= 1 ? `${timeoutHours} hour${timeoutHours !== 1 ? 's' : ''}` : `${timeoutHours * 60} minutes`} of inactivity.`
      );
      logout();
      window.location.href = '/login';
    };

    // Events that indicate user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Add event listeners for user activity
    events.forEach((event) => {
      document.addEventListener(event, resetInactivityTimer, true);
    });

    // Initialize timer
    resetInactivityTimer();

    // Check if session expired while browser was closed
    const lastActivity = localStorage.getItem('lastActivityTime');
    if (lastActivity) {
      const INACTIVITY_TIMEOUT = getSessionTimeout();
      const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
      if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
        handleInactivityLogout();
        return;
      }
    }

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, resetInactivityTimer, true);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
    };
  }, [user]);

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
        message: error.response?.data?.message || 'Login failed',
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

  const value = {
    user,
    loading,
    socket,
    login,
    register,
    logout,
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