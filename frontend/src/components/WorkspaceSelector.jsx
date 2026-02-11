import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Building2, CheckCircle, ChevronRight } from 'lucide-react';

/**
 * Workspace Selector Component
 * Displayed after login when user has multiple workspaces
 * Allows user to select which workspace to use for their session
 * Admins can access all workspaces
 */
const WorkspaceSelector = ({ workspaces, onSelect, userEmail, isAdmin }) => {
  const { theme } = useTheme();
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const handleSelect = async (workspace) => {
    console.log('Workspace selected:', workspace);
    setSelectedWorkspace(workspace.id);
    setIsSelecting(true);
    try {
      await onSelect(workspace);
    } catch (error) {
      console.error('Error selecting workspace:', error);
      setIsSelecting(false);
      alert('Failed to select workspace. Please try again.');
    }
  };

  const getWorkspaceInitials = (name) => {
    if (!name) return 'W';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getWorkspaceColor = (type) => {
    return type === 'CORE' 
      ? 'from-blue-500 to-cyan-500' 
      : 'from-teal-500 to-emerald-500';
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      hr: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      team_lead: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
      member: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400',
      community_admin: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    };
    return colors[role] || colors.member;
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Admin',
      hr: 'HR',
      team_lead: 'Team Lead',
      member: 'Member',
      community_admin: 'Community Admin'
    };
    return labels[role] || role;
  };

  return (
    <div className={`relative flex min-h-screen w-full flex-col ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'}`}>
      <div className="flex h-full grow flex-col items-center justify-center p-4 sm:p-6">
        {/* Selection Card */}
        <div className={`w-full max-w-[600px] flex flex-col rounded border ${theme === 'dark' ? 'border-[#282f39] bg-[#1c2027]' : 'border-gray-200 bg-white'} shadow-lg overflow-hidden`}>
          {/* Header Section */}
          <div className={`px-8 pt-10 pb-6 flex flex-col gap-3 border-b ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-100'}`}>
                <Building2 className={`w-6 h-6 ${theme === 'dark' ? 'text-[#136dec]' : 'text-blue-600'}`} />
              </div>
              <div>
                <h1 className={`text-2xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Select Your Workspace
                </h1>
                <p className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} text-sm font-normal mt-1`}>
                  {userEmail}
                </p>
              </div>
            </div>
            <p className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} text-sm`}>
              You have access to {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}. Choose one to continue.
            </p>
            {isAdmin && (
              <div className={`mt-2 px-3 py-2 rounded-lg ${theme === 'dark' ? 'bg-purple-900/20 border border-purple-800/50' : 'bg-purple-50 border border-purple-200'}`}>
                <p className={`text-xs ${theme === 'dark' ? 'text-purple-400' : 'text-purple-700'} flex items-center gap-2`}>
                  <span className="text-sm">🔑</span>
                  <span className="font-medium">Admin Access: You can access all workspaces in the system</span>
                </p>
              </div>
            )}
          </div>

          {/* Workspaces List */}
          <div className="px-8 py-6">
            <div className="space-y-3">
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => handleSelect(workspace)}
                  disabled={isSelecting && selectedWorkspace !== workspace.id}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                    selectedWorkspace === workspace.id
                      ? theme === 'dark'
                        ? 'border-[#136dec] bg-[#136dec]/10'
                        : 'border-blue-500 bg-blue-50'
                      : theme === 'dark'
                        ? 'border-[#282f39] bg-[#111418] hover:border-[#3d4555] hover:bg-[#1c2027]'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  } ${isSelecting && selectedWorkspace !== workspace.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {/* Workspace Icon */}
                  <div className={`size-12 rounded-lg bg-gradient-to-br ${getWorkspaceColor(workspace.type)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm`}>
                    {getWorkspaceInitials(workspace.name)}
                  </div>

                  {/* Workspace Info */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`text-base font-semibold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {workspace.name}
                      </h3>
                      {selectedWorkspace === workspace.id && isSelecting && (
                        <div className="animate-spin h-4 w-4 border-2 border-[#136dec] border-t-transparent rounded-full"></div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        workspace.type === 'CORE'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                      }`}>
                        {workspace.type}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRoleBadgeColor(workspace.role)}`}>
                        {getRoleLabel(workspace.role)}
                      </span>
                    </div>
                  </div>

                  {/* Arrow Icon */}
                  <ChevronRight className={`w-5 h-5 flex-shrink-0 ${
                    selectedWorkspace === workspace.id
                      ? 'text-[#136dec]'
                      : theme === 'dark'
                        ? 'text-[#9da8b9]'
                        : 'text-gray-400'
                  }`} />
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className={`px-8 py-4 border-t ${theme === 'dark' ? 'border-[#282f39] bg-[#111418]' : 'border-gray-200 bg-gray-50'}`}>
            <p className={`text-xs ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-500'} text-center`}>
              💡 You can switch workspaces anytime from the sidebar
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSelector;
