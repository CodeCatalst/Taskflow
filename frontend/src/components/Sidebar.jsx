import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
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
  LogOut,
  User as UserIcon,
  Building2
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { theme, currentTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const confirmModal = useConfirmModal();

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

  const adminMenuItems = [
    { path: '/teams', icon: Users, label: 'Teams', roles: ['admin', 'hr', 'team_lead', 'community_admin'] },
    { path: '/users', icon: UserCog, label: 'User Management', roles: ['admin', 'hr'] },
    { path: '/community-users', icon: UserCog, label: 'Community Users', roles: ['community_admin'] },
    { path: '/workspaces', icon: Building2, label: 'Workspaces', roles: ['admin'] },
    { path: '/changelog', icon: FileText, label: 'Audit Logs', roles: ['admin'] },
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
    
    return true;
  };

  const isDark = theme === 'dark';

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} ${
      isDark ? 'bg-[#111418] border-[#282f39]' : 'bg-white border-gray-200'
    } border-r flex flex-col shrink-0 transition-all duration-300 relative`}>
      {/* Logo Section */}
      <div className={`${collapsed ? 'p-3' : 'p-4'} border-b ${
        isDark ? 'border-[#282f39]' : 'border-gray-200'
      } flex items-center justify-center`}>
        {!collapsed ? (
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
      <div className="flex flex-col gap-1 p-4 flex-1 overflow-y-auto">
        {!collapsed && (
          <div className="px-3 py-2">
            <p className={`text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-[#9da8b9]' : 'text-gray-500'
            }`}>Main</p>
          </div>
        )}
        
        {mainMenuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 px-3 py-2 rounded transition-colors group ${
                active
                  ? isDark
                    ? 'bg-[#136dec]/10 text-[#136dec]'
                    : 'bg-blue-50 text-blue-600'
                  : isDark
                    ? 'text-[#9da8b9] hover:bg-[#1c2027] hover:text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title={collapsed ? item.label : ''}
            >
              <Icon size={20} className={active ? 'fill-current' : ''} />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          );
        })}

        {/* Admin Section */}
        {adminMenuItems.some(canAccess) && (
          <>
            {!collapsed && (
              <div className="px-3 py-2 mt-4">
                <p className={`text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'text-[#9da8b9]' : 'text-gray-500'
                }`}>Management</p>
              </div>
            )}
            {adminMenuItems.filter(canAccess).map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-3 px-3 py-2 rounded transition-colors group ${
                    active
                      ? isDark
                        ? 'bg-[#136dec]/10 text-[#136dec]'
                        : 'bg-blue-50 text-blue-600'
                      : isDark
                        ? 'text-[#9da8b9] hover:bg-[#1c2027] hover:text-white'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  title={collapsed ? item.label : ''}
                >
                  <Icon size={20} className={active ? 'fill-current' : ''} />
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* Workspace Info */}
      {!collapsed && (
        <div className={`p-4 border-t ${
          isDark ? 'border-[#282f39]' : 'border-gray-200'
        }`}>
          <div className="px-3 py-2">
            <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${
              isDark ? 'text-[#9da8b9]' : 'text-gray-500'
            }`}>Workspace</p>
            {/* Show workspace info for community_admin */}
            {user?.role === 'community_admin' && user?.workspace ? (
              <div className={`flex items-center gap-2 text-sm font-medium ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                <div className="size-6 rounded bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-[10px] text-white font-bold">
                  {getUserInitials(user.workspace.name)}
                </div>
                <div className="flex-1">
                  <span className="truncate block">{user.workspace.name}</span>
                  <span className={`text-[10px] ${isDark ? 'text-[#9da8b9]' : 'text-gray-500'}`}>
                    {user.workspace.type === 'COMMUNITY' ? 'Community' : 'Core'} Workspace
                  </span>
                </div>
              </div>
            ) : user?.team_id ? (
              <div className={`flex items-center gap-2 text-sm font-medium ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                <div className="size-6 rounded bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-[10px] text-white font-bold">
                  {getUserInitials(user.team_id.name)}
                </div>
                <span className="truncate">{user.team_id.name}</span>
              </div>
            ) : (
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
                ) : user?.workspace ? (
                  <>
                    <div className="size-6 rounded bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-[10px] text-white font-bold">
                      {getUserInitials(user.workspace.name)}
                    </div>
                    <div className="flex-1">
                      <span className={`truncate block text-xs font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.workspace.name}</span>
                      <span className={`text-[10px] ${isDark ? 'text-[#9da8b9]' : 'text-gray-500'}`}>
                        {user.workspace.type === 'COMMUNITY' ? 'Community' : 'Core'} Workspace
                      </span>
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
        {!collapsed && user && (
          <div className={`p-4 border-b ${
            isDark ? 'border-[#282f39]' : 'border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
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
        <div className="p-4">
          {!collapsed && (
            <div className="px-3 py-2 mb-2">
              <p className={`text-xs font-bold uppercase tracking-wider ${
                isDark ? 'text-[#9da8b9]' : 'text-gray-500'
              }`}>Account</p>
            </div>
          )}
          
          {/* Profile Button */}
          <button
            onClick={() => navigate('/settings')}
            className={`flex items-center gap-3 px-3 py-2 rounded transition-colors group w-full mb-1 ${
              isActive('/settings')
                ? isDark
                  ? 'bg-[#136dec]/10 text-[#136dec]'
                  : 'bg-blue-50 text-blue-600'
                : isDark
                  ? 'text-[#9da8b9] hover:bg-[#1c2027] hover:text-white'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
            title={collapsed ? 'Profile & Settings' : ''}
          >
            <UserIcon size={20} />
            {!collapsed && <span className="text-sm font-medium">Profile & Settings</span>}
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
            className={`flex items-center gap-3 px-3 py-2 rounded transition-colors group w-full ${
              isDark
                ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                : 'text-red-600 hover:bg-red-50 hover:text-red-700'
            }`}
            title={collapsed ? 'Logout' : ''}
          >
            <LogOut size={20} />
            {!collapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={`p-3 border-t flex items-center justify-center transition-colors ${
          isDark
            ? 'text-[#9da8b9] hover:text-white border-[#282f39] hover:bg-[#1c2027]'
            : 'text-gray-600 hover:text-gray-900 border-gray-200 hover:bg-gray-100'
        }`}
        title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
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
  );
};

export default Sidebar;
