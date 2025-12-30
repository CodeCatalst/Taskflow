import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useConfirmModal } from '../hooks/useConfirmModal';
import Sidebar from '../components/Sidebar';
import ConfirmModal from '../components/modals/ConfirmModal';
import axios from '../api/axios';
import { 
  Building2, 
  Users, 
  CheckSquare, 
  Layers,
  Plus,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  Database,
  RefreshCw,
  Search,
  X
} from 'lucide-react';

export default function WorkspaceManagement() {
  const { theme } = useTheme();
  const confirmModal = useConfirmModal();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [workspaceUsers, setWorkspaceUsers] = useState([]);
  const [workspaceTasks, setWorkspaceTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'COMMUNITY',
    ownerEmail: ''
  });

  const [editData, setEditData] = useState({
    name: '',
    type: 'COMMUNITY',
    limits: {
      maxUsers: 10,
      maxTasks: 100,
      maxTeams: 3
    }
  });

  useEffect(() => {
    fetchWorkspaces();
    fetchStats();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/workspaces');
      setWorkspaces(response.data);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      alert('Failed to fetch workspaces');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/workspaces/stats/summary');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchWorkspaceDetails = async (id) => {
    try {
      const response = await axios.get(`/workspaces/${id}`);
      setSelectedWorkspace(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching workspace details:', error);
      alert('Failed to fetch workspace details');
    }
  };

  const fetchWorkspaceUsers = async (workspace) => {
    try {
      const response = await axios.get(`/workspaces/${workspace._id}/users`);
      setSelectedWorkspace(workspace);
      setWorkspaceUsers(response.data.users);
      setShowUsersModal(true);
    } catch (error) {
      console.error('Error fetching workspace users:', error);
      alert('Failed to fetch workspace users');
    }
  };

  const fetchWorkspaceTasks = async (workspace) => {
    try {
      const response = await axios.get(`/workspaces/${workspace._id}/tasks`);
      setSelectedWorkspace(workspace);
      setWorkspaceTasks(response.data.tasks);
      setShowTasksModal(true);
    } catch (error) {
      console.error('Error fetching workspace tasks:', error);
      alert('Failed to fetch workspace tasks');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/workspaces', formData);
      alert('Workspace created successfully');
      setShowCreateModal(false);
      setFormData({ name: '', type: 'COMMUNITY', ownerEmail: '' });
      fetchWorkspaces();
      fetchStats();
    } catch (error) {
      console.error('Error creating workspace:', error);
      alert(error.response?.data?.message || 'Failed to create workspace');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/workspaces/${selectedWorkspace._id}`, editData);
      alert('Workspace updated successfully');
      setShowEditModal(false);
      fetchWorkspaces();
    } catch (error) {
      console.error('Error updating workspace:', error);
      alert(error.response?.data?.message || 'Failed to update workspace');
    }
  };

  const handleDelete = async (id, name) => {
    const confirmMsg = `⚠️ DELETE WORKSPACE AND ALL DATA?

Workspace: "${name}"

This will permanently delete:
• All users in this workspace
• All tasks in this workspace
• All teams in this workspace

This action CANNOT be undone!`;
    
    confirmModal.show({
      title: '⚠️ Delete Workspace',
      message: confirmMsg,
      confirmText: 'Delete Workspace',
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm: async () => {
        const confirmation = prompt("Type 'DELETE' to confirm:");
        if (confirmation !== 'DELETE') {
          alert('Deletion cancelled');
          return;
        }

        try {
          const response = await axios.delete(`/workspaces/${id}`);
          const deleted = response.data.deleted || {};
          alert(`✅ Workspace deleted successfully\n\nDeleted:\n• ${deleted.users || 0} users\n• ${deleted.tasks || 0} tasks\n• ${deleted.teams || 0} teams`);
          fetchWorkspaces();
          fetchStats();
        } catch (error) {
          console.error('Error deleting workspace:', error);
          alert(error.response?.data?.message || 'Failed to delete workspace');
        }
      },
    });
  };

  const handleToggleStatus = (id, name, currentStatus) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    confirmModal.show({
      title: `${action === 'activate' ? 'Activate' : 'Deactivate'} Workspace`,
      message: `Are you sure you want to ${action} workspace "${name}"? Users in this workspace will ${action === 'deactivate' ? 'lose access until it is reactivated' : 'regain access'}.`,
      confirmText: action === 'activate' ? 'Activate' : 'Deactivate',
      cancelText: 'Cancel',
      variant: action === 'deactivate' ? 'warning' : 'info',
      onConfirm: async () => {
        try {
          const response = await axios.patch(`/workspaces/${id}/toggle-status`);
          const message = response.data.message || `Workspace ${action}d successfully`;
          const note = response.data.note || '';
          
          alert(`${message}\n\n⚠️ IMPORTANT: ${note || 'Users in this workspace must log out and log back in to see the change.'}`);
          fetchWorkspaces();
          fetchStats();
        } catch (error) {
          console.error('Error toggling workspace status:', error);
          alert(error.response?.data?.message || 'Failed to toggle workspace status');
        }
      },
    });
  };

  const openEditModal = (workspace) => {
    setSelectedWorkspace(workspace);
    setEditData({
      name: workspace.name,
      type: workspace.type,
      limits: workspace.limits || { maxUsers: 10, maxTasks: 100, maxTeams: 3 }
    });
    setShowEditModal(true);
  };

  const filteredWorkspaces = workspaces.filter(ws =>
    ws.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isDark = theme === 'dark';

  const getTypeColor = (type) => {
    return type === 'CORE' 
      ? isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-800'
      : isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800';
  };

  if (loading) {
    return (
      <div className={`flex h-screen ${isDark ? 'bg-[#0f1419]' : 'bg-gray-50'}`}>
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${isDark ? 'bg-[#0f1419]' : 'bg-gray-50'}`}>
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className={`text-3xl font-bold mb-2 flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Building2 className="w-8 h-8 text-purple-600" />
              Workspace Management
            </h1>
            <p className={isDark ? 'text-[#9da8b9]' : 'text-gray-600'}>
              Manage all workspaces in the system
            </p>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Workspaces */}
              <div className={`rounded-lg shadow-md p-6 ${isDark ? 'bg-[#111418]' : 'bg-white'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${isDark ? 'text-[#9da8b9]' : 'text-gray-600'}`}>Total Workspaces</p>
                    <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {stats.totalWorkspaces}
                    </p>
                  </div>
                  <Database className="w-12 h-12 text-purple-600 opacity-20" />
                </div>
                <div className="mt-4 flex gap-3 text-sm flex-wrap">
                  <span className={isDark ? 'text-green-400' : 'text-green-600'}>
                    ✓ {stats.activeWorkspaces} Active
                  </span>
                  <span className={isDark ? 'text-red-400' : 'text-red-600'}>
                    ✗ {stats.inactiveWorkspaces} Inactive
                  </span>
                </div>
              </div>

              {/* Workspace Types */}
              <div className={`rounded-lg shadow-md p-6 ${isDark ? 'bg-[#111418]' : 'bg-white'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${isDark ? 'text-[#9da8b9]' : 'text-gray-600'}`}>Workspace Types</p>
                    <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {stats.coreWorkspaces + stats.communityWorkspaces}
                    </p>
                  </div>
                  <Layers className="w-12 h-12 text-blue-600 opacity-20" />
                </div>
                <div className="mt-4 flex gap-4 text-sm">
                  <span className={isDark ? 'text-purple-400' : 'text-purple-600'}>
                    {stats.coreWorkspaces} CORE
                  </span>
                  <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>
                    {stats.communityWorkspaces} COMMUNITY
                  </span>
                </div>
              </div>

              {/* Total Users */}
              <div className={`rounded-lg shadow-md p-6 ${isDark ? 'bg-[#111418]' : 'bg-white'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${isDark ? 'text-[#9da8b9]' : 'text-gray-600'}`}>Total Users</p>
                    <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {stats.totalUsers}
                    </p>
                  </div>
                  <Users className="w-12 h-12 text-green-600 opacity-20" />
                </div>
              </div>

              {/* Total Tasks */}
              <div className={`rounded-lg shadow-md p-6 ${isDark ? 'bg-[#111418]' : 'bg-white'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${isDark ? 'text-[#9da8b9]' : 'text-gray-600'}`}>Total Tasks</p>
                    <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {stats.totalTasks}
                    </p>
                  </div>
                  <CheckSquare className="w-12 h-12 text-blue-600 opacity-20" />
                </div>
              </div>
            </div>
          )}

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? 'text-[#9da8b9]' : 'text-gray-400'}`} />
                <input
                  type="text"
                  placeholder="Search workspaces..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
                    isDark 
                      ? 'bg-[#111418] border-[#282f39] text-white placeholder-[#9da8b9]' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Workspace
            </button>
            <button
              onClick={() => { fetchWorkspaces(); fetchStats(); }}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                isDark 
                  ? 'bg-[#111418] hover:bg-[#1c2027] text-white' 
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
          </div>

          {/* Workspaces Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredWorkspaces.map((workspace) => (
              <div
                key={workspace._id}
                className={`rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow ${isDark ? 'bg-[#111418]' : 'bg-white'}`}
              >
                {/* Workspace Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {workspace.name}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(workspace.type)}`}>
                        {workspace.type}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        workspace.isActive 
                          ? isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                          : isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
                      }`}>
                        {workspace.isActive ? '🟢 Active' : '🔴 Inactive'}
                      </span>
                    </div>
                    <p className={`text-sm ${isDark ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                      Created {new Date(workspace.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <Users className={`w-5 h-5 mx-auto mb-1 ${isDark ? 'text-[#9da8b9]' : 'text-gray-400'}`} />
                    <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {workspace.stats?.userCount || 0}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-[#9da8b9]' : 'text-gray-600'}`}>Users</p>
                  </div>
                  <div className="text-center">
                    <CheckSquare className={`w-5 h-5 mx-auto mb-1 ${isDark ? 'text-[#9da8b9]' : 'text-gray-400'}`} />
                    <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {workspace.stats?.taskCount || 0}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-[#9da8b9]' : 'text-gray-600'}`}>Tasks</p>
                  </div>
                  <div className="text-center">
                    <Layers className={`w-5 h-5 mx-auto mb-1 ${isDark ? 'text-[#9da8b9]' : 'text-gray-400'}`} />
                    <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {workspace.stats?.teamCount || 0}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-[#9da8b9]' : 'text-gray-600'}`}>Teams</p>
                  </div>
                </div>

                {/* Actions */}
                <div className={`grid grid-cols-3 gap-2 pt-4 border-t ${isDark ? 'border-[#282f39]' : 'border-gray-200'}`}>
                  <button
                    onClick={() => fetchWorkspaceDetails(workspace._id)}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    Details
                  </button>
                  <button
                    onClick={() => fetchWorkspaceUsers(workspace)}
                    className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                  >
                    <Users className="w-4 h-4" />
                    Users
                  </button>
                  <button
                    onClick={() => fetchWorkspaceTasks(workspace)}
                    className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                  >
                    <CheckSquare className="w-4 h-4" />
                    Tasks
                  </button>
                  <button
                    onClick={() => openEditModal(workspace)}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleStatus(workspace._id, workspace.name, workspace.isActive)}
                    className={`px-3 py-2 ${
                      workspace.isActive 
                        ? 'bg-orange-600 hover:bg-orange-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-sm`}
                  >
                    <AlertCircle className="w-4 h-4" />
                    {workspace.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(workspace._id, workspace.name)}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredWorkspaces.length === 0 && (
            <div className="text-center py-12">
              <Database className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-[#9da8b9]' : 'text-gray-400'}`} />
              <p className={isDark ? 'text-[#9da8b9]' : 'text-gray-600'}>
                {searchTerm ? 'No workspaces found matching your search' : 'No workspaces created yet'}
              </p>
            </div>
          )}

          {/* Create Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className={`rounded-lg max-w-md w-full p-6 ${isDark ? 'bg-[#111418]' : 'bg-white'}`}>
                <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Create New Workspace
                </h2>
                <form onSubmit={handleCreate}>
                  <div className="mb-4">
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#9da8b9]' : 'text-gray-700'}`}>
                      Workspace Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDark 
                          ? 'bg-[#0f1419] border-[#282f39] text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="e.g., Acme Corporation"
                    />
                  </div>

                  <div className="mb-4">
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#9da8b9]' : 'text-gray-700'}`}>
                      Workspace Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDark 
                          ? 'bg-[#0f1419] border-[#282f39] text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="COMMUNITY">COMMUNITY (Free - Limited)</option>
                      <option value="CORE">CORE (Unlimited)</option>
                    </select>
                    <p className={`text-xs mt-1 ${isDark ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                      {formData.type === 'COMMUNITY' 
                        ? 'Limited to 10 users, 100 tasks, 3 teams'
                        : 'Unlimited users, tasks, and teams with full features'}
                    </p>
                  </div>

                  <div className="mb-6">
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#9da8b9]' : 'text-gray-700'}`}>
                      Owner Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={formData.ownerEmail}
                      onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDark 
                          ? 'bg-[#0f1419] border-[#282f39] text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="owner@example.com"
                    />
                    <p className={`text-xs mt-1 ${isDark ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                      Assign an existing user as workspace admin
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className={`flex-1 px-4 py-2 rounded-lg ${
                        isDark 
                          ? 'bg-[#1c2027] hover:bg-[#282f39] text-white' 
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Modal - Similar structure with editData */}
          {showEditModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className={`rounded-lg max-w-md w-full p-6 ${isDark ? 'bg-[#111418]' : 'bg-white'}`}>
                <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Edit Workspace
                </h2>
                <form onSubmit={handleEdit}>
                  <div className="mb-4">
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-[#9da8b9]' : 'text-gray-700'}`}>
                      Workspace Name
                    </label>
                    <input
                      type="text"
                      required
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        isDark 
                          ? 'bg-[#0f1419] border-[#282f39] text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>

                  {editData.type === 'COMMUNITY' && (
                    <div className="mb-4 space-y-3">
                      <label className={`block text-sm font-medium ${isDark ? 'text-[#9da8b9]' : 'text-gray-700'}`}>
                        Limits
                      </label>
                      <input
                        type="number"
                        value={editData.limits.maxUsers}
                        onChange={(e) => setEditData({ 
                          ...editData, 
                          limits: { ...editData.limits, maxUsers: parseInt(e.target.value) }
                        })}
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDark 
                            ? 'bg-[#0f1419] border-[#282f39] text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="Max Users"
                      />
                      <input
                        type="number"
                        value={editData.limits.maxTasks}
                        onChange={(e) => setEditData({ 
                          ...editData, 
                          limits: { ...editData.limits, maxTasks: parseInt(e.target.value) }
                        })}
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDark 
                            ? 'bg-[#0f1419] border-[#282f39] text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="Max Tasks"
                      />
                      <input
                        type="number"
                        value={editData.limits.maxTeams}
                        onChange={(e) => setEditData({ 
                          ...editData, 
                          limits: { ...editData.limits, maxTeams: parseInt(e.target.value) }
                        })}
                        className={`w-full px-3 py-2 border rounded-lg ${
                          isDark 
                            ? 'bg-[#0f1419] border-[#282f39] text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="Max Teams"
                      />
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className={`flex-1 px-4 py-2 rounded-lg ${
                        isDark 
                          ? 'bg-[#1c2027] hover:bg-[#282f39] text-white' 
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Details Modal */}
          {showDetailsModal && selectedWorkspace && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className={`rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto ${isDark ? 'bg-[#111418]' : 'bg-white'}`}>
                <div className="flex justify-between items-start mb-6">
                  <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {selectedWorkspace.name}
                  </h2>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-[#1c2027]' : 'hover:bg-gray-100'}`}
                  >
                    <X className={`w-5 h-5 ${isDark ? 'text-[#9da8b9]' : 'text-gray-600'}`} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className={`text-sm font-semibold ${isDark ? 'text-[#9da8b9]' : 'text-gray-600'}`}>Type</p>
                    <p className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedWorkspace.type}</p>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${isDark ? 'text-[#9da8b9]' : 'text-gray-600'}`}>Status</p>
                    <p className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {selectedWorkspace.isActive ? '🟢 Active' : '🔴 Inactive'}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${isDark ? 'text-[#9da8b9]' : 'text-gray-600'}`}>Statistics</p>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div>
                        <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {selectedWorkspace.stats?.userCount || 0}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-[#9da8b9]' : 'text-gray-600'}`}>Users</p>
                      </div>
                      <div>
                        <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {selectedWorkspace.stats?.taskCount || 0}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-[#9da8b9]' : 'text-gray-600'}`}>Tasks</p>
                      </div>
                      <div>
                        <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {selectedWorkspace.stats?.teamCount || 0}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-[#9da8b9]' : 'text-gray-600'}`}>Teams</p>
                      </div>
                    </div>
                  </div>
                  {selectedWorkspace.type === 'COMMUNITY' && (
                    <div>
                      <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-[#9da8b9]' : 'text-gray-600'}`}>Limits</p>
                      <div className="space-y-2">
                        <p className={isDark ? 'text-white' : 'text-gray-900'}>
                          Max Users: {selectedWorkspace.limits?.maxUsers || 10}
                        </p>
                        <p className={isDark ? 'text-white' : 'text-gray-900'}>
                          Max Tasks: {selectedWorkspace.limits?.maxTasks || 100}
                        </p>
                        <p className={isDark ? 'text-white' : 'text-gray-900'}>
                          Max Teams: {selectedWorkspace.limits?.maxTeams || 3}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowDetailsModal(false)}
                  className={`w-full mt-6 px-4 py-2 rounded-lg ${
                    isDark 
                      ? 'bg-[#1c2027] hover:bg-[#282f39] text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Users Modal */}
          {showUsersModal && selectedWorkspace && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className={`${isDark ? 'bg-[#111418]' : 'bg-white'} rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-auto`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Users in "{selectedWorkspace.name}"
                  </h3>
                  <button
                    onClick={() => setShowUsersModal(false)}
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-[#1c2027]' : 'hover:bg-gray-100'}`}
                  >
                    <X className={isDark ? 'text-gray-400' : 'text-gray-600'} />
                  </button>
                </div>

                <div className={`text-sm mb-4 ${isDark ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                  Total: {workspaceUsers.length} users
                </div>

                {workspaceUsers.length === 0 ? (
                  <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    No users in this workspace
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={isDark ? 'border-b border-[#282f39]' : 'border-b border-gray-200'}>
                          <th className={`text-left py-3 px-4 ${isDark ? 'text-[#9da8b9]' : 'text-gray-600'}`}>Name</th>
                          <th className={`text-left py-3 px-4 ${isDark ? 'text-[#9da8b9]' : 'text-gray-600'}`}>Email</th>
                          <th className={`text-left py-3 px-4 ${isDark ? 'text-[#9da8b9]' : 'text-gray-600'}`}>Role</th>
                          <th className={`text-left py-3 px-4 ${isDark ? 'text-[#9da8b9]' : 'text-gray-600'}`}>Team</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workspaceUsers.map((user) => (
                          <tr key={user._id} className={isDark ? 'border-b border-[#282f39] hover:bg-[#1c2027]' : 'border-b border-gray-100 hover:bg-gray-50'}>
                            <td className={`py-3 px-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{user.full_name}</td>
                            <td className={`py-3 px-4 ${isDark ? 'text-[#9da8b9]' : 'text-gray-600'}`}>{user.email}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                user.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                                user.role === 'hr' ? 'bg-purple-500/20 text-purple-400' :
                                user.role === 'team_lead' ? 'bg-blue-500/20 text-blue-400' :
                                user.role === 'community_admin' ? 'bg-orange-500/20 text-orange-400' :
                                'bg-green-500/20 text-green-400'
                              }`}>
                                {user.role.replace('_', ' ').toUpperCase()}
                              </span>
                            </td>
                            <td className={`py-3 px-4 ${isDark ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                              {user.team_id?.name || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <button
                  onClick={() => setShowUsersModal(false)}
                  className={`w-full mt-6 px-4 py-2 rounded-lg ${
                    isDark 
                      ? 'bg-[#1c2027] hover:bg-[#282f39] text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Tasks Modal */}
          {showTasksModal && selectedWorkspace && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className={`${isDark ? 'bg-[#111418]' : 'bg-white'} rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-auto`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Tasks in "{selectedWorkspace.name}"
                  </h3>
                  <button
                    onClick={() => setShowTasksModal(false)}
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-[#1c2027]' : 'hover:bg-gray-100'}`}
                  >
                    <X className={isDark ? 'text-gray-400' : 'text-gray-600'} />
                  </button>
                </div>

                <div className={`text-sm mb-4 ${isDark ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                  Showing: {workspaceTasks.length} tasks
                </div>

                {workspaceTasks.length === 0 ? (
                  <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    No tasks in this workspace
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={isDark ? 'border-b border-[#282f39]' : 'border-b border-gray-200'}>
                          <th className={`text-left py-3 px-4 ${isDark ? 'text-[#9da8b9]' : 'text-gray-600'}`}>Title</th>
                          <th className={`text-left py-3 px-4 ${isDark ? 'text-[#9da8b9]' : 'text-gray-600'}`}>Status</th>
                          <th className={`text-left py-3 px-4 ${isDark ? 'text-[#9da8b9]' : 'text-gray-600'}`}>Priority</th>
                          <th className={`text-left py-3 px-4 ${isDark ? 'text-[#9da8b9]' : 'text-gray-600'}`}>Assigned To</th>
                          <th className={`text-left py-3 px-4 ${isDark ? 'text-[#9da8b9]' : 'text-gray-600'}`}>Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workspaceTasks.map((task) => (
                          <tr key={task._id} className={isDark ? 'border-b border-[#282f39] hover:bg-[#1c2027]' : 'border-b border-gray-100 hover:bg-gray-50'}>
                            <td className={`py-3 px-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              <div className="max-w-xs truncate">{task.title}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                task.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                                task.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-gray-500/20 text-gray-400'
                              }`}>
                                {task.status?.replace('_', ' ').toUpperCase() || 'TODO'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                task.priority === 'medium' ? 'bg-orange-500/20 text-orange-400' :
                                'bg-gray-500/20 text-gray-400'
                              }`}>
                                {task.priority?.toUpperCase() || 'LOW'}
                              </span>
                            </td>
                            <td className={`py-3 px-4 ${isDark ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                              {task.assigned_to?.full_name || '-'}
                            </td>
                            <td className={`py-3 px-4 ${isDark ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                              {new Date(task.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <button
                  onClick={() => setShowTasksModal(false)}
                  className={`w-full mt-6 px-4 py-2 rounded-lg ${
                    isDark 
                      ? 'bg-[#1c2027] hover:bg-[#282f39] text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

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
    </div>
  );
}

