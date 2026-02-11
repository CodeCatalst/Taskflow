import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSidebar } from '../context/SidebarContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useConfirmModal } from '../hooks/useConfirmModal';
import ConfirmModal from './modals/ConfirmModal';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  BarChart3,
  Calendar,
  Grid3x3,
  Settings,
  UserCog,
  FileText,
  Menu,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LogOut,
  User as UserIcon,
  Building2,
  X,
  Clock,
  CalendarDays,
  Briefcase,
  RefreshCw
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { theme, currentTheme } = useTheme();
  const { isMobileOpen, isMobile, closeMobileSidebar, isCollapsed, toggleCollapse } = useSidebar();
  const { workspace, allWorkspaces, switchWorkspace, fetchAllWorkspaces } = useWorkspace();
  const navigate = useNavigate();
  const location = useLocation();
  const confirmModal = useConfirmModal();

  // Dropdown state management
  const [openDropdowns, setOpenDropdowns] = useState({
    main: true, // Main section starts open
    hr: false,
    management: false,
    workspaces: false
  });

  const toggleDropdown = (section) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Load workspaces on mount
  useEffect(() => {
    if (user && allWorkspaces.length === 0) {
      fetchAllWorkspaces();
    }
  }, [user]);

  // Close sidebar when clicking on navigation item on mobile
  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      closeMobileSidebar();
    }
  };

  const getUserInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const mainMenuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/tasks', icon: CheckSquare, label: 'My Tasks' },
    { path: '/kanban', icon: Grid3x3, label: 'Kanban Board' },
    { path: '/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  ];

  const hrMenuItems = [
    { path: '/hr/dashboard', icon: LayoutDashboard, label: 'HR Dashboard', roles: ['admin', 'hr'], coreWorkspaceOnly: true },
    { path: '/hr/attendance', icon: Clock, label: 'Attendance', roles: ['admin', 'hr'], coreWorkspaceOnly: true },
    { path: '/hr/leaves', icon: CalendarDays, label: 'Leave Management', roles: ['admin', 'hr', 'member'], coreWorkspaceOnly: true },
    { path: '/hr/calendar', icon: Calendar, label: 'HR Calendar', roles: ['admin', 'hr'], coreWorkspaceOnly: true },
    { path: '/hr/email-center', icon: FileText, label: 'Email Center', roles: ['admin', 'hr'], coreWorkspaceOnly: true },
    { path: '/teams', icon: Users, label: 'Teams', roles: ['admin', 'hr', 'team_lead', 'community_admin'] },
    { path: '/users', icon: UserCog, label: 'User Management', roles: ['admin', 'hr', 'community_admin'] },
  ];

  const adminMenuItems = [
    { path: '/community-users', icon: UserCog, label: 'Community Users', roles: ['community_admin'] },
    { path: '/workspaces', icon: Building2, label: 'Workspaces', roles: ['admin'] },
    { path: '/changelog', icon: FileText, label: 'Audit Logs', roles: ['admin'], coreWorkspaceOnly: true },
  ];

  const bottomMenuItems = [
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const canAccess = (item) => {
    if (!item.roles) return true;
    if (!item.roles.includes(user?.role)) return false;

    // If systemAdminOnly, check if user is a system admin
    if (item.systemAdminOnly) {
      return user?.isSystemAdmin || (!user?.workspaceId && user?.role === 'admin');
    }

    // Check workspace type restrictions for HR features
    if (item.coreWorkspaceOnly && workspace?.type !== 'CORE') {
      return false;
    }

    return true;
  };

  const isDark = theme === 'dark';

  return (
    <>
      {/* Mobile/Tablet Overlay */}
      {isMobile && isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        ${isCollapsed ? 'w-16' : 'w-64'}
        ${isDark ? 'bg-[#111418] border-[#282f39] shadow-xl' : 'bg-white border-gray-200 shadow-lg'}
        border-r flex flex-col shrink-0 transition-all duration-300
        ${isMobile ? 'fixed' : 'relative'} inset-y-0 left-0 z-50
        ${isMobile ? (isMobileOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
      `}>
        {/* Mobile/Tablet Close Button */}
        {isMobile && isMobileOpen && (
          <button
            onClick={closeMobileSidebar}
            className={`absolute top-4 right-4 z-10 p-2 rounded-md ${
              isDark ? 'text-[#9da8b9] hover:text-white hover:bg-[#1c2027]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            } lg:hidden transition-colors`}
          >
            <X size={24} />
          </button>
        )}
      {/* Logo Section */}
      <div className={`${isCollapsed ? 'p-3' : 'p-4'} border-b ${
        isDark ? 'border-[#282f39]/70' : 'border-gray-200/70'
      } flex items-center justify-center bg-gradient-to-r ${
        isDark ? 'from-[#111418] to-[#1a1d23]' : 'from-white to-gray-50/50'
      }`}>
        {!isCollapsed ? (
          <div className="flex items-center gap-3 w-full px-2">
            <img 
              src="/logo.png" 
              alt="TaskFlow Logo" 
              className="w-8 h-8 object-contain"
            />
            <span className={`text-xl font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              TaskFlow
            </span>
          </div>
        ) : (
          <img 
            src="/logo.png" 
            alt="TaskFlow Logo" 
            className="w-8 h-8 object-contain"
            title="TaskFlow"
          />
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex flex-col flex-1 overflow-y-auto max-h-full">
        {/* Main Section Dropdown */}
        {!isCollapsed && (
          <div className={`border-b ${
            isDark ? 'border-[#282f39]/50' : 'border-gray-200/50'
          } mx-2 mb-2`}>
            <button
              onClick={() => toggleDropdown('main')}
              className={`w-full flex items-center justify-between py-3 px-1 text-left transition-colors group hidden lg:flex ${
                isDark ? 'text-[#9da8b9] hover:text-white' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wider">Main</p>
              {openDropdowns.main ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
        )}

        {/* Main Menu Items */}
        <div className={`transition-all duration-200 ${
          isCollapsed || openDropdowns.main ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          {mainMenuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-md transition-colors group ${
                  active
                    ? isDark
                      ? 'bg-[#136dec]/10 text-[#136dec]'
                      : 'bg-blue-50 text-blue-600'
                    : isDark
                      ? 'text-[#9da8b9] hover:bg-[#1c2027] hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
                title={isCollapsed ? item.label : ''}
              >
                <Icon size={18} className={active ? 'fill-current' : ''} />
                {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* HR Management Section Dropdown */}
        {hrMenuItems.some(canAccess) && (
          <>
            {!isCollapsed && (
              <div className={`border-b ${
                isDark ? 'border-[#282f39]/50' : 'border-gray-200/50'
              } mx-2 mb-2`}>
                <button
                  onClick={() => toggleDropdown('hr')}
                  className={`w-full flex items-center justify-between py-3 px-1 text-left transition-colors group hidden lg:flex ${
                    isDark ? 'text-[#9da8b9] hover:text-white' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider">HR Management</p>
                  {openDropdowns.hr ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>
            )}

            {/* HR Menu Items */}
            <div className={`transition-all duration-200 ${
              isCollapsed || openDropdowns.hr || isMobile ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
            }`}>
              {hrMenuItems.filter(canAccess).map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-md transition-colors group ${
                      active
                        ? isDark
                          ? 'bg-[#136dec]/10 text-[#136dec]'
                          : 'bg-blue-50 text-blue-600'
                        : isDark
                          ? 'text-[#9da8b9] hover:bg-[#1c2027] hover:text-white'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    title={isCollapsed ? item.label : ''}
                  >
                    <Icon size={18} className={active ? 'fill-current' : ''} />
                    {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Management Section Dropdown */}
        {adminMenuItems.some(canAccess) && (
          <>
            {!isCollapsed && (
              <div className={`border-b ${
                isDark ? 'border-[#282f39]/50' : 'border-gray-200/50'
              } mx-2 mb-2`}>
                <button
                  onClick={() => toggleDropdown('management')}
                  className={`w-full flex items-center justify-between py-3 px-1 text-left transition-colors group hidden lg:flex ${
                    isDark ? 'text-[#9da8b9] hover:text-white' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider">Management</p>
                  {openDropdowns.management ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              </div>
            )}

            {/* Management Menu Items */}
            <div className={`transition-all duration-200 ${
              isCollapsed || openDropdowns.management || isMobile ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
            }`}>
              {adminMenuItems.filter(canAccess).map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-md transition-colors group ${
                      active
                        ? isDark
                          ? 'bg-[#136dec]/10 text-[#136dec]'
                          : 'bg-blue-50 text-blue-600'
                        : isDark
                          ? 'text-[#9da8b9] hover:bg-[#1c2027] hover:text-white'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    title={isCollapsed ? item.label : ''}
                  >
                    <Icon size={18} className={active ? 'fill-current' : ''} />
                    {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Workspace Info & Switcher */}
      {!isCollapsed && (
        <div className={`p-2 border-t hidden lg:block ${
          isDark ? 'border-[#282f39]' : 'border-gray-200'
        }`}>
          <div className="px-2 py-1.5">
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-[#9da8b9]' : 'text-gray-500'
              }`}>Workspace</p>
              {allWorkspaces.length > 1 && (
                <button
                  onClick={() => toggleDropdown('workspaces')}
                  className={`text-xs ${isDark ? 'text-[#9da8b9] hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                  title="Switch workspace"
                >
                  {openDropdowns.workspaces ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              )}
            </div>
            
            {/* Current Workspace Display */}
            {workspace?.name && (
              <div className={`flex items-center gap-2 text-sm font-medium mb-2 p-2 rounded ${
                isDark ? 'bg-[#1c2027] text-white' : 'bg-gray-100 text-gray-900'
              }`}>
                <div className={`size-6 rounded flex items-center justify-center text-[10px] text-white font-bold ${
                  workspace.type === 'CORE' 
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-500' 
                    : 'bg-gradient-to-br from-teal-500 to-emerald-500'
                }`}>
                  {getUserInitials(workspace.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="truncate block">{workspace.name}</span>
                  <span className={`text-[10px] ${isDark ? 'text-[#9da8b9]' : 'text-gray-500'}`}>
                    {workspace.type === 'COMMUNITY' ? 'Community' : 'Core'} Workspace
                  </span>
                </div>
              </div>
            )}
            
            {/* Workspace Switcher Dropdown */}
            {allWorkspaces.length > 1 && openDropdowns.workspaces && (
              <div className={`mb-2 rounded overflow-hidden ${
                isDark ? 'bg-[#111418]' : 'bg-white border border-gray-200'
              }`}>
                <div className={`text-[10px] font-semibold uppercase px-2 py-1.5 ${
                  isDark ? 'text-[#9da8b9] bg-[#1c2027]' : 'text-gray-500 bg-gray-50'
                }`}>
                  Available Workspaces
                </div>
                {allWorkspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={async () => {
                      if (ws.id !== workspace?.id) {
                        const success = await switchWorkspace(ws.id);
                        if (success) {
                          toggleDropdown('workspaces');
                        }
                      }
                    }}
                    disabled={ws.id === workspace?.id}
                    className={`w-full flex items-center gap-2 px-2 py-2 text-left transition-colors ${
                      ws.id === workspace?.id
                        ? isDark 
                          ? 'bg-[#136dec]/10 text-[#136dec] cursor-default' 
                          : 'bg-blue-50 text-blue-600 cursor-default'
                        : isDark
                          ? 'hover:bg-[#1c2027] text-[#9da8b9] hover:text-white'
                          : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    <div className={`size-5 rounded flex items-center justify-center text-[9px] text-white font-bold ${
                      ws.type === 'CORE' 
                        ? 'bg-gradient-to-br from-blue-500 to-cyan-500' 
                        : 'bg-gradient-to-br from-teal-500 to-emerald-500'
                    }`}>
                      {getUserInitials(ws.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs truncate">{ws.name}</span>
                        {ws.id === workspace?.id && (
                          <span className="text-[9px]">✓</span>
                        )}
                      </div>
                      <span className={`text-[9px] ${
                        ws.id === workspace?.id
                          ? isDark ? 'text-[#136dec]/70' : 'text-blue-500'
                          : isDark ? 'text-[#9da8b9]' : 'text-gray-500'
                      }`}>
                        {ws.type} • {ws.role}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {/* Legacy team display for users without multi-workspace */}
            {(!workspace?.name && user?.team_id) && (
              <div className={`flex items-center gap-2 text-sm font-medium ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                <div className="size-6 rounded bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-[10px] text-white font-bold">
                  {getUserInitials(user.team_id.name)}
                </div>
                <span className="truncate">{user.team_id.name}</span>
              </div>
            )}
            
            {/* Admin or no workspace display */}
            {!workspace?.name && !user?.team_id && (
              <div className={`flex items-center gap-2 text-sm ${
                isDark ? 'text-[#9da8b9]' : 'text-gray-600'
              }`}>
                {user?.role === 'admin' ? (
                  <>
                    <div className="size-6 rounded bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-[10px] text-white font-bold">
                      A
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium">Admin - All Teams</p>
                      <button 
                        onClick={() => navigate('/teams')}
                        className="text-[10px] text-[#136dec] hover:underline mt-0.5"
                      >
                        Manage Teams →
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="size-6 rounded bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-[10px] text-white font-bold">
                      ?
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium">No Team Assigned</p>
                      <p className="text-[10px] mt-0.5">Contact your admin</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Profile & Actions */}
      <div className={`border-t ${
        isDark ? 'border-[#282f39]' : 'border-gray-200'
      }`}>
        {/* User Info */}
        {!isCollapsed && user && (
          <div className={`p-2 border-b ${
            isDark ? 'border-[#282f39]' : 'border-gray-200'
          }`}>
            <div className="flex items-center gap-2">
              {user.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt={user.full_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="size-10 rounded-full bg-gradient-to-br from-[#136dec] to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                  {getUserInitials(user.full_name)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>{user.full_name}</p>
                <p className={`text-xs truncate ${
                  isDark ? 'text-[#9da8b9]' : 'text-gray-600'
                }`}>{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Settings & Logout */}
        <div className="p-2">
          {!isCollapsed && (
            <div className={`border-t pt-3 mb-2 hidden lg:block ${
              isDark ? 'border-[#282f39]/50' : 'border-gray-200/50'
            }`}>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
                isDark ? 'text-[#9da8b9]' : 'text-gray-600'
              }`}>Account</p>
            </div>
          )}

          {/* Profile Button */}
          <button
            onClick={() => handleNavigation('/settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-md transition-colors group mb-2 ${
              isActive('/settings')
                ? isDark
                  ? 'bg-[#136dec]/10 text-[#136dec]'
                  : 'bg-blue-50 text-blue-600'
                : isDark
                  ? 'text-[#9da8b9] hover:bg-[#1c2027] hover:text-white'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
            title={isCollapsed ? 'Profile & Settings' : ''}
          >
            <UserIcon size={18} />
            {!isCollapsed && <span className="text-sm font-medium">Profile & Settings</span>}
          </button>

          {/* Logout Button */}
          <button
            onClick={async () => {
              const confirmed = await confirmModal.show({
                title: 'Logout',
                message: 'Are you sure you want to logout? You will need to sign in again to access your account.',
                confirmText: 'Logout',
                cancelText: 'Stay Logged In',
                variant: 'logout',
              });

              if (confirmed) {
                logout();
                navigate('/login');
              }
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-md transition-colors group ${
              isDark
                ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                : 'text-red-600 hover:bg-red-50 hover:text-red-700'
            }`}
            title={isCollapsed ? 'Logout' : ''}
          >
            <LogOut size={18} />
            {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Toggle Button - Show on Tablet and Desktop */}
      <button
        onClick={toggleCollapse}
        className={`p-3 border-t flex items-center justify-center transition-colors hidden md:flex ${
          isDark
            ? 'text-[#9da8b9] hover:text-white border-[#282f39] hover:bg-[#1c2027]'
            : 'text-gray-600 hover:text-gray-900 border-gray-200 hover:bg-gray-100'
        }`}
        title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={confirmModal.onClose}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        variant={confirmModal.variant}
        isLoading={confirmModal.isLoading}
      />
    </aside>
    </>
  );
};

export default Sidebar;
