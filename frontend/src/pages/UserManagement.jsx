import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useConfirmModal } from '../hooks/useConfirmModal';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import ConfirmModal from '../components/modals/ConfirmModal';
import useRealtimeSync from '../hooks/useRealtimeSync';
import { Upload, Download, FileJson, FileSpreadsheet, X, Search, Filter, Users as UsersIcon, User, Shield, Trash2, Edit2, Key, Plus } from 'lucide-react';

export default function UserManagement() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const confirmModal = useConfirmModal();
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [bulkImportFile, setBulkImportFile] = useState(null);
  const [bulkImportLoading, setBulkImportLoading] = useState(false);
  const [bulkImportResults, setBulkImportResults] = useState(null);
  const [modalMode, setModalMode] = useState('create');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
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

  const hasPermission = user && (user.role === 'admin' || user.role === 'hr');

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
    if (name === 'role' && value === 'admin') {
      setFormData(prev => ({ ...prev, [name]: value, team_id: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
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
    setFormData({ full_name: usr.full_name, email: usr.email, password: '', role: usr.role, team_id: usr.team_id?._id || '' });
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
      message: `Are you sure you want to delete user: ${userEmail}? This will permanently remove their account and all associated data.`,
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

  const handleBulkDelete = () => {
    if (selectedUserIds.length === 0) {
      setError('Please select users to delete');
      setTimeout(() => setError(''), 3000);
      return;
    }
    confirmModal.show({
      title: 'Delete Multiple Users',
      message: `Are you sure you want to delete ${selectedUserIds.length} user(s)? This will permanently remove their accounts and all associated data. This action cannot be undone.`,
      confirmText: `Delete ${selectedUserIds.length} User${selectedUserIds.length !== 1 ? 's' : ''}`,
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const response = await api.post('/users/bulk-delete', { userIds: selectedUserIds });
          setSuccess(response.data.message);
          setSelectedUserIds([]);
          await fetchUsers();
          setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to delete users');
          setTimeout(() => setError(''), 3000);
        }
      },
    });
  };

  const toggleSelectUser = (userId) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.length === users.filter(usr => usr._id !== user.id).length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(users.filter(usr => usr._id !== user.id).map(usr => usr._id));
    }
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

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['application/json', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
      if (!validTypes.includes(file.type)) {
        setError('Invalid file type. Please upload JSON or Excel file.');
        setTimeout(() => setError(''), 3000);
        return;
      }
      setBulkImportFile(file);
      setError('');
    }
  };

  const handleBulkImport = async () => {
    if (!bulkImportFile) {
      setError('Please select a file to import');
      return;
    }
    setBulkImportLoading(true);
    setError('');
    setBulkImportResults(null);
    try {
      const formData = new FormData();
      formData.append('file', bulkImportFile);
      const isExcel = bulkImportFile.type.includes('spreadsheet') || bulkImportFile.type.includes('excel');
      const endpoint = isExcel ? '/users/bulk-import/excel' : '/users/bulk-import/json';
      const response = await api.post(endpoint, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setBulkImportResults(response.data);
      setSuccess(`Successfully imported ${response.data.successful.length} users`);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to import users');
    } finally {
      setBulkImportLoading(false);
    }
  };

  const downloadTemplate = async (format) => {
    try {
      const endpoint = format === 'json' ? '/users/bulk-import/template-json' : '/users/bulk-import/template';
      const response = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `user_import_template.${format === 'json' ? 'json' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download template');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Admin' },
      hr: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'HR' },
      team_lead: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Team Lead' },
      member: { bg: 'bg-slate-500/20', text: 'text-slate-300', label: 'Member' }
    };
    return badges[role] || badges.member;
  };

  if (!hasPermission) {
    return (
      <div className={`flex h-screen w-full overflow-hidden ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'}`}>
        <Sidebar />
        <main className={`flex-1 flex items-center justify-center ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'}`}>
          <div className={`${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-white'} p-8 rounded border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'}`}>
            <h2 className="text-2xl font-bold text-red-500 mb-4">Access Denied</h2>
            <p className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>You don't have permission to access user management.</p>
            <p className="text-[#6b7280] mt-2">Only Admin and HR can manage users.</p>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'} ${theme === 'dark' ? 'text-white' : 'text-gray-900'} h-screen flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-6">
          <div className="flex gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="w-4 h-12 bg-[#136dec] rounded-full animate-pulse" style={{ animationDelay: `${i * 0.15}s` }}></div>
            ))}
          </div>
          <p className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-medium`}>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-full overflow-hidden ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'}`}>
      <Sidebar />

      <main className={`flex-1 flex flex-col h-full min-w-0 ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'}`}>
        {/* Header */}
        <header className={`border-b ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} ${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'} shrink-0`}>
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-xl font-bold leading-tight`}>User & Team Management</h2>
              <p className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} text-xs mt-1`}>{users.length} users • {teams.length} teams</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkImportModal(true)}
                className="flex items-center justify-center rounded h-9 px-4 bg-green-600 text-white gap-2 text-sm font-bold hover:bg-green-700 transition-colors"
              >
                <Upload size={18} />
                <span className="hidden sm:inline">Bulk Import</span>
              </button>
              <button
                onClick={openCreateModal}
                className="flex items-center justify-center rounded h-9 px-4 bg-[#136dec] text-white gap-2 text-sm font-bold hover:bg-blue-600 transition-colors"
              >
                <Plus size={18} />
                <span>Create User</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative col-span-1 md:col-span-2">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`} size={18} />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full h-9 pl-10 pr-4 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-white'} border ${theme === 'dark' ? 'border-[#3e454f]' : 'border-gray-200'} rounded text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'} placeholder-[#6b7280] focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                  placeholder="Search users by name, email, or team..."
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className={`h-9 px-3 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-white'} border ${theme === 'dark' ? 'border-[#3e454f]' : 'border-gray-200'} rounded text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'} focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="hr">HR</option>
                <option value="team_lead">Team Lead</option>
                <option value="member">Member</option>
              </select>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className={`h-9 px-3 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-white'} border ${theme === 'dark' ? 'border-[#3e454f]' : 'border-gray-200'} rounded text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'} focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
              >
                <option value="all">All Teams</option>
                <option value="no_team">No Team</option>
                {teams.map(team => (
                  <option key={team._id} value={team._id}>{team.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedUserIds.length > 0 && (
            <div className="px-6 pb-4">
              <div className="bg-[#136dec]/10 border border-[#136dec]/30 rounded p-3 flex items-center justify-between">
                <span className="text-sm text-white font-medium">{selectedUserIds.length} user(s) selected</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedUserIds([])}
                    className="text-xs text-[#9da8b9] hover:text-white transition-colors"
                  >
                    Clear Selection
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors"
                  >
                    <Trash2 size={14} />
                    Delete Selected
                  </button>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded p-3 mb-4 flex items-center justify-between">
              <span className="text-sm text-red-400">{error}</span>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">
                <X size={16} />
              </button>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded p-3 mb-4 flex items-center justify-between">
              <span className="text-sm text-green-400">{success}</span>
              <button onClick={() => setSuccess('')} className="text-green-400 hover:text-green-300">
                <X size={16} />
              </button>
            </div>
          )}

          {/* Users Table */}
          <div className={`${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-white'} rounded border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${theme === 'dark' ? 'bg-[#111418]' : 'bg-gray-50'}`}>
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.length === users.filter(usr => usr._id !== user.id).length && users.length > 1}
                        onChange={toggleSelectAll}
                        className="rounded border-[#4b5563] text-[#136dec] focus:ring-[#136dec]"
                      />
                    </th>
                    <th className={`px-4 py-3 text-left text-[10px] font-bold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} uppercase tracking-wider`}>User</th>
                    <th className={`px-4 py-3 text-left text-[10px] font-bold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} uppercase tracking-wider`}>Role</th>
                    <th className={`px-4 py-3 text-left text-[10px] font-bold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} uppercase tracking-wider hidden md:table-cell`}>Team</th>
                    <th className={`px-4 py-3 text-left text-[10px] font-bold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} uppercase tracking-wider hidden lg:table-cell`}>Created</th>
                    <th className={`px-4 py-3 text-right text-[10px] font-bold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} uppercase tracking-wider`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-[#282f39]' : 'divide-gray-200'}`}>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className={`px-4 py-8 text-center ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((usr) => {
                      const badge = getRoleBadge(usr.role);
                      return (
                        <tr key={usr._id} className={`${theme === 'dark' ? 'hover:bg-[#282f39]/50' : 'hover:bg-gray-50'} transition-colors`}>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedUserIds.includes(usr._id)}
                              onChange={() => toggleSelectUser(usr._id)}
                              disabled={usr._id === user.id}
                              className="rounded border-[#4b5563] text-[#136dec] focus:ring-[#136dec] disabled:opacity-50"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{usr.full_name}</div>
                            <div className={`text-xs ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`}>{usr.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${badge.bg} ${badge.text}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className={`px-4 py-3 text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} hidden md:table-cell`}>
                            {usr.team_id?.name || 'No Team'}
                          </td>
                          <td className={`px-4 py-3 text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} hidden lg:table-cell`}>
                            {new Date(usr.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditModal(usr)}
                                className={`p-1.5 ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} ${theme === 'dark' ? 'hover:text-white hover:bg-[#282f39]' : 'hover:text-gray-900 hover:bg-gray-100'} rounded transition-colors`}
                                title="Edit User"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleResetPassword(usr._id, usr.email)}
                                className={`p-1.5 ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} ${theme === 'dark' ? 'hover:text-white hover:bg-[#282f39]' : 'hover:text-gray-900 hover:bg-gray-100'} rounded transition-colors`}
                                title="Reset Password"
                              >
                                <Key size={16} />
                              </button>
                              {usr._id !== user.id && (
                                <button
                                  onClick={() => handleDelete(usr._id, usr.email)}
                                  className="p-1.5 text-[#9da8b9] hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                  title="Delete User"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-white'} rounded border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} p-8 max-w-md w-full`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {modalMode === 'create' ? 'Create New User' : 'Edit User'}
              </h2>
              <button onClick={() => setShowModal(false)} className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Full Name *</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 ${theme === 'dark' ? 'bg-[#111418]' : 'bg-white'} border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} rounded ${theme === 'dark' ? 'text-white' : 'text-gray-900'} focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 ${theme === 'dark' ? 'bg-[#111418]' : 'bg-white'} border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} rounded ${theme === 'dark' ? 'text-white' : 'text-gray-900'} focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                  required
                />
              </div>

              {modalMode === 'create' && (
                <div>
                  <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 ${theme === 'dark' ? 'bg-[#111418]' : 'bg-white'} border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} rounded ${theme === 'dark' ? 'text-white' : 'text-gray-900'} focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                    required
                  />
                </div>
              )}

              <div>
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Role *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 ${theme === 'dark' ? 'bg-[#111418]' : 'bg-white'} border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} rounded ${theme === 'dark' ? 'text-white' : 'text-gray-900'} focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                  required
                >
                  <option value="member">Member</option>
                  <option value="team_lead">Team Lead</option>
                  <option value="hr">HR</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {formData.role !== 'admin' && (
                <div>
                  <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Team</label>
                  <select
                    name="team_id"
                    value={formData.team_id}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 ${theme === 'dark' ? 'bg-[#111418]' : 'bg-white'} border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} rounded ${theme === 'dark' ? 'text-white' : 'text-gray-900'} focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                  >
                    <option value="">No Team</option>
                    {teams.map(team => (
                      <option key={team._id} value={team._id}>{team.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded p-2 text-sm text-red-400">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-500/10 border border-green-500/30 rounded p-2 text-sm text-green-400">
                  {success}
                </div>
              )}

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`px-6 py-2 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-gray-200'} ${theme === 'dark' ? 'text-white' : 'text-gray-900'} rounded ${theme === 'dark' ? 'hover:bg-[#3a4454]' : 'hover:bg-gray-300'} transition-colors`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#136dec] text-white rounded hover:bg-blue-600 transition-colors font-semibold"
                >
                  {modalMode === 'create' ? 'Create User' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImportModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`${theme === 'dark' ? 'bg-[#1c2027]' : 'bg-white'} rounded border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Bulk Import Users</h2>
              <button onClick={() => { setShowBulkImportModal(false); setBulkImportFile(null); setBulkImportResults(null); }} className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'}`}>
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider mb-3`}>Step 1: Download Template</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => downloadTemplate('excel')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    <FileSpreadsheet size={18} />
                    Excel Template
                  </button>
                  <button
                    onClick={() => downloadTemplate('json')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    <FileJson size={18} />
                    JSON Template
                  </button>
                </div>
              </div>

              <div>
                <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider mb-3`}>Step 2: Upload File</h3>
                <input
                  type="file"
                  accept=".json,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className={`w-full px-4 py-2 ${theme === 'dark' ? 'bg-[#111418]' : 'bg-white'} border ${theme === 'dark' ? 'border-[#282f39]' : 'border-gray-200'} rounded ${theme === 'dark' ? 'text-white' : 'text-gray-900'} file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-[#136dec] file:text-white file:cursor-pointer hover:file:bg-blue-600`}
                />
                {bulkImportFile && (
                  <p className={`text-sm ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} mt-2`}>Selected: {bulkImportFile.name}</p>
                )}
              </div>

              {bulkImportResults && (
                <div className="space-y-3">
                  <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} uppercase tracking-wider`}>Import Results</h3>
                  <div className="space-y-2">
                    <div className="bg-green-500/10 border border-green-500/30 rounded p-3">
                      <p className="text-sm text-green-400">✓ Successfully imported: {bulkImportResults.successful.length} users</p>
                    </div>
                    {bulkImportResults.failed.length > 0 && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
                        <p className="text-sm text-red-400 font-medium mb-2">✗ Failed: {bulkImportResults.failed.length} users</p>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {bulkImportResults.failed.map((fail, idx) => (
                            <p key={idx} className="text-xs text-red-300">{fail.email}: {fail.reason}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => { setShowBulkImportModal(false); setBulkImportFile(null); setBulkImportResults(null); }}
                  className={`px-6 py-2 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-gray-200'} ${theme === 'dark' ? 'text-white' : 'text-gray-900'} rounded ${theme === 'dark' ? 'hover:bg-[#3a4454]' : 'hover:bg-gray-300'} transition-colors`}
                >
                  Close
                </button>
                <button
                  onClick={handleBulkImport}
                  disabled={!bulkImportFile || bulkImportLoading}
                  className="px-6 py-2 bg-[#136dec] text-white rounded hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkImportLoading ? 'Importing...' : 'Import Users'}
                </button>
              </div>
            </div>
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
