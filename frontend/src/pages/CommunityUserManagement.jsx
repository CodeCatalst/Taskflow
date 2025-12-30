import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useConfirmModal } from '../hooks/useConfirmModal';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import ConfirmModal from '../components/modals/ConfirmModal';
import useRealtimeSync from '../hooks/useRealtimeSync';
import { Search, Users as UsersIcon, User, Trash2, Edit2, Key, Plus, X } from 'lucide-react';

export default function CommunityUserManagement() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const confirmModal = useConfirmModal();
  
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'member',
    team_id: ''
  });

  // Community admins can only manage users in their community workspace
  const hasPermission = user && user.role === 'community_admin';

  useEffect(() => {
    if (hasPermission) {
      fetchUsers();
      fetchTeams();
    }
  }, [hasPermission]);

  useRealtimeSync({
    onUserCreated: () => { if (hasPermission) fetchUsers(); },
    onUserUpdated: () => { if (hasPermission) fetchUsers(); },
    onUserDeleted: () => { if (hasPermission) fetchUsers(); },
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data.users);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await api.get('/teams');
      setTeams(response.data.teams || []);
    } catch (err) {
      console.error('Failed to fetch teams:', err);
    }
  };

  const filteredUsers = useMemo(() => {
    let filtered = [...users];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(usr => 
        usr.full_name.toLowerCase().includes(query) ||
        usr.email.toLowerCase().includes(query) ||
        (usr.team_id?.name && usr.team_id.name.toLowerCase().includes(query))
      );
    }
    if (roleFilter !== 'all') {
      filtered = filtered.filter(usr => usr.role === roleFilter);
    }
    if (teamFilter !== 'all') {
      if (teamFilter === 'no_team') {
        filtered = filtered.filter(usr => !usr.team_id);
      } else {
        filtered = filtered.filter(usr => usr.team_id?._id === teamFilter);
      }
    }
    return filtered;
  }, [users, searchQuery, roleFilter, teamFilter]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({ full_name: '', email: '', password: '', role: 'member', team_id: '' });
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const openEditModal = (usr) => {
    setModalMode('edit');
    setSelectedUser(usr);
    setFormData({ 
      full_name: usr.full_name, 
      email: usr.email, 
      password: '', 
      role: usr.role, 
      team_id: usr.team_id?._id || '' 
    });
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (modalMode === 'create') {
        await api.post('/users', formData);
        setSuccess('User created successfully');
      } else {
        const updateData = { ...formData };
        delete updateData.password;
        await api.put(`/users/${selectedUser._id}`, updateData);
        setSuccess('User updated successfully');
      }
      await fetchUsers();
      setTimeout(() => { setShowModal(false); setSuccess(''); }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${modalMode} user`);
    }
  };

  const handleDelete = (userId, userEmail) => {
    confirmModal.show({
      title: 'Delete User',
      message: `Are you sure you want to delete user: ${userEmail}? This will permanently remove their account and all associated data from your workspace.`,
      confirmText: 'Delete User',
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/users/${userId}`);
          setSuccess('User deleted successfully');
          await fetchUsers();
          setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to delete user');
          setTimeout(() => setError(''), 3000);
        }
      },
    });
  };

  const handleResetPassword = async (userId, userEmail) => {
    const newPassword = prompt(`Enter new password for ${userEmail}:`);
    if (!newPassword) return;
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setTimeout(() => setError(''), 3000);
      return;
    }
    try {
      await api.patch(`/users/${userId}/password`, { password: newPassword });
      setSuccess('Password reset successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-red-500',
      hr: 'bg-purple-500',
      team_lead: 'bg-blue-500',
      member: 'bg-green-500',
      community_admin: 'bg-orange-500'
    };
    return colors[role] || 'bg-gray-500';
  };

  if (!hasPermission) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className={`flex-1 overflow-auto ${isDark ? 'bg-[#0f1419] text-white' : 'bg-gray-50 text-gray-900'}`}>
          <div className="p-8">
            <div className={`${isDark ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'} border rounded-lg p-4`}>
              <p className={isDark ? 'text-red-300' : 'text-red-800'}>
                You do not have permission to access this page. Only Community Administrators can manage users.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className={`flex-1 overflow-auto ${isDark ? 'bg-[#0f1419]' : 'bg-gray-50'} flex items-center justify-center`}>
          <div className="text-center">
            <div className={`inline-block animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? 'border-blue-400' : 'border-blue-600'}`}></div>
            <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className={`flex-1 overflow-auto ${isDark ? 'bg-[#0f1419]' : 'bg-gray-50'}`}>
        <div className="p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Community User Management
            </h1>
            <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage users in your community workspace
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className={`mb-4 p-4 rounded-lg ${isDark ? 'bg-red-900/20 border border-red-700' : 'bg-red-50 border border-red-200'}`}>
              <p className={isDark ? 'text-red-300' : 'text-red-800'}>{error}</p>
            </div>
          )}
          {success && (
            <div className={`mb-4 p-4 rounded-lg ${isDark ? 'bg-green-900/20 border border-green-700' : 'bg-green-50 border border-green-200'}`}>
              <p className={isDark ? 'text-green-300' : 'text-green-800'}>{success}</p>
            </div>
          )}

          {/* Controls */}
          <div className={`${isDark ? 'bg-[#111418]' : 'bg-white'} rounded-lg shadow-sm p-6 mb-6`}>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} size={20} />
                  <input
                    type="text"
                    placeholder="Search by name, email, or team..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
                      isDark 
                        ? 'bg-[#1a1f2e] border-gray-700 text-white placeholder-gray-500' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>

                {/* Role Filter */}
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className={`px-4 py-2 border rounded-lg ${
                    isDark 
                      ? 'bg-[#1a1f2e] border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="all">All Roles</option>
                  <option value="member">Member</option>
                  <option value="team_lead">Team Lead</option>
                  <option value="hr">HR</option>
                </select>

                {/* Team Filter */}
                <select
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  className={`px-4 py-2 border rounded-lg ${
                    isDark 
                      ? 'bg-[#1a1f2e] border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="all">All Teams</option>
                  <option value="no_team">No Team</option>
                  {teams.map(team => (
                    <option key={team._id} value={team._id}>{team.name}</option>
                  ))}
                </select>
              </div>

              {/* Add User Button */}
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                <Plus size={20} />
                Add User
              </button>
            </div>
          </div>

          {/* Users Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className={`${isDark ? 'bg-[#111418]' : 'bg-white'} rounded-lg shadow-sm p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Users</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{users.length}</p>
                </div>
                <UsersIcon className="text-blue-500" size={40} />
              </div>
            </div>
            <div className={`${isDark ? 'bg-[#111418]' : 'bg-white'} rounded-lg shadow-sm p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Members</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {users.filter(u => u.role === 'member').length}
                  </p>
                </div>
                <User className="text-green-500" size={40} />
              </div>
            </div>
            <div className={`${isDark ? 'bg-[#111418]' : 'bg-white'} rounded-lg shadow-sm p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Team Leads</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {users.filter(u => u.role === 'team_lead').length}
                  </p>
                </div>
                <User className="text-blue-500" size={40} />
              </div>
            </div>
            <div className={`${isDark ? 'bg-[#111418]' : 'bg-white'} rounded-lg shadow-sm p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Filtered</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{filteredUsers.length}</p>
                </div>
                <Search className="text-purple-500" size={40} />
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className={`${isDark ? 'bg-[#111418]' : 'bg-white'} rounded-lg shadow-sm overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDark ? 'bg-[#1a1f2e]' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                      User
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                      Email
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                      Role
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                      Team
                    </th>
                    <th className={`px-6 py-3 text-right text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`${isDark ? 'divide-y divide-gray-700' : 'divide-y divide-gray-200'}`}>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center">
                        <UsersIcon className={`mx-auto ${isDark ? 'text-gray-600' : 'text-gray-400'}`} size={48} />
                        <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          No users found
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((usr) => (
                      <tr key={usr._id} className={isDark ? 'hover:bg-[#1a1f2e]' : 'hover:bg-gray-50'}>
                        <td className={`px-6 py-4 whitespace-nowrap ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <div className={`h-10 w-10 rounded-full ${getRoleBadgeColor(usr.role)} flex items-center justify-center text-white font-semibold`}>
                                {usr.full_name.charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="font-medium">{usr.full_name}</div>
                              {usr._id === user.id && (
                                <span className="text-xs text-blue-500">(You)</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {usr.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(usr.role)} text-white`}>
                            {usr.role.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {usr.team_id ? usr.team_id.name : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(usr)}
                              className={`p-2 rounded ${isDark ? 'hover:bg-[#1a1f2e] text-blue-400' : 'hover:bg-gray-100 text-blue-600'} transition-colors`}
                              title="Edit User"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleResetPassword(usr._id, usr.email)}
                              className={`p-2 rounded ${isDark ? 'hover:bg-[#1a1f2e] text-yellow-400' : 'hover:bg-gray-100 text-yellow-600'} transition-colors`}
                              title="Reset Password"
                            >
                              <Key size={18} />
                            </button>
                            {usr._id !== user.id && (
                              <button
                                onClick={() => handleDelete(usr._id, usr.email)}
                                className={`p-2 rounded ${isDark ? 'hover:bg-[#1a1f2e] text-red-400' : 'hover:bg-gray-100 text-red-600'} transition-colors`}
                                title="Delete User"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Create/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${isDark ? 'bg-[#111418]' : 'bg-white'} rounded-lg shadow-xl max-w-md w-full`}>
            <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {modalMode === 'create' ? 'Add New User' : 'Edit User'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className={`${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-2 border rounded-lg ${
                    isDark 
                      ? 'bg-[#1a1f2e] border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-2 border rounded-lg ${
                    isDark 
                      ? 'bg-[#1a1f2e] border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>

              {modalMode === 'create' && (
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={modalMode === 'create'}
                    minLength={6}
                    className={`w-full px-4 py-2 border rounded-lg ${
                      isDark 
                        ? 'bg-[#1a1f2e] border-gray-700 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  />
                </div>
              )}

              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Role *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-2 border rounded-lg ${
                    isDark 
                      ? 'bg-[#1a1f2e] border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="member">Member</option>
                  <option value="team_lead">Team Lead</option>
                  <option value="hr">HR</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Team
                </label>
                <select
                  name="team_id"
                  value={formData.team_id}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg ${
                    isDark 
                      ? 'bg-[#1a1f2e] border-gray-700 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                >
                  <option value="">No Team</option>
                  {teams.map(team => (
                    <option key={team._id} value={team._id}>{team.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`flex-1 px-4 py-2 border rounded-lg ${
                    isDark 
                      ? 'border-gray-700 text-gray-300 hover:bg-[#1a1f2e]' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  } transition-colors`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {modalMode === 'create' ? 'Create User' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
