import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSidebar } from '../context/SidebarContext';
import { useConfirmModal } from '../hooks/useConfirmModal';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import ConfirmModal from '../components/modals/ConfirmModal';
import useRealtimeSync from '../hooks/useRealtimeSync';
import { Upload, Download, FileJson, FileSpreadsheet, X, Search, Filter, Users as UsersIcon, User, Shield, Trash2, Edit2, Key, Plus, Menu } from 'lucide-react';

export default function UserManagement() {
  const { user } = useAuth();
  const { theme, currentTheme } = useTheme();
  const { toggleMobileSidebar } = useSidebar();
  const confirmModal = useConfirmModal();
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordResetData, setPasswordResetData] = useState({ userId: '', userEmail: '', newPassword: '' });
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
    team_id: '',
    teams: [],
    employmentStatus: 'ACTIVE'
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
        (usr.team_id?.name && usr.team_id.name.toLowerCase().includes(query)) ||
        (usr.teams && usr.teams.some(t => t.name && t.name.toLowerCase().includes(query)))
      );
    }
    if (roleFilter !== 'all') {
      filtered = filtered.filter(usr => usr.role === roleFilter);
    }
    if (teamFilter !== 'all') {
      if (teamFilter === 'no_team') {
        filtered = filtered.filter(usr => !usr.team_id && (!usr.teams || usr.teams.length === 0));
      } else {
        filtered = filtered.filter(usr => 
          usr.team_id?._id === teamFilter ||
          (usr.teams && usr.teams.some(t => (t._id || t) === teamFilter))
        );
      }
    }
    return filtered;
  }, [users, searchQuery, roleFilter, teamFilter]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'role' && value === 'admin') {
      setFormData(prev => ({ ...prev, [name]: value, team_id: '', teams: [] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTeamToggle = (teamId) => {
    setFormData(prev => {
      const teams = prev.teams || [];
      const isSelected = teams.includes(teamId);
      const newTeams = isSelected 
        ? teams.filter(id => id !== teamId)
        : [...teams, teamId];
      // Set primary team_id to first team if not set
      const newTeamId = newTeams.length > 0 && !prev.team_id ? newTeams[0] : prev.team_id;
      return { ...prev, teams: newTeams, team_id: newTeamId };
    });
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({ full_name: '', email: '', password: '', role: 'member', team_id: '', teams: [], employmentStatus: 'ACTIVE' });
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const openEditModal = (usr) => {
    setModalMode('edit');
    setSelectedUser(usr);
    const userTeamIds = usr.teams && usr.teams.length > 0 
      ? usr.teams.map(t => t._id || t)
      : (usr.team_id ? [usr.team_id._id || usr.team_id] : []);
    setFormData({ 
      full_name: usr.full_name, 
      email: usr.email, 
      password: '', 
      role: usr.role, 
      team_id: usr.team_id?._id || '',
      teams: userTeamIds,
      employmentStatus: usr.employmentStatus || 'ACTIVE'
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
        const updateData = { 
          full_name: formData.full_name,
          email: formData.email,
          role: formData.role,
          employmentStatus: formData.employmentStatus
        };
        // Only include team data if not admin
        if (formData.role !== 'admin') {
          updateData.team_id = formData.team_id;
          // For Core Workspace, send teams array if available
          if (formData.teams && formData.teams.length > 0) {
            updateData.teams = formData.teams;
          }
        }
        await api.put(`/users/${selectedUser._id}`, updateData);
        setSuccess('User updated successfully');
      }
      await fetchUsers();
      setTimeout(() => { setShowModal(false); setSuccess(''); }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${modalMode} user`);
    }
  };

  const handleDelete = async (userId, userEmail) => {
    const confirmed = await confirmModal.show({
      title: 'Delete User',
      message: `Are you sure you want to delete user: ${userEmail}? This will permanently remove their account and all associated data.`,
      confirmText: 'Delete User',
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (confirmed) {
      try {
        await api.delete(`/users/${userId}`);
        setSuccess('User deleted successfully');
        await fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete user');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUserIds.length === 0) {
      setError('Please select users to delete');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const confirmed = await confirmModal.show({
      title: 'Delete Multiple Users',
      message: `Are you sure you want to delete ${selectedUserIds.length} user(s)? This will permanently remove their accounts and all associated data. This action cannot be undone.`,
      confirmText: `Delete ${selectedUserIds.length} User${selectedUserIds.length !== 1 ? 's' : ''}`,
      cancelText: 'Cancel',
      variant: 'danger',
    });

    if (confirmed) {
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
    }
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
    setPasswordResetData({ userId, userEmail, newPassword: '' });
    setShowPasswordModal(true);
  };

  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    const { userId, newPassword } = passwordResetData;
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    try {
      await api.patch(`/users/${userId}/password`, { password: newPassword });
      setSuccess('Password reset successfully');
      setTimeout(() => setSuccess(''), 3000);
      setShowPasswordModal(false);
      setPasswordResetData({ userId: '', userEmail: '', newPassword: '' });
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

  const getEmploymentStatusBadge = (status) => {
    const badges = {
      ACTIVE: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Active' },
      INACTIVE: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Inactive' },
      ON_NOTICE: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'On Notice' },
      EXITED: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Exited' }
    };
    return badges[status] || { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Active' };
  };

  if (!hasPermission) {
    return (
      <div className={`flex h-screen w-full ${currentTheme.background}`}>
        <Sidebar />
        <main className={`flex-1 flex items-center justify-center ${currentTheme.background}`}>
          <div className={`${currentTheme.surface} p-8 rounded border ${currentTheme.border}`}>
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
      <div className={`${currentTheme.background} ${currentTheme.text} h-screen flex items-center justify-center`}>
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
    <div className={`flex h-screen w-full ${currentTheme.background}`}>
      <Sidebar />

      <main className={`flex-1 flex flex-col h-full w-full min-w-0 ${currentTheme.background} overflow-hidden`}>
        {/* Header */}
        <header className={`border-b ${currentTheme.border} ${currentTheme.background} shrink-0`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4 gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile/Tablet Menu Button */}
              <button
                onClick={toggleMobileSidebar}
                className={`lg:hidden ${theme === 'dark' ? 'text-[#9da8b9] hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
                aria-label="Toggle menu"
              >
                <Menu size={20} className="sm:w-6 sm:h-6" />
              </button>
              <div>
                <h2 className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-base sm:text-lg md:text-xl font-bold leading-tight`}>User & Team Management</h2>
                <p className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} text-[10px] sm:text-xs mt-0.5 sm:mt-1`}>{users.length} users • {teams.length} teams</p>
              </div>
            </div>
            <div className="flex gap-1.5 sm:gap-2">
              <button
                onClick={() => setShowBulkImportModal(true)}
                className="flex items-center justify-center rounded h-7 sm:h-8 md:h-9 px-2 sm:px-3 md:px-4 bg-green-600 text-white gap-1 sm:gap-1.5 text-[10px] sm:text-xs md:text-sm font-bold hover:bg-green-700 transition-colors"
              >
                <Upload size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Bulk Import</span>
                <span className="sm:hidden">Import</span>
              </button>
              <button
                onClick={openCreateModal}
                className="flex items-center justify-center rounded h-7 sm:h-8 md:h-9 px-2 sm:px-3 md:px-4 bg-[#136dec] text-white gap-1 sm:gap-1.5 text-[10px] sm:text-xs md:text-sm font-bold hover:bg-blue-600 transition-colors"
              >
                <Plus size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Create User</span>
                <span className="sm:hidden">Create</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="px-1 sm:px-4 md:px-6 pb-1 sm:pb-3 md:pb-4">
            <div className="flex flex-col gap-0.5 sm:gap-2 md:gap-3">
              <div className="relative">
                <Search className={`absolute left-1 sm:left-3 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'}`} size={11} />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full h-5 sm:h-8 md:h-9 lg:h-10 pl-5 sm:pl-8 md:pl-10 pr-1 sm:pr-3 md:pr-4 ${currentTheme.surface} border ${currentTheme.border} rounded text-[9px] sm:text-xs md:text-sm ${currentTheme.text} placeholder-[#6b7280] focus:ring-1 focus:ring-[#136dec] focus:border-transparent`}
                  placeholder="Search..."
                />
              </div>
              <div className="grid grid-cols-2 gap-0.5 sm:gap-2 md:gap-3">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className={`h-5 sm:h-8 md:h-9 lg:h-10 px-0.5 sm:px-2 md:px-3 ${currentTheme.surface} border ${currentTheme.border} rounded text-[8px] sm:text-xs md:text-sm ${currentTheme.text} focus:ring-1 focus:ring-[#136dec] focus:border-transparent overflow-hidden`}
                  style={{ textOverflow: 'ellipsis' }}
                >
                  <option value="all">All</option>
                  <option value="admin">Admin</option>
                  <option value="hr">HR</option>
                  <option value="team_lead">Lead</option>
                  <option value="member">Member</option>
                </select>
                <select
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  className={`h-5 sm:h-8 md:h-9 lg:h-10 px-0.5 sm:px-2 md:px-3 ${currentTheme.surface} border ${currentTheme.border} rounded text-[8px] sm:text-xs md:text-sm ${currentTheme.text} focus:ring-1 focus:ring-[#136dec] focus:border-transparent overflow-hidden`}
                  style={{ textOverflow: 'ellipsis' }}
                >
                  <option value="all">All Teams</option>
                  <option value="no_team">No Team</option>
                  {teams.map(team => (
                    <option key={team._id} value={team._id}>{team.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedUserIds.length > 0 && (
            <div className="px-4 sm:px-6 pb-4">
              <div className={`${theme === 'dark' ? 'bg-[#136dec]/10 border-[#136dec]/30' : 'bg-blue-50 border-blue-200'} border rounded p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3`}>
                <span className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-medium`}>{selectedUserIds.length} user(s) selected</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedUserIds([])}
                    className={`text-xs ${theme === 'dark' ? 'text-[#9da8b9] hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors px-2 py-1`}
                  >
                    Clear Selection
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors"
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
        <div className="flex-1 overflow-auto p-4 sm:p-6">
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

          {/* Desktop Table View */}
          <div className={`hidden md:block ${currentTheme.surface} rounded border ${currentTheme.border} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${currentTheme.surfaceSecondary}`}>
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
                    <th className={`px-4 py-3 text-left text-[10px] font-bold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} uppercase tracking-wider`}>Status</th>
                    <th className={`px-4 py-3 text-left text-[10px] font-bold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} uppercase tracking-wider`}>Teams</th>
                    <th className={`px-4 py-3 text-left text-[10px] font-bold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} uppercase tracking-wider hidden lg:table-cell`}>Created</th>
                    <th className={`px-4 py-3 text-right text-[10px] font-bold ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} uppercase tracking-wider`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${currentTheme.border}`}>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className={`px-4 py-8 text-center ${currentTheme.textSecondary}`}>
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((usr) => {
                      const badge = getRoleBadge(usr.role);
                      const statusBadge = getEmploymentStatusBadge(usr.employmentStatus);
                      return (
                        <tr key={usr._id} className={`${currentTheme.hover} transition-colors`}>
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
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${statusBadge.bg} ${statusBadge.text}`}>
                              {statusBadge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              {usr.teams && usr.teams.length > 0 ? (
                                usr.teams.map((team, idx) => (
                                  <span
                                    key={idx}
                                    className={`inline-flex px-2 py-0.5 text-xs rounded ${theme === 'dark' ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-100 text-blue-700'}`}
                                  >
                                    {team.name || team}
                                  </span>
                                ))
                              ) : usr.team_id?.name ? (
                                <span className={`inline-flex px-2 py-0.5 text-xs rounded ${theme === 'dark' ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                                  {usr.team_id.name}
                                </span>
                              ) : (
                                <span className={`text-xs ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-500'}`}>No Team</span>
                              )}
                            </div>
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
                                  className={`p-1.5 ${theme === 'dark' ? 'text-[#9da8b9] hover:text-red-500 hover:bg-red-500/10' : 'text-gray-600 hover:text-red-600 hover:bg-red-50'} rounded transition-colors`}
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

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredUsers.length === 0 ? (
              <div className={`${currentTheme.surface} rounded border ${currentTheme.border} p-8 text-center ${currentTheme.textSecondary}`}>
                No users found
              </div>
            ) : (
              filteredUsers.map((usr) => {
                const badge = getRoleBadge(usr.role);
                return (
                  <div key={usr._id} className={`${currentTheme.surface} rounded border ${currentTheme.border} p-4`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(usr._id)}
                        onChange={() => toggleSelectUser(usr._id)}
                        disabled={usr._id === user.id}
                        className="mt-1 rounded border-[#4b5563] text-[#136dec] focus:ring-[#136dec] disabled:opacity-50"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} truncate`}>{usr.full_name}</h3>
                            <p className={`text-xs ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} truncate mt-0.5`}>{usr.email}</p>
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${badge.bg} ${badge.text} shrink-0`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className={`text-xs ${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} mb-3`}>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <UsersIcon size={12} className="shrink-0" />
                            {usr.teams && usr.teams.length > 0 ? (
                              usr.teams.map((team, idx) => (
                                <span
                                  key={idx}
                                  className={`inline-flex px-1.5 py-0.5 text-xs rounded ${theme === 'dark' ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-100 text-blue-700'}`}
                                >
                                  {team.name || team}
                                </span>
                              ))
                            ) : usr.team_id?.name ? (
                              <span className={`inline-flex px-1.5 py-0.5 text-xs rounded ${theme === 'dark' ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                                {usr.team_id.name}
                              </span>
                            ) : (
                              <span>No Team</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(usr)}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-gray-100'} ${theme === 'dark' ? 'text-white' : 'text-gray-900'} rounded text-xs font-medium transition-colors`}
                          >
                            <Edit2 size={14} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleResetPassword(usr._id, usr.email)}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-gray-100'} ${theme === 'dark' ? 'text-white' : 'text-gray-900'} rounded text-xs font-medium transition-colors`}
                          >
                            <Key size={14} />
                            Reset
                          </button>
                          {usr._id !== user.id && (
                            <button
                              onClick={() => handleDelete(usr._id, usr.email)}
                              className="px-3 py-2 bg-red-500/10 text-red-500 rounded text-xs font-medium hover:bg-red-500/20 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`${currentTheme.surface} rounded border ${currentTheme.border} p-5 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className={`text-lg sm:text-2xl font-bold ${currentTheme.text}`}>
                {modalMode === 'create' ? 'Create New User' : `Edit User: ${selectedUser?.full_name}`}
              </h2>
              <button onClick={() => setShowModal(false)} className={`${currentTheme.textSecondary} hover:${currentTheme.text}`}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Information Section */}
              <div className={`p-4 rounded-lg ${currentTheme.surfaceSecondary} border ${currentTheme.border}`}>
                <h3 className={`text-sm font-bold ${currentTheme.text} uppercase tracking-wider mb-3`}>Basic Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>Full Name *</label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 ${currentTheme.surfaceSecondary} border ${currentTheme.border} rounded ${currentTheme.text} focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 ${currentTheme.surfaceSecondary} border ${currentTheme.border} rounded ${currentTheme.text} focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                      required
                    />
                  </div>

                  {modalMode === 'create' && (
                    <div>
                      <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>Password *</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 ${currentTheme.surfaceSecondary} border ${currentTheme.border} rounded ${currentTheme.text} focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                        required
                        minLength={6}
                      />
                      <p className={`text-xs ${currentTheme.textSecondary} mt-1`}>Minimum 6 characters</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Role & Status Section */}
              <div className={`p-4 rounded-lg ${currentTheme.surfaceSecondary} border ${currentTheme.border}`}>
                <h3 className={`text-sm font-bold ${currentTheme.text} uppercase tracking-wider mb-3`}>Role & Status</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>Role *</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 ${currentTheme.surfaceSecondary} border ${currentTheme.border} rounded ${currentTheme.text} focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                      required
                    >
                      <option value="member">Member</option>
                      <option value="team_lead">Team Lead</option>
                      <option value="hr">HR</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {modalMode === 'edit' && (
                    <div>
                      <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>Employment Status *</label>
                      <select
                        name="employmentStatus"
                        value={formData.employmentStatus}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 ${currentTheme.surfaceSecondary} border ${currentTheme.border} rounded ${currentTheme.text} focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                        required
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="ON_NOTICE">On Notice</option>
                        <option value="EXITED">Exited</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Teams Section */}
              {formData.role !== 'admin' && (
                <div className={`p-4 rounded-lg ${currentTheme.surfaceSecondary} border ${currentTheme.border}`}>
                  <h3 className={`text-sm font-bold ${currentTheme.text} uppercase tracking-wider mb-3 flex items-center gap-2`}>
                    <UsersIcon size={16} />
                    Team Assignments
                  </h3>
                  
                  {modalMode === 'edit' ? (
                    <>
                      <p className={`text-xs ${currentTheme.textSecondary} mb-3`}>
                        Select multiple teams for this user (Core Workspace feature)
                      </p>
                      
                      {teams.length === 0 ? (
                        <p className={`text-sm ${currentTheme.textSecondary} py-4 text-center`}>No teams available</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {teams.map(team => {
                            const isSelected = formData.teams?.includes(team._id);
                            const isPrimary = formData.team_id === team._id;
                            return (
                              <label
                                key={team._id}
                                className={`flex items-center justify-between p-3 rounded border cursor-pointer transition-colors ${
                                  isSelected 
                                    ? 'bg-blue-500/10 border-blue-500/30' 
                                    : `${currentTheme.surface} border-${currentTheme.border}`
                                } hover:bg-blue-500/5`}
                              >
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleTeamToggle(team._id)}
                                    className="rounded border-gray-500 text-[#136dec] focus:ring-[#136dec]"
                                  />
                                  <div>
                                    <span className={`text-sm font-medium ${currentTheme.text}`}>{team.name}</span>
                                    {isPrimary && (
                                      <span className="ml-2 text-xs px-2 py-0.5 bg-blue-500 text-white rounded">Primary</span>
                                    )}
                                  </div>
                                </div>
                                <span className={`text-xs ${currentTheme.textSecondary}`}>
                                  {team.members?.length || 0} members
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {formData.teams && formData.teams.length > 0 && (
                        <div className="mt-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded">
                          <p className={`text-xs ${currentTheme.text} font-medium mb-2`}>
                            Selected Teams: {formData.teams.length}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {formData.teams.map(teamId => {
                              const team = teams.find(t => t._id === teamId);
                              return team ? (
                                <span key={teamId} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-500/20 text-blue-400 rounded">
                                  {team.name}
                                  {formData.team_id === teamId && <span className="text-xs">(Primary)</span>}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}

                      {formData.teams && formData.teams.length > 1 && (
                        <div className="mt-3">
                          <label className={`block text-xs font-medium ${currentTheme.text} mb-2`}>
                            Primary Team (Used for legacy features)
                          </label>
                          <select
                            name="team_id"
                            value={formData.team_id}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 text-sm ${currentTheme.surfaceSecondary} border ${currentTheme.border} rounded ${currentTheme.text} focus:ring-2 focus:ring-[#136dec]`}
                          >
                            {formData.teams.map(teamId => {
                              const team = teams.find(t => t._id === teamId);
                              return team ? (
                                <option key={teamId} value={teamId}>{team.name}</option>
                              ) : null;
                            })}
                          </select>
                        </div>
                      )}
                    </>
                  ) : (
                    <div>
                      <label className={`block text-sm font-medium ${currentTheme.text} mb-2`}>Team (Optional)</label>
                      <select
                        name="team_id"
                        value={formData.team_id}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 ${currentTheme.surfaceSecondary} border ${currentTheme.border} rounded ${currentTheme.text} focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                      >
                        <option value="">No Team</option>
                        {teams.map(team => (
                          <option key={team._id} value={team._id}>{team.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-500/10 border border-green-500/30 rounded p-3 text-sm text-green-400">
                  {success}
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`px-4 sm:px-6 py-2.5 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-gray-200'} ${theme === 'dark' ? 'text-white' : 'text-gray-900'} rounded ${theme === 'dark' ? 'hover:bg-[#3a4454]' : 'hover:bg-gray-300'} transition-colors text-sm sm:text-base`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 sm:px-6 py-2.5 bg-[#136dec] text-white rounded hover:bg-blue-600 transition-colors font-semibold text-sm sm:text-base"
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
          <div className={`${currentTheme.surface} rounded border ${currentTheme.border} p-5 sm:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className={`text-lg sm:text-2xl font-bold ${currentTheme.text}`}>Bulk Import Users</h2>
              <button onClick={() => { setShowBulkImportModal(false); setBulkImportFile(null); setBulkImportResults(null); }} className={`${currentTheme.textSecondary} hover:${currentTheme.text}`}>
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 sm:space-y-6">
              {/* Instructions */}
              <div className={`p-4 rounded-lg ${currentTheme.surfaceSecondary} border ${currentTheme.border}`}>
                <h3 className={`text-xs sm:text-sm font-bold ${currentTheme.text} uppercase tracking-wider mb-2`}>📋 Import Instructions</h3>
                <ul className={`text-xs sm:text-sm ${currentTheme.textSecondary} space-y-1.5 list-disc list-inside`}>
                  <li><strong>Required fields:</strong> full_name, email, password, role</li>
                  <li><strong>Optional fields:</strong> team (single), teams (multiple, comma-separated), employment_status</li>
                  <li><strong>Roles:</strong> admin, hr, team_lead, member</li>
                  <li><strong>Employment Status:</strong> ACTIVE, INACTIVE, ON_NOTICE, EXITED (default: ACTIVE)</li>
                  <li><strong>Multiple Teams:</strong> Use "teams" field with comma-separated team names (e.g., "Development, QA")</li>
                  <li><strong>Team Creation:</strong> Teams that don't exist will be created automatically</li>
                </ul>
              </div>

              {/* Step 1: Download Template */}
              <div className={`p-4 rounded-lg ${currentTheme.surfaceSecondary} border ${currentTheme.border}`}>
                <h3 className={`text-xs sm:text-sm font-bold ${currentTheme.text} uppercase tracking-wider mb-3`}>Step 1: Download Template</h3>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={() => downloadTemplate('excel')}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <FileSpreadsheet size={16} />
                    Excel Template (.xlsx)
                  </button>
                  <button
                    onClick={() => downloadTemplate('json')}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <FileJson size={16} />
                    JSON Template (.json)
                  </button>
                </div>
                <p className={`text-xs ${currentTheme.textSecondary} mt-2`}>
                  Templates include sample data with all supported fields
                </p>
              </div>

              {/* Step 2: Upload File */}
              <div className={`p-4 rounded-lg ${currentTheme.surfaceSecondary} border ${currentTheme.border}`}>
                <h3 className={`text-xs sm:text-sm font-bold ${currentTheme.text} uppercase tracking-wider mb-3`}>Step 2: Upload Completed File</h3>
                <input
                  type="file"
                  accept=".json,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className={`w-full px-3 py-2 text-sm ${currentTheme.surfaceSecondary} border ${currentTheme.border} rounded ${currentTheme.text} file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-[#136dec] file:text-white file:cursor-pointer file:text-sm hover:file:bg-blue-600`}
                />
                {bulkImportFile && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                      {bulkImportFile.name}
                    </span>
                    <span className={`text-xs ${currentTheme.textSecondary}`}>
                      ({(bulkImportFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                )}
              </div>

              {/* Results Section */}
              {bulkImportResults && (
                <div className={`p-4 rounded-lg ${currentTheme.surfaceSecondary} border ${currentTheme.border} space-y-3`}>
                  <h3 className={`text-xs sm:text-sm font-bold ${currentTheme.text} uppercase tracking-wider`}>📊 Import Results</h3>
                  
                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                      <div className={`text-2xl font-bold ${currentTheme.text}`}>{bulkImportResults.total}</div>
                      <div className="text-xs text-blue-400">Total</div>
                    </div>
                    <div className="text-center p-3 bg-green-500/10 border border-green-500/30 rounded">
                      <div className="text-2xl font-bold text-green-400">{bulkImportResults.successful.length}</div>
                      <div className="text-xs text-green-400">Success</div>
                    </div>
                    <div className="text-center p-3 bg-red-500/10 border border-red-500/30 rounded">
                      <div className="text-2xl font-bold text-red-400">{bulkImportResults.failed.length}</div>
                      <div className="text-xs text-red-400">Failed</div>
                    </div>
                  </div>

                  {/* Teams Created */}
                  {bulkImportResults.teamsCreated && bulkImportResults.teamsCreated.length > 0 && (
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded p-3">
                      <p className="text-sm text-purple-400 font-medium mb-2">
                        ✨ Created {bulkImportResults.teamsCreated.length} new team(s):
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {bulkImportResults.teamsCreated.map((team, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                            {team.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Success Details */}
                  {bulkImportResults.successful.length > 0 && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded p-3">
                      <p className="text-sm text-green-400 font-medium mb-2">✓ Successfully Imported Users:</p>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {bulkImportResults.successful.slice(0, 5).map((user, idx) => (
                          <div key={idx} className="text-xs text-green-300 flex justify-between gap-2">
                            <span>{user.full_name} ({user.email})</span>
                            <span className="text-green-400/70">{user.teams || 'No team'}</span>
                          </div>
                        ))}
                        {bulkImportResults.successful.length > 5 && (
                          <p className="text-xs text-green-400/70 italic">
                            ...and {bulkImportResults.successful.length - 5} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Failed Details */}
                  {bulkImportResults.failed.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
                      <p className="text-sm text-red-400 font-medium mb-2">✗ Failed Imports:</p>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {bulkImportResults.failed.map((fail, idx) => (
                          <div key={idx} className="text-xs">
                            <span className="text-red-300">{fail.email || `Row ${fail.row}`}</span>
                            <span className="text-red-400/70 ml-2">- {fail.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4">
                <button
                  onClick={() => { setShowBulkImportModal(false); setBulkImportFile(null); setBulkImportResults(null); }}
                  className={`px-4 sm:px-6 py-2.5 ${theme === 'dark' ? 'bg-[#282f39]' : 'bg-gray-200'} ${theme === 'dark' ? 'text-white' : 'text-gray-900'} rounded ${theme === 'dark' ? 'hover:bg-[#3a4454]' : 'hover:bg-gray-300'} transition-colors text-sm sm:text-base`}
                >
                  Close
                </button>
                <button
                  onClick={handleBulkImport}
                  disabled={!bulkImportFile || bulkImportLoading}
                  className="px-4 sm:px-6 py-2.5 bg-[#136dec] text-white rounded hover:bg-blue-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex items-center justify-center gap-2"
                >
                  {bulkImportLoading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Import Users
                    </>
                  )}
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

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${currentTheme.surface} rounded-lg shadow-xl max-w-md w-full p-6`}>
            <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
              Reset Password
            </h3>
            <p className={`${theme === 'dark' ? 'text-[#9da8b9]' : 'text-gray-600'} mb-4 text-sm`}>
              Enter new password for <span className="font-semibold">{passwordResetData.userEmail}</span>
            </p>
            <form onSubmit={handlePasswordResetSubmit}>
              <div className="mb-4">
                <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>
                  New Password *
                </label>
                <input
                  type="password"
                  value={passwordResetData.newPassword}
                  onChange={(e) => setPasswordResetData({ ...passwordResetData, newPassword: e.target.value })}
                  placeholder="Enter new password (min 6 characters)"
                  className={`w-full p-3 ${currentTheme.surfaceSecondary} border ${currentTheme.border} ${currentTheme.text} placeholder:text-[#58606e] rounded-lg focus:ring-2 focus:ring-[#136dec] focus:border-transparent`}
                  required
                  minLength={6}
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordResetData({ userId: '', userEmail: '', newPassword: '' });
                  }}
                  className={`px-4 py-2 ${theme === 'dark' ? 'bg-[#282f39] hover:bg-[#3a4454]' : 'bg-gray-200 hover:bg-gray-300'} ${theme === 'dark' ? 'text-white' : 'text-gray-900'} rounded transition-colors`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#136dec] text-white rounded hover:bg-blue-600 transition-colors font-semibold"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
