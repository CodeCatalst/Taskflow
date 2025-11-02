import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, LogOut, User, LayoutDashboard, CheckSquare, Users, UserCog, Kanban, Menu, X, ChevronLeft, ChevronRight, BarChart3, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../api/axios';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { currentTheme, currentColorScheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Don't show error for unauthorized - user might not be logged in yet
      if (error.response?.status !== 401) {
        console.error('Error fetching notifications:', error);
      }
    }
  };

  const markAsRead = async () => {
    try {
      await api.patch('/notifications/mark-read');
      setUnreadCount(0);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-purple-100 text-purple-800',
      hr: 'bg-green-100 text-green-800',
      team_lead: 'bg-blue-100 text-blue-800',
      member: 'bg-gray-100 text-gray-800',
    };
    return badges[role] || badges.member;
  };

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'hr', 'team_lead', 'member'],
    },
    {
      name: 'Tasks',
      href: '/tasks',
      icon: CheckSquare,
      roles: ['admin', 'hr', 'team_lead', 'member'],
    },
    {
      name: 'Kanban',
      href: '/kanban',
      icon: Kanban,
      roles: ['admin', 'hr', 'team_lead', 'member'],
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
      roles: ['admin', 'hr', 'team_lead', 'member'],
    },
    {
      name: 'Teams',
      href: '/teams',
      icon: Users,
      roles: ['admin', 'hr', 'team_lead'],
    },
    {
      name: 'User Management',
      href: '/users',
      icon: UserCog,
      roles: ['admin', 'hr'],
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      roles: ['admin', 'hr', 'team_lead', 'member'],
    },
  ];

  const isActive = (href) => {
    return location.pathname === href || (href === '/dashboard' && location.pathname === '/');
  };

  // Derive a border color class from the primary bg class (e.g., bg-blue-600 -> border-blue-600)
  const primaryBorderClass = currentColorScheme.primary?.startsWith('bg-')
    ? currentColorScheme.primary.replace('bg-', 'border-')
    : 'border-blue-600';

  return (
    <div className={`flex h-screen ${currentTheme.background}`}>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white p-2 rounded-lg shadow-lg border"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } ${
        isCollapsed ? 'md:w-20' : 'md:w-64'
      } md:translate-x-0 fixed md:fixed inset-y-0 left-0 z-50 ${currentTheme.surface} shadow-lg border-r ${currentTheme.border} transition-all duration-300 ease-in-out md:h-screen md:flex-shrink-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} h-20 px-2 border-b ${currentTheme.border} relative`}>
            <Link
              to="/dashboard"
              className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <img 
                src="/logo.png" 
                alt="TaskFlow Logo" 
                className={`${isCollapsed ? 'w-10 h-10' : 'w-12 h-12'} object-contain transition-all`}
              />
              {!isCollapsed && <span className={`text-2xl font-bold ${currentTheme.text}`}>TaskFlow</span>}
            </Link>

            {/* Collapse Toggle Button */}
            {!isCollapsed && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`hidden md:block p-1 rounded-lg ${currentTheme.hover} transition-colors`}
              >
                <ChevronLeft className={`w-5 h-5 ${currentTheme.textSecondary}`} />
              </button>
            )}
            {isCollapsed && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`hidden md:block absolute -right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full ${currentTheme.surface} border ${currentTheme.border} shadow-md ${currentTheme.hover} transition-colors`}
              >
                <ChevronRight className={`w-4 h-4 ${currentTheme.textSecondary}`} />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2 smooth-scroll">
            {navigationItems
              .filter(item => item.roles.includes(user?.role))
              .map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`w-full flex items-center ${isCollapsed ? 'px-2 py-3 justify-center' : 'px-4 py-3'} text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive(item.href)
                        ? `${currentColorScheme.primaryLight} ${currentColorScheme.primaryText} border-r-4 ${primaryBorderClass}`
                        : `${currentTheme.textSecondary} ${currentTheme.hover} hover:${currentTheme.text}`
                    }`}
                    data-testid={`nav-${item.name.toLowerCase()}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    title={isCollapsed ? item.name : ''}
                  >
                    <Icon className={`${isCollapsed ? 'w-6 h-6 flex-shrink-0' : 'w-5 h-5 mr-3 flex-shrink-0'} transition-colors ${
                      isActive(item.href) ? currentColorScheme.primaryText : currentTheme.textMuted
                    }`} />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
          </nav>

          {/* User Info & Actions */}
          <div className={`border-t ${currentTheme.border} p-3 space-y-3 flex-shrink-0`}>
            {!isCollapsed && (
              <div className={`relative p-3 rounded-xl ${currentTheme.surfaceSecondary} border ${currentTheme.border} transition-all hover:shadow-md group`}>
                <div className="flex items-center space-x-3">
                  {/* Avatar with gradient ring */}
                  <div className={`relative flex-shrink-0`}>
                    <div className={`absolute inset-0 rounded-full ${currentColorScheme.primary} opacity-20 blur-sm group-hover:opacity-30 transition-opacity`}></div>
                    <div className={`relative w-10 h-10 rounded-full ${currentColorScheme.primaryLight} flex items-center justify-center border-2 ${primaryBorderClass} shadow-lg`}>
                      <User className={`w-5 h-5 ${currentColorScheme.primaryText}`} />
                    </div>
                  </div>
                  
                  {/* User Details */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${currentTheme.text} truncate leading-tight`} data-testid="user-name">
                      {user?.full_name}
                    </p>
                    <div className="mt-1.5">
                      <span
                        className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium ${getRoleBadge(user?.role)} shadow-sm`}
                        data-testid="user-role"
                      >
                        <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-60"></span>
                        {user?.role?.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications */}
            {!isCollapsed && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (!showNotifications) markAsRead();
                  }}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium ${currentTheme.textSecondary} ${currentTheme.hover} rounded-lg transition-all hover:shadow-sm border ${currentTheme.border}`}
                  data-testid="notification-button"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="ml-auto bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold px-1.5 shadow-md animate-pulse" data-testid="notification-count">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className={`absolute bottom-full left-0 mb-2 w-full ${currentTheme.surface} rounded-xl shadow-2xl border-2 ${currentTheme.border} z-50 overflow-hidden`} data-testid="notification-dropdown">
                    <div className={`p-4 border-b ${currentTheme.border} ${currentColorScheme.primaryLight}`}>
                      <h3 className={`font-bold ${currentTheme.text}`}>Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto smooth-scroll">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div
                            key={notif._id}
                            className={`p-4 border-b ${currentTheme.hover} ${
                              !notif.read_at ? currentColorScheme.primaryLight : ''
                            }`}
                            data-testid="notification-item"
                          >
                            <p className={`text-sm font-medium ${currentTheme.text}`}>{notif.type.replace('_', ' ')}</p>
                            <p className={`text-xs ${currentTheme.textSecondary} mt-1`}>
                              {notif.payload.task_title || notif.payload.message}
                            </p>
                            <p className={`text-xs ${currentTheme.textMuted} mt-1`}>
                              {new Date(notif.created_at).toLocaleString()}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className={`p-4 text-center ${currentTheme.textMuted}`}>No notifications</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Logout */}
            {!isCollapsed && (
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all hover:shadow-sm border border-red-200 dark:border-red-800/30"
                data-testid="logout-button"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span>Logout</span>
              </button>
            )}

            {/* Collapsed Icons */}
            {isCollapsed && (
              <>
                {/* Collapsed User Avatar */}
                <div className="mb-3 flex justify-center">
                  <div className={`relative group`}>
                    <div className={`absolute inset-0 rounded-full ${currentColorScheme.primary} opacity-20 blur-sm group-hover:opacity-40 transition-opacity`}></div>
                    <div 
                      className={`relative w-11 h-11 rounded-full ${currentColorScheme.primaryLight} flex items-center justify-center border-2 ${primaryBorderClass} shadow-md cursor-pointer hover:shadow-lg transition-all`}
                      title={`${user?.full_name} - ${user?.role?.replace('_', ' ')}`}
                    >
                      <User className={`w-6 h-6 ${currentColorScheme.primaryText}`} />
                    </div>
                  </div>
                </div>
                
                {/* Collapsed Notifications */}
                <div className="relative mb-3 flex justify-center">
                  <button
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      if (!showNotifications) markAsRead();
                    }}
                    className={`relative w-11 h-11 flex items-center justify-center ${currentTheme.textSecondary} ${currentTheme.hover} rounded-lg transition-all hover:shadow-md border ${currentTheme.border}`}
                    data-testid="notification-button-collapsed"
                    title="Notifications"
                  >
                    <Bell className="w-6 h-6" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] rounded-full min-w-[16px] h-[16px] flex items-center justify-center font-bold px-1 shadow-md animate-pulse" data-testid="notification-count-collapsed">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  
                  {/* Collapsed Notifications Dropdown */}
                  {showNotifications && (
                    <div className={`absolute bottom-full left-full ml-2 mb-0 w-80 ${currentTheme.surface} rounded-xl shadow-2xl border-2 ${currentTheme.border} z-50 overflow-hidden`} data-testid="notification-dropdown-collapsed">
                      <div className={`p-4 border-b ${currentTheme.border} ${currentColorScheme.primaryLight}`}>
                        <h3 className={`font-bold ${currentTheme.text}`}>Notifications</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto smooth-scroll">
                        {notifications.length > 0 ? (
                          notifications.map((notif) => (
                            <div
                              key={notif._id}
                              className={`p-4 border-b ${currentTheme.hover} ${
                                !notif.read_at ? currentColorScheme.primaryLight : ''
                              }`}
                              data-testid="notification-item"
                            >
                              <p className={`text-sm font-medium ${currentTheme.text}`}>{notif.type.replace('_', ' ')}</p>
                              <p className={`text-xs ${currentTheme.textSecondary} mt-1`}>
                                {notif.payload.task_title || notif.payload.message}
                              </p>
                              <p className={`text-xs ${currentTheme.textMuted} mt-1`}>
                                {new Date(notif.created_at).toLocaleString()}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className={`p-4 text-center ${currentTheme.textMuted}`}>No notifications</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Collapsed Logout */}
                <button
                  onClick={handleLogout}
                  className="w-11 h-11 mx-auto flex items-center justify-center text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all hover:shadow-md border border-red-200 dark:border-red-800/30"
                  data-testid="logout-button-collapsed"
                  title="Logout"
                >
                  <LogOut className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col overflow-hidden ${isCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
        <main className="flex-1 overflow-y-auto">
          {/* Content will be rendered here by the router */}
        </main>
      </div>

    </div>
  );
};

export default Navbar;